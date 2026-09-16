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

面试别报清单。选一条做过的主线：

> **北极星是每条路由的 First Load JS，手段是把 `'use client'` 往叶子推，再用 `optimizePackageImports` 收 antd 桶文件。**

这套是 App Router 上真正吃过亏才会说的。Pages Router 时代的人爱谈 webpack splitChunks；App Router 上最大的包往往不是「没配置」，而是 **layout 变成了整站 Client 根**。

#### 90 秒口述（建议背）

> 聊天这种产品迁到 Next，我不会先改 webpack。先 `next build` 看两条数：`First Load JS shared by all`，以及 `/`、`/auth`、`/chat/[id]` 各自的 First Load。
>
> 典型事故是 root `layout.tsx` 标了 `'use client'`——因为要挂 UserContext、antd `ConfigProvider`、还把 SideBar 放进 layout。结果登录页也下载侧栏、聊天 Markdown、上传弹窗。RSC 等于没了，shared JS 居高不下。
>
> 我的改法是：layout 保持 Server；单独做一层很瘦的 `providers.tsx`（只包 Auth + AntdRegistry）；SideBar 是 layout 里的 client island，**从 providers 里拿掉**，避免 import 链把 `api.js` / 图标全送进 shared。聊天页的 `react-markdown` 用 `next/dynamic`，进会话才加载。antd / icons 开 `optimizePackageImports`，让 `import { Button } from 'antd'` 被改写成路径导入。middleware 只做 JWT 过期跳转，绝不 import 业务 `api.js`。每改一次对着同一条路由重新 `next build` 对比 First Load，并用 `@next/bundle-analyzer` 看 treemap 里是不是 barrel 和误升的 client 树。

#### 为什么这条主线像「认真做过」

| 没做过会说的 | 做过会盯的 |
| --- | --- |
| 用 `dynamic import`、开压缩、上 CDN | `shared by all` 为什么高；是哪条 import 链打进来的 |
| 把所有组件都 `ssr: false` | 只对「浏览器 only」的叶子关 SSR（markdown/上传），壳还是 RSC |
| antd 换成按需插件就完了 | App Router 里桶文件 + Client 边界叠加，要 `optimizePackageImports`，还要禁止 Server Component 直接 `import 'antd'` |
| 拆越细越好 | 拆完要对同一路由看 First Load；拆过头只是多请求，shared 没降 |

#### 对照本产品，Client 边界怎么画

没做过会把整棵树标成 client。做过会按 **岛** 画：

```
app/layout.tsx                    Server：html、next/font、metadata。禁止 antd / axios
app/providers.tsx                 Client：UserProvider + AntdRegistry，保持极瘦
app/middleware.ts                 Edge：只 jwt-decode + 跳 /auth。禁止 import ./routes/api
app/(main)/layout.tsx             Server 壳 + 一个 <Sidebar /> island
app/(main)/page.tsx               Server 欢迎文案；conversationsBrief 可在 Server 拉完当 props
app/(main)/chat/[windowID]/page.tsx
                                  Server 可拉历史；消息列表 / SSE / InputBox 才是 Client
app/(auth)/auth/page.tsx          独立 route group，layout 不挂 Sidebar
components/markdown-message.tsx   next/dynamic，ssr:false 或至少不进 shared
components/file-modal.tsx         打开弹窗才 import
```

对应今天 Vite 代码里的问题，迁过去会自动暴露：

1. `main.jsx` 静态 import 全站 → Next 按目录拆路由，但 **layout 里 import ChatPage 会立刻把收益打回原形**。
2. `SideBar.jsx` import antd Button/icons + `api.js` → 放进 root layout 就会进 `shared by all`。登录页不需要侧栏，要用 route group 把 `(auth)` 和 `(main)` 拆开。
3. `Message.jsx` 顶层 `import ReactMarkdown` → 必须留在 chat 叶子，用 `dynamic()`。
4. `FileModal` 写死 localhost、依赖 Upload/Modal → 弹窗级 dynamic，不要从 InputBox 静态链路进首屏。
5. `jwt-decode` 可以出现在 middleware；`axios` 不行（Edge 体积 + Node API）。

#### 操作顺序（体现判断力，不要倒过来）

