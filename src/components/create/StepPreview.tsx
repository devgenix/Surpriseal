"use client";

import { Button, Card, Divider } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

export default function StepPreview({ onBack, data }) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center text-secondary-foreground">Ready to Publish?</h2>
      
      <div className="flex gap-10 flex-col md:flex-row items-start">
        {/* Preview Pane - Mockup */}
        <div className="w-full md:w-[320px] mx-auto bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-900 ring-1 ring-gray-900/10">
             <div className="bg-background w-full h-full rounded-[2.2rem] overflow-hidden relative isolate">
                 {/* Mockup Content */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
                 
                 <div className="flex flex-col items-center justify-center h-full p-6 text-center relative z-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <span className="text-3xl">❤️</span>
                    </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">For {data.recipientName}</h3>
                     <p className="text-sm text-gray-500 mb-8">A special surprise awaits you.</p>
                     <Button type="primary" shape="round" className="shadow-lg shadow-primary/30">Tap to Open</Button>
                 </div>
             </div>
        </div>

        {/* Summary side */}
        <div className="flex-1 w-full space-y-6">
            <Card hoverable className="border-primary/20 bg-primary/5 rounded-2xl overflow-hidden">
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                        <span className="font-medium text-primary-foreground">Recipient</span>
                        <span className="text-gray-700 font-bold">{data.recipientName}</span>
                    </div>
                     <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                        <span className="font-medium text-primary-foreground">Occasion</span>
                        <span className="text-gray-700 capitalize font-bold">{data.occasion}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="font-medium text-primary-foreground">Custom URL</span>
                        <span className="text-primary font-mono bg-white px-2 py-1 rounded border border-primary/20">/{data.slug || 'generating...'}</span>
                    </div>
                </div>
            </Card>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-primary">₦7,900</span>
                </div>
                <ul className="space-y-3 mb-8">
                    <li className="flex gap-3 items-center text-sm text-gray-600">
                        <CheckCircleOutlined className="text-green-500 text-lg" /> 
                        <span className="font-medium">Premium Experience</span>
                    </li>
                     <li className="flex gap-3 items-center text-sm text-gray-600">
                        <CheckCircleOutlined className="text-green-500 text-lg" /> 
                         <span className="font-medium">60-Day Hosting</span>
                    </li>
                    <li className="flex gap-3 items-center text-sm text-gray-600">
                        <CheckCircleOutlined className="text-green-500 text-lg" /> 
                         <span className="font-medium">Password Protection</span>
                    </li>
                </ul>
                <Button type="primary" size="large" block className="h-14 text-xl font-bold shadow-lg shadow-primary/20 rounded-xl hover:scale-[1.02] transition-transform">
                    Pay & Publish
                </Button>
            </div>

             <Button onClick={onBack} size="large" block type="text" className="text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                Back to Edit
            </Button>
        </div>
      </div>
    </div>
  );
}
