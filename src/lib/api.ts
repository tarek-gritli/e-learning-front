import {
  User,
  Course,
  CourseMaterial,
  Enrollment,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

const API_BASE_URL = "http://localhost:3000";

class ApiClient {
  private getTokenFromStorage(): string | null {
    return localStorage.getItem("access_token");
  }

  private setTokenInStorage(token: string): void {
    localStorage.setItem("access_token", token);
  }

  private removeTokenFromStorage(): void {
    localStorage.removeItem("access_token");
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getTokenFromStorage();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      credentials: "include",
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Auth methods
  async login(
    username: string,
    password: string
  ): Promise<{ accessToken: string; user: User }> {
    const response = await this.request<{ user: User; accessToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );

    // Store token in localStorage
    if (response.accessToken) {
      this.setTokenInStorage(response.accessToken);
      console.log("Token stored in localStorage");
    }

    return response;
  }

  async register(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<ApiResponse<User>> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getMe(): Promise<User> {
    return this.request("/auth/me");
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      // Always remove token from storage, even if logout request fails
      this.removeTokenFromStorage();
    }
  }

  // Course methods - updated to return courses based on user role
  async getCourses(page = 1, limit = 10): Promise<PaginatedResponse<Course>> {
    return this.request(`/courses?page=${page}&limit=${limit}`);
  }

  async createCourse(courseData: {
    title: string;
    description?: string;
  }): Promise<ApiResponse<Course>> {
    return this.request("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(
    id: number,
    courseData: { title?: string; description?: string }
  ): Promise<ApiResponse<Course>> {
    return this.request(`/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id: number): Promise<void> {
    return this.request(`/courses/${id}`, { method: "DELETE" });
  }

  async getCourseStudents(
    courseId: number,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Enrollment>> {
    return this.request(
      `/courses/${courseId}/students?page=${page}&limit=${limit}`
    );
  }

  async getCourseMaterials(
    courseId: number,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<CourseMaterial>> {
    return this.request(
      `/courses/${courseId}/materials?page=${page}&limit=${limit}`
    );
  }

  async uploadCourseMaterial(
    courseId: number,
    file: File,
    title: string
  ): Promise<ApiResponse<CourseMaterial>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const token = this.getTokenFromStorage();
    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/materials`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  async downloadCourseMaterial(
    courseId: number,
    materialId: number
  ): Promise<Blob> {
    const token = this.getTokenFromStorage();
    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/materials/${materialId}/download`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async deleteMaterial(courseId: number, materialId: number): Promise<void> {
    return this.request(`/courses/${courseId}/materials/${materialId}`, {
      method: "DELETE",
    });
  }

  async inviteStudent(courseId: number, studentId: number): Promise<void> {
    return this.request(
      `instructor/courses/${courseId}/students/${studentId}/invite`,
      {
        method: "POST",
        body: JSON.stringify({ studentId }),
      }
    );
  }

  async kickStudent(courseId: number, studentId: number): Promise<void> {
    return this.request(
      `instructor/courses/${courseId}/students/${studentId}/kick`,
      {
        method: "PATCH",
        body: JSON.stringify({ studentId }),
      }
    );
  }

  async completeCourse(courseId: number): Promise<void> {
    return this.request(`/courses/${courseId}/complete`, { method: "PATCH" });
  }

  async dropFromCourse(courseId: number): Promise<void> {
    return this.request(`/student/drop/${courseId}`, { method: "PATCH" });
  }

  async acceptEnrollment(courseId: number): Promise<void> {
    return this.request(`/student/accept/${courseId}`, { method: "PATCH" });
  }

  async rejectEnrollment(courseId: number): Promise<void> {
    return this.request(`/courses/reject/${courseId}`, { method: "DELETE" });
  }

  async getUsers(
    page = 1,
    limit = 10,
    role?: string
  ): Promise<PaginatedResponse<User>> {
    const roleParam = role ? `&role=${role}` : "";
    return this.request(`/users?page=${page}&limit=${limit}${roleParam}`);
  }

  async createInstructor(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    avatar?: string;
    bio?: string;
  }): Promise<ApiResponse<User>> {
    return this.request("/users/instructor", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateProfile(userData: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    avatar?: string;
    bio?: string;
  }): Promise<ApiResponse<User>> {
    return this.request("users/profile", {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  }

  async deleteMyAccount(): Promise<void> {
    try {
      await this.request("users/delete", { method: "DELETE" });
    } finally {
      this.removeTokenFromStorage();
    }
  }

  async deleteUser(userId: number): Promise<void> {
    return this.request(`/users/${userId}`, { method: "DELETE" });
  }

  createEventStream(): EventSource {
    const token = this.getTokenFromStorage();
    if (!token) {
      throw new Error("No authentication token found");
    }
    const eventSource = new EventSource(
      `${API_BASE_URL}/event/stream?token=${encodeURIComponent(token)}`,
      {
        withCredentials: true,
      }
    );
    return eventSource;
  }
}

export const apiClient = new ApiClient();
