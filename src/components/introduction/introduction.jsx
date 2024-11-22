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
    title: "提出背景信息，比如",
    examples: [
      "我是一名中学历史老师，我需要写不少于5000字的教案，具体要求如下......",
      "请给出北京地区的牙膏营销策略",
    ],
  },
  {
    icon: <QuestionCircleOutlined className="card-icon" />,
    title: "进一步给出回答要求，比如",
    examples: [
      "接下来我用中文提问，你用英文作答",
      "请具体解释营销策略中客户定制、交叉销售、联合推广的部分",
    ],
  },
  {
    icon: <BulbOutlined className="card-icon" />,
    title: "场景提问，比如",
    examples: [
      "请向5岁的小孩解释什么是双缝干涉实验",
      "我现在要给我的狗取名字，它是一只黑白的边牧",
    ],
  },
];

const IntroductionCards = () => {
  return (
    <>
      <h3 className="introduction-title">好的问题是好的答案的开始</h3>

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
    </>
  );
};

export default IntroductionCards;
