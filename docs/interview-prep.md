# ninjiaAI 前端面试准备（结合本仓库）

面向：首屏优化、包优化、高并发、前后端数据不一致。

答法统一用三句话：**现状是什么 → 为什么会这样 → 我会怎么改**。面试官更认「我读过自己项目、知道坑在哪」，而不是背清单。

本仓库是 Vite + React 18 的 SPA：JWT 登录、antd、SSE 流式对话。没有 React Query、没有路由懒加载、没有虚拟列表。

---

## 0. 先用 30 秒讲清项目

> 这是一个 ChatGPT 风格的对话产品前端。登录后左侧是会话列表，右侧是消息流。鉴权是 JWT 放 localStorage，首屏壳子可以不发网络请求就画出来；会话列表靠 `getUserInfo`，历史消息靠 `getConversation`，发送走 SSE `/chat/conversation`。UI 主要是 antd，Markdown 用 `react-markdown`。

如果被问「你负责哪一块」：路由鉴权、会话侧栏、SSE 流式渲染、文件上传与解析状态。

---

## 一、首屏优化

### Q1. 用户打开首页，从输入 URL 到看到内容，发生了什么？

**怎么答（对照代码）：**

1. `index.html` 几乎是空壳：只有 `#root` 和一个 module script `/src/main.jsx`。没有预加载、没有内联关键 CSS、没有 SSR。
2. 浏览器必须先下载、解析、执行整份 JS，React 才能挂载。
3. `main.jsx` **静态 import 了所有页面**：`Root`、`ChatPage`、`AuthPage`、`Account`、`UserProvider`、`ProtectedRoute`。首屏哪怕只是欢迎页，也会把聊天页、登录页、antd 一起拉下来。
4. `/` 外面包了 `UserProvider` + `ProtectedRoute`：
   - `UserProvider` 同步 `JSON.parse(localStorage.user)`，不发请求。
   - `ProtectedRoute` 用 `jwt-decode` 看 `exp`，过期就 `<Navigate to="/auth">`。这也是纯客户端判断，不请求服务端 introspect。
5. 通过鉴权后渲染 `Root` = Navbar + SideBar + `<Outlet />`。欢迎页 `Index` 只是一段静态文案，真正的首屏网络请求是 SideBar 里的 `getUserInfo(email)`。

**一句话结论：** 首屏瓶颈是 **JS 包体积 + 瀑布请求**，不是聊天流本身。壳子可以同步画出，会话列表还要再等一轮 API。

**加分改法：**

- 路由级 `React.lazy` + `Suspense`，登录页/聊天页/账号页拆开。
- SideBar 加骨架屏，避免空白。
- `index.html` 对主 chunk 做 `modulepreload`；字体/首屏图标走 CDN。
- 关键用户信息用 HTTP 缓存或把 conversationsBrief 内嵌进登录响应，减少首屏瀑布。

### Q2. FCP / LCP / TTI 在这个项目里分别卡在哪？

| 指标 | 这个项目的卡点 |
| --- | --- |
| FCP（首次有内容） | 等主 JS 执行完。html 里几乎没有可绘制内容。 |
| LCP（最大内容） | 登录后多半是侧栏列表或欢迎文案；慢的话是 `getUserInfo` 回来之前的空白。聊天页 LCP 还会被历史消息 + Markdown 拖住。 |
| TTI（可交互） | antd + React 水合完成后；发送按钮、侧栏点击才能用。 |

**追问「为什么 html 里不放点东西？」**  
SPA 的取舍：一套路由服务所有页面，SSR/SSG 成本高。这个体量可以继续用 CSR，但要用拆包+骨架把空白压下去。如果要做 SEO 或开放落地页，再上 Vite SSR / 单独的营销页。

### Q3. 鉴权放 localStorage，对首屏是优化还是隐患？

**现状：** 首屏不请求就能决定去 `/` 还是 `/auth`，壳子出得快。

**隐患（面试官一定会追）：**

- Token 过期只在 `ProtectedRoute` 渲染时检查，没有 axios 401 拦截，也没有定时器。接口中途 401 只会变成通用报错。
- `user` 对象可能和数据库不一致（套餐、用户名），上下文里其实主要用 `email`。
- XSS 能直接读 token；SSE 还把 token 放在 query string 里，日志、Referer、浏览器历史都会泄露。

**标准答法：** 「首屏用本地 JWT 做乐观放行，服务端仍是权威。正确做法是：本地快速进壳 + 后台静默校验 / 401 统一踢回登录。敏感凭证不要出现在 URL。」

### Q4. 首屏有没有请求瀑布？怎么拆？

有。典型路径：

```
下载 JS → 执行路由 → 画壳 → SideBar getUserInfo
进入某个会话 → 再 getConversation 拉全量历史
```

`getUserInfo` 曾经直接返回完整 `conversations`（含消息），后来改成 `conversationsBrief`（只有 `windowID` + `title`），就是为了减小首屏包。这是仓库里已经做过的优化，commit 信息是「修复用户信息接口-减小数据包加快响应时间」。

**面试时主动提这一点：** 列表和详情分离，侧栏只拿摘要，点进会话再拉 `messageHistory`。这是标准的「首屏只请求首屏需要的数据」。

还可以再说：登录接口如果顺带返回 `conversationsBrief`，能再少一轮。

### Q5. 聊天页算不算首屏？流式渲染算优化吗？

聊天页不是站点 FCP，但是 **会话首屏**。当前实现：

- `useEffect([windowID, email])` 里 `getMessageHistory`，没有立刻清空旧消息。
- 切会话时，上一窗的气泡可能先闪一下，再被新数据替换。
- 每条消息都 `ReactMarkdown` 全量解析；SSE 每个 chunk 都 `setMessages`，等于每个 token 重跑一遍 Markdown。
- `key={index}`，没有虚拟列表，没有自动滚到底。

**流式 SSE 对「感知性能」是加分：** 用户先看到自己的气泡和 loading，再逐字出字，比等完整 JSON 更好。  
**但对主线程是减分：** 高频 setState + Markdown 重解析会卡。

