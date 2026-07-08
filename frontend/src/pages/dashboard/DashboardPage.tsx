import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { useList } from '@/hooks/useApi';
import {
  Calculator,
  Package,
  BookOpen,
  FileSpreadsheet,
  Building2,
  ClipboardCheck,
  TrendingUp,
  Users,
  Clock,
  Star,
  ArrowRight,
  Activity,
  HardHat,
  Ruler,
  Weight,
  Layers,
  Compass,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardStats, Project, ActivityLog } from '@/types';

const quickTools = [
  { name: 'Concrete Mix', icon: <Layers size={24} />, path: '/calculator/concrete-mix', color: 'from-blue-500 to-blue-600' },
  { name: 'Steel Weight', icon: <Weight size={24} />, path: '/calculator/steel-weight', color: 'from-orange-500 to-orange-600' },
  { name: 'Slab Design', icon: <Ruler size={24} />, path: '/calculator/slab', color: 'from-green-500 to-green-600' },
  { name: 'Earthwork', icon: <HardHat size={24} />, path: '/calculator/earthwork', color: 'from-yellow-500 to-yellow-600' },
  { name: 'Unit Converter', icon: <Compass size={24} />, path: '/converter', color: 'from-purple-500 to-purple-600' },
  { name: 'BOQ Generator', icon: <FileSpreadsheet size={24} />, path: '/boq', color: 'from-red-500 to-red-600' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: projectsResponse } = useList<Project>('/projects', ['projects']);

  // BUG FIX: these used to be fetched once via a bare `useEffect(() => {...}, [])`
  // + local `useState`, completely outside react-query. That means the
  // numbers here went stale the moment you saved a calculation, created a
  // BOQ, or did anything elsewhere in the app — only a full page reload
  // would refresh them. Now they're react-query queries under
  // ['dashboard-stats'] / ['activities'], the same keys that CalculatorPage
  // and BOQPage invalidate after a save, so this view updates the moment
  // something relevant happens instead of silently going stale.
  const { data: statsResponse, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });
  const { data: activitiesResponse, isLoading: isLoadingActivities } = useList<ActivityLog>('/activities', ['activities']);

  const stats = statsResponse?.data || null;
  const recentActivities = activitiesResponse?.data || [];

  const projects = projectsResponse?.data || [];
  const totalProjects = stats?.totalProjects || projects.length;
  const activeProjects = stats?.activeProjects || projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const totalCalculations = stats?.totalCalculations || 0;
  const savedMaterials = stats?.savedMaterials || 0;
  const recentList = recentActivities.length > 0 ? recentActivities : stats?.recentActivities || [];

  // BUG FIX: this was a hardcoded `75%` with no logic behind it at all —
  // every user saw the same number regardless of their actual profile.
  // Now it's a real ratio of filled-in fields.
  const profileFields = [user?.name, user?.email, user?.phone, user?.bio, user?.avatar];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name?.split(' ')[0] || 'Engineer'}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/projects/new">
            <Button>
              <Building2 className="mr-2" size={16} />
              New Project
            </Button>
          </Link>
          <Link to="/calculator">
            <Button variant="outline">
              <Calculator className="mr-2" size={16} />
              Quick Calculate
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-[hsl(var(--secondary))] rounded" />
                    <div className="h-6 w-16 bg-[hsl(var(--secondary))] rounded" />
                    <div className="h-3 w-24 bg-[hsl(var(--secondary))] rounded" />
                  </div>
                  <div className="h-12 w-12 bg-[hsl(var(--secondary))] rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          [
            { label: 'Total Projects', value: String(totalProjects), icon: <Building2 size={20} />, change: `${activeProjects} active` },
            { label: 'Calculations', value: String(totalCalculations), icon: <Calculator size={20} />, change: 'Saved in history' },
            { label: 'Saved Materials', value: String(savedMaterials), icon: <Package size={20} />, change: 'In library' },
            { label: 'IS Codes', value: String(stats?.latestISCodes?.length || 0), icon: <BookOpen size={20} />, change: 'Available' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[hsl(221.2,83.2%,53.3%)]/10 text-[hsl(221.2,83.2%,53.3%)]">
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Access Tools */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Access Tools</h2>
          <Link to="/calculator" className="text-sm text-[hsl(221.2,83.2%,53.3%)] hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickTools.map((tool, i) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={tool.path}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-4 text-center space-y-2">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tool.color} text-white group-hover:scale-110 transition-transform`}>
                      {tool.icon}
                    </div>
                    <p className="text-sm font-medium">{tool.name}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={18} />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : recentList.length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No recent activities yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentList.slice(0, 5).map((activity: any, i: number) => (
                  <div key={activity.id || i} className="flex items-start gap-3 pb-3 border-b border-[hsl(var(--border))] last:border-0">
                    <div className="p-2 rounded-lg bg-[hsl(var(--secondary))]">
                      {activity.action?.toLowerCase?.()?.includes('calculat') ? <Calculator size={16} /> :
                       activity.action?.toLowerCase?.()?.includes('upload') ? <Ruler size={16} /> :
                       activity.action?.toLowerCase?.()?.includes('boq') || activity.action?.toLowerCase?.()?.includes('generat') ? <FileSpreadsheet size={16} /> :
                       activity.action?.toLowerCase?.()?.includes('material') ? <Package size={16} /> :
                       activity.action?.toLowerCase?.()?.includes('inspect') ? <ClipboardCheck size={16} /> :
                       <Activity size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.action || activity.entity}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Star size={16} />
                Favorite Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.favoriteTools?.length ? (
                  stats.favoriteTools.map((tool: any) => (
                    <div key={typeof tool === 'string' ? tool : tool.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      {typeof tool === 'string' ? tool : tool.name}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] py-2">
                    No favorites yet. Star a calculator to pin it here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock size={16} />
                Recent IS Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.latestISCodes?.length ? (
                  stats.latestISCodes.map((code: any) => (
                    <div key={code.id || code.code} className="text-sm p-2 rounded-lg hover:bg-[hsl(var(--accent))] cursor-pointer">
                      {code.code} - {code.title}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] py-2">
                    No IS codes viewed yet.{' '}
                    <Link to="/is-codes" className="text-[hsl(221.2,83.2%,53.3%)] hover:underline">
                      Browse the library
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile Completion</p>
                  <div className="mt-2 h-2 rounded-full bg-[hsl(var(--secondary))]">
                    <div
                      className="h-full rounded-full bg-[hsl(221.2,83.2%,53.3%)] transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
                <span className="text-lg font-bold">{profileCompletion}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}