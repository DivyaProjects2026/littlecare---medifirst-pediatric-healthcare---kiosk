export interface VitalVideo {
  category: string;
  title: string;
  videoUrl: string;
  isVideoFile: boolean;
  paramKey: string;
  unit: string;
  defaultVal: string;
}

export interface CartoonStory {
  title: string;
  icon?: string;
  bgGradient?: string;
  character: string;
  message: string;
  videoUrl: string;
  isVideoFile: boolean;
}

export interface Appointment {
  id: string;
  childName: string;
  age: string;
  date: string;
  time: string;
  reason: string;
  status: 'Pending' | 'Approved';
}

export interface PatientVitals {
  temp?: string;
  hr?: string;
  weight?: string;
  height?: string;
  spO2?: string;
  respRate?: string;
  bp?: string;
  bmi?: string;
  [key: string]: string | undefined;
}

export interface PatientRecord {
  childName: string;
  age: string;
  gender: string;
  visitDate: string;
  parentName: string;
  reportReleased: boolean;
  vitals: PatientVitals;
  diagnosis: string;
  aiSuggestions: string[];
}

export interface Bill {
  id: string;
  childName: string;
  date: string;
  service: string;
  amount: string;
  status: string;
  receiptNo: string;
}

export interface ParentAccount {
  username: string;
  childName: string;
  pin: string;
}

export interface ChildDetails {
  name: string;
  age: string;
  gender: string;
}

export interface AppData {
  marqueeMessage: string;
  parentAccounts: ParentAccount[];
  currentLoggedInParent: string;
  childDetails: ChildDetails;
  vitalsVideos: VitalVideo[];
  cartoonStories: CartoonStory[];
  appointments: Appointment[];
  patientRecords: Record<string, PatientRecord>;
  bills: Bill[];
}

export type ViewMode = 'roleSelection' | 'kidsPortal' | 'parentLogin' | 'parentPortal' | 'adminPortal';
export type KidsTab = 'interactive' | 'tabular' | 'videos';
export type AdminTab = 'accounts' | 'appointments' | 'reports' | 'billing' | 'videos' | 'marquee';
export type Language = 'en' | 'hi';