**加分改法：** 切窗先 `setMessages([])` 或显示骨架；流式期间用纯文本，`[DONE]` 后再 Markdown；`React.memo` + 稳定 `messageId`；长列表上 `react-virtuoso`；把 EventSource 放 ref，卸载时 close。

### Q6. 移动端首屏还做了什么？

`index.css` 强制 `input, textarea { font-size: 16px }`，避免 iOS 聚焦缩放。`NinjiaForm` 在 `focusin` 时把 viewport 重置成 `width=device-width, initial-scale=1`。这是移动 Web 的体验优化，和包体积无关，但被问到「还有什么首屏/体验优化」可以提。

---

## 二、包优化

总体就三步，Vite 和 Next.js 都一样：**先量谁进了首屏 JS → 再决定它该不该进 → 最后才改配置。**  
没做过的人会先背 `manualChunks` / `dynamic()`；做过的人先看成绩单：Vite 看 visualizer + 首屏必须下载的 JS；Next 看 `next build` 的 **First Load JS**。

本仓库是 Vite SPA，路由不会自动拆。Next App Router 会按 route 拆，但很容易被 `layout.tsx` 上的 `'use client'` 把收益吃光——这才是认真做过 Next 包优化的人会盯的点。

### Q1. 现在打包策略是什么？问题在哪？

`vite.config.js` 几乎是默认配置：`@vitejs/plugin-react` + `vite-svg-loader`，没有 `manualChunks`，没有压缩插件配置，没有 antd 按需插件。

`main.jsx` 全静态导入，**没有 `React.lazy` / `Suspense`**。生产构建基本是「一个大 vendor + 一个大业务包」。

体积大户：

| 依赖 | 为何重 | 是否必须进首屏 |
| --- | --- | --- |
| `antd` + `@ant-design/icons` | 几乎每个页面 `from "antd"` 桶导入 | 登录按钮需要，但聊天 Markdown、上传弹窗不该进首屏 |
| `react-markdown` | 只在 Message 里用 | 应放到 ChatPage chunk |
| `jwt-decode` | 很小 | 可以留在主包 |
| `axios` | 中等 | 主包合理 |
| `localforage` / `match-sorter` / `sort-by` | React Router 教程残留，业务不用 | 应从 dependencies 删掉 |

死代码：`src/contacts.js`、`src/routes/edit.jsx`、`src/routes/destroy.jsx`、`InviteValidation.jsx`（路由已注释）。它们目前没被 `main.jsx` 引进来，**不一定进 bundle**，但会干扰分析和依赖体积。

### Q2. 「antd 很大」具体怎么讲、怎么拆？

**现象：** `Button`、`Input`、`Modal`、`Spin`、`message`、`Upload` 都从 `"antd"` 进。Vite + ESM 下 antd 5 有一定 tree-shaking，但图标、样式、Form 运行时仍然不小。侧栏、聊天、登录、文件弹窗全量打包进同一图。

**答法：**

1. 路由拆包：`AuthPage` / `ChatPage` / `Account` 用 `lazy(() => import(...))`。
2. `manualChunks`: 把 `antd`、`react-markdown` 打到独立 async chunk，走缓存。
3. 首屏能用原生 button/input 就不要为了一个发送按钮拉整份 antd（或换成更轻的组件库）。
4. 图标按需：`@ant-design/icons` 只引用到的几个。
5. `vite-bundle-visualizer` / `rollup-plugin-visualizer` 先量再改，避免拍脑袋。

示例（面试口述即可）：

```js
const ChatPage = lazy(() => import("./routes/chat/chatPage"));
// ...
<Suspense fallback={<Spin />}>
  <ChatPage />
</Suspense>
```

```js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        antd: ["antd", "@ant-design/icons"],
        markdown: ["react-markdown"],
      },
    },
  },
}
```

### Q3. 如何判断拆包是否真的优化了首屏？

不要只看 total gzip。看：

- 首屏 **必须下载的 JS 字节数**（entry + 同步 vendor）
- 路由 chunk 是否在进入对应页才加载
- 缓存命中：antd 升级不频繁，单独 chunk 长期缓存
- 是否拆过头：HTTP/2 下小文件太多会有握手开销，但这个项目目前是「拆太少」不是「拆太多」

### Q4. 运行时包优化（和构建包不是一回事）

面试官有时把「包」理解成 **每次接口的数据包**：

- `conversations` → `conversationsBrief`：侧栏不再下发明细消息。
- 历史按 `windowID` 按需拉取，而不是一次拉用户全部对话。
- 文件列表只在打开 FileModal 时请求（`visible` 变化才 fetch）。
- SSE 按 chunk 推，避免等完整答案一次性 JSON。

这些都是「减小数据包、加快响应」，和 JS bundle 优化要分开讲，否则会被认为概念混了。

### Q5. 常见追问速查

**Tree-shaking 为什么没把 antd 摇干净？**  
副作用、样式副作用、桶文件再导出、CJS 互操作。要看具体入口是 `antd` 还是 `antd/es/button`。

**为什么 CSS 也会拖首屏？**  
antd 样式随 JS 注入/导入；聊天页、弹窗样式现在全局进主包。CSS code split 会随异步 chunk 一起拆。

**Source map / 压缩？**  
Vite 生产默认 esbuild minify。面试提到「开 gzip/brotli 在 Nginx / CDN」即可，这是传输层，不是 Vite 必做。

### Q6. 如果用 Next.js，包优化你怎么做？（选一条主线讲透）

面试别报清单。选一条做过的主线，然后把因果讲完：

> **北极星是每条路由的 First Load JS。先量清楚谁进了 shared，再把 `'use client'` 往叶子推，最后才用 `optimizePackageImports` 收 antd 桶文件。**

Pages Router 时代的人爱谈 webpack `splitChunks`。App Router 上包变大，通常不是「没配 webpack」，而是 **root layout 变成了整站 Client 根**：要挂 UserContext、antd `ConfigProvider`，再把 SideBar 塞进 layout。登录页也会下载侧栏、Markdown、上传弹窗，`shared by all` 下不来，RSC 等于没了。

