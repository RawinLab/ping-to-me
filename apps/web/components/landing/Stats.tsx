import { getTranslations } from "next-intl/server";

export async function Stats() {
  const t = await getTranslations("landing.stats");

  const stats = [
    {
      value: t("linksCreated.value"),
      label: t("linksCreated.label"),
      description: t("linksCreated.description"),
    },
    {
      value: t("clicksTracked.value"),
      label: t("clicksTracked.label"),
      description: t("clicksTracked.description"),
    },
    {
      value: t("activeUsers.value"),
      label: t("activeUsers.label"),
      description: t("activeUsers.description"),
    },
    {
      value: t("uptime.value"),
      label: t("uptime.label"),
      description: t("uptime.description"),
    },
  ];

  return (
    <section className="section-padding bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="max-w-[600px] text-slate-400 md:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600/20 mb-4">
                <span className="text-3xl font-bold gradient-text">
                  {stat.value.charAt(0)}
                </span>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.value}
              </p>
              <p className="text-lg font-medium text-white mb-1">
                {stat.label}
              </p>
              <p className="text-sm text-slate-400">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
