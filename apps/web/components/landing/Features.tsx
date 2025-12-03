import {
  LinkIcon,
  BarChart3,
  QrCode,
  FileText,
  Users,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Advanced analytics",
    description:
      "Track clicks, conversions, and revenue with detailed charts. Understand your audience with location, device, and referrer data.",
    link: "Learn more",
  },
  {
    icon: LinkIcon,
    title: "Custom domains",
    description:
      "Use your own branded domain to create trustworthy short links. Build brand recognition with every click.",
    link: "Learn more",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description:
      "Work together with your team using shared workspaces. Manage permissions and track activity across your organization.",
    link: "Learn more",
  },
  {
    icon: QrCode,
    title: "QR codes",
    description:
      "Generate beautiful, customizable QR codes for any link. Perfect for print materials, business cards, and events.",
    link: "Learn more",
  },
  {
    icon: Code2,
    title: "API access",
    description:
      "Integrate link shortening into your applications with our powerful REST API. Automate your workflow with webhooks.",
    link: "View docs",
  },
  {
    icon: FileText,
    title: "Bio pages",
    description:
      "Create beautiful landing pages to showcase all your important links. Perfect for social media profiles.",
    link: "Learn more",
  },
];

export function Features() {
  return (
    <section id="features" className="section-padding bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Everything you need to manage links
          </h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Robust link management tools that help you track performance and
            optimize campaigns.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl border bg-card hover:shadow-lg hover:border-blue-200 transition-all duration-300"
            >
              <div className="mb-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {feature.link}
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
