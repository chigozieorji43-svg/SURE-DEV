import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, MapPin, Briefcase, Calendar, Layout, Server, 
  Layers, Palette, Smartphone, Cloud, Brain, Shield,
  ArrowUpRight, UserCheck, CodeXml, DraftingCompass
} from 'lucide-react';
import { Developer } from '../types';
import { DEVELOPERS, CATEGORIES, LOCATIONS, EXPERIENCES, AVAILABILITIES, STATISTICS } from '../data';

interface DeveloperDirectoryProps {
  initialSearchQuery: string;
  onViewProfile: (developer: Developer) => void;
  onHireDeveloper: (developer: Developer) => void;
  developers?: Developer[];
  onTrackClick?: (trackName: string) => void;
}

// Icon mapper for categories
const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'DraftingCompass': return <DraftingCompass size={20} className="text-emerald-600" />;
    case 'Server': return <Server size={20} className="text-blue-600" />;
    case 'Layers': return <Layers size={20} className="text-indigo-600" />;
    case 'Figma': return <Palette size={20} className="text-rose-600" />;
    case 'Palette': return <Palette size={20} className="text-amber-600" />;
    case 'Cloud': return <Cloud size={20} className="text-cyan-600" />;
    case 'Brain': return <Brain size={20} className="text-purple-600" />;
    default: return <Shield size={20} className="text-gray-600" />;
  }
};

