"use client";

import { Button, Form, Upload, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function StepMemories({ onNext, onBack, data, onChange }) {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    onChange(values);
    onNext();
  };

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
        return e;
        }
        return e?.fileList;
    };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Add Memories</h2>
      <p className="text-gray-500 mb-6">Choose up to 5 special photos.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={data}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
            name="photos"
            valuePropName="fileList"
            getValueFromEvent={normFile}
        >
            <Upload action="/upload.do" listType="picture-card">
                <button style={{ border: 0, background: 'none' }} type="button">
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                </button>
            </Upload>
        </Form.Item>

         <Form.Item
          label="Caption (Optional)"
          name="memoriesCaption"
        >
          <Input placeholder="A short note about these memories..." />
        </Form.Item>

        <div className="flex gap-4 mt-8">
             <Button onClick={onBack} size="large" className="flex-1">
                Back
            </Button>
            <Button type="primary" htmlType="submit" size="large" className="flex-1">
                Continue to Video
            </Button>
        </div>
      </Form>
    </div>
  );
}
