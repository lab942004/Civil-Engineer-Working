import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';

// Pages
// BUG FIX / BUILD WARNING: every page used to be imported statically here,
// so Vite had no choice but to bundle all ~25 pages (plus every library
// only one of them needs, e.g. recharts-style chart code, drawing tools,
// etc.) into a single ~790 kB JS chunk that shipped on first load no matter
// which page the user actually opened, triggering Vite's "chunk larger
// than 500 kB" build warning. Switching to `React.lazy()` lets Vite split
// each page into its own chunk that only downloads when that route is
// visited, so first load only pays for the login/dashboard code path.
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const CalculatorPage = lazy(() => import('@/pages/calculator/CalculatorPage'));
const ConverterPage = lazy(() => import('@/pages/converter/ConverterPage'));
const MaterialsPage = lazy(() => import('@/pages/materials/MaterialsPage'));
const ISCodesPage = lazy(() => import('@/pages/iscodes/ISCodesPage'));
const BOQPage = lazy(() => import('@/pages/boq/BOQPage'));
const RateAnalysisPage = lazy(() => import('@/pages/rate-analysis/RateAnalysisPage'));
const EstimationPage = lazy(() => import('@/pages/estimation/EstimationPage'));
const DrawingsPage = lazy(() => import('@/pages/drawings/DrawingsPage'));
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'));
const InspectionPage = lazy(() => import('@/pages/inspection/InspectionPage'));
const SiteDiaryPage = lazy(() => import('@/pages/sitediary/SiteDiaryPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const NotesPage = lazy(() => import('@/pages/notes/NotesPage'));
const LearningPage = lazy(() => import('@/pages/learning/LearningPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

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
      <HashRouter>
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(221.2,83.2%,53.3%)]" />
            </div>
          }
        >
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
        </Suspense>
      </HashRouter>
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
