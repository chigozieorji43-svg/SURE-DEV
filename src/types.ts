export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  developerId?: string;
  developerName?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  developerId?: string;
  developerName?: string;
}

export type ProjectStatus = 
  | 'Pending' 
  | 'Accepted' 
  | 'Declined' 
  | 'Active' 
  | 'In Review' 
  | 'Revision Requested' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Archived';

export interface ManagedProject {
  id: string;
  employerId: string;
  developerId: string;
  employerName: string;
  developerName: string;
  employerLogo?: string;
  developerAvatar?: string;
  title: string;
  description: string;
  scopeOfWork?: string;
  contractType?: 'Fixed Scope' | 'Milestone-Based' | 'Hourly / Time & Material';
  budget?: string;
  deadline: string;
  startDate?: string;
  expectedCompletionDate?: string;
  requiredSkills: string[];
  technologies?: string[];
  notes?: string;
  sourceApplicationId?: string;
  sourcePostId?: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  completionRequestedBy?: 'employer' | 'developer';
  isArchived?: boolean;
}

export type TimelineEventType =
  | 'Project Created'
  | 'Developer Accepted'
  | 'Developer Declined'
  | 'Employer Cancelled'
  | 'Project Completed'
  | 'Review Submitted'
  | 'Complaint Submitted'
  | 'Message Sent'
  | 'File Uploaded'
  | 'Deliverable Submitted'
  | 'Meeting Started'
  | 'Meeting Ended'
  | 'Milestone Created'
  | 'Milestone Completed'
  | 'Revision Requested'
  | 'Task Updated'
  | 'Contract Updated'
  | 'Amendment Requested'
  | 'Dispute Opened';

export interface ProjectTimelineEvent {
  id: string;
  projectId: string;
  eventType: TimelineEventType;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: 'employer' | 'developer' | 'system';
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface ContractMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'employer' | 'developer' | 'system';
  text: string;
  attachments?: Array<{ name: string; url: string; type: string; size: number }>;
  voiceNoteUrl?: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  replyToId?: string;
  isPinned?: boolean;
  isEdited?: boolean;
  isSystemMessage?: boolean;
  contractCard?: {
    title: string;
    budget?: string;
    employerName: string;
    developerName: string;
    status: string;
    acceptedAt: string;
  };
  readBy?: string[];
  codeSnippet?: { language: string; code: string };
  createdAt: string;
}

export interface ContractFile {
  id: string;
  projectId: string;
  name: string;
  url: string;
  fileType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByRole: 'employer' | 'developer';
  version: number;
  comments?: Array<{ id: string; author: string; text: string; createdAt: string }>;
  createdAt: string;
}

