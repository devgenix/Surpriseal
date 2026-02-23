"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does Surpriseal work exactly?",
    answer: "Surpriseal allows you to create a beautiful, structured digital reveal. You start by choosing a theme, uploading photos and video messages, and then scheduling the final gift (like a link or gift card). Your recipient gets a unique link that leads them through an interactive journey before the final surprise is revealed.",
  },
  {
    question: "Can multiple people contribute to one surprise?",
    answer: "Yes! In fact, most of our users use it for group surprises. You can easily share a contributor link with friends and family so they can record and upload their own video messages directly to the celebration gallery.",
  },
  {
    question: "How much does it cost?",
    answer: "We offer a single, simple pricing package for one-time celebrations. This includes your structured timeline, 30 days of hosting, and a full interactive gallery. You can check the current price in your local currency on our pricing page.",
  },
  {
    question: "Is there a limit to how many photos or videos I can add?",
    answer: "Our standard package includes up to 20 media items. If you need more, we offer an 'Unlimited Media' add-on at checkout for those extra-special milestone moments buried in memories.",
  },
  {
    question: "Does the recipient need to download an app?",
    answer: "Not at all. Surpriseal is purely web-based. The recipient just clicks a link on their smartphone, tablet, or computer and the experience starts immediately in their browser, complete with music and animations.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-[#fcf9f8]">
      <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-[#1b110e] mb-4">
              Got <span className="text-primary italic">Questions?</span>
            </h2>
            <p className="text-[#97604e] text-lg font-medium">
              Everything you need to know about creating the perfect surprise.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`group rounded-2xl border transition-all duration-300 ${
                  openIndex === index 
                    ? "bg-white border-primary/20 shadow-xl shadow-primary/5" 
                    : "bg-white/50 border-[#f3eae7] hover:border-primary/20"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left outline-none"
                >
                  <span className={`text-lg md:text-xl font-bold transition-colors ${
                    openIndex === index ? "text-[#1b110e]" : "text-[#1b110e]/80 group-hover:text-primary"
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                    openIndex === index ? "bg-primary text-white scale-110" : "bg-[#f3eae7] text-[#97604e] group-hover:bg-primary/10 group-hover:text-primary"
                  }`}>
                    {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                }`}>
                  <div className="p-6 md:p-8 pt-0 text-[#97604e] leading-relaxed font-medium">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center">
            <p className="text-[#1b110e] font-bold mb-4">Still need help?</p>
            <p className="text-[#97604e] text-sm mb-6">Our support team is always here for you.</p>
            <a 
              href="mailto:support@surpriseal.com" 
              className="inline-block text-primary font-bold hover:underline"
            >
              Contact Support →
            </a>
          </div>
      </Container>
    </section>
  );
}
