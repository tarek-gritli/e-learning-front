import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { User, Course } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, UserPlus, Activity, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalUsers: number;
  totalInstructors: number;
  totalStudents: number;
  totalCourses: number;
}

interface EventData {
  id: number;
  type: string;
  payload: any;
  createdAt: string;
  user: User;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalCourses: 0,
  });
  const [recentEvents, setRecentEvents] = useState<EventData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createInstructorOpen, setCreateInstructorOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    bio: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    setupEventStream();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersResponse, coursesResponse] = await Promise.all([
        apiClient.getUsers(1, 100),
        apiClient.getCourses(1, 100),
      ]);

      const totalUsers = usersResponse.total;
      const instructors = usersResponse.data.filter(
        (u) => u.role === "INSTRUCTOR"
      );
      const students = usersResponse.data.filter((u) => u.role === "STUDENT");

      setAnalytics({
        totalUsers,
        totalInstructors: instructors.length,
        totalStudents: students.length,
        totalCourses: coursesResponse.total,
      });

      setUsers(usersResponse.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupEventStream = () => {
    try {
      const eventSource = apiClient.createEventStream();

      eventSource.onopen = () => {
        console.log("EventSource connection opened");
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data);
          setRecentEvents((prev) => [eventData, ...prev.slice(0, 9)]);

          const eventTypeMap: Record<string, string> = {
            STUDENT_ENROLLED_IN_COURSE: "Student enrolled in course",
            COURSE_CREATED: "New course created",
            INSTRUCTOR_INVITED_STUDENT: "Student invited to course",
            STUDENT_DROPPED_FROM_COURSE: "Student dropped from course",
          };

          const message = eventTypeMap[eventData.type];
          if (message) {
            toast({
              title: "Real-time Update",
              description: message,
            });
          }
        } catch (error) {
          console.error("Failed to parse event data:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        eventSource.close();
      };

      return () => eventSource.close();
    } catch (error) {
      console.error("Failed to setup event stream:", error);
      toast({
        title: "Error",
        description: "Failed to establish real-time connection",
        variant: "destructive",
      });
    }
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createInstructor(newInstructor);
      toast({
        title: "Success",
        description: "Instructor account created successfully",
      });
      setCreateInstructorOpen(false);
      setNewInstructor({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        bio: "",
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create instructor account",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await apiClient.deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; variant: any }> = {
      STUDENT_ENROLLED_IN_COURSE: {
        text: "Student Enrolled",
        variant: "default",
      },
      COURSE_CREATED: { text: "Course Created", variant: "secondary" },
      INSTRUCTOR_INVITED_STUDENT: {
        text: "Student Invited",
        variant: "outline",
      },
      STUDENT_DROPPED_FROM_COURSE: {
        text: "Student Dropped",
        variant: "destructive",
      },
      STUDENT_REJECTED_ENROLLMENT_FROM_COURSE: {
        text: "Invitation Rejected",
        variant: "destructive",
      },
      
    };

    return (
      labels[type] || { text: type.replace(/_/g, " "), variant: "outline" }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and management</p>
        </div>

        <Dialog
          open={createInstructorOpen}
          onOpenChange={setCreateInstructorOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Instructor Account</DialogTitle>
              <DialogDescription>
                Create a new instructor account to manage courses.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInstructor} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newInstructor.firstName}
                    onChange={(e) =>
                      setNewInstructor({
                        ...newInstructor,
                        firstName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newInstructor.lastName}
                    onChange={(e) =>
                      setNewInstructor({
                        ...newInstructor,
                        lastName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newInstructor.username}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newInstructor.email}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newInstructor.password}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      password: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateInstructorOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Account</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalInstructors}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Real-time Events</span>
            </CardTitle>
            <CardDescription>Live platform activity updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No recent events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event, index) => {
                  console.log("Event data:", event);
                  const eventLabel = getEventTypeLabel(event.type);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <Badge variant={eventLabel.variant}>
                          {eventLabel.text}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>Recent users and quick actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        user.role === "ADMIN"
                          ? "default"
                          : user.role === "INSTRUCTOR"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                    {user.role !== "ADMIN" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
