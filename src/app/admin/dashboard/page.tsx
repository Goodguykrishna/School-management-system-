'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import { StatCardSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, CalendarCheck, FileText, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  todayAttendancePercent: string;
  examsThisWeek: number;
  attendanceTrends: Array<{
    date: string;
    present: number;
    absent: number;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const attendancePercent = stats ? parseFloat(stats.todayAttendancePercent) : 0;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.fullName}! Here's your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={Users}
                description="Enrolled students"
                color="blue"
              />
              <StatCard
                title="Total Teachers"
                value={stats?.totalTeachers || 0}
                icon={UserCog}
                description="Active teachers"
                color="purple"
              />
              <StatCard
                title="Today's Attendance"
                value={`${stats?.todayAttendancePercent || 0}%`}
                icon={CalendarCheck}
                description="Present today"
                color={attendancePercent >= 75 ? 'green' : 'red'}
              />
              <StatCard
                title="Exams This Week"
                value={stats?.examsThisWeek || 0}
                icon={FileText}
                description="Scheduled exams"
                color="yellow"
              />
            </>
          )}
        </div>

        {/* Attendance Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Attendance Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.attendanceTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="present" 
                      name="Present" 
                      fill="#22c55e" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="absent" 
                      name="Absent" 
                      fill="#ef4444" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a href="/admin/students" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Manage Students</p>
                <p className="text-sm text-gray-500">Add or remove students</p>
              </a>
              <a href="/admin/teachers" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <UserCog className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Manage Teachers</p>
                <p className="text-sm text-gray-500">Add or remove teachers</p>
              </a>
              <a href="/admin/attendance" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <CalendarCheck className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">View Attendance</p>
                <p className="text-sm text-gray-500">Monitor all records</p>
              </a>
              <a href="/admin/events" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <FileText className="w-6 h-6 text-yellow-600 mb-2" />
                <p className="font-medium text-gray-900">Events & Notices</p>
                <p className="text-sm text-gray-500">Manage announcements</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