export const DeveloperDirectory: React.FC<DeveloperDirectoryProps> = ({
  initialSearchQuery,
  onViewProfile,
  onHireDeveloper,
  developers = DEVELOPERS,
  onTrackClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedExperience, setSelectedExperience] = useState('All Experience');
  const [selectedAvailability, setSelectedAvailability] = useState('Any Availability');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Sync with hero search trigger
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchTerm(initialSearchQuery);
      // Scroll to directory automatically
      const el = document.getElementById('developers-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [initialSearchQuery]);

  // Handle category quick-click
  const handleCategoryClick = (categoryName: string) => {
    if (onTrackClick) {
      onTrackClick(categoryName);
    } else {
      if (selectedCategory === categoryName) {
        setSelectedCategory(null); // Deselect
      } else {
        setSelectedCategory(categoryName);
      }
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedLocation('All Locations');
    setSelectedExperience('All Experience');
    setSelectedAvailability('Any Availability');
    setSelectedCategory(null);
  };

  // Filter developers based on all selection matrices
  const filteredDevelopers = developers.filter((dev) => {
    // 1. Search text
    const query = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      dev.name.toLowerCase().includes(query) ||
      dev.title.toLowerCase().includes(query) ||
      dev.bio.toLowerCase().includes(query) ||
      dev.skills.some((skill) => skill.toLowerCase().includes(query));

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
        matchesCategory = dev.skills.some(s => ['node.js', 'go', 'rust', 'postgresql', 'gRPC', 'backend'].includes(s.toLowerCase())) || dev.title.toLowerCase().includes('backend');
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

  return (
    <section
      id="developers-section"
      className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 relative z-10"
    >
      
      {/* 1. Statistics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20 bg-white p-8 rounded-[24px] shadow-premium border border-brand-border">
        <div className="text-center md:text-left md:px-4">
          <p className="font-display font-bold text-4xl text-brand-green tracking-tight">
            {STATISTICS.developers}+
          </p>
          <p className="text-sm font-semibold text-brand-midnight mt-1">Verified Abia Developers</p>
          <p className="text-xs text-gray-400 mt-1">Sourced from Aba & Umuahia</p>
        </div>
        <div className="text-center md:text-left md:px-4 border-l border-brand-border">
          <p className="font-display font-bold text-4xl text-brand-midnight tracking-tight">
            {STATISTICS.companies}+
          </p>
          <p className="text-sm font-semibold text-brand-midnight mt-1">Hiring Startups</p>
          <p className="text-xs text-gray-400 mt-1">Partnered with regional guilds</p>
        </div>
        <div className="text-center md:text-left md:px-4 border-l border-brand-border">
          <p className="font-display font-bold text-4xl text-brand-midnight tracking-tight">
            {STATISTICS.projects}+
          </p>
          <p className="text-sm font-semibold text-brand-midnight mt-1">Vetted Production Projects</p>
          <p className="text-xs text-gray-400 mt-1">Live, secure client portfolios</p>
        </div>
        <div className="text-center md:text-left md:px-4 border-l border-brand-border">
          <p className="font-display font-bold text-4xl text-brand-gold tracking-tight">
            {STATISTICS.skills}+
          </p>
          <p className="text-sm font-semibold text-brand-midnight mt-1">Core Tech Disciplines</p>
          <p className="text-xs text-gray-400 mt-1">From Rust systems to UI designs</p>
        </div>
      </div>

      {/* 2. Quick-Filter Categories (Bento style grid) */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-display font-bold text-brand-green uppercase tracking-widest">
              Browse by Track
            </span>
            <h2 className="text-3xl font-display font-bold text-brand-midnight tracking-tight mt-1">
              Developer Ecosystem Taxonomy
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md">
            Click any core category pill to filter current listings. Abia's developers are vetted by actual engineering output.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.name;
            return (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={`flex items-center justify-between p-3.5 sm:p-5 rounded-[18px] text-left border transition-all cursor-pointer min-w-0 ${
                  isSelected
                    ? 'bg-brand-midnight text-white border-brand-midnight shadow-md'
                    : 'bg-white text-brand-midnight border-brand-border hover:border-brand-green hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 mr-1">
                  <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-white/10' : 'bg-brand-warm-white'}`}>
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm leading-tight truncate" title={category.name}>{category.name}</p>
                    <p className={`text-[10px] sm:text-xs mt-0.5 leading-none ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                      {category.count} profiles
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={16} className={`shrink-0 ${isSelected ? 'text-brand-gold' : 'text-gray-300'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search and Active Filter Inputs */}
      <div className="bg-white rounded-[20px] p-6 border border-brand-border shadow-premium mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Main search */}
          <div className="lg:col-span-4 flex items-center gap-3 bg-brand-warm-white border border-brand-border px-4 py-3 rounded-xl focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-colors">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Filter names, bios, or tech stack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-brand-midnight"
            />
          </div>

          {/* Location */}
          <div className="lg:col-span-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-brand-warm-white border border-brand-border px-4 py-3 rounded-xl text-sm text-brand-midnight focus:border-brand-green outline-none"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'All Locations' ? 'All Locations' : `Aba/Umuahia - ${loc}`}
                </option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div className="lg:col-span-2">
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="w-full bg-brand-warm-white border border-brand-border px-4 py-3 rounded-xl text-sm text-brand-midnight focus:border-brand-green outline-none"
            >
              {EXPERIENCES.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div className="lg:col-span-2">
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full bg-brand-warm-white border border-brand-border px-4 py-3 rounded-xl text-sm text-brand-midnight focus:border-brand-green outline-none"
            >
              {AVAILABILITIES.map((avail) => (
                <option key={avail} value={avail}>
                  {avail}
                </option>
              ))}
            </select>
          </div>

          {/* Actions & Resets */}
          <div className="lg:col-span-2 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-3 px-4 rounded-xl text-center text-xs font-semibold text-gray-500 hover:text-brand-midnight border border-transparent hover:border-brand-border transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

        </div>
      </div>

      {/* 4. Filter Indicators */}
      {(selectedLocation !== 'All Locations' || selectedExperience !== 'All Experience' || selectedAvailability !== 'Any Availability' || selectedCategory || searchTerm) && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-medium text-gray-400">Active Filters:</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-medium border border-brand-green/20">
              Query: "{searchTerm}"
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-medium border border-brand-green/20">
              Track: {selectedCategory}
            </span>
          )}
          {selectedLocation !== 'All Locations' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-medium border border-brand-green/20">
              Location: {selectedLocation}
            </span>
          )}
          {selectedExperience !== 'All Experience' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-medium border border-brand-green/20">
              {selectedExperience}
            </span>
          )}
          {selectedAvailability !== 'Any Availability' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-medium border border-brand-green/20">
              {selectedAvailability}
            </span>
          )}
        </div>
      )}

      {/* 5. Developer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(showAll ? filteredDevelopers : filteredDevelopers.slice(0, 4)).map((dev) => (
          <div
            key={dev.id}
            id={`dev-card-${dev.id}`}
            className="group relative bg-white rounded-[24px] p-6 border border-brand-border hover:border-brand-green/30 hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between"
          >
            {/* Top row Info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={dev.avatar}
                      alt={dev.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border border-brand-border shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute bottom-0 right-0 block w-3.5 h-3.5 rounded-full border-2 border-white ${
                      dev.availability === 'immediate'
                        ? 'bg-brand-green'
                        : dev.availability === 'soon'
                        ? 'bg-brand-gold'
                        : 'bg-gray-300'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display font-bold text-base text-brand-midnight tracking-tight">
                        {dev.name}
                      </h4>
                      {dev.featured && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold font-display font-extrabold text-[9px] uppercase tracking-wider border border-brand-gold/20">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-green font-medium mt-0.5">{dev.title}</p>
                  </div>
                </div>
              </div>

              {/* Bio snippet */}
              <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                {dev.bio}
              </p>

              {/* Tag pills */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {dev.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-full bg-brand-warm-white text-gray-600 font-medium text-xs border border-brand-border/60"
                  >
                    {skill}
                  </span>
                ))}
                {dev.skills.length > 4 && (
                  <span className="px-2 py-1 rounded-full bg-brand-warm-white text-gray-400 font-medium text-[10px] border border-brand-border/60">
                    +{dev.skills.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Row Controls */}
            <div className="border-t border-brand-border/60 pt-5 mt-auto">
              <div className="flex items-center justify-between gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-300" />
                  {dev.location}, Abia
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={14} className="text-gray-300" />
                  {dev.experience} yrs exp
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onViewProfile(dev)}
                  className="w-full py-3 rounded-xl border border-brand-border text-brand-midnight hover:border-gray-400 hover:bg-gray-50 font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  View Profile
                </button>
                <button
                  onClick={() => onHireDeveloper(dev)}
                  className="w-full py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer text-center"
                >
                  Hire Developer
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredDevelopers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-brand-border rounded-[24px] shadow-premium">
            <p className="text-lg font-display font-bold text-brand-midnight">No matching developers found</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Try adjusting your search filters or browse other tracks like CAD/CAM or Backend.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-6 px-5 py-2.5 rounded-xl bg-brand-midnight text-white text-xs font-semibold cursor-pointer"
            >
              Reset all Filters
            </button>
          </div>
        )}
      </div>

      {!showAll && filteredDevelopers.length > 4 && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setShowAll(true)}
            className="px-8 py-3.5 rounded-xl bg-brand-midnight hover:bg-brand-midnight/95 text-white hover:text-brand-gold font-display font-semibold text-xs uppercase tracking-wider shadow-premium transition-all duration-300 cursor-pointer flex items-center gap-2.5 border border-brand-border/20 active:scale-95"
          >
            <span>View More Profiles</span>
            <Layers size={14} />
          </button>
        </div>
      )}

    </section>
  );
};