下面按「成绩单怎么读 → 事故怎么发生 → 边界怎么收 → 依赖怎么抠 → 怎么验收」讲，可以当口述稿。

---

#### 6.1 成绩单到底是什么

`next build` 结束会打一张路由表，每一行大概长这样（数字是示意，面试讲结构即可）：

```
Route                     Size     First Load JS
┌ ○ /                     2 kB          142 kB
├ ○ /auth                 8 kB          118 kB
├ λ /chat/[windowID]     35 kB          210 kB
└ ○ /account              4 kB          125 kB
+ First Load JS shared by all            87 kB
```

要会拆这三列，否则数字会对不上嘴：

1. **Size（路由自己的 JS）**  
   只有进这个 URL 才下载的部分。聊天页的 `react-markdown`、SSE 逻辑、FileModal 理应主要落在这里。

2. **First Load JS（打开这个 URL 必须下载的全部 JS）**  
   `= shared by all + 这条路由的同步 client 依赖`。用户第一次进 `/auth` 或 `/chat/xxx`，浏览器为了可交互要拉的就是这个。它才是首屏包。只看 Size 会误判：聊天页 Size 35kB 看起来不疼，First Load 210kB 才是用户付的钱。

3. **First Load JS shared by all**  
   所有路由都会带上的公共 client 包。来源几乎总是 `app/layout.tsx` 的模块图：layout 静态 import 的每一个 client 模块，都会进 shared。framework runtime（React / Next）也在这里，这部分降不掉，能降的是 **你自己挂到 layout 上的业务**。

所以「做过」的第一句话不是「我用了 dynamic」，而是：

> 我先记下 `/auth`、`/`、`/chat/[id]` 三条 First Load，以及 shared 那一行。优化目标是：登录页明显轻于聊天页；shared 里没有 markdown、没有 Upload、没有会话列表。

还要分清三笔账，别把它们加在一起报「包小了 40%」：

| 账本 | 是什么 | 谁在付代价 |
| --- | --- | --- |
| Client JS（First Load） | 下载 + 解析 + hydrate | 主线程，FCP/TTI |
| RSC Flight payload | Server 传来的组件树和数据 | 网络，几乎不占 JS parse |
| CSS | antd 样式、全局 CSS | 下载和首次绘制，analyzer 里常和 JS 挤在一起 |

`conversationsBrief` 如果改成 Server Component 里 fetch，再当 props 传给 client 侧栏：省的是客户端 axios 调用和瀑布，**不是**把数据从网线里抹掉，数据会走 Flight。面试被追问「那包真的小了吗」就答：JS parse 小了，首屏请求链短了，Flight 仍在，两笔要分开说。

Vite 对照：SPA 没有「分路由 First Load」，只有「首屏必须执行的那一个大包」。`rollup-plugin-visualizer` 里标红的同步模块，约等于 Next 的 shared + 当前页 Size。Next 把成绩单按路由拆开了，所以更能证明「登录页没夹带聊天」。

---

#### 6.2 为什么 App Router 默认就该更小，以及它怎么被搞大

默认模型：

- 文件 **没有** `'use client'` → Server Component。代码跑在 Node，**不进浏览器 JS**（除非它 import 了 client 模块，见下）。
- 只有带 `'use client'` 的文件，以及被它静态 import 的整条依赖链，才会打进 Client bundle。
- 路由是目录，`app/auth/page.tsx` 和 `app/chat/[windowID]/page.tsx` 默认不会打进同一条同步图。这就是「不用手写 React.lazy 也能按路由拆」。

因此，Next 包优化的胜负手不是 splitChunks，而是：**哪些文件被迫变成了 client，以及这些 client 文件被谁静态 import。**

`'use client'` 不是「这个组件在浏览器渲染」这么简单，它是一条 **模块边界**：

- 标了 `'use client'` 的文件，自己整份进 client bundle。
- 它顶层 `import` 的所有本地模块、antd、axios、markdown，即使那些文件没写 `'use client'`，也会被卷进 client 图（因为 client 不能在运行时再去执行一段没下发的 Server 模块）。
- 更关键的是 **父级**：Server Component 可以渲染一个 client 子组件，这是合法的「岛」。但反过来，client 父组件里写 `import Sidebar from './Sidebar'`，Sidebar 无论能不能做成 Server，都已经在 client 图里了。

所以「把 `'use client'` 往叶子推」的意思是：

> 让需要 hooks / 事件 / 浏览器 API 的文件自己当岛；它的祖先继续当 Server。祖先用 `<Sidebar />` 引用岛，而不是把岛的实现 import 进一个巨大的 client layout。

---

#### 6.3 典型事故：root layout 标成 `'use client'`（对照本仓库细讲）

这个产品迁过去，最自然、也最容易写错的第一版，几乎就是今天 `main.jsx` + `root.jsx` 的翻版：

```tsx
// app/layout.tsx  —— 错误示范，但非常常见
"use client";
import { UserProvider } from "@/context/userContext";
import { ConfigProvider } from "antd";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <UserProvider>
          <ConfigProvider>
            <Navbar />
            <Sidebar />
            {children}
          </ConfigProvider>
        </UserProvider>
      </body>
    </html>
  );
}
```

为什么会这样写，面试要主动说出来，显得你理解约束，而不是背「layout 不要 use client」：

1. `UserProvider` 里有 `useState` / `useNavigate`，必须是 client。今天的 `userContext.jsx` 就是这样。
2. antd 5 的 `ConfigProvider`、`message` 要用 React Context 和浏览器，必须是 client。
3. 今天的 `Root` 里 Navbar + SideBar 包着所有已登录页，迁 Next 时最省事就是塞进 root layout，好让 `/` 和 `/chat/[id]` 共用。
4. layout 一旦要 import 这些东西，文件顶部就会被加上 `'use client'`。有人还会图省事把 `children` 整棵树放进这个 client 根里。

然后模块图变成这样（对照现有源码）：

