import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, MapPin, Briefcase, Calendar, Layout, Server, Layers, Palette, Cloud, Brain, Shield, UserCheck, CodeXml, ArrowUpRight, DraftingCompass, Sparkles
} from 'lucide-react';
import { Developer } from '../types';

interface DeveloperDirectoryEmployerProps {
  developers: Developer[];
  onViewProfile: (developer: Developer) => void;
  onHireDeveloper: (developer: Developer) => void;
}

export const DeveloperDirectoryEmployer: React.FC<DeveloperDirectoryEmployerProps> = ({
  developers,
  onViewProfile,
  onHireDeveloper,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedExperience, setSelectedExperience] = useState('All Experience');
  const [selectedAvailability, setSelectedAvailability] = useState('Any Availability');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter developers based on all selection matrices
  const filteredDevelopers = developers.filter((dev) => {
    // 1. Search text
    const query = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (dev.name && dev.name.toLowerCase().includes(query)) ||
      (dev.title && dev.title.toLowerCase().includes(query)) ||
      (dev.bio && dev.bio.toLowerCase().includes(query)) ||
      (dev.skills && dev.skills.some((skill) => skill.toLowerCase().includes(query)));

    // 2. Location
    const matchesLocation = selectedLocation === 'All Locations' || dev.location === selectedLocation;

    // 3. Experience
    let matchesExperience = true;
    if (selectedExperience === 'Junior (1-2 yrs)') {
      matchesExperience = dev.experience >= 1 && dev.experience <= 2;
    } else if (selectedExperience === 'Mid-level (3-5 yrs)') {
      matchesExperience = dev.experience >= 3 && dev.experience <= 5;
    } else if (selectedExperience === 'Senior (5+ yrs)') {
      matchesExperience = dev.experience >= 5;
    }

    // 4. Availability
    let matchesAvailability = true;
    if (selectedAvailability === 'Available Immediately') {
      matchesAvailability = dev.availability === 'immediate';
    } else if (selectedAvailability === 'Available Soon') {
      matchesAvailability = dev.availability === 'soon';
    }

    // 5. Category quick-filter
    let matchesCategory = true;
    if (selectedCategory) {
      const catLower = selectedCategory.toLowerCase();
      if (catLower.includes('cad/cam') || catLower.includes('cad') || catLower.includes('cam')) {
        matchesCategory = dev.skills.some(s => ['cad', 'cam', '3d modeling', 'solidworks', 'fusion 360', 'autocad', 'catia', '3d printing'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('cad') || dev.title.toLowerCase().includes('cam');
      } else if (catLower.includes('backend')) {
        matchesCategory = dev.skills.some(s => ['node.js', 'go', 'rust', 'postgresql', 'grpc', 'backend'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('backend');
      } else if (catLower.includes('full stack')) {
        matchesCategory = dev.skills.some(s => ['typescript', 'graphql', 'node.js', 'react', 'aws'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('stack');
      } else if (catLower.includes('design') || catLower.includes('ui/ux')) {
        matchesCategory = dev.skills.some(s => ['figma', 'design', 'ux', 'motion'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('design') || dev.title.toLowerCase().includes('ux');
      } else if (catLower.includes('creative') || catLower.includes('arts') || catLower.includes('art')) {
        matchesCategory = dev.skills.some(s => ['animation', 'illustration', 'creative', 'graphic', '3d design', 'blender', 'photoshop', 'illustrator', '3d modeling', '3d animation'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('creative') || dev.title.toLowerCase().includes('artist') || dev.title.toLowerCase().includes('art') || dev.title.toLowerCase().includes('animator');
      } else if (catLower.includes('cloud') || catLower.includes('devops')) {
        matchesCategory = dev.skills.some(s => ['aws', 'cloud', 'devops', 'terraform', 'docker', 'kubernetes'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('cloud') || dev.title.toLowerCase().includes('devops');
      } else if (catLower.includes('ai') || catLower.includes('machine')) {
        matchesCategory = dev.skills.some(s => ['ai', 'ml', 'python', 'pytorch', 'machine learning'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('ai') || dev.title.toLowerCase().includes('machine');
      }
    }

    return matchesSearch && matchesLocation && matchesExperience && matchesAvailability && matchesCategory;
  });

  const categories = [
    { name: 'CAD/CAM', icon: 'DraftingCompass' },
    { name: 'Backend', icon: 'Server' },
    { name: 'Full Stack', icon: 'Layers' },
    { name: 'UI/UX Design', icon: 'Figma' },
    { name: 'Creative Arts', icon: 'Palette' },
    { name: 'Cloud & DevOps', icon: 'Cloud' },
    { name: 'AI & Data Science', icon: 'Brain' }
  ];

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'DraftingCompass': return <DraftingCompass size={14} />;
      case 'Server': return <Server size={14} />;
      case 'Layers': return <Layers size={14} />;
      case 'Palette': return <Palette size={14} />;
      case 'Cloud': return <Cloud size={14} />;
      case 'Brain': return <Brain size={14} />;
      default: return <Shield size={14} />;
    }
  };

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto space-y-10">
      
      {/* Title block */}
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-midnight tracking-tight">
          Sovereign Talent Directory
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore and secure contracts with verified engineers, CAD designers, and creatives across Abia State.
        </p>
      </div>

      {/* Category Horizontal Quick Filters */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-brand-midnight text-brand-gold border-brand-midnight shadow-md'
              : 'bg-white border-brand-border text-gray-600 hover:border-gray-300'
          }`}
        >
          <span>All Sectors</span>
        </button>
        {categories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={`emp-cat-${cat.name}-${idx}`}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-brand-green text-white border-brand-green shadow-md'
                  : 'bg-white border-brand-border text-gray-600 hover:border-gray-300'
              }`}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Select Grid */}
      <div className="bg-white border border-brand-border p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-4 relative">
          <span className="absolute left-3.5 top-3.5 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search name, expertise, specific skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none"
          />
        </div>

        {/* Location Dropdown */}
        <div className="md:col-span-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none cursor-pointer"
          >
            <option>All Locations</option>
            <option>Aba</option>
            <option>Umuahia</option>
            <option>Ohafia</option>
            <option>Arochukwu</option>
            <option>Bende</option>
          </select>
        </div>

        {/* Experience Dropdown */}
        <div className="md:col-span-2">
          <select
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none cursor-pointer"
          >
            <option>All Experience</option>
            <option>Junior (1-2 yrs)</option>
            <option>Mid-level (3-5 yrs)</option>
            <option>Senior (5+ yrs)</option>
          </select>
        </div>

        {/* Availability Dropdown */}
        <div className="md:col-span-2">
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-warm-white/40 border border-brand-border/80 focus:border-brand-green rounded-xl text-xs text-brand-midnight outline-none cursor-pointer"
          >
            <option>Any Availability</option>
            <option>Available Immediately</option>
            <option>Available Soon</option>
          </select>
        </div>

        {/* Reset Trigger */}
        <div className="md:col-span-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedLocation('All Locations');
              setSelectedExperience('All Experience');
              setSelectedAvailability('Any Availability');
              setSelectedCategory(null);
            }}
            className="w-full py-2.5 rounded-xl border border-dashed border-brand-border text-xs text-gray-500 font-semibold uppercase hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Developers Cards Grid */}
      {filteredDevelopers.length === 0 ? (
        <div className="text-center py-20 bg-brand-warm-white/20 border border-dashed border-brand-border rounded-3xl">
          <p className="text-gray-400 text-sm font-semibold">No developers match your current filtration criteria.</p>
          <p className="text-gray-400 text-xs mt-1">Try expanding your location or clearing quick skills categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevelopers.map((dev, idx) => (
            <motion.div
              layout
              key={dev.id ? `${dev.id}-${idx}` : idx}
              className="bg-white rounded-3xl border border-brand-border shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between gap-5 relative overflow-hidden group"
            >
              
              {/* Highlight ribbon */}
              {dev.featured && (
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                  <div className="absolute transform rotate-45 bg-brand-gold text-brand-midnight text-[8px] font-extrabold uppercase text-center py-1 w-24 -right-6 top-3 shadow-sm border-b border-brand-gold/20 font-mono tracking-wider">
                    Vetted
                  </div>
                </div>
              )}

              {/* Developer Details Container */}
              <div>
                {/* Header: Photo and availability */}
                <div className="flex items-start gap-4 justify-between">
                  <img
                    src={dev.avatar}
                    alt={dev.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-brand-warm-white border border-brand-border"
                  />
                  
                  {/* Availability Badge */}
                  {dev.availability === 'immediate' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-mono text-[9px] uppercase font-bold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Immediate
                    </span>
                  )}
                  {dev.availability === 'soon' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 font-mono text-[9px] uppercase font-bold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Soon
                    </span>
                  )}
                  {dev.availability === 'no' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-500 font-mono text-[9px] uppercase font-bold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Closed
                    </span>
                  )}
                </div>

                {/* Developer Name & Title */}
                <div className="mt-4">
                  <h3 className="font-display font-extrabold text-brand-midnight text-lg tracking-tight group-hover:text-brand-green transition-colors">
                    {dev.name}
                  </h3>
                  <p className="text-brand-green font-medium text-xs mt-0.5">{dev.title}</p>
                </div>

                {/* Location and Experience Details */}
                <div className="flex gap-4 mt-3 font-mono text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-brand-green" />
                    {dev.location}
                  </span>
                  <span className="flex items-center gap-1 border-l border-gray-200 pl-4">
                    <Briefcase size={12} className="text-brand-green" />
                    {dev.experience} Yrs Exp
                  </span>
                </div>

                {/* Bio text snippet */}
                <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                  {dev.bio}
                </p>

                {/* Skills badges */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {dev.skills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={`${skill}-${idx}`}
                      className="px-2 py-1 rounded-lg bg-brand-warm-white border border-brand-border text-[10px] font-bold text-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                  {dev.skills.length > 4 && (
                    <span className="px-2 py-1 rounded-lg bg-brand-midnight/5 text-[10px] font-bold text-gray-500">
                      +{dev.skills.length - 4} More
                    </span>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="grid grid-cols-2 gap-3 border-t border-brand-border/60 pt-4 mt-1">
                <button
                  onClick={() => onViewProfile(dev)}
                  className="w-full py-2.5 rounded-xl border border-brand-border hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  View Profile
                  <ArrowUpRight size={12} />
                </button>
                <button
                  onClick={() => onHireDeveloper(dev)}
                  className="w-full py-2.5 rounded-xl bg-brand-green hover:bg-emerald-700 text-[10px] font-bold uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <UserCheck size={12} />
                  Hire Candidate
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
};
