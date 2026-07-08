import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CalculatorPage from '@/pages/calculator/CalculatorPage';
import ConverterPage from '@/pages/converter/ConverterPage';
import MaterialsPage from '@/pages/materials/MaterialsPage';
import ISCodesPage from '@/pages/iscodes/ISCodesPage';
import BOQPage from '@/pages/boq/BOQPage';
import RateAnalysisPage from '@/pages/rate-analysis/RateAnalysisPage';
import EstimationPage from '@/pages/estimation/EstimationPage';
import DrawingsPage from '@/pages/drawings/DrawingsPage';
import ProjectsPage from '@/pages/projects/ProjectsPage';
import InspectionPage from '@/pages/inspection/InspectionPage';
import SiteDiaryPage from '@/pages/sitediary/SiteDiaryPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import NotesPage from '@/pages/notes/NotesPage';
import LearningPage from '@/pages/learning/LearningPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import AdminPage from '@/pages/admin/AdminPage';
import SettingsPage from '@/pages/SettingsPage';
import HelpPage from '@/pages/HelpPage';
import NotFoundPage from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { setDark } = useThemeStore();

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, [setDark]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Calculator Module */}
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="calculator/:calculatorType" element={<CalculatorPage />} />
            
            {/* Unit Converter */}
            <Route path="converter" element={<ConverterPage />} />
            
            {/* Material Library */}
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="materials/:category" element={<MaterialsPage />} />
            <Route path="materials/:category/:materialId" element={<MaterialsPage />} />
            
            {/* IS Codes */}
            <Route path="iscodes" element={<ISCodesPage />} />
            <Route path="iscodes/:codeId" element={<ISCodesPage />} />
            
            {/* BOQ */}
            <Route path="boq" element={<BOQPage />} />
            <Route path="boq/new" element={<BOQPage />} />
            <Route path="boq/:id" element={<BOQPage />} />
            
            {/* Rate Analysis */}
            <Route path="rate-analysis" element={<RateAnalysisPage />} />
            
            {/* Estimation */}
            <Route path="estimation" element={<EstimationPage />} />
            
            {/* Drawings */}
            <Route path="drawings" element={<DrawingsPage />} />
            
            {/* Projects */}
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/new" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectsPage />} />
            
            {/* Site Inspection */}
            <Route path="inspection" element={<InspectionPage />} />
            <Route path="site-diary" element={<SiteDiaryPage />} />
            
            {/* Daily Reports */}
            <Route path="reports" element={<ReportsPage />} />
            
            {/* Notes */}
            <Route path="notes" element={<NotesPage />} />
            
            {/* Learning Center */}
            <Route path="learning" element={<LearningPage />} />
            
            {/* Profile */}
            <Route path="profile" element={<ProfilePage />} />
            
            {/* Admin */}
            <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            
            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Help */}
            <Route path="help" element={<HelpPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </QueryClientProvider>
  );
}