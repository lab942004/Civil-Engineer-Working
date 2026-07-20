import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/Login/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import UsersPage from '../pages/Users/UsersPage';
import MaterialLibraryPage from '../pages/MaterialLibrary/MaterialLibraryPage';
import ISCodesPage from '../pages/ISCodes/ISCodesPage';
import LearningCenterPage from '../pages/LearningCenter/LearningCenterPage';
import CategoriesPage from '../pages/Categories/CategoriesPage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import AnalyticsPage from '../pages/Analytics/AnalyticsPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import DownloadsPage from '../pages/Downloads/DownloadsPage';
import ActivityLogsPage from '../pages/ActivityLogs/ActivityLogsPage';

export default function AppRoutes() {
  return (
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
  );
}