```
app/layout.tsx  ('use client')
  ├─ userContext.jsx          → react, 可能再带 router
  ├─ antd ConfigProvider      → antd 运行时 + 一串样式
  ├─ navBar.jsx               → antd Button/icons
  ├─ SideBar.jsx              → antd Button/message/icons
  │     └─ ../api.js          → axios 实例、拦截器、所有 REST
  │     └─ ConversationItem   → 又一层 antd Input/Dropdown
  └─ {children} 仍在这个 client 根下
        即便 chat/page.tsx 想当 Server，父级已是 client，
        这条子树的「Server」收益会被吃掉
```

后果要讲具体，不要只说「包变大」：

- **shared by all 被抬起来。** layout 是所有路由的祖先，它的 client 图 = 每个 URL 的 First Load 起步价。`/auth` 也会下载 SideBar、axios、会话列表相关 antd。用户还没登录，就在为登录后的壳买单。
- **RSC 名存实亡。** 页面文件即使不写 `'use client'`，只要被 client layout 当作 children 包住，且页面自己又 import 了 client 工具，很容易整页按 client 交。欢迎页那几行静态文案，本可以零业务 JS，现在要 hydrate 一整棵壳。
- **路由拆包失效。** Next 按目录拆的是「页面自己的模块」。你把 ChatPage / Markdown 从 layout 静态 import（或从 Sidebar 间接 import）等于手动把它们并回 shared。这和今天 `main.jsx` 静态 import `ChatPage` 是同一类错误，只是换了个框架。
- **登录跳转变胖。** 未登录用户打到 `/auth`，本来只要表单。现在 First Load 接近已登录壳。middleware 再若 import 了 `src/routes/api.js`，Edge 那份包还要再付一次 axios。

用今天的 Vite 代码举例 import 链，面试官一听就知道你读过项目：

- `SideBar.jsx` 顶部：`antd` 的 `Button/message`、`@ant-design/icons` 的 `PlusOutlined`、`../api` 的 `getUserInfo/createChatWindow`。只要 Sidebar 进 layout，这些全部进 shared。
- `ConversationItem.jsx`：`Input/Dropdown/Menu` + `deleteChatWindow/editChatWindow`。侧栏列表项也会进 shared。
- `Message.jsx`：顶层 `import ReactMarkdown from "react-markdown"`。它若被 ChatPage 静态 import，ChatPage 若再被 layout 或某个 shared client 引用，markdown 就进 First Load；即便只在聊天路由引用，也会进 `/chat/[id]` 的同步 Size，而不是点开消息才加载。
- `InputBox.jsx` 静态 import `FileModal`，FileModal 又拉 `Upload/Modal/List` 和上传 API。发送框在聊天页是常驻的，等于打开对话就把上传弹窗整套打进这条路由的同步 JS。
- `jwt-decode` 很小，放 layout 或 middleware 都可；危险的是和 axios 写在同一个 `api.js` 里被一起 import。

这就是「root layout 标成 `'use client'` 之后，登录页也会下载侧栏、Markdown、上传弹窗」的完整因果，不是一句口号。

---

#### 6.4 正确画法：Server 壳 + 瘦 providers + 叶子上的岛

目标不是「消灭所有 client」，而是 **client 只出现在真正需要浏览器的叶子，并且不要从 root layout 静态引用重岛**。

```
app/layout.tsx                         保持 Server
  html / body / next/font / metadata
  <Providers>                          唯一从 root 引入的 client，且极瘦
    {children}
  </Providers>

app/providers.tsx                      'use client'
  AntdRegistry + ConfigProvider + UserProvider
  禁止 import Sidebar / Chat / markdown / api.js

app/(auth)/layout.tsx                  无 Sidebar
app/(auth)/auth/page.tsx               登录表单自己当 client 页或表单岛

app/(main)/layout.tsx                  仍可以是 Server
  <Navbar />                           client 岛（菜单、登出）
  <Sidebar />                          client 岛（列表、创建、删除）
  {children}

app/(main)/page.tsx                    Server：欢迎文案
                                       conversationsBrief 可在这里或 layout 里 fetch 再当 props 递给 Sidebar

app/(main)/chat/[windowID]/page.tsx    Server 负责拉历史更好
  <ChatTranscript initialMessages={} />  client 岛：SSE、输入框
       └─ MarkdownMessage              next/dynamic，不要顶层 import react-markdown
       └─ FileModal                    打开弹窗再 import

middleware.ts                          只 jwt-decode + 过期跳 /auth
                                       禁止 import src/routes/api.js
```

几个容易讲含糊的点，展开说：

**（1）为什么 providers 要单独拆，而且必须瘦？**  
layout 要保持 Server，才能继续当 RSC 根、才能写 `metadata` / `next/font`。但 Auth 和 antd 必须 client，所以抽 `providers.tsx`。这里 **只允许** Context 外壳。你如果在 providers 里顺手 `<Sidebar />`，Sidebar 的 axios/antd 又会回到 shared——等于事故换了个文件名。  
「从 providers 里拿掉 Sidebar」不是矫情：providers 挂在 root，auth 路由也会包到它。Sidebar 只能放在 `(main)/layout.tsx`。

**（2）为什么要用 `(auth)` / `(main)` route group？**  
括号目录不进 URL。作用是 **两套 layout**：登录页没有侧栏，已登录壳才有。这是降 `/auth` First Load 的结构手段，比在一个 layout 里 `if (pathname)` 藏 Sidebar 更干净——后者仍然可能静态 import Sidebar。

**（3）Sidebar 放 `(main)/layout` 会进聊天页和首页的 shared，这可以接受。**  
已登录用户三个页都要用侧栏，这份 JS 是该付的。不能接受的是让 **未登录路由** 也付。优化是「按产品壳分层」，不是「每个按钮一个 chunk」。

**（4）`'use client'` 写在叶子，父级怎么传数据？**  
Server layout / page 里 `const data = await getConversationsBrief()`，然后 `<Sidebar initial={data} />`。岛内部再 `useState(initial)` 做创建/删除。这样首屏列表不必等客户端 axios，JS 里也不必为了首屏去打包一整份 getUserInfo 调用链——调用链仍可能在岛里（因为还要「新聊天」），但至少首屏 HTML 已经有列表。这是 RSC 真正的包优化：少一段必须 hydrate 完才能发的瀑布。

