"use client";

import { Button, Form, Input, Switch } from "antd";

const { TextArea } = Input;

export default function StepReveal({ onNext, onBack, data, onChange }) {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    onChange(values);
    onNext();
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">The Grand Finale</h2>
      <Form
        form={form}
        layout="vertical"
        initialValues={data}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          label="Final Message"
          name="finalMessage"
          rules={[{ required: true, message: "Please enter a final message" }]}
        >
          <TextArea
            rows={4}
            placeholder="The big question, or a final loving thought..."
            className="text-lg"
          />
        </Form.Item>

        <Form.Item label="Confetti Explosion" name="confetti" valuePropName="checked">
           <Switch defaultChecked />
        </Form.Item>

        <div className="flex gap-4 mt-8">
             <Button onClick={onBack} size="large" className="flex-1">
                Back
            </Button>
            <Button type="primary" htmlType="submit" size="large" className="flex-1">
                Preview & Pay
            </Button>
        </div>
      </Form>
    </div>
  );
}
