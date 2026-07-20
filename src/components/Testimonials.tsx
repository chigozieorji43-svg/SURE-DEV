import React from 'react';
import { Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data';

export const Testimonials: React.FC = () => {
  return (
    <section
      id="testimonials-section"
      className="bg-brand-warm-white py-24 md:py-32 relative z-10 overflow-hidden noise-bg"
    >
      {/* Background graphic elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[30vw] bg-brand-green/3 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <span className="text-xs font-display font-bold text-brand-green uppercase tracking-widest">
            Client Success
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-midnight tracking-tight mt-2">
            Endorsed by Innovative Leaders
          </h2>
          <p className="text-gray-500 mt-3 text-base leading-relaxed">
            Discover what engineering directors and startup founders say about their experience hiring vetted talent from Abia via SureDev.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative bg-white/70 dark:bg-[#0B1311]/70 backdrop-blur-md rounded-[24px] p-8 md:p-10 border border-brand-border/60 dark:border-white/10 shadow-premium flex flex-col justify-between hover:shadow-premium-hover hover:border-brand-green/20 transition-all duration-300"
            >
              {/* Decorative Quote Icon */}
              <div className="absolute top-6 right-8 text-brand-green/10">
                <Quote size={40} strokeWidth={4} />
              </div>

              <div>
                {/* Logo or Company Badge */}
                <div className="inline-flex px-3.5 py-1.5 rounded-lg bg-brand-midnight dark:bg-brand-green text-white font-display font-bold text-xs tracking-wider uppercase mb-6">
                  {testimonial.logo}
                </div>

                <p className="text-gray-600 dark:text-gray-300 italic text-sm md:text-base leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-4 border-t border-brand-border/60 dark:border-white/5 pt-6">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-brand-border dark:border-white/10"
                />
                <div className="text-left">
                  <h4 className="font-display font-bold text-sm text-brand-midnight dark:text-white leading-snug">
                    {testimonial.author}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    {testimonial.role}, <span className="text-brand-green font-semibold">{testimonial.company}</span>
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
