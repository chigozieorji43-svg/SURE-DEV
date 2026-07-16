import { Developer, Testimonial, Statistics, Employer } from './types';

// We reference the generated assets with their absolute-relative import paths in Vite:
import heroImg from './assets/images/hero_collaboration_3d_1784057624148.jpg';
import fintechImg from './assets/images/project_preview_fintech_1784057636937.jpg';
import agritechImg from './assets/images/project_preview_agritech_1784057651245.jpg';

export const HERO_IMAGE = heroImg;

export const STATISTICS: Statistics = {
  developers: 284,
  companies: 48,
  projects: 136,
  skills: 18,
};

export const DEVELOPERS: Developer[] = [
  {
    id: 'dev-chinedu',
    name: 'Chinedu Okeke',
    title: 'Principal Full Stack Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400',
    location: 'Aba',
    experience: 7,
    skills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'PostgreSQL', 'Docker', 'AWS'],
    availability: 'immediate',
    bio: 'Passionate full-stack developer focusing on scalable financial systems. Architect of regional payment rails and high-throughput APIs. Active open-source contributor.',
    githubUrl: 'https://github.com/chinedu-okeke',
    linkedinUrl: 'https://linkedin.com/in/chinedu-okeke',
    twitterUrl: 'https://twitter.com/chinedudev',
    portfolioUrl: 'https://chinedu.dev',
    featured: true,
    email: 'chinedu.okeke@suredev.ng',
    projects: [
      {
        id: 'proj-abapay',
        title: 'AbaPay Commerce Gateway',
        description: 'A custom, low-latency financial settlement API designed for trade merchants in Ariaria International Market, Aba. Features robust offline-first synchronization.',
        image: fintechImg,
        tags: ['React', 'PostgreSQL', 'Vite', 'Stripe API'],
        demoUrl: 'https://abapay.suredev.ng',
        githubUrl: 'https://github.com/chinedu-okeke/abapay-core',
      }
    ]
  },
  {
    id: 'dev-amarachi',
    name: 'Amarachi Nwosu',
    title: 'Senior Product Designer & Frontend Developer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
    location: 'Umuahia',
    experience: 5,
    skills: ['Figma', 'React', 'Tailwind CSS', 'Framer Motion', 'Design Systems', 'Web Accessibility'],
    availability: 'immediate',
    bio: 'Bridging the absolute gap between world-class visual aesthetics and front-end engineering. Creating seamless, accessible user interfaces for African startups.',
    githubUrl: 'https://github.com/amarachi-design',
    linkedinUrl: 'https://linkedin.com/in/amarachi-nwosu',
    twitterUrl: 'https://twitter.com/amara_creates',
    portfolioUrl: 'https://amarachi.design',
    featured: true,
    email: 'amarachi.nwosu@suredev.ng',
    projects: [
      {
        id: 'proj-oru',
        title: 'Oru Design Tokens',
        description: 'A comprehensive design token and component ecosystem engineered for Nigerian SaaS platforms, fully accessible and compliant with WCAG standards.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800&h=600',
        tags: ['Figma', 'Tailwind CSS', 'React', 'Framer'],
        demoUrl: 'https://oru.suredev.ng',
        githubUrl: 'https://github.com/amarachi-design/oru-tokens',
      }
    ]
  },
  {
    id: 'dev-kalu',
    name: 'Kalu Uduma',
    title: 'Mobile Systems Specialist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400',
    location: 'Ohafia',
    experience: 6,
    skills: ['Flutter', 'React Native', 'Kotlin', 'Go', 'gRPC', 'SQLite', 'Redis'],
    availability: 'soon',
    bio: 'Dedicated mobile developer building offline-capable, highly efficient mobile systems for sub-optimal network conditions. Experienced with enterprise-level APIs.',
    githubUrl: 'https://github.com/kalu-uduma',
    linkedinUrl: 'https://linkedin.com/in/kalu-uduma',
    twitterUrl: 'https://twitter.com/kalu_mobile',
    portfolioUrl: 'https://kaluuduma.dev',
    featured: true,
    email: 'kalu.uduma@suredev.ng',
    projects: [
      {
        id: 'proj-farmroute',
        title: 'FarmRoute Supply Chain',
        description: 'An offline-first Android and iOS client that helps smallholder farmers in Ohafia and Bende log agricultural outputs and match with regional logistics companies.',
        image: agritechImg,
        tags: ['Flutter', 'SQLite', 'Go', 'gRPC'],
        demoUrl: 'https://farmroute.suredev.ng',
        githubUrl: 'https://github.com/kalu-uduma/farmroute-mobile',
      }
    ]
  },
  {
    id: 'dev-obinna',
    name: 'Obinna Egwu',
    title: 'Lead Backend & Cloud Engineer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400',
    location: 'Aba',
    experience: 8,
    skills: ['Go', 'Rust', 'PostgreSQL', 'Docker', 'Kubernetes', 'RabbitMQ', 'Terraform'],
    availability: 'soon',
    bio: 'Deep systems programmer. Specialized in distributed databases, microservice clustering, and automating continuous multi-region deployments.',
    githubUrl: 'https://github.com/obinna-egwu',
    linkedinUrl: 'https://linkedin.com/in/obinna-egwu',
    twitterUrl: 'https://twitter.com/obinna_backend',
    portfolioUrl: 'https://obinna.tech',
    featured: false,
    email: 'obinna.egwu@suredev.ng',
    projects: [
      {
        id: 'proj-aba-gateway',
        title: 'Aba Industrial API Router',
        description: 'An ultra-fast custom API gateway written in Rust to handle secure machine-to-machine integrations in Abia light-manufacturing corridors.',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800&h=600',
        tags: ['Rust', 'Docker', 'gRPC', 'Terraform'],
        demoUrl: 'https://gateway.aba.tech',
        githubUrl: 'https://github.com/obinna-egwu/aba-router',
      }
    ]
  },
  {
    id: 'dev-chioma',
    name: 'Chioma Nnaji',
    title: 'CAD/CAM Engineer & 3D Modeler',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
    location: 'Umuahia',
    experience: 4,
    skills: ['SolidWorks', 'Fusion 360', 'AutoCAD', '3D Modeling', 'Three.js', 'TypeScript'],
    availability: 'immediate',
    bio: 'Obsessed with industrial product design, 3D printing preparation, and web-based 3D modeling. Striving to build high-precision digital models for localized manufacturing in Abia.',
    githubUrl: 'https://github.com/chioma-nnaji',
    linkedinUrl: 'https://linkedin.com/in/chioma-nnaji',
    twitterUrl: 'https://twitter.com/chioma_web',
    portfolioUrl: 'https://chiomadevs.com',
    featured: false,
    email: 'chioma.nnaji@suredev.ng',
    projects: [
      {
        id: 'proj-surespace',
        title: 'Aba Shoe-Mold CAD Engine',
        description: 'A custom, low-latency 3D shoe-mold modeler designed for localized shoe manufacturers in Aba, integrating with CNC machinery.',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800&h=600',
        tags: ['Fusion 360', 'Three.js', 'CAD/CAM', 'TypeScript'],
        demoUrl: 'https://surespace.suredev.ng',
        githubUrl: 'https://github.com/chioma-nnaji/surespace-3d',
      }
    ]
  },
  {
    id: 'dev-emeka',
    name: 'Emeka Anya',
    title: 'Cloud & DevOps Architect',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400',
    location: 'Arochukwu',
    experience: 6,
    skills: ['AWS', 'Google Cloud', 'Linux Systems', 'Terraform', 'CI/CD', 'Docker', 'Prometheus'],
    availability: 'no',
    bio: 'Helping teams achieve 99.99% uptime. Expert in cloud infrastructure automation, self-healing setups, and database recovery pipelines.',
    githubUrl: 'https://github.com/emeka-cloud',
    linkedinUrl: 'https://linkedin.com/in/emeka-anya',
    twitterUrl: 'https://twitter.com/emeka_infra',
    portfolioUrl: 'https://emeka.cloud',
    featured: false,
    email: 'emeka.anya@suredev.ng',
    projects: [
      {
        id: 'proj-abia-cdn',
        title: 'Abia Local Edge CDN',
        description: 'A custom reverse-caching cluster deployment designed to host static assets closer to regional network cells for low-data-consumption access.',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800&h=600',
        tags: ['Terraform', 'Docker', 'AWS CloudFront', 'Prometheus'],
        demoUrl: 'https://cdn.abia.network',
        githubUrl: 'https://github.com/emeka-cloud/edge-cdn',
      }
    ]
  },
  {
    id: 'dev-ikechi',
    name: 'Ikechi Onyekwere',
    title: '3D Animator & Creative Illustrator',
    avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=400&h=400',
    location: 'Aba',
    experience: 5,
    skills: ['Blender', '3D Animation', 'Illustration', 'Photoshop', 'After Effects', 'Creative Direction'],
    availability: 'immediate',
    bio: 'Crafting stunning 3D brand assets, character animations, and vector illustrations. Bringing cultural stories and modern startup branding to life through creative digital motion.',
    githubUrl: 'https://github.com/ikechi-creative',
    linkedinUrl: 'https://linkedin.com/in/ikechi-creative',
    twitterUrl: 'https://twitter.com/ikechi_creates',
    portfolioUrl: 'https://ikechicreative.com',
    featured: false,
    email: 'ikechi.onyekwere@suredev.ng',
    projects: [
      {
        id: 'proj-aba-cultural',
        title: 'Abia Creative Heritage Assets',
        description: 'A digitized interactive repository of 3D-modeled regional heritage artifacts and high-fidelity promotional animations designed for regional tourism campaigns.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800&h=600',
        tags: ['Blender', '3D Animation', 'Illustration', 'Creative Direction'],
        demoUrl: 'https://heritage.abia.gallery',
        githubUrl: 'https://github.com/ikechi-creative/heritage-3d',
      }
    ]
  }
];

