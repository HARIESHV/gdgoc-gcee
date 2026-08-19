export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: string;
  rollNumber?: string;
  profileImage?: string;
  points?: number;
  bio?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
  joinedAt?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface GEvent {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  shortDescription: string;
  banner: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  speaker: string;
  speakerBio: string;
  category: string;
  technologies: string[];
  registrationEnabled: boolean;
  registrationDeadline: string;
  capacity: number;
  googleFormUrl: string;
  responseSheetId?: string;
  responseSheetName?: string;
  lastSyncedAt?: string;
  manualRegistrationCount: number;
  isCertificateEligible: boolean;
  isInauguration: boolean;
  status: EventStatus;
  effectiveStatus: EventStatus;
  registeredCount: number;
  createdAt?: string;
}

export interface SendingHistoryEntry {
  _id: string;
  eventType: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: string;
}

export interface SendingHistoryStats {
  sent: number;
  failed: number;
  pending: number;
}

export interface AttendanceRecord {
  id: string;
  eventId?: string;
  eventTitle?: string;
  eventDate: string;
  status: 'PRESENT' | 'ABSENT';
  method: 'ADMIN' | 'QR';
  markedAt?: string;
}

export interface Certificate {
  certificateId: string;
  studentName: string;
  organization: string;
  institution: string;
  eventDate: string;
  eventDateLabel: string;
  eventName: string;
  issueDate: string;
  issueDateLabel: string;
  status: 'VALID' | 'REVOKED';
  campaignName?: string;
  revokedAt?: string;
  qrCode?: string;
}

export interface Campaign {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  minimumAttendancePercentage: number;
  minimumEligibleEvents: number;
  releaseDate?: string;
  certificateTemplate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  generatedAt?: string;
}

export interface Member {
  _id: string;
  name: string;
  team: string;
  role: string;
  department: string;
  year: string;
  photo: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  createdAt?: string;
}

export interface ResourceItem {
  _id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  type?: string;
  uploadedBy?: string;
  createdAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  department: string;
  year: string;
  profileImage: string;
  points: number;
  eventsAttended: number;
}

export interface EligibilityStudent {
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  year: string;
  attended: number;
  attendancePercentage: number;
  qualifies: boolean;
}

export interface DashboardStats {
  registered: number;
  attended: number;
  attendancePercent: number;
  certificates: number;
}

export interface AdminStats {
  totalStudents: number;
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  attendanceRecords: number;
  certificates: number;
  validCertificates: number;
  pendingCertificates: number;
  members: number;
}
