
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Course, CourseMaterial } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Download, Users, Calendar, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CourseChat from '@/components/CourseChat';

const CourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEnrollment, setUserEnrollment] = useState<any>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const coursesResponse = await apiClient.getCourses(1, 100);
      const foundCourse = coursesResponse.data.find(c => c.id === parseInt(courseId!));
      
      if (!foundCourse) {
        toast({
          title: 'Error',
          description: 'Course not found',
          variant: 'destructive',
        });
        navigate('/student');
        return;
      }

      // Check if student is enrolled
      const enrollment = foundCourse.enrollments?.find(e => e.studentId === user?.id);
      if (!enrollment) {
        toast({
          title: 'Error',
          description: 'You are not enrolled in this course',
          variant: 'destructive',
        });
        navigate('/student');
        return;
      }

      setCourse(foundCourse);
      setUserEnrollment(enrollment);

      // Load materials
      const materialsResponse = await apiClient.getCourseMaterials(parseInt(courseId!));
      setMaterials(materialsResponse.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load course data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMaterial = async (materialId: number, title: string) => {
    try {
      const blob = await apiClient.downloadCourseMaterial(parseInt(courseId!), materialId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Material downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download material',
        variant: 'destructive',
      });
    }
  };

  const handleDropCourse = async () => {
    try {
      await apiClient.dropFromCourse(parseInt(courseId!));
      toast({
        title: 'Success',
        description: 'Dropped from course successfully',
      });
      navigate('/student');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course || !userEnrollment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusBadge(userEnrollment.status)}
              <span className="text-sm text-gray-600">
                Instructor: {course.instructor.firstName} {course.instructor.lastName}
              </span>
            </div>
          </div>
        </div>
        
        {userEnrollment.status === 'ACTIVE' && (
          <Button variant="outline" onClick={handleDropCourse}>
            Drop Course
          </Button>
        )}
      </div>

      {course.description && (
        <Card>
          <CardHeader>
            <CardTitle>Course Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{course.description}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="info">Course Info</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Course Materials</h3>
          </div>

          {materials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
                <p className="text-gray-600 text-center">
                  Your instructor hasn't uploaded any materials for this course yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{material.title}</h3>
                        <p className="text-sm text-gray-600">
                          Uploaded {new Date(material.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadMaterial(material.id, material.title)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Instructor Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span> {course.instructor.firstName} {course.instructor.lastName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {course.instructor.email}
                </div>
                {course.instructor.bio && (
                  <div>
                    <span className="font-medium">Bio:</span> {course.instructor.bio}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Enrollment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(userEnrollment.status)}
                </div>
                <div>
                  <span className="font-medium">Enrolled:</span> {new Date(userEnrollment.enrolledAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Course Created:</span> {new Date(course.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Total Students:</span> {course.enrollments?.filter(e => e.status === 'ACTIVE').length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <CourseChat courseId={parseInt(courseId!)} userEnrollmentStatus={userEnrollment.status} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetails;
