import React from 'react';
import { ShieldCheck, Award, MapPin } from 'lucide-react';

export const WhySureDev: React.FC = () => {
  const points = [
    {
      title: 'Verified Developers',
      icon: <ShieldCheck size={24} className="text-brand-green" />,
      description: 'Every developer in the registry is thoroughly audited. We verify their GitHub commit histories, source code clarity, and practical knowledge through live testing.',
    },
    {
      title: 'Portfolio Driven',
      icon: <Award size={24} className="text-brand-green" />,
      description: 'We believe in shipped code, not resumes. Every profile features working production examples, live URLs, and accessible git repositories so you can evaluate craftsmanship instantly.',
    },
    {
      title: 'Built for Abia',
      icon: <MapPin size={24} className="text-brand-green" />,
      description: "Tailored for Abia's growing tech corridor. We bridge the local talent in Aba's manufacturing hubs and Umuahia's administrative nodes with high-end global startup teams.",
    },
  ];

  return (
    <section
      id="why-section"
      className="bg-white border-y border-brand-border/60 py-24 md:py-32 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <span className="text-xs font-display font-bold text-brand-green uppercase tracking-widest">
            A Global Standard
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-midnight tracking-tight mt-2">
            Why Teams Trust SureDev Talent
          </h2>
          <p className="text-gray-500 mt-4 text-base leading-relaxed">
            Designed to reflect the precision of Stripe and Vercel, SureDev offers a rigorous stage for outstanding builders to connect with premium companies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {points.map((point) => (
            <div
              key={point.title}
              className="bg-brand-warm-white rounded-[24px] p-8 border border-brand-border hover:border-brand-green/30 hover:shadow-premium transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-brand-border flex items-center justify-center mb-6 shadow-sm">
                {point.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-brand-midnight">
                {point.title}
              </h3>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
