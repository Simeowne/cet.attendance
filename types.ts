export enum AttendanceStatus {
  TimedIn = 'Timed In',
  TimedOut = 'Timed Out',
}

export interface Student {
  id: string;
  name: string;
  avatarUrl: string;
  course: string;
  year: number;
  block: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  studentAvatarUrl: string;
  studentCourse: string;
  studentYear: number;
  studentBlock: string;
  status: AttendanceStatus;
  timestamp: Date;
}

export interface Message {
  type: 'success' | 'error';
  text: string;
}

export type View = 'dashboard' | 'analytics' | 'students' | 'logout';