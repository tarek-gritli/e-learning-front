
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Pages
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import StudentDashboard from "./pages/student/StudentDashboard";
import CourseDetails from "./pages/student/CourseDetails";
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import CourseManagement from "./pages/instructor/CourseManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Settings from "./pages/Settings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Index />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Settings Route - All users */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Layout>
                  <StudentDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/student/courses/:courseId" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Layout>
                  <CourseDetails />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Instructor Routes */}
            <Route path="/instructor" element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                <Layout>
                  <InstructorDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/instructor/courses/:courseId" element={
              <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                <Layout>
                  <CourseManagement />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={
              <Layout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                  <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
              </Layout>
            } />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
