import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Course, CourseMaterial, Enrollment, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, FileText, Users, Settings, Trash2, Download, UserMinus, CheckCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CourseChat from '@/components/CourseChat';

const CourseManagement: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
  });

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
      
      if (!foundCourse || foundCourse.instructorId !== user?.id) {
        toast({
          title: 'Error',
          description: 'Course not found or you do not have permission to manage it',
          variant: 'destructive',
        });
        navigate('/instructor');
        return;
      }

      setCourse(foundCourse);
      setCourseForm({
        title: foundCourse.title,
        description: foundCourse.description || '',
      });

      // Load materials and enrollments
      const [materialsResponse, enrollmentsResponse, studentsResponse] = await Promise.all([
        apiClient.getCourseMaterials(parseInt(courseId!)),
        apiClient.getCourseStudents(parseInt(courseId!)),
        apiClient.getUsers(1, 100, 'STUDENT'),
      ]);

      setMaterials(materialsResponse.data);
      setEnrollments(enrollmentsResponse.data);
      setStudents(studentsResponse.data);
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

  const handleUpdateCourse = async () => {
    try {
      await apiClient.updateCourse(parseInt(courseId!), courseForm);
      toast({
        title: 'Success',
        description: 'Course updated successfully',
      });
      loadCourseData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update course',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await apiClient.deleteCourse(parseInt(courseId!));
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });
      navigate('/instructor');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    }
  };

  const handleUploadMaterial = async () => {
    if (!selectedFile || !materialTitle) {
      toast({
        title: 'Error',
        description: 'Please select a file and enter a title',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiClient.uploadCourseMaterial(parseInt(courseId!), selectedFile, materialTitle);
      toast({
        title: 'Success',
        description: 'Material uploaded successfully',
      });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setMaterialTitle('');
      loadCourseData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload material',
        variant: 'destructive',
      });
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

  const handleDeleteMaterial = async (materialId: number) => {
    try {
      await apiClient.deleteMaterial(parseInt(courseId!), materialId);
      toast({
        title: 'Success',
        description: 'Material deleted successfully',
      });
      loadCourseData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete material',
        variant: 'destructive',
      });
    }
  };

  const handleInviteStudent = async () => {
    if (!selectedStudentId) return;

    try {
      await apiClient.inviteStudent(parseInt(courseId!), selectedStudentId);
      toast({
        title: 'Success',
        description: 'Student invited successfully',
      });
      setInviteDialogOpen(false);
      setSelectedStudentId(null);
      loadCourseData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to invite student',
        variant: 'destructive',
      });
    }
  };

  const handleKickStudent = async (studentId: number) => {
    try {
      await apiClient.kickStudent(parseInt(courseId!), studentId);
      toast({
        title: 'Success',
        description: 'Student removed from course',
      });
      loadCourseData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove student',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteCourse = async () => {
    try {
      await apiClient.completeCourse(parseInt(courseId!));
      toast({
        title: 'Success',
        description: 'Course marked as completed for all students',
      });
      loadCourseData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete course',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
      </div>
    );
  }

  const availableStudents = students.filter(student => 
    !enrollments.some(enrollment => enrollment.studentId === student.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/instructor')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleCompleteCourse} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Course
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Course
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Course</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this course? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCourse}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrollments.filter(e => e.status === 'ACTIVE').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{materials.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrollments.filter(e => e.status === 'PENDING').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Course Materials</h3>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Course Material</DialogTitle>
                  <DialogDescription>
                    Upload a PDF file for your course materials.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Material Title</Label>
                    <Input
                      id="title"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      placeholder="Enter material title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">PDF File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUploadMaterial}>Upload</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadMaterial(material.id, material.title)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMaterial(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Enrolled Students</h3>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Student</DialogTitle>
                  <DialogDescription>
                    Select a student to invite to this course.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Available Students</Label>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {availableStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            selectedStudentId === student.id ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-600">{student.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInviteStudent} disabled={!selectedStudentId}>
                      Invite
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{enrollment.student.email}</p>
                    </div>
                    <Badge variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  
                  {enrollment.status === 'ACTIVE' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleKickStudent(enrollment.studentId)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <CourseChat courseId={parseInt(courseId!)} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Course Settings</span>
              </CardTitle>
              <CardDescription>
                Update course information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseTitle">Course Title</Label>
                <Input
                  id="courseTitle"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseDescription">Description</Label>
                <Textarea
                  id="courseDescription"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={handleUpdateCourse}>
                Update Course
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseManagement;
