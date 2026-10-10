export interface ExperienceItem {
  id: string;
  type: string;
  title: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  ongoing: boolean;
  description: string;
  result: string;
  teamSize: string;
  numbers: string;
  link: string;
  skills: string[];
}

export interface SkillItem {
  name: string;
  level: number;
  source: 'manual' | 'test';
}

export interface LanguageItem {
  name: string;
  level: string;
}

export interface TestResult {
  testId: string;
  testName: string;
  score: number;
  maxScore: number;
  date: string;
  passed: boolean;
}

export interface EducationInfo {
  level: string;
  institution: string;
  faculty: string;
  specialty: string;
  profile: string;
  course: string;
  endYear: string;
  form: string;
  gpa: string;
  achievements: string[];
}

export interface OpportunityPrefs {
  types: string[];
  startWhen: string;
  hoursPerWeek: string;
  format: string;
  salary: number;
  salaryNotMain: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  gender: string;
  city: string;
  region: string;
  relocation: string;
  phone: string;
  email: string;
  telegram: string;
  vk: string;
  photo: string;
  education: EducationInfo;
  opportunity: OpportunityPrefs;
  profession: string;
  roles: string[];
  interests: string[];
  experiences: ExperienceItem[];
  skills: SkillItem[];
  softSkills: { name: string; score: number }[];
  languages: LanguageItem[];
  driverLicense: string;
  businessTrips: string;
  portfolioLinks: string[];
  priorities: string[];
  projects: string;
  achievements: string[];
  tests: TestResult[];
  coverLetter: string;
  certificateName: string;
  certificateNumber: string;
}

export interface Vacancy {
  title: string;
  company: string;
  type: string;
  location: string;
  format: string;
  salary: string;
  experience: string;
  match: number;
  reasons: string[];
  logo: string;
  gradient: string;
  bonuses: string[];
  skillsRequired: string[];
  skillsMissing: string[];
}

export type StepId =
  | 'welcome'
  | 'personal'
  | 'education'
  | 'opportunity'
  | 'interests'
  | 'experience'
  | 'hardskills'
  | 'softskills'
  | 'additional'
  | 'priorities'
  | 'profile-ready'
  | 'resume'
  | 'vacancies'
  | 'cover-letter'
  | 'final-check'
  | 'celebration'
  | 'next-steps'
  | 'certificate';

export interface AppState {
  profile: UserProfile;
  currentStep: StepId;
  completedSteps: StepId[];
  appliedVacancy: string | null;
  activeTab: string;
  demoMode: boolean;
}