export interface ContractMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  deliverables: string[];
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Approved' | 'Revision Requested';
  submissionNotes?: string;
  submissionFiles?: Array<{ name: string; url: string }>;
  completionDate?: string;
  revisionHistory?: Array<{ requestedAt: string; reason: string; requestedBy: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ContractDeliverable {
  id: string;
  projectId: string;
  title: string;
  description: string;
  files?: Array<{ name: string; url: string }>;
  githubUrl?: string;
  liveUrl?: string;
  documentationUrl?: string;
  notes?: string;
  status: 'Submitted' | 'Approved' | 'Revision Requested' | 'Rejected';
  feedback?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export type TaskColumn = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface KanbanTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  column: TaskColumn;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  assigneeName?: string;
  labels?: string[];
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  comments?: Array<{ id: string; authorName: string; text: string; createdAt: string }>;
  attachments?: Array<{ name: string; url: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ContractMeeting {
  id: string;
  projectId: string;
  title: string;
  type: 'video' | 'audio';
  scheduledAt: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  hostId: string;
  hostName: string;
  durationSeconds?: number;
  summaryNotes?: string;
  actionItems?: string[];
  participants?: string[];
  createdAt: string;
}

export interface ContractChangeRequest {
  id: string;
  projectId: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: 'employer' | 'developer';
  newDeadline?: string;
  newScope?: string;
  newBudget?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

export interface ContractDispute {
  id: string;
  projectId: string;
  complainantId: string;
  complainantName: string;
  complainantRole: 'employer' | 'developer';
  respondentId: string;
  respondentName: string;
  category: string;
  description: string;
  evidenceFiles?: Array<{ name: string; url: string }>;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Dismissed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtendedReview {
  id: string;
  projectId: string;
  projectTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'employer' | 'developer';
  targetUserId: string;
  targetUserRole: 'employer' | 'developer';
  rating?: number;
  overallRating: number;
  communicationRating: number;
  workQualityRating?: number;
  timelinessRating?: number;
  professionalismRating: number;
  projectClarityRating?: number;
  comment: string;
  createdAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  projectTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'employer' | 'developer';
  targetUserId: string;
  targetUserRole: 'employer' | 'developer';
  rating: number; // 1-5
  title: string;
  comment: string;
  createdAt: string;
}

export type ComplaintReason =
  | 'Developer did not deliver'
  | 'Employer did not pay'
  | 'Poor communication'
  | 'Spam'
  | 'Fake profile'
  | 'Harassment'
  | 'Other';

export type ComplaintStatus = 'Open' | 'Under Review' | 'Resolved' | 'Dismissed';

export interface Complaint {
  id: string;
  projectId: string;
  projectTitle: string;
  complainantId: string;
  complainantName: string;
  complainantRole: 'employer' | 'developer';
  respondentId: string;
  respondentName: string;
  reason: ComplaintReason;
  description: string;
  evidenceLink?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
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
  projects: PortfolioProject[];
  email: string;
  gender?: string;
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
  profileImageUrl?: string;
  photoURL?: string;
  hasCustomProfileImage?: boolean;
  projectsCompleted?: number;
  averageRating?: number;
  reviewCount?: number;
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
  gender?: string;
  location: string;
  industry: string;
  desiredSkills: string[];
  hiringCategories: string[];
  hiringTypes: string[]; // ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']
  targetQualifications?: string;
  profileImageUrl?: string;
  photoURL?: string;
  hasCustomProfileImage?: boolean;
  coverPhoto?: string;
  projectsPosted?: number;
  projectsCompleted?: number;
  averageRating?: number;
  reviewCount?: number;
  reliabilityScore?: number;
}

export interface ProjectPost {
  id: string;
  postId?: string;
  employerId: string;
  employerName: string;
  employerProfileImage?: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  skills: string[];
  budget?: string;
  deadline?: string;
  status: 'active' | 'open' | 'closed' | 'draft';
  visibility?: 'public' | 'private' | string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'developer' | 'employer';

export interface UserSession {
  email: string;
  accountType: AccountType;
  isOnboarded: boolean;
  developerProfileId?: string;
  employerProfileId?: string;
  isGoogleUser?: boolean;
  profileImageUrl?: string;
  hasCustomProfileImage?: boolean;
  isAdmin?: boolean;
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

export interface InAppNotification {
  id: string;
  receiverId: string;
  senderId?: string;
  senderName?: string;
  type: 'welcome' | 'verification' | 'collab_request' | 'message' | 'weekly_update' | 'announcement' | 'security_alert' | 'general';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface EmailPreferences {
  weeklyEmails: boolean;
  securityAlerts: boolean;
  collaborationEmails: boolean;
  marketingEmails: boolean;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientId?: string;
  emailType: string;
  subject: string;
  status: 'sent' | 'failed' | 'simulated';
  error?: string;
  sentAt: string;
}

export interface EmailAnalytics {
  emailsSent: number;
  emailsFailed: number;
  weeklySends: number;
  openRatePlaceholder: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'developers' | 'employers' | 'profession';
  targetProfession?: string;
  sentBy: string;
  createdAt: string;
  recipientCount: number;
}

// ==========================================
// ENTERPRISE COLLABORATION & WORKSPACE TYPES
// ==========================================

export type PresenceStatus = 'Online' | 'Offline' | 'Away' | 'Busy' | 'In Meeting';

export type ActiveActionType = 
  | 'typing' 
  | 'viewing_files' 
  | 'reviewing_deliverables' 
  | 'editing_contract' 
  | 'updating_tasks' 
  | 'viewing_milestones' 
  | 'in_video_call' 
  | 'uploading_files' 
  | 'viewing_analytics' 
  | 'idle';

export interface WorkspacePresence {
  id?: string;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer' | 'admin';
  status: PresenceStatus;
  customStatusMessage?: string;
  currentActivity: ActiveActionType;
  activityDetails?: string;
  lastSeen: string;
  activeTabId?: string;
  deviceInfo?: string;
}

export type WorkspaceAction = 
  | 'create_milestone' | 'edit_milestone' | 'delete_milestone'
  | 'submit_milestone' | 'approve_deliverable' | 'reject_deliverable'
  | 'schedule_meeting' | 'join_meeting'
  | 'modify_contract' | 'invite_participant' | 'archive_contract' | 'restore_contract'
  | 'upload_file' | 'delete_file' | 'create_task' | 'edit_task'
  | 'request_revision' | 'request_amendment'
  | 'override_permissions' | 'lock_contract' | 'unlock_contract'
  | 'moderate_dispute' | 'suspend_workspace';

export interface ServiceHealthStatus {
  firestoreConnected: boolean;
  cloudinaryAvailable: boolean;
  aiAvailable: boolean;
  notificationsActive: boolean;
  emailServiceActive: boolean;
  realtimeSyncOk: boolean;
  latencyMs: number;
  uploadSpeedMbps: number;
  lastSyncTime: string;
  pendingOfflineActionsCount: number;
}

export interface ConflictEdit<T = any> {
  id: string;
  entityType: 'task' | 'milestone' | 'contract' | 'deliverable' | 'note';
  entityId: string;
  myVersion: T;
  theirVersion: T;
  myTimestamp: string;
  theirTimestamp: string;
  theirUserName: string;
}

export interface AutosaveDraft {
  id: string;
  projectId: string;
  userId: string;
  fieldKey: string;
  content: any;
  updatedAt: string;
}

export interface WorkspaceBookmark {
  id: string;
  projectId: string;
  userId: string;
  itemType: 'message' | 'file' | 'task' | 'milestone' | 'deliverable' | 'meeting_note';
  itemId: string;
  title: string;
  subtitle?: string;
  createdAt: string;
}

export interface WorkspaceFavorite {
  id: string;
  projectId: string;
  userId: string;
  itemType: 'file' | 'task' | 'milestone' | 'document' | 'conversation';
  itemId: string;
  title: string;
  category?: string;
  createdAt: string;
}

export interface RecentItem {
  id: string;
  projectId: string;
  userId: string;
  itemType: 'file' | 'task' | 'conversation' | 'milestone' | 'meeting' | 'deliverable';
  itemId: string;
  title: string;
  viewedAt: string;
  tabTarget?: string;
}

export interface GlobalSearchResult {
  id: string;
  itemType: 'message' | 'file' | 'task' | 'milestone' | 'deliverable' | 'meeting' | 'review' | 'contract' | 'dispute';
  title: string;
  snippet: string;
  date: string;
  authorName?: string;
  tabId: string;
  metadata?: Record<string, any>;
}

export interface WorkspaceAccessLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  ipAddress?: string;
  deviceInfo?: string;
  timestamp: string;
  status: 'success' | 'denied' | 'flagged';
}

export interface CallSession {
  id: string;
  projectId: string;
  projectTitle: string;
  type: 'audio' | 'video';
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callerRole: 'employer' | 'developer';
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  receiverRole: 'employer' | 'developer';
  status: 'calling' | 'connecting' | 'connected' | 'declined' | 'ended' | 'cancelled';
  offer?: { type: string; sdp: string };
  answer?: { type: string; sdp: string };
  createdAt: string;
  endedAt?: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface ProjectApplication {
  id: string;
  applicationId: string;
  projectId: string;
  employerId: string;
  employerName?: string;
  developerId: string;
  developerName: string;
  developerProfileImage?: string;
  projectTitle: string;
  proposal: string;
  experience?: string;
  estimatedCompletionTime?: string;
  proposedBudget?: string;
  status: ApplicationStatus;
  createdProjectId?: string;
  createdAt: string;
  updatedAt: string;
}



