import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn, getInitials } from '@/lib/utils';
import {
  Search,
  Moon,
  Sun,
  Bell,
  LogOut,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react';

export default function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/80] backdrop-blur-lg">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
            <input
              type="text"
              placeholder="Search modules, calculators, IS codes..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--input))] bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg"
              >
                <p className="text-xs text-[hsl(var(--muted-foreground))] p-2">Type to search...</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[hsl(221.2,83.2%,53.3%)] flex items-center justify-center text-white text-xs font-medium">
                {user?.name ? getInitials(user.name) : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-tight">{user?.name || 'User'}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-tight">{user?.role?.replace('_', ' ')}</p>
              </div>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-56 p-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg z-50"
                >
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[hsl(var(--accent))]"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[hsl(var(--accent))]"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <Link
                    to="/help"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[hsl(var(--accent))]"
                    onClick={() => setProfileOpen(false)}
                  >
                    <HelpCircle size={16} />
                    Help & Support
                  </Link>
                  <hr className="my-1 border-[hsl(var(--border))]" />
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}