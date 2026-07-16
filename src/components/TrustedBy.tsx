import React from 'react';
import { Landmark, Briefcase, Users, Award } from 'lucide-react';

export const TrustedBy: React.FC = () => {
  const categories = [
    {
      title: 'Partner Institutions',
      icon: <Landmark size={14} className="text-gray-400" />,
      items: ['ABSU', 'MOUAU Umudike', 'Gregory University', 'Abia Poly'],
    },
    {
      title: 'Active Tech Startups',
      icon: <Briefcase size={14} className="text-gray-400" />,
      items: ['AbiaTrade', 'Zeno Fin', 'Afrisend Logistics', 'Ariaria Pay'],
    },
    {
      title: 'Communities & Ecosystems',
      icon: <Users size={14} className="text-gray-400" />,
      items: ['GDG Aba', 'DevsInAbia', 'Abia Tech Hub', 'Aba Startup Week'],
    },
  ];

  return (
    <div className="w-full bg-white border-y border-brand-border/60 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <p className="text-center text-xs font-display font-semibold tracking-widest text-gray-400 uppercase mb-8">
          Fostered in Synergy with Abia's Leading Ecosystems
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-brand-border">
          {categories.map((category, index) => (
            <div
              key={category.title}
              className={`flex flex-col items-center md:items-start pt-6 md:pt-0 ${
                index > 0 ? 'md:pl-10' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                {category.icon}
                <span className="text-xs font-display font-bold text-brand-midnight uppercase tracking-wider">
                  {category.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3">
                {category.items.map((item) => (
                  <span
                    key={item}
                    className="text-gray-400 hover:text-brand-midnight font-display font-semibold text-sm tracking-tight transition-colors duration-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
