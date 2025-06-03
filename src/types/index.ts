
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  instructorId: number;
  instructor: User;
  createdAt: string;
  updatedAt: string;
  materials?: CourseMaterial[];
  enrollments?: Enrollment[];
}

export interface CourseMaterial {
  id: number;
  title: string;
  type: 'PDF';
  fileUrl: string;
  courseId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'KICKED' | 'PENDING';
  enrolledAt: string;
  completedAt?: string;
  studentId: number;
  courseId: number;
  student: User;
  course: Course;
}

export interface CourseMessage {
  id: number;
  text: string;
  timestamp: string;
  userId: number;
  user: User;
  conversationId: number;
  reactions: any;
  comments: any[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