export const EMPLOYERS: Employer[] = [
  {
    id: 'emp-abiatrade',
    companyName: 'AbiaTrade Technologies',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200',
    contactPerson: 'Nnamdi Anyanwu',
    description: 'AbiaTrade is the leading digital commerce enablement company for West African manufacturers. We build robust e-commerce solutions, payment gateways, and inventory systems for local trade merchants.',
    website: 'https://abiatrade.com',
    phone: '+234 803 123 4567',
    email: 'nnamdi@abiatrade.com',
    location: 'Aba',
    industry: 'E-commerce & Retail',
    desiredSkills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'PostgreSQL', 'Docker'],
    hiringCategories: ['Backend', 'Full Stack', 'UI/UX Design'],
    hiringTypes: ['Full-time', 'Contract', 'Remote']
  },
  {
    id: 'emp-shoetech',
    companyName: 'Ariaria Shoe-Tech Hub',
    companyLogo: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=200&h=200',
    contactPerson: 'Dr. Okezie Uche',
    description: 'Ariaria Shoe-Tech Hub bridges the gap between high-precision modern manufacturing and the legendary craftsmanship of Aba shoe designers. We use CAD/CAM and 3D prototyping to automate industrial production.',
    website: 'https://ariariashoetech.ng',
    phone: '+234 812 345 6789',
    email: 'okezie@ariariashoetech.ng',
    location: 'Aba',
    industry: 'Manufacturing & Industrial',
    desiredSkills: ['SolidWorks', 'Fusion 360', 'AutoCAD', '3D Modeling', 'CNC G-code', '3D Printing'],
    hiringCategories: ['CAD/CAM', 'Creative Arts'],
    hiringTypes: ['Full-time', 'Contract']
  },
  {
    id: 'emp-creativemu',
    companyName: 'Umuahia Creative Agency',
    companyLogo: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=200&h=200',
    contactPerson: 'Folake Bakare',
    description: 'A boutique branding and visual design studio focused on giving African startups world-class visual representations. We deliver comprehensive brand strategies, illustrations, and digital animations.',
    website: 'https://creativemu.agency',
    phone: '+234 815 987 6543',
    email: 'folake@creativemu.agency',
    location: 'Umuahia',
    industry: 'Creative Arts & Marketing',
    desiredSkills: ['Figma', 'Blender', '3D Animation', 'Illustration', 'Photoshop', 'After Effects'],
    hiringCategories: ['UI/UX Design', 'Creative Arts'],
    hiringTypes: ['Contract', 'Internship', 'Remote']
  },
  {
    id: 'emp-farmroute',
    companyName: 'FarmRoute Supply Chain',
    companyLogo: 'https://images.unsplash.com/photo-1464234471565-33b517aaf298?auto=format&fit=crop&q=80&w=200&h=200',
    contactPerson: 'Obioma Kanu',
    description: 'FarmRoute connects rural cooperative farms in Bende and Ohafia with transport networks and large metropolitan retailers. We develop lightweight mobile and tracking systems that operate offline.',
    website: 'https://farmroute.com.ng',
    phone: '+234 807 444 5555',
    email: 'obioma@farmroute.com.ng',
    location: 'Ohafia',
    industry: 'Logistics & Supply Chain',
    desiredSkills: ['Flutter', 'React Native', 'Kotlin', 'Go', 'gRPC', 'SQLite'],
    hiringCategories: ['Backend', 'Full Stack'],
    hiringTypes: ['Full-time', 'Remote']
  },
  {
    id: 'emp-arocloud',
    companyName: 'Aro Cloud Solutions',
    companyLogo: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200&h=200',
    contactPerson: 'Emeka Anya',
    description: 'A premium cloud architecture and DevOps consulting firm based in Arochukwu. We design multi-region automated setups, container orchestrations, and secure hybrid infrastructure networks.',
    website: 'https://arocloud.sh',
    phone: '+234 905 111 2222',
    email: 'emeka@arocloud.sh',
    location: 'Arochukwu',
    industry: 'Cloud & Infrastructure',
    desiredSkills: ['AWS', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    hiringCategories: ['Cloud & DevOps'],
    hiringTypes: ['Full-time', 'Part-time', 'Contract']
  }
];

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
