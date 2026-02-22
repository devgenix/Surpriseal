"use client";

import { Button, Form, Upload, Radio } from "antd";
import { UploadOutlined, AudioOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { useState } from "react";

export default function StepMedia({ onNext, onBack, data, onChange }) {
  const [mediaType, setMediaType] = useState(data.mediaType || "video");
    const [form] = Form.useForm();

  const onFinish = (values) => {
    onChange({ ...values, mediaType });
    onNext();
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add a Personal Touch</h2>
      <p className="text-gray-500 mb-8">Upload a video greeting or record a voice message.</p>

       <div className="mb-8 flex gap-4">
        <Button 
            type={mediaType === "video" ? "primary" : "default"} 
            icon={<VideoCameraOutlined />} 
            onClick={() => setMediaType("video")}
            className="flex-1 h-12"
        >
            Video
        </Button>
        <Button 
            type={mediaType === "audio" ? "primary" : "default"} 
            icon={<AudioOutlined />} 
            onClick={() => setMediaType("audio")}
            className="flex-1 h-12"
        >
            Voice Note
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={data}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
            name="mediaFile"
            label={mediaType === "video" ? "Upload Video" : "Upload Audio"}
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
        >
             <Upload action="/upload.do" listType="text" maxCount={1}>
                <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
        </Form.Item>

        <div className="flex gap-4 mt-8">
             <Button onClick={onBack} size="large" className="flex-1">
                Back
            </Button>
            <Button type="primary" htmlType="submit" size="large" className="flex-1">
                Continue to Reveal
            </Button>
        </div>
      </Form>
    </div>
  );
}
