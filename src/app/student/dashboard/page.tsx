'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatCardSkeleton, CardSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Bell, Calendar, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  creator: { fullName: string };
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  type: string;
}

interface Stats {
  attendancePercent: string;
  totalDays: number;
  presentCount: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [noticesRes, eventsRes, statsRes] = await Promise.all([
          fetch('/api/notices'),
          fetch('/api/events?upcoming=true&limit=5'),
          fetch(`/api/stats?type=student&studentId=${user.id}`)
        ]);

        const noticesData = await noticesRes.json();
        const eventsData = await eventsRes.json();
        const statsData = await statsRes.json();

        setNotices(noticesData);
        setEvents(eventsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const attendancePercent = stats ? parseFloat(stats.attendancePercent) : 0;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName}!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening today</p>
        </div>

        {/* Attendance Summary */}
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            title="Attendance Rate"
            value={`${stats?.attendancePercent || 0}%`}
            icon={TrendingUp}
            description={`${stats?.presentCount || 0} present out of ${stats?.totalDays || 0} days`}
            color={attendancePercent >= 75 ? 'green' : 'red'}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
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
                  description="Check back later for important announcements"
                />
              ) : (
                <div className="space-y-3">
                  {notices.slice(0, 3).map((notice) => (
                    <div key={notice.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{notice.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(notice.createdAt), 'MMM d, yyyy')} • {notice.creator.fullName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="w-5 h-5 text-primary" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : events.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming events"
                  description="Your schedule is clear for now"
                />
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => {
                    const daysLeft = differenceInDays(new Date(event.eventDate), new Date());
                    return (
                      <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs text-primary font-medium">
                            {format(new Date(event.eventDate), 'MMM')}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {format(new Date(event.eventDate), 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {event.type}
                            </Badge>
                            {daysLeft >= 0 && (
                              <span className="text-xs text-gray-500">
                                {daysLeft === 0 ? 'Today' : `In ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