**（5）Chat 页不要整页 `'use client'`。**  
需要 hooks 的是：SSE EventSource、受控输入、复制按钮。历史消息如果只是服务端拉下来的静态 Markdown，外壳可以 Server 渲染，只有正在流式的那一条是 client。退一步：整页 client 也行，但 **不要在 page 顶层 import react-markdown 和 FileModal**。用 `dynamic()` 把它们从同步图里拿出去。

```tsx
const MarkdownMessage = dynamic(() => import("./MarkdownMessage"), {
  loading: () => <Spin size="small" />,
  ssr: false,
});
```

`ssr: false` 的理由要说完整：markdown 不是 LCP（LCP 更可能是侧栏或欢迎文案），也没有 SEO 价值；关 SSR 可以让首包不含 `react-markdown` 的解析器。壳子继续 SSR。整页 `ssr: false` 才是错的，那会回到今天这种空 HTML 等 JS。

FileModal 同理：`InputBox` 里不要顶层 import，改成打开时 `import()`，或 `dynamic` 且默认不渲染。今天的静态 `import FileModal` 会把 antd Upload/Modal 绑死在聊天页同步 JS 上。

---

#### 6.5 边界收完，才轮到 `optimizePackageImports`

即使 Client 边界对了，`import { Button, message } from "antd"` 和 `import { PlusOutlined } from "@ant-design/icons"` 仍可能把桶文件卷进来。antd、icons、lodash 这类包的 `index.js` 是「再导出几百个模块」的 barrel。打包器从入口静态分析时，经常因为：

- CJS / ESM 互操作
- 文件里的副作用（样式 import、prototype 修改）
- `export *`

而放弃 tree-shaking，于是你只用了 Button，图里仍有一堆无关组件。

`optimizePackageImports: ["antd", "@ant-design/icons"]` 做的事情很具体：编译期把

```js
import { Button } from "antd";
```

改写成类似

```js
import Button from "antd/es/button";
```

的路径导入（ lucide / lodash-es 同理）。这不是运行时魔法，是让打包器看到「只引用这一个文件」，tree-shaking 才能成立。老配置叫 `modularizeImports`，要自己写 `antd/es/{{member}}`；新的内置名单覆盖了 antd、icons、lucide 这些重灾区。

面试时强调顺序：**先把 Sidebar / Markdown 移出 root client 图，再开这个选项。** 否则只是「shared 里那份巨大 antd 变得略小一点」，登录页该夹带的还是夹带。analyzer 里如果仍能看到 `antd/es/upload`、`react-markdown` 出现在 `/auth` 的图里，说明边界没收完，不是配置没生效。

antd 还有一层 App Router 成本：CSS-in-JS 要 `AntdRegistry`（StyleProvider）包在 client providers 里，否则样式闪或丢。这会增加一点 runtime，但不要为了躲它把整个 layout 标成 client——那才是因小失大。

Server Component **不要**直接 `import { Button } from "antd"`。Button 要事件，本质是 client。Server 文件一 import，轻则这条 Server 树被卷成 client bundle，重则 build 报错。正确是：Server 只传数据，岛内部自己 import antd。

---

#### 6.6 操作顺序（倒过来会像没做过）

**第 1 步：量，写下三条路由的数。**  
`next build`。记录 shared、`/auth`、`/`、`/chat/[id]` 的 First Load。`ANALYZE=true` 开 `@next/bundle-analyzer`，在 treemap 里点 `antd`、`react-markdown`、`axios`，看它们出现在哪条路由。问自己：为什么 `/auth` 的图里有 `PlusOutlined`？顺着 import 回溯，一般会回到 layout 或 providers。

**第 2 步：收 Client 边界。**  
从根往叶问每个 `'use client'`：「这里用了 hooks / 浏览器 API 吗？能不能把这句话移到子文件？」常见误升：一个本可以 Server 的 `page.tsx` 顶部 import 了带 `'use client'` 的 `utils`，或者 import 了 `api.js` 里某个顺带拉起 axios 的函数。文件一旦进 client 图，它的整份依赖都进。

**第 3 步：按壳分层。**  
`(auth)` 和 `(main)` 拆 layout；Sidebar 只存在于 `(main)`。providers 瘦到只剩 Context。

**第 4 步：叶子上再 dynamic。**  
markdown、FileModal、可能还有账号页的邀请码二维码，这些不是壳。用 `next/dynamic` 从同步图拿掉。

**第 5 步：抠桶文件。**  
`optimizePackageImports`。必要时 icons 改成直接路径，避免 `import * as Icons`。

**第 6 步：清 Edge。**  
middleware 单独 20 行：读 cookie / token、`jwtDecode`、过期 `NextResponse.redirect`。不要 import 今天的 `src/routes/api.js`（axios 实例 + 全部 REST）。Edge bundle 和页面 JS 是两份成绩单，要分开看。axios 在 Edge 里体积和 Node API 都不合适。

**第 7 步：同一条路由再 build。**  
验收标准讲清楚才像做过：

- `/auth` First Load 明显低于 `/chat/[id]`（登录不再夹带侧栏和 markdown）
- shared 里找不到 `react-markdown`、`antd/es/upload`
- 聊天页 Size 上升、First Load 的增量来自路由自己，而不是 shared 被一起抬高
- 点进对话后 Network 里才出现 markdown chunk；打开附件后才出现 Upload chunk

shared 没降、只是多了几个小 chunk，说明拆过头或边界没动，只是心理安慰。

---

#### 6.7 和当前 Vite 方案怎么衔接（被问「那为什么不直接上 Next」）

对这个体量：**先在 Vite 做 `React.lazy` + `manualChunks` 就能拿掉大部分首屏 JS**，不必为了拆包迁框架。对应关系要讲明白：

