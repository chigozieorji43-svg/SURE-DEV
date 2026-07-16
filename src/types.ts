export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  developerId: string;
  developerName: string;
}

export interface Developer {
  id: string;
  name: string;
  title: string;
  avatar: string;
  location: string;
  experience: number; // Years
  skills: string[];
  availability: 'immediate' | 'soon' | 'no'; // immediate = Green badge, soon = Amber badge, no = Grey badge
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  portfolioUrl: string;
  featured: boolean;
  projects: Omit<Project, 'developerId' | 'developerName'>[];
  email: string;
  coverPhoto?: string;
  currentWorkplace?: string;
  phone?: string;
  workExperience?: Array<{
    id: string;
    role: string;
    company: string;
    duration: string;
    description: string;
  }>;
  qualification?: string;
}

export interface Employer {
  id: string;
  companyName: string;
  companyLogo: string;
  contactPerson: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  location: string;
  industry: string;
  desiredSkills: string[];
  hiringCategories: string[];
  hiringTypes: string[]; // ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']
  targetQualifications?: string;
}

export type AccountType = 'developer' | 'employer';

export interface UserSession {
  email: string;
  accountType: AccountType;
  isOnboarded: boolean;
  developerProfileId?: string;
  employerProfileId?: string;
  isGoogleUser?: boolean;
}


export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  logo: string;
  avatar: string;
}

export interface Statistics {
  developers: number;
  companies: number;
  projects: number;
  skills: number;
}

export interface CollabRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  timestamp: string;
}

