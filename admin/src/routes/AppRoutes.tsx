import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AdminLayout from '../layouts/AdminLayout';

// Same fix as the main frontend: statically importing every admin page
// bundled them all into one ~800 kB chunk that loaded up front regardless
// of which page was opened. Lazy-loading splits each page into its own
// chunk that only downloads when visited.
const LoginPage = lazy(() => import('../pages/Login/LoginPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const UsersPage = lazy(() => import('../pages/Users/UsersPage'));
const MaterialLibraryPage = lazy(() => import('../pages/MaterialLibrary/MaterialLibraryPage'));
const ISCodesPage = lazy(() => import('../pages/ISCodes/ISCodesPage'));
const LearningCenterPage = lazy(() => import('../pages/LearningCenter/LearningCenterPage'));
const CategoriesPage = lazy(() => import('../pages/Categories/CategoriesPage'));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage'));
const ReportsPage = lazy(() => import('../pages/Reports/ReportsPage'));
const AnalyticsPage = lazy(() => import('../pages/Analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'));
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'));
const DownloadsPage = lazy(() => import('../pages/Downloads/DownloadsPage'));
const ActivityLogsPage = lazy(() => import('../pages/ActivityLogs/ActivityLogsPage'));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Admin Routes */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="materials" element={<MaterialLibraryPage />} />
        <Route path="iscodes" element={<ISCodesPage />} />
        <Route path="learning" element={<LearningCenterPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="downloads" element={<DownloadsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
}