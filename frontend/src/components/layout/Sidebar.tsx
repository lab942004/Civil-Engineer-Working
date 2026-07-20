import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Calculator,
  ArrowLeftRight,
  Package,
  BookOpen,
  FileSpreadsheet,
  Receipt,
  Building2,
  Image,
  FolderKanban,
  ClipboardCheck,
  NotebookPen,
  FileText,
  StickyNote,
  GraduationCap,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Menu,
  X,
} from 'lucide-react';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  children?: { title: string; path: string }[];
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  {
    title: 'Calculator',
    icon: <Calculator size={20} />,
    path: '/calculator',
    children: [
      { title: 'Concrete Mix', path: '/calculator/concrete-mix' },
      { title: 'Steel Weight', path: '/calculator/steel-weight' },
      { title: 'Slab Design', path: '/calculator/slab' },
      { title: 'Beam Design', path: '/calculator/beam' },
      { title: 'Column Design', path: '/calculator/column' },
      { title: 'Foundation', path: '/calculator/foundation' },
      { title: 'Earthwork', path: '/calculator/earthwork' },
      { title: 'All Calculators', path: '/calculator' },
    ],
  },
  { title: 'Unit Converter', icon: <ArrowLeftRight size={20} />, path: '/converter' },
  { title: 'Material Library', icon: <Package size={20} />, path: '/materials' },
  { title: 'IS Codes', icon: <BookOpen size={20} />, path: '/iscodes' },
  { title: 'BOQ Generator', icon: <FileSpreadsheet size={20} />, path: '/boq' },
  { title: 'Rate Analysis', icon: <Receipt size={20} />, path: '/rate-analysis' },
  { title: 'Estimation', icon: <Building2 size={20} />, path: '/estimation' },
  { title: 'Drawing Library', icon: <Image size={20} />, path: '/drawings' },
  { title: 'Projects', icon: <FolderKanban size={20} />, path: '/projects' },
  { title: 'Site Inspection', icon: <ClipboardCheck size={20} />, path: '/inspection' },
  { title: 'Site Diary', icon: <NotebookPen size={20} />, path: '/site-diary' },
  { title: 'Daily Reports', icon: <FileText size={20} />, path: '/reports' },
  { title: 'Notes', icon: <StickyNote size={20} />, path: '/notes' },
  { title: 'Learning Center', icon: <GraduationCap size={20} />, path: '/learning' },
  { title: 'Profile', icon: <UserCircle size={20} />, path: '/profile' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { user } = useAuthStore();

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const filteredItems = sidebarItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(221.2,83.2%,53.3%)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CE</span>
            </div>
            <span className="font-semibold text-sm">Civil Engineer</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1 rounded-lg hover:bg-[hsl(var(--accent))]"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-[hsl(var(--accent))]"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredItems.map((item) => {
          const active = isActive(item.path);
          const expanded = expandedItems.includes(item.title);

          return (
            <div key={item.title}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      active
                        ? 'bg-[hsl(221.2,83.2%,53.3%)]/10 text-[hsl(221.2,83.2%,53.3%)]'
                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                    )}
                  >
                    {item.icon}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        <motion.span
                          animate={{ rotate: expanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight size={14} />
                        </motion.span>
                      </>
                    )}
                  </button>
                  <AnimatePresence>
                    {expanded && !collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-8 space-y-1 mt-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={cn(
                                'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                                location.pathname === child.path
                                  ? 'bg-[hsl(221.2,83.2%,53.3%)]/10 text-[hsl(221.2,83.2%,53.3%)]'
                                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                              )}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-[hsl(221.2,83.2%,53.3%)]/10 text-[hsl(221.2,83.2%,53.3%)]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[hsl(var(--border))]">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive('/settings')
              ? 'bg-[hsl(221.2,83.2%,53.3%)]/10 text-[hsl(221.2,83.2%,53.3%)]'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
          )}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}