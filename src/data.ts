import { Developer, Testimonial, Statistics, Employer } from './types';

// We reference the generated assets with their absolute-relative import paths in Vite:
import heroImg from './assets/images/hero_team_aba_1784280947298.jpg';
import fintechImg from './assets/images/project_preview_fintech_1784057636937.jpg';
import agritechImg from './assets/images/project_preview_agritech_1784057651245.jpg';

export const HERO_IMAGE = heroImg;

export const STATISTICS: Statistics = {
  developers: 284,
  companies: 48,
  projects: 136,
  skills: 18,
};

export const DEVELOPERS: Developer[] = [];

export const EMPLOYERS: Employer[] = [];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    quote: "Finding high-quality engineering talent locally was our biggest bottleneck. SureDev made it possible to hire three expert developers from Aba within a single week. Their portfolio-first vetting process is unmatched.",
    author: "Nnamdi Anyanwu",
    role: "Chief Technology Officer",
    company: "AbiaTrade Technologies",
    logo: "AbiaTrade",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200"
  },
  {
    id: 'test-2',
    quote: "We utilized SureDev to contract a UI/UX expert from Umuahia for our banking rebranding campaign. The developer came with pre-verified case studies and fit perfectly into our workflow, saving us weeks of sourcing.",
    author: "Folake Bakare",
    role: "VP of Product",
    company: "Zeno Financial",
    logo: "Zeno",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200"
  },
  {
    id: 'test-3',
    quote: "SureDev is exactly what the Abia ecosystem needed. It gives our brilliant local engineers a premium stage to display their actual projects and helps global companies hire them with total security.",
    author: "Dr. Okezie Uche",
    role: "Director of Innovation",
    company: "Abia Tech Hub Foundation",
    logo: "ATHF",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200"
  }
];

export const CATEGORIES = [
  { name: 'CAD/CAM', count: 96, icon: 'DraftingCompass' },
  { name: 'Backend', count: 84, icon: 'Server' },
  { name: 'Full Stack', count: 112, icon: 'Layers' },
  { name: 'UI/UX Design', count: 42, icon: 'Figma' },
  { name: 'Creative Arts', count: 58, icon: 'Palette' },
  { name: 'Cloud & DevOps', count: 35, icon: 'Cloud' },
  { name: 'AI & Data Science', count: 19, icon: 'Brain' },
  { name: 'Cybersecurity', count: 12, icon: 'ShieldAlert' },
];

export const LOCATIONS = ['All Locations', 'Aba', 'Umuahia', 'Ohafia', 'Arochukwu', 'Bende'];

export const EXPERIENCES = ['All Experience', 'Junior (1-2 yrs)', 'Mid-level (3-5 yrs)', 'Senior (5+ yrs)'];

export const AVAILABILITIES = ['Any Availability', 'Available Immediately', 'Available Soon'];
