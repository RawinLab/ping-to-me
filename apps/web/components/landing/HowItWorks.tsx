"use client";

import { useState } from "react";
import { Check, Link2, BarChart3, Share2 } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: Link2,
    title: "Create your link",
    description:
      "Paste your long URL and get a short, branded link instantly. Customize it with your own alias.",
    features: [
      "Custom branded domains",
      "Custom aliases",
      "Link expiration settings",
    ],
  },
  {
    id: 2,
    icon: BarChart3,
    title: "Track performance",
    description:
      "Monitor clicks, geographic data, and device types. Get real-time insights into your link performance.",
    features: [
      "Real-time click tracking",
      "Geographic analytics",
      "Device & browser stats",
    ],
  },
  {
    id: 3,
    icon: Share2,
    title: "Share & grow",
    description:
      "Share your links everywhere. Use QR codes for offline marketing and bio pages for social media.",
    features: [
      "Generate QR codes",
      "Social media sharing",
      "Bio page builder",
    ],
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section id="how-it-works" className="section-padding gradient-bg-soft">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            How it works
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            See PingTO.Me in action
          </h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Discover how easy it is to create, manage, and track your links.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                  activeStep === step.id
                    ? "bg-white shadow-lg border-l-4 border-blue-600"
                    : "bg-transparent hover:bg-white/50"
                }`}
                onClick={() => setActiveStep(step.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                      activeStep === step.id
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                    {activeStep === step.id && (
                      <ul className="mt-4 space-y-2">
                        {step.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Check className="h-4 w-4 text-blue-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-blue-100 bg-white">
              <div className="bg-slate-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                </div>

                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded-lg p-4">
                      <label className="text-slate-400 text-sm block mb-2">
                        Enter your long URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value="https://example.com/very-long-url-here..."
                          readOnly
                          className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm"
                        />
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                          Shorten
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">
                        Your short link
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-medium">
                          ping.to/my-link
                        </span>
                        <button className="text-slate-400 hover:text-white text-sm">
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-white">12.5K</p>
                        <p className="text-xs text-slate-400">Total Clicks</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-white">45</p>
                        <p className="text-xs text-slate-400">Countries</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-white">8.2%</p>
                        <p className="text-xs text-slate-400">CTR</p>
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-end gap-1 h-24">
                        {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-blue-600 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-slate-400">Mon</span>
                        <span className="text-xs text-slate-400">Sun</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-center">
                      <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                        <div className="grid grid-cols-5 gap-1">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-5 h-5 ${
                                Math.random() > 0.3
                                  ? "bg-slate-900"
                                  : "bg-white"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {["Twitter", "LinkedIn", "Facebook"].map((social) => (
                        <button
                          key={social}
                          className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-sm"
                        >
                          {social}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
