import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Building2, MapPin, Briefcase, Globe, Mail, Phone, Clock, Plus, Check, ExternalLink, Send
} from 'lucide-react';
import { Employer } from '../types';

interface EmployerDirectoryDeveloperProps {
  employers: Employer[];
  onApplyToEmployer: (employer: Employer) => void;
  onViewCompany: (employer: Employer) => void;
}

export const EmployerDirectoryDeveloper: React.FC<EmployerDirectoryDeveloperProps> = ({
  employers,
  onApplyToEmployer,
  onViewCompany,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedHiringType, setSelectedHiringType] = useState('All Commitments');

  // Filter employers
  const filteredEmployers = employers.filter((emp) => {
    // 1. Search text
    const query = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      emp.companyName.toLowerCase().includes(query) ||
      emp.description.toLowerCase().includes(query) ||
      emp.industry.toLowerCase().includes(query) ||
      emp.desiredSkills.some(s => s.toLowerCase().includes(query));

    // 2. Location
    const matchesLocation = selectedLocation === 'All Locations' || emp.location === selectedLocation;

    // 3. Industry
    const matchesIndustry = selectedIndustry === 'All Industries' || emp.industry === selectedIndustry;

    // 4. Hiring Type
    const matchesHiringType = selectedHiringType === 'All Commitments' || emp.hiringTypes.includes(selectedHiringType);

    return matchesSearch && matchesLocation && matchesIndustry && matchesHiringType;
  });

  const uniqueIndustries = ['All Industries', ...Array.from(new Set(employers.map(e => e.industry)))];
  const uniqueLocations = ['All Locations', 'Aba', 'Umuahia', 'Ohafia', 'Arochukwu', 'Bende'];
  const commitmentTypes = ['All Commitments', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto space-y-10">
      
      {/* Title block */}
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-midnight tracking-tight">
          Hiring Corporate Partners
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Connect directly with registered Abia-based manufacturers, trade platforms, and digital startups currently seeking tech talent.
        </p>
      </div>

      {/* Filters Grid */}
      <div className="bg-white border border-brand-border p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <span className="absolute left-3.5 top-3.5 text-gray-400">
            {/* We import manually to be 100% compliant with standard lucide icons */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search company name, industry, tech stack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none"
          />
        </div>

        {/* Location Selector */}
        <div className="md:col-span-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none cursor-pointer font-semibold"
          >
            {uniqueLocations.map(loc => (
              <option key={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Industry Selector */}
        <div className="md:col-span-3">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none cursor-pointer font-semibold"
          >
            {uniqueIndustries.map(ind => (
              <option key={ind}>{ind}</option>
            ))}
          </select>
        </div>

        {/* Commitment Type Selector */}
        <div className="md:col-span-3">
          <select
            value={selectedHiringType}
            onChange={(e) => setSelectedHiringType(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none cursor-pointer font-semibold"
          >
            {commitmentTypes.map(type => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employers Grid */}
      {filteredEmployers.length === 0 ? (
        <div className="text-center py-20 bg-brand-warm-white/20 border border-dashed border-brand-border rounded-3xl">
          <p className="text-gray-400 text-sm font-semibold">No hiring partners match your criteria.</p>
          <p className="text-gray-400 text-xs mt-1">Try resetting the industry selection or search text.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEmployers.map((emp) => (
            <motion.div
              layout
              key={emp.id}
              className="bg-white rounded-3xl border border-brand-border shadow-sm p-6 md:p-8 flex flex-col justify-between gap-6 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300"
            >
              
              <div>
                {/* Header Logo & Location details */}
                <div className="flex items-start gap-4">
                  <img
                    src={emp.companyLogo}
                    alt={emp.companyName}
                    className="w-14 h-14 rounded-2xl object-cover bg-brand-warm-white border border-brand-border shadow-sm"
                  />
                  <div>
                    <h3 className="font-display font-extrabold text-brand-midnight text-lg tracking-tight hover:text-brand-green transition-colors">
                      {emp.companyName}
                    </h3>
                    <p className="text-brand-green text-xs font-semibold">{emp.industry}</p>
                    
                    <div className="flex gap-3 mt-1.5 font-mono text-[9px] uppercase font-extrabold tracking-wider text-gray-400 items-center">
                      <span className="flex items-center gap-1">
                        {/* MapPin SVG inline for absolute safety */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin text-brand-green"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {emp.location}
                      </span>
                      {emp.website && (
                        <a 
                          href={emp.website} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1 border-l border-gray-200 pl-3 hover:text-brand-green transition-colors text-[9px]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                          Corporate Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company description */}
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                  {emp.description}
                </p>

                {/* Looking for tracks */}
                <div className="mt-5 space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider">
                    Actively Seeking Tracks:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {emp.hiringCategories.map(cat => (
                      <span key={cat} className="px-2.5 py-1 rounded-xl bg-brand-green/5 border border-brand-green/15 text-brand-green font-semibold text-[10px]">
                        {cat}
                      </span>
                    ))}
                    {emp.hiringTypes.map(type => (
                      <span key={type} className="px-2.5 py-1 rounded-xl bg-brand-midnight text-brand-gold font-semibold text-[10px] border border-brand-midnight">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Desired Skills */}
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider">
                    Target Technologies Stack:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {emp.desiredSkills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 rounded-lg bg-brand-warm-white border border-brand-border text-[9px] font-bold text-gray-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Candidate Qualification */}
                {emp.targetQualifications && (
                  <div className="mt-4 pt-3 border-t border-brand-border/40 flex flex-wrap items-center gap-1 text-[10px] text-brand-midnight font-semibold">
                    <span className="font-mono text-[9px] uppercase font-bold text-gray-400 mr-1">Target Qualification:</span>
                    <span className="text-brand-green">{emp.targetQualifications}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-2 gap-3 border-t border-brand-border/60 pt-4 mt-1">
                <button
                  onClick={() => onViewCompany(emp)}
                  className="w-full py-2.5 rounded-xl border border-brand-border hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Company Details
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                </button>
                <button
                  onClick={() => onApplyToEmployer(emp)}
                  className="w-full py-2.5 rounded-xl bg-brand-midnight hover:bg-black text-[10px] font-bold uppercase tracking-wider text-brand-gold hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  Sync Proposal
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
};
