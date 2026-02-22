"use client";

import { Button, Input, Select, DatePicker, Form } from "antd";

export default function StepRecipient({ onNext, data, onChange }) {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    onChange(values);
    onNext();
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Who is this surprise for?</h2>
        <p className="mt-2 text-gray-600">Let's start by personalizing the experience.</p>
      </div>
      
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-primary/5 border border-gray-100">
        <Form
            form={form}
            layout="vertical"
            initialValues={data}
            onFinish={onFinish}
            size="large"
            requiredMark={false}
        >
            <Form.Item
            label={<span className="font-semibold text-gray-700">Recipient Name</span>}
            name="recipientName"
            rules={[{ required: true, message: "Please enter a name" }]}
            className="mb-6"
            >
            <Input placeholder="e.g. Sarah" className="rounded-xl py-3" />
            </Form.Item>

            <Form.Item
            label={<span className="font-semibold text-gray-700">Occasion</span>}
            name="occasion"
            rules={[{ required: true, message: "Please select an occasion" }]}
            className="mb-6"
            >
            <Select placeholder="Select occasion" className="rounded-xl h-[50px] [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-gray-300">
                <Select.Option value="birthday">Birthday</Select.Option>
                <Select.Option value="anniversary">Anniversary</Select.Option>
                <Select.Option value="valentine">Valentine's Day</Select.Option>
                <Select.Option value="just-because">Just Because</Select.Option>
            </Select>
            </Form.Item>

            <Form.Item 
                label={<span className="font-semibold text-gray-700">Custom URL Slug</span>} 
                name="slug"
                className="mb-6"
                help="This will be the link you share (e.g. surpriseal.com/sarah-bday)"
            >
            <Input addonBefore="surpriseal.com/" placeholder="sarah-bday-2024" className="rounded-xl py-1" />
            </Form.Item>

            <Form.Item 
                label={<span className="font-semibold text-gray-700">Unlock Date & Time (Optional)</span>} 
                name="unlockDate"
                className="mb-8"
            >
            <DatePicker showTime className="w-full rounded-xl py-3" />
            </Form.Item>

            <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block size="large" className="h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
                Continue to Message
            </Button>
            </Form.Item>
        </Form>
      </div>
    </div>
  );
}
