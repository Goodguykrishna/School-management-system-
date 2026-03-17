'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatCardSkeleton, CardSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, CalendarCheck, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  creator: { fullName: string };
}

interface Stats {
  totalStudents: number;
  examsThisWeek: number;
  todayAttendanceMarked: boolean;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticesRes, statsRes] = await Promise.all([
          fetch('/api/notices'),
          fetch('/api/stats')
        ]);

        const noticesData = await noticesRes.json();
        const statsData = await statsRes.json();

        setNotices(noticesData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-1">Here's your teaching overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <>
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
                description="Enrolled in your classes"
                color="blue"
              />
              <StatCard
                title="Exams This Week"
                value={stats?.examsThisWeek || 0}
                icon={FileText}
                description="Scheduled examinations"
                color="purple"
              />
              <StatCard
                title="Today's Attendance"
                value={stats?.todayAttendanceMarked ? 'Marked' : 'Not Marked'}
                icon={CalendarCheck}
                description={stats?.todayAttendanceMarked ? 'All attendance recorded' : 'Mark attendance now'}
                color={stats?.todayAttendanceMarked ? 'green' : 'red'}
              />
            </>
          )}
        </div>

        {/* Latest Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" />
              Latest Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : notices.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notices yet"
                description="Important announcements will appear here"
              />
            ) : (
              <div className="space-y-3">
                {notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900">{notice.title}</h4>
                      <span className="text-xs text-gray-400">
                        {format(new Date(notice.createdAt), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{notice.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Posted by {notice.creator.fullName}
                    </p>
                  </div>
                ))}
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
              <a href="/teacher/attendance" className="p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                <CalendarCheck className="w-6 h-6 text-primary mb-2" />
                <p className="font-medium text-gray-900">Mark Attendance</p>
                <p className="text-sm text-gray-500">Record today's attendance</p>
              </a>
              <a href="/teacher/exams" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <FileText className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Create Exam</p>
                <p className="text-sm text-gray-500">Schedule a new exam</p>
              </a>
              <a href="/teacher/grades" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Enter Grades</p>
                <p className="text-sm text-gray-500">Record student scores</p>
              </a>
              <a href="/teacher/events" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <AlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
                <p className="font-medium text-gray-900">Create Event</p>
                <p className="text-sm text-gray-500">Add school events</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
