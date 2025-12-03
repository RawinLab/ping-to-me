"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@pingtome/ui";

const faqs = [
  {
    question: "How do I get started with PingTO.Me?",
    answer:
      "Getting started is easy! Simply sign up for a free account, and you can start creating short links immediately. No credit card required.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes! With our Pro and Enterprise plans, you can connect your own custom domain to create branded short links that build trust with your audience.",
  },
  {
    question: "What analytics are available?",
    answer:
      "We provide comprehensive analytics including click counts, geographic data, device types, browsers, referrers, and time-based trends. All in real-time.",
  },
  {
    question: "Is there an API available?",
    answer:
      "Yes, we offer a full REST API that allows you to integrate link shortening into your applications. API access is available on Pro and Enterprise plans.",
  },
  {
    question: "How secure are my links?",
    answer:
      "Security is our priority. We use enterprise-grade encryption, malicious link detection, and provide features like password protection and link expiration.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely! You can upgrade, downgrade, or cancel your subscription at any time. No long-term contracts or hidden fees.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-padding gradient-bg-soft">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Frequently asked questions
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-lg">
            Can&apos;t find what you&apos;re looking for?
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border bg-white overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
