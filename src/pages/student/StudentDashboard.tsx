
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Course } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCourses(1, 50);
      setCourses(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptEnrollment = async (courseId: number) => {
    try {
      await apiClient.acceptEnrollment(courseId);
      toast({
        title: 'Success',
        description: 'Enrollment accepted successfully',
      });
      loadCourses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept enrollment',
        variant: 'destructive',
      });
    }
  };

  const handleRejectEnrollment = async (courseId: number) => {
    try {
      await apiClient.rejectEnrollment(courseId);
      toast({
        title: 'Success',
        description: 'Enrollment rejected',
      });
      loadCourses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject enrollment',
        variant: 'destructive',
      });
    }
  };

  const handleDropCourse = async (courseId: number) => {
    try {
      await apiClient.dropFromCourse(courseId);
      toast({
        title: 'Success',
        description: 'Dropped from course successfully',
      });
      loadCourses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to drop from course',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'default',
      COMPLETED: 'secondary',
      PENDING: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  // Separate courses by enrollment status
  const activeCourses = courses.filter(course => 
    course.enrollments?.some(e => e.studentId === user?.id && e.status === 'ACTIVE')
  );
  
  const pendingInvites = courses.filter(course => 
    course.enrollments?.some(e => e.studentId === user?.id && e.status === 'PENDING')
  );
  
  const completedCourses = courses.filter(course => 
    course.enrollments?.some(e => e.studentId === user?.id && e.status === 'COMPLETED')
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Pending Invitations</h2>
          <div className="grid gap-4">
            {pendingInvites.map((course) => (
              <Card key={course.id} className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>
                        Invited by {course.instructor.firstName} {course.instructor.lastName}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptEnrollment(course.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectEnrollment(course.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Courses */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
        
        {activeCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active courses</h3>
              <p className="text-gray-600 text-center">
                You haven't enrolled in any courses yet. Wait for an instructor to invite you to a course.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeCourses.map((course) => {
              const enrollment = course.enrollments?.find(e => e.studentId === user?.id);
              return (
                <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                      {enrollment && getStatusBadge(enrollment.status)}
                    </div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Instructor: {course.instructor.firstName} {course.instructor.lastName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{course.materials?.length || 0} materials</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Enrolled: {enrollment && new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        className="flex-1"
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                      >
                        View Course
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropCourse(course.id);
                        }}
                      >
                        Drop
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Completed Courses</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedCourses.map((course) => {
              const enrollment = course.enrollments?.find(e => e.studentId === user?.id);
              return (
                <Card key={course.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <BookOpen className="h-6 w-6 text-green-600" />
                      {enrollment && getStatusBadge(enrollment.status)}
                    </div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Instructor: {course.instructor.firstName} {course.instructor.lastName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Completed: {enrollment?.completedAt && new Date(enrollment.completedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                      >
                        View Materials
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
