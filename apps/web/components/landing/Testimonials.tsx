import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "PingTO.Me has transformed how we track our marketing campaigns. The analytics are incredibly detailed and the interface is so easy to use.",
    author: "Sarah Chen",
    role: "Marketing Director",
    company: "TechFlow",
    rating: 5,
  },
  {
    quote:
      "We switched from Bitly and haven't looked back. The custom domain support and team features are exactly what we needed.",
    author: "Michael Rodriguez",
    role: "Growth Lead",
    company: "StartupXYZ",
    rating: 5,
  },
  {
    quote:
      "The QR code generator and bio pages have been game-changers for our offline marketing. Highly recommend!",
    author: "Emily Johnson",
    role: "Brand Manager",
    company: "CreativeHub",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="section-padding bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Loved by teams worldwide
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-lg">
            See what our customers have to say about PingTO.Me
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
                    {testimonial.role} at {testimonial.company}
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
