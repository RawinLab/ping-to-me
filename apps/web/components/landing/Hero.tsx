import Link from "next/link";
import { Button } from "@pingtome/ui";
import { ArrowRight, Play, Star } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden gradient-bg-soft">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
      <div className="container px-4 md:px-6 py-16 md:py-24 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 w-fit rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Star className="h-4 w-4 fill-blue-500 text-blue-500" />
              <span>Free forever, no credit card required</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                URL shortener with{" "}
                <span className="gradient-text">QR codes</span>
              </h1>
              <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                Create short links, QR codes, and bio pages in seconds. Track
                every click with powerful analytics and grow your audience.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold gradient-bg hover:opacity-90 transition-opacity"
                >
                  Create free account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base font-semibold"
                >
                  <Play className="mr-2 h-5 w-5" />
                  View demo
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-white"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    Trusted by 10,000+ users
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative lg:ml-auto">
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-blue-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-500/5" />
              <div className="bg-white p-1">
                <div className="rounded-lg overflow-hidden bg-slate-900">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-800">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs text-slate-400">
                        dashboard.pingto.me
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">
                        Your Short Links
                      </h3>
                      <div className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs">
                        + New Link
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          short: "ping.to/sale",
                          clicks: "2,847",
                          trend: "+12%",
                        },
                        {
                          short: "ping.to/docs",
                          clicks: "1,234",
                          trend: "+8%",
                        },
                        {
                          short: "ping.to/app",
                          clicks: "956",
                          trend: "+23%",
                        },
                      ].map((link) => (
                        <div
                          key={link.short}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                        >
                          <div>
                            <p className="text-blue-400 font-medium text-sm">
                              {link.short}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white text-sm">
                              {link.clicks}
                            </span>
                            <span className="text-green-400 text-xs">
                              {link.trend}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                        <p className="text-2xl font-bold text-white">5.2K</p>
                        <p className="text-xs text-slate-400">Total Clicks</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                        <p className="text-2xl font-bold text-white">127</p>
                        <p className="text-xs text-slate-400">Links</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                        <p className="text-2xl font-bold text-white">89%</p>
                        <p className="text-xs text-slate-400">CTR</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
