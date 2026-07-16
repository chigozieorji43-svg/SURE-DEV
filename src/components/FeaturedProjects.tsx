import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Github, ExternalLink, Code } from 'lucide-react';
import { DEVELOPERS } from '../data';
import { Developer } from '../types';

interface FeaturedProjectsProps {
  onViewDeveloper: (developer: Developer) => void;
  developers?: Developer[];
}

export const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({ onViewDeveloper, developers = DEVELOPERS }) => {
  const [activeFilter, setActiveFilter] = useState('All');

  // Derive all projects dynamically from developers
  const projects = developers.flatMap((dev) =>
    dev.projects.map((proj) => ({
      ...proj,
      developer: dev,
    }))
  );

  // Available filter tags
  const filterPills = ['All', 'React', 'Go', 'Flutter', 'Tailwind CSS', 'Figma', 'Rust'];

  // Filtering logic
  const filteredProjects = projects.filter((proj) => {
    if (activeFilter === 'All') return true;
    return proj.tags.some((t) => t.toLowerCase() === activeFilter.toLowerCase());
  });

  return (
    <section
      id="projects-section"
      className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 relative z-10"
    >
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-xs font-display font-bold text-brand-green uppercase tracking-widest">
            Portfolio Showcase
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-midnight tracking-tight mt-2">
            Featured Systems & Craftsmanship
          </h2>
          <p className="text-gray-500 mt-2 text-sm max-w-md">
            Inspect live production applications authored by Abia's premier creators. Click to view codebases or developer profiles.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterPills.map((pill) => {
            const isSelected = activeFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveFilter(pill)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-brand-green text-white border-brand-green shadow-sm'
                    : 'bg-white text-gray-500 border-brand-border hover:border-gray-300 hover:text-brand-midnight'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="group flex flex-col justify-between bg-white border border-brand-border rounded-[24px] overflow-hidden hover:shadow-premium-hover transition-all duration-300"
          >
            {/* Project Image Frame */}
            <div className="aspect-video relative overflow-hidden bg-brand-midnight">
              <img
                src={project.image}
                alt={project.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
              {/* Glassmorphic Project Badge top left */}
              <div className="absolute top-5 left-5 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                <Code size={12} className="text-brand-green" />
                <span className="text-[10px] font-bold text-brand-midnight tracking-wider uppercase">
                  Production Build
                </span>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-8">
              {/* Developer Badge */}
              <button
                onClick={() => onViewDeveloper(project.developer)}
                className="inline-flex items-center gap-2 mb-4 bg-brand-warm-white hover:bg-gray-100 p-1.5 pr-3.5 rounded-full border border-brand-border/60 transition-colors cursor-pointer text-left focus:outline-none"
              >
                <img
                  src={project.developer.avatar}
                  alt={project.developer.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-white"
                />
                <span className="text-xs font-semibold text-brand-midnight">
                  Built by <span className="text-brand-green">{project.developer.name}</span>
                </span>
              </button>

              <h3 className="text-2xl font-display font-bold text-brand-midnight tracking-tight">
                {project.title}
              </h3>
              
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                {project.description}
              </p>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 mt-5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded bg-brand-warm-white text-gray-500 font-medium text-xs border border-brand-border/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action row */}
              <div className="flex gap-6 mt-8 pt-6 border-t border-brand-border/60">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:text-emerald-700 transition-colors"
                  >
                    Live Preview <ExternalLink size={14} />
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand-midnight transition-colors"
                  >
                    View Source <Github size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