**1. 量。** `next build` 把 `/auth`、`/`、`/chat/[id]` 的 First Load 记下来。`ANALYZE=true` 开 `@next/bundle-analyzer`。同时分清三笔账，别混着报数字：

- Client JS：下载 + 解析 + hydrate（包优化主战场）
- RSC Flight payload：Server 传来的树和数据（`conversationsBrief` 放 Server 会走这个，不是 JS）
- CSS：antd 样式可能看起来像「JS 没小」

**2. 收 Client 边界。** 从根到叶问：这个文件为什么要 `'use client'`？常见误升：文件顶部 import 了一个 client 模块，整文件变 client，父 Server Component 跟着废掉。聊天页只要 InputBox / SSE / 复制按钮是 client，历史列表外壳可以 Server 先吐。

**3. 再抠依赖。** 边界对了，配置才有用：

```js
const nextConfig = {
  experimental: {
    optimizePackageImports: ["antd", "@ant-design/icons"],
  },
};
```

（较新版本里这个配置已升到顶层 `optimizePackageImports`，面试说「等价于编译期把桶导入改写成 `antd/es/button`」即可。）

```js
const MarkdownMessage = dynamic(() => import("./MarkdownMessage"), {
  loading: () => <Spin />,
  ssr: false, // markdown 首屏不是 LCP，可关 SSR 换更小的首包
});
```

**4. 清 Edge / 共享模块。** middleware 误 import `src/routes/api.js`（axios 实例、拦截器、一堆 REST 函数）是真实项目里很常见的「突然 +200KB」来源。鉴权中间件单独写 20 行。

**5. 再 build 同一条路由。** shared 降了、`/auth` 不再含 markdown / FileModal，才算成。登录页 First Load 明显低于聊天页，说明 route group 和 dynamic 生效。

#### 和当前 Vite 方案怎么衔接（被问「那你为啥不直接上 Next」）

对这个体量：**先在 Vite 做 `React.lazy` + `manualChunks` 就能拿掉大部分首屏 JS**，不必为了拆包迁框架。Next 的额外收益是：

- 路由级拆包是默认的，不用手写 lazy
- 欢迎页 / 会话摘要可以 RSC，首屏少一段 `getUserInfo` 瀑布
- `next/font` 避免字体闪和额外请求
- middleware 在边缘做登录跳转，少一次客户端白屏再 redirect

迁 Next 的成本是 antd 的 App Router 适配（`AntdRegistry`、CSS-in-JS）、`'use client'` 纪律、SSE 仍只能在 client。所以面试收口：**包优化策略跨框架是同一套；Next 只是把成绩单变成 First Load JS，把最大风险从「忘了 lazy」变成「layout 标成了 client」。**

#### 追问速查（Next 专项）

**`optimizePackageImports` 和 `modularizeImports` 什么关系？**  
后者是老配置，手写 `antd` → `antd/es/{{member}}`。前者是 Next 内置的 barrel 优化，lodash、lucide、antd、icons 这类「一个 index 再导出几百个」最吃这个。没有它，tree-shaking 经常败给副作用和 CJS。

**为什么 Server Component import antd 会出事？**  
antd 组件要事件和 Context，本质是 client。Server 文件 import 它，这条模块图会把该 Server 树变成 client bundle，或者直接 build 报错。正确是：Server 页只传数据，UI 岛自己 import antd。

**`dynamic` 的 `ssr:false` 会不会伤 SEO / LCP？**  
聊天气泡、上传弹窗没有 SEO 价值，LCP 也不该是 Markdown。壳子（标题、侧栏骨架）继续 SSR。整页 `ssr:false` 才是错的。

**middleware 能不能 jwt-decode？**  
能，库很小。不能顺手 import 带 axios / antd 的业务模块。Edge bundle 和页面 JS 是两份包，要分开看体积。

**RSC 数据算包优化吗？**  
算「首屏必须下载的字节」，但不是 JS parse。把 `conversationsBrief` 放到 Server fetch，省的是客户端 axios + 瀑布，Flight payload 仍在。报优化结果时要说清省的是哪一笔。

**和 Vite `manualChunks` 怎么类比？**  
Vite 手动把 antd / markdown 打进 async chunk ≈ Next 里「别从 layout import 它们 + `dynamic`」。Next 不需要你写 `manualChunks` 才能按路由拆；你需要保证 **不要从 shared layout 把它们又并回去**。

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