| 今天 Vite 的问题 | Next 里等价的收法 |
| --- | --- |
| `main.jsx` 静态 import 全站 | 不要在 `app/layout.tsx` 静态 import 页面级组件 |
| 没有 `React.lazy` | App Router 默认按目录拆；仍要防止 layout 把它们并回 shared |
| `manualChunks: { antd, markdown }` | markdown 用 `dynamic`；antd 用边界 + `optimizePackageImports` |
| 登录和聊天同一张模块图 | `(auth)` / `(main)` 两套 layout |
| 首屏等 JS 才能画壳 | Server layout + RSC 先吐 HTML，岛再 hydrate |

Next 多出来、Vite 不容易白嫖的部分：

- 欢迎页 / 会话摘要可以 Server fetch，少一轮客户端 `getUserInfo` 瀑布
- `next/font` 把字体打进构建，避免 Google Fonts 阻塞
- middleware 在边缘跳登录，少一次「先出 SPA 再 redirect」的白屏

成本也要说：antd 的 `AntdRegistry`、全员 `'use client'` 纪律、SSE / EventSource 仍然只能在 client（Token 进 URL 的问题框架解决不了）。所以收口是：

> 包优化策略跨框架是同一套：先看首屏必须下载的 JS，再砍同步依赖。Next 只是把成绩单变成 First Load JS，把最大风险从「忘了 lazy」变成「layout 标成了 client」。我不会为了拆包而迁框架；若已经在 Next 上，我也不会先去调 webpack。

---

#### 6.8 追问速查（Next 专项）

**`optimizePackageImports` 和 `modularizeImports` 什么关系？**  
后者是老配置，手写 `antd` → `antd/es/{{member}}`。前者是 Next 内置的 barrel 改写，lodash、lucide、antd、icons 最吃这个。没有它，tree-shaking 经常败给副作用和 CJS。它解决「用了 Button 却打进半个 antd」；不解决「layout 把 Button 打进了所有路由」。

**为什么 Server Component import antd 会出事？**  
antd 组件要 onClick 和 Context，必须是 client。Server 文件 import 它，模块图会把该树卷进 client，或直接 build 失败。Server 页只传 props，岛内部再 import。

**`dynamic` 的 `ssr:false` 会不会伤 SEO / LCP？**  
聊天气泡、上传弹窗没有 SEO 价值，LCP 也不该是 Markdown。壳（标题、侧栏骨架、欢迎文案）继续 SSR。整页 `ssr:false` 会回到现在这种空 `#root`。

**middleware 能不能 jwt-decode？**  
能，库很小。不能顺手 import 带 axios / antd 的业务模块。Edge 包和页面 JS 分开计量。

**RSC 数据算包优化吗？**  
算「首屏必须下载的字节」，但不是 JS parse。报结果时说清省的是 Client JS 还是 Flight / 瀑布。

**和 Vite `manualChunks` 怎么类比？**  
Vite 手动把 antd / markdown 打进 async chunk ≈ Next 里「别从 layout import 它们 + `dynamic`」。Next 不需要你写 `manualChunks` 才能按路由拆；你需要保证不要从 shared layout 把它们又并回去。

**能不能把所有组件都标 `'use client'`，只靠 dynamic 拆？**  
能跑，但 First Load 仍会包含所有同步 import 的岛。dynamic 只对 **异步 import 的叶子** 有效。父级 client layout 里静态 `import Sidebar`，Sidebar 永远在 shared。所以边界是第一刀，dynamic 是第二刀。

---

## 三、高并发

前端说的「高并发」通常不是 QPS 百万，而是三层：**自己页面上的并发请求、浏览器连接限制、后端限流时前端怎么配合**。

### Q1. 这个项目在并发上实际做了什么？

做得很少：

- axios `timeout: 8000`，只约束 REST，不管 SSE。
- 没有 `AbortController`，没有请求去重，没有并发锁。
- SSE 用原生 `EventSource`（HTTP/1.1 下同域通常最多 6 条连接）。
- 日限额用 SSE 哨兵字符串 `[ERROR-EXCEESS-DAILYUSAGE]`，不是 HTTP 429。
- 发送按钮有 `loading` state，但 **从来没 `setLoading(true)`**，流式过程中可以连点。

把「没做」讲清楚，比假装做过限流更加分。

### Q2. 切会话时的竞态（高频追问）

`ChatPage`：

```js
useEffect(() => {
  const initMessages = async () => {
    const data = await getMessageHistory(email, windowID);
    if (data.success) setMessages(data.messageHistory || []);
  };
  initMessages();
}, [windowID, email]);
```

没有 abort，没有 `cancelled` 标志，切走也不清空。

**场景：** 快速点会话 A → B。若 A 的历史更慢，A 的响应后到，会把 B 的列表覆盖成 A。这就是经典 **stale response / 竞态**。

**标准解法（口述 + 能写出来）：**

```js
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;
  setMessages([]); // 立刻切断旧 UI
  (async () => {
    const data = await getMessageHistory(email, windowID, controller.signal);
    if (!cancelled && data.success) setMessages(data.messageHistory || []);
  })();
  return () => {
    cancelled = true;
    controller.abort();
  };
}, [windowID, email]);
```

用 TanStack Query 则 `queryKey: ["conversation", windowID]`，框架自动忽略过期结果。

### Q3. SSE 并发：连点发送、切走、多标签

当前 `getChatGPTResponse`：

- 每次发送 `new EventSource(...)`，句柄只在闭包里。
- 没有在 `useEffect` cleanup 里 `close()`。
- chunk 处理是「改最后一条消息」：`updatedMessages[lastIndex].content += chunk`。

**会出什么事故：**

1. 连点发送：多条 SSE 同时写 `messages[last]`，回复互相污染。
2. 流式中切到别的会话：旧 EventSource 还在 `setMessages`，新会话出现旧流的字。
3. 组件卸载后仍 setState（StrictMode 开发态更明显）。
4. HTTP/1.1 下开满 6 条 EventSource 后，侧栏的 REST 请求会被堵住（**队头阻塞**）。这是前端高并发很加分的点。

