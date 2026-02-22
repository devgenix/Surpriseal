"use client";

import { useState } from "react";
import { Steps } from "antd";
import { UserOutlined, MessageOutlined, PictureOutlined, VideoCameraOutlined, GiftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import StepRecipient from "@/components/create/StepRecipient";
import StepMessage from "@/components/create/StepMessage";
import StepMemories from "@/components/create/StepMemories";
import StepMedia from "@/components/create/StepMedia";
import StepReveal from "@/components/create/StepReveal";
import StepPreview from "@/components/create/StepPreview";

const steps = [
  {
    title: "Recipient",
    icon: <UserOutlined />,
  },
  {
    title: "Message",
    icon: <MessageOutlined />,
  },
  {
    title: "Memories",
    icon: <PictureOutlined />,
  },
  {
    title: "Media",
    icon: <VideoCameraOutlined />,
  },
  {
    title: "Reveal",
    icon: <GiftOutlined />,
  },
  {
    title: "Review",
    icon: <CheckCircleOutlined />,
  },
];

export default function CreatePage() {
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState({});

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleFormChange = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  const items = steps.map((item) => ({ key: item.title, title: item.title, icon: item.icon }));

  return (
    <Section className="min-h-screen bg-gray-50/50">
      <Container>
        <div className="flex flex-col lg:flex-row gap-12">
            {/* Steps Sidebar (Left) */}
          <div className="w-full lg:w-64 flex-shrink-0">
             <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <Steps direction="vertical" current={current} items={items} className="hidden lg:flex" />
                <Steps direction="horizontal" current={current} items={items} className="lg:hidden" size="small" responsive={false} />
             </div>
          </div>

          {/* Form Content (Right) */}
          <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[600px]">
            {current === 0 && <StepRecipient onNext={next} data={formData} onChange={handleFormChange} />}
            {current === 1 && <StepMessage onNext={next} onBack={prev} data={formData} onChange={handleFormChange} />}
            {current === 2 && <StepMemories onNext={next} onBack={prev} data={formData} onChange={handleFormChange} />}
            {current === 3 && <StepMedia onNext={next} onBack={prev} data={formData} onChange={handleFormChange} />}
            {current === 4 && <StepReveal onNext={next} onBack={prev} data={formData} onChange={handleFormChange} />}
            {current === 5 && <StepPreview onBack={prev} data={formData} />}
          </div>
        </div>
      </Container>
    </Section>
  );
}
