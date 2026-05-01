import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function Testimonials() {
  const t = await getTranslations("landing.testimonials");

  const testimonials = [
    {
      quote: t("testimony1.quote"),
      author: t("testimony1.author"),
      role: t("testimony1.role"),
      company: t("testimony1.company"),
      rating: 5,
    },
    {
      quote: t("testimony2.quote"),
      author: t("testimony2.author"),
      role: t("testimony2.role"),
      company: t("testimony2.company"),
      rating: 5,
    },
    {
      quote: t("testimony3.quote"),
      author: t("testimony3.author"),
      role: t("testimony3.role"),
      company: t("testimony3.company"),
      rating: 5,
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="relative p-8 rounded-2xl border bg-gradient-to-b from-blue-50/50 to-white"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <blockquote className="text-lg mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("roleAt", { role: testimonial.role, company: testimonial.company })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