**改法：**

- `eventSourceRef`，新请求先 `close()` 旧连接。
- `sending` 锁：流式期间禁用输入；InputBox 的 `loading` 真正接上。
- 用 `messageId` 更新指定消息，不要永远改 last。
- 卸载 / `windowID` 变化时 close。
- 长期：`fetch` + `ReadableStream` 带 `Authorization` 头，避免 token 进 URL；HTTP/2 / 连接复用。

### Q4. 侧栏创建会话的闭包过期

```js
setConversationsBrief([
  res.data.conversationBrief,
  ...conversationsBrief, // 可能是过期快照
]);
```

连点「新聊天」时，两次请求都基于同一份旧数组，后写覆盖先写，**丢一条会话**。应使用函数式更新：`setConversationsBrief(prev => [brief, ...prev])`。删除同理。

这是 React 并发/高频点击的典型题，不一定要上升到「后端高并发」。

### Q5. 后端高并发时，前端怎么配合？（即使这是 FE 仓库也要能答）

结合现有接口设计讲：

1. **限流可见性：** 日限额现在靠 SSE 特殊字符串。更规范是 429 + `Retry-After`，前端统一拦截、倒计时、禁止重试风暴。
2. **幂等：** 创建会话、发送消息应带 `clientRequestId`。连点不会造出两个窗或两轮计费。
3. **超时与重试：** axios 8s 超时后没有智能重试（这是对的：对写接口盲目重试会放大后端压力）。读接口才能有限次退避重试。
4. **降级：** SSE `onerror` 只 toast。高并发下应：停自动重连（EventSource 默认会重连，代码里手动 close 是对的）、展示半截回复、允许「重新生成」。
5. **连接数：** 不要对每个 token 开一条长连接；同一会话同一时间只允许一条 in-flight stream。
6. **数据包：** `conversationsBrief` 已经在减带宽和后端序列化成本。列表分页、历史分页（现在是一次拉全量 `messageHistory`）是下一步。

### Q6. EventSource 为什么把 token 放 query？和并发有什么关系？

原生 `EventSource` **不能自定义 header**，所以代码把 `token=` 拼到 URL。这是实现约束，不是好设计。

高并发/安全叙事：网关 access log、CDN log、浏览器历史全是凭证。改用 `fetch` 流或 cookie（HttpOnly + SameSite）才能在高 QPS 网关里做统一鉴权，而不把 JWT 打进日志。

### Q7. 文件解析的「伪轮询」

`FileModal` 确认时调用一次 `getFileStatus`。状态是 `processing | ready | failed`。processing 只提示「1-3 分钟后再试」，**没有 setInterval 轮询**。

面试怎么说：避免无脑轮询打爆解析服务；更好的是指数退避轮询、或上传后用 SSE/WebSocket 推状态。这就是前端侧的并发保护。

---

## 四、前后端数据不一致

核心句：**服务端是 Source of Truth，UI 是投影。任何乐观更新都要能对账、能回滚、能处理乱序。**

### Q1. 这个项目有哪些「两份真相」？

| 数据 | 前端副本 | 服务端 | 不一致怎么发生 |
| --- | --- | --- | --- |
| 登录用户 | `localStorage.user` + Context | DB 用户 | 登录后从未再拉全量用户；套餐/用户名会过期 |
| Token 有效 | `jwt-decode(exp)` | 签发/黑名单 | 纯客户端过期；服务端吊销前端不知道；无 401 拦截 |
| 会话列表 | `conversationsBrief` state | 会话表 | 创建/删除后只改本地；流式结束后不刷新；后端若自动按首句改标题，侧栏仍是旧标题 |
| 消息列表 | `messages` state | 会话消息 | 乐观插入用户气泡 + 本地拼接 SSE；`[DONE]` 后 **不重新 getConversation** |
| 会话标题 | `ConversationItem` 内部 `useState(title)` | `editChatWindow` | 先改 UI 再请求，失败也不回滚 |
| 文件 | Modal 内 `fileList` | S3 + 解析状态 | 上传成功只信 response；解析是异步，ready 前不能当上下文 |

### Q2. 乐观更新：哪些做对了，哪些漏了？

**发送消息（部分乐观）：** 先插入 user 气泡，再开 SSE，再插一条 `loading: true` 的 assistant。感知快，这是对的。

**漏了：**

- 失败时半截 assistant 气泡还在，没有标记 error，也没有回滚。
- 不和服务器对账，本地拼接内容可能和落库不一致（编码、`\\n` 替换、截断、日限额中途断开）。
- 日限额分支 `close()` 后，空的 assistant 气泡仍留在列表。

**重命名：** `onBlur` 立刻 `setIsEditing(false)`，本地 title 已变，请求失败只 toast。应保留 `prevTitle`，失败 `setTitle(prevTitle)`。

**删除：** 先等 API 成功再 `filter`，这是 **pessimistic**，一致性更好，手感稍慢。可以说「破坏性操作我选择等服务端确认」。

**创建：** 201 后再插入列表并 navigate，也是等服务端。但用了过期闭包，并发下会丢数据。

**面试对比句：** 「创建/删除走确认后再改列表；发送和重命名走乐观。问题是乐观路径没有版本号和回滚。」

### Q3. 流式内容为什么容易和 DB 对不上？

前端自己 `content += event.data.replace(/\\n/g, "\n")`。假设：

- chunk 边界拆在转义中间
- 服务端实际存的是另一份规范化文本
- 连接在 `[DONE]` 前断了，服务端可能已存半截或整段
- 前端日限额提前 close，服务端是否落库未知

**正确对账：** `[DONE]` 或 error 后用同一 `windowID` 再拉一次历史（或 SSE 最后一帧带 `serverMessageId + checksum`）。至少在 `visibilitychange` 回到前台时失效缓存。

### Q4. 切会话闪旧消息，算不算数据不一致？

算 **UI 层的错误投影**。`messages` 是组件 state，没有按 `windowID` 做 key。React 复用 `ChatPage` 实例时 state 残留。

更好模型：

