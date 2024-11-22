import React from "react";
import { Card, Typography, List } from "antd";
import {
  EditOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import "./style.css"; // 引入CSS文件

const { Paragraph } = Typography;

const guideData = [
  {
    icon: <EditOutlined className="card-icon" />,
    title: "长文章",
    examples: ["创作一篇关于跨境营销的博客", "写一个关于2040年的冒险的故事"],
  },
  {
    icon: <BulbOutlined className="card-icon" />,
    title: "创意思法",
    examples: [
      "为一种狗粮产生3个幽默的产品标题",
      "说服一个人加入健身房的5个理由",
    ],
  },
  {
    icon: <QuestionCircleOutlined className="card-icon" />,
    title: "解释和提问",
    examples: ["向一个5岁的孩子解释SEO", "如何写Python代码抓取一个网站？"],
  },
];

const IntroductionCards = () => {
  return (
    <div className="guide-container">
      {guideData.map((item, index) => (
        <Card
          key={index}
          className="guide-card"
          title={
            <div className="card-title">
              {item.icon}
              <span>{item.title}</span>
            </div>
          }
          hoverable
        >
          <List
            size="small"
            dataSource={item.examples}
            renderItem={(example) => (
              <List.Item className="list-item">
                <Paragraph>{example}</Paragraph>
              </List.Item>
            )}
          />
        </Card>
      ))}
    </div>
  );
};

export default IntroductionCards;
