import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import {
  LayoutDashboard, Users, BookOpen, FileCode, GraduationCap,
  FolderTree, Bell, BarChart3, FileText, Activity, Settings,
  UserCircle, LogOut, ChevronLeft, ChevronRight, Menu, X,
  Download,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'Users', icon: <Users size={20} />, path: '/users' },
  { label: 'Material Library', icon: <BookOpen size={20} />, path: '/materials' },
  { label: 'IS Codes', icon: <FileCode size={20} />, path: '/iscodes' },
  { label: 'Learning Center', icon: <GraduationCap size={20} />, path: '/learning' },
  { label: 'Categories', icon: <FolderTree size={20} />, path: '/categories' },
  { label: 'Downloads', icon: <Download size={20} />, path: '/downloads' },
  { label: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
  { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
  { label: 'Reports', icon: <FileText size={20} />, path: '/reports' },
  { label: 'Activity Logs', icon: <Activity size={20} />, path: '/activity-logs' },
  { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  { label: 'Profile', icon: <UserCircle size={20} />, path: '/profile' },
];

export default function Sidebar({ isOpen, toggleSidebar, isMobile }: {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col',
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : (isOpen ? 'w-[260px]' : 'w-[72px]'),
          'shadow-lg shadow-gray-200/50'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 border-b border-gray-100 px-4',
          isOpen ? 'justify-between' : 'justify-center'
        )}>
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">CE</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">Admin Panel</h1>
                <p className="text-[10px] text-gray-400">Civil Engineer</p>
              </div>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className={cn(
                'p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors',
                !isOpen && 'absolute -right-3 top-5 bg-white border border-gray-200 shadow-sm'
              )}
            >
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
          {isMobile && isOpen && (
            <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700',
                !isOpen && 'justify-center'
              )}
              title={!isOpen ? item.label : undefined}
            >
              <span className={cn(
                'flex-shrink-0 transition-colors',
                'group-hover:text-blue-500'
              )}>
                {item.icon}
              </span>
              {isOpen && <span className="text-sm">{item.label}</span>}
              {isOpen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-has-[:is(.active)]:opacity-100 transition-opacity" />}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="border-t border-gray-100 p-3">
          {isOpen ? (
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all w-full group',
              !isOpen && 'justify-center'
            )}
            title={!isOpen ? 'Logout' : undefined}
          >
            <LogOut size={18} className="group-hover:scale-105 transition-transform" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}