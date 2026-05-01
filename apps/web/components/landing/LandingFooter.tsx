import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");

  const footerLinks = {
    [t("product")]: [
      { name: t("productLinks.features"), href: "#features" },
      { name: t("productLinks.pricing"), href: "#pricing" },
      { name: t("productLinks.integrations"), href: "#integrations" },
      { name: t("productLinks.api"), href: "/api" },
      { name: t("productLinks.changelog"), href: "/changelog" },
    ],
    [t("resources")]: [
      { name: t("resourceLinks.documentation"), href: "/docs" },
      { name: t("resourceLinks.blog"), href: "/blog" },
      { name: t("resourceLinks.helpCenter"), href: "/help" },
      { name: t("resourceLinks.status"), href: "/status" },
    ],
    [t("company")]: [
      { name: t("companyLinks.about"), href: "/about" },
      { name: t("companyLinks.careers"), href: "/careers" },
      { name: t("companyLinks.contact"), href: "/contact" },
      { name: t("companyLinks.partners"), href: "/partners" },
    ],
    [t("legal")]: [
      { name: t("legalLinks.privacy"), href: "/privacy" },
      { name: t("legalLinks.terms"), href: "/terms" },
      { name: t("legalLinks.cookies"), href: "/cookies" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com", icon: Twitter },
    { name: "GitHub", href: "https://github.com", icon: Github },
    { name: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container px-4 md:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Link className="flex items-center gap-2 mb-4" href="/">
              <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl text-white">
                PingTO<span className="text-blue-400">.Me</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              {t("description")}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            {t("copyright", { year: new Date().getFullYear().toString() })}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {t("termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