- `key={windowID}` 挂在路由 element 上，切窗直接卸载重建；或
- `messagesByWindowId` 规范化 store，当前窗只读自己的槽位。

这和「服务端数据错了」不同，面试里要主动区分：**缓存键错了** vs **服务端和客户端字段不一致**。

### Q5. 接口字段演进：`conversations` → `conversationsBrief`

这就是真实的前后端契约不一致案例。如果只发后端、前端仍读 `data.conversations`，侧栏会变成空数组或 undefined。

**答「如何避免契约漂移」：**

- 共享 TypeScript 类型 / OpenAPI，CI 校验。
- 前端对关键字段做 runtime 校验（zod），缺字段直接失败而不是静默空 UI。
- 版本化字段，兼容期同时返回 `conversations` 和 `conversationsBrief`。
- 这次改动的正确方向：列表 DTO 和详情 DTO 分离。

### Q6. 文件状态机：最适合讲「最终一致」

上传 `action` 写死 `http://localhost:3000/njapi/upload/uploadSingle`，生产环境 `VITE_API_URL` 是 `https://hideinbush.top/njapi`，**生产和开发数据源都不一致**，这是环境配置造成的 FE/BE 对不齐。

业务上：上传成功 ≠ 可引用。`processing` 时确认会被拒绝。这是对的，避免把未解析文件当上下文发给 `/chat/conversation`。

面试升华：异步任务用状态机，不要用「上传成功就乐观选中」。需要 `fileId` + 状态，前端展示 processing，服务端拒绝未 ready 的 `fileKey`（不能只靠前端拦截）。

### Q7. 多端 / 多标签会怎样？

没有 WebSocket 同步会话列表。标签 A 删除会话，标签 B 的 SideBar 仍显示；点进去会请求失败。`localStorage` 的 token 是共享的，但 React state 不共享。

**答：** 对会话列表用 `storage` 事件或广播频道做跨标签失效；更好是短轮询/推送 invalidation。当前产品阶段可以接受「刷新才一致」，但要说得出边界。

### Q8. 注册参数不一致（契约 bug，很好用的例子）

`Register.jsx` 调用：

```js
register(username, email, password, verificationCode);
```

`api.register` 只接收三个参数，body 只有 `{ username, email, password }`。验证码只在上一步 `Verify` 里校验过，注册请求没带上。

这是典型的 **前后端/前后模块契约不一致**：页面以为带了第四个参数，API 层丢了。面试官问「你怎么保证表单数据和接口一致」就讲：类型、单测、不要在 wrapper 里默默丢字段。

---

## 五、四个主题串成一套「项目故事」（建议背这段）

> 首屏上，我们用 localStorage 的 JWT 同步放行，避免鉴权请求挡住壳子；侧栏只拉 `conversationsBrief`，消息按窗口再拉，这是已经做了的数据包优化。但 JS 侧还没做路由懒加载，antd 和聊天页都在主包，所以 FCP 仍被 bundle 限制。如果换 Next App Router，我会盯 First Load JS，而不是先改打包配置：layout 保持 Server，`'use client'` 只留在侧栏 / SSE / Markdown 这些叶子上，antd 走 `optimizePackageImports`，markdown 用 `dynamic` 进聊天路由。本质和 Vite 的 lazy + manualChunks 一样，只是 Next 最容易在 root layout 标成 client 把拆包吃掉。
>
> 并发上，聊天是 SSE。EventSource 不能带 Authorization，token 只能放 query，这是实现换安全的取舍。更大的问题是没有 abort、没有发送锁、chunk 总是写最后一条消息，快切会话或连点会把数据写乱。浏览器同域 6 条长连接还会堵住 REST。
>
> 一致性上，UI 大量信本地投影：流式拼接后不对账、重命名失败不回滚、用户信息只在登录时写入。服务端仍是权威，前端缺的是「乐观更新 + 用 windowID/messageId 对账 + 失败回滚」。文件解析用 processing/ready/failed 状态机，这是项目里相对正确的最终一致模型。

---

## 六、可能的追问（短答）

**为什么不用 WebSocket 改 SSE？**  
SSE 是单向服务端推，正好适合 token 流；实现简单、自动重连。需要多端同步会话列表、输入中状态、通知时再上 WS。当前只推一个生成流，SSE 够。

**为什么不用 Redux？**  
状态很局部：user、会话摘要、当前窗消息。Context + useState 够。缺的不是 Redux，是带 `queryKey` 的服务端状态（TanStack Query）和请求生命周期。

**key={index} 有什么问题？**  
流式过程中插入/失败占位时，index 会错位，组件 state（复制按钮 `copied`）会串。应用服务端 `messageId`。

**StrictMode 双调用？**  
开发态 effect 跑两次，会打两次 `getUserInfo` / `getMessageHistory`。生产一次。所以 effect 必须幂等、必须 cleanup。

**如何衡量优化？**  
Performance 面板看 FCP/LCP；Vite 用 visualizer 看「首屏必须下载的 JS」；Next 用 `next build` 的 First Load JS（shared vs 分路由）+ `@next/bundle-analyzer`。Charles / Network 看请求链和 payload。对竞态写一个「快速切换 windowID」的测试。

---

## 七、如果让你做改造，优先级怎么排（体现判断力）

1. **正确性：** EventSource 生命周期、AbortController、发送锁、函数式 setState、路由大小写 `ChatPage` vs `chatPage`、上传 URL 改用 `VITE_API_URL`。
2. **一致性：** `[DONE]` 后 revalidate；重命名回滚；axios 401 清 token。
3. **首屏/包：** Vite 先 lazy + antd/markdown 拆 chunk，删 localforage；若在 Next，先收 `'use client'` 边界和 First Load JS，再 `optimizePackageImports` / `dynamic`。
4. **体验：** 骨架屏、虚拟列表、流式期间跳过 Markdown。

面试结尾可以补一句：「我不会一上来上微前端。这个体量先把竞态和首屏 JS 做对。上 Next 也是为了 RSC 和按路由的 First Load，不是为了再配一遍 webpack。」
