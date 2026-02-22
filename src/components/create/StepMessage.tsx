"use client";

import { Button, Input, Form, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { TextArea } = Input;

export default function StepMessage({ onNext, onBack, data, onChange }) {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    onChange(values);
    onNext();
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Set the mood</h2>
      <Form
        form={form}
        layout="vertical"
        initialValues={data}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          label="Opening Message"
          name="openingMessage"
          rules={[{ required: true, message: "Please write an opening message" }]}
        >
          <TextArea
            rows={4}
            placeholder="Write a heartfelt message to start the experience..."
          />
        </Form.Item>

        <Form.Item label="Background Music" name="bgMusic">
           <Upload>
            <Button icon={<UploadOutlined />}>Click to Upload Music (Optional)</Button>
          </Upload>
        </Form.Item>

        <div className="flex gap-4">
             <Button onClick={onBack} size="large" className="flex-1">
                Back
            </Button>
            <Button type="primary" htmlType="submit" size="large" className="flex-1">
                Continue to Memories
            </Button>
        </div>
      </Form>
    </div>
  );
}
