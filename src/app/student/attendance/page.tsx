'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton, StatCardSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

interface Stats {
  attendancePercent: string;
  totalDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'present':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Present</Badge>;
    case 'absent':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Absent</Badge>;
    case 'late':
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Late</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'absent':
      return <XCircle className="w-5 h-5 text-red-600" />;
    case 'late':
      return <Clock className="w-5 h-5 text-yellow-600" />;
    default:
      return null;
  }
};

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [attendanceRes, statsRes] = await Promise.all([
          fetch(`/api/attendance?studentId=${user.id}`),
          fetch(`/api/stats?type=student&studentId=${user.id}`)
        ]);

        const attendanceData = await attendanceRes.json();
        const statsData = await statsRes.json();

        setAttendance(attendanceData);
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
          <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-500 mt-1">Track your attendance throughout the year</p>
        </div>

        {/* Attendance Summary Card */}
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div 
                  className={`p-8 flex-1 flex flex-col items-center justify-center text-white ${
                    attendancePercent >= 75 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                  }`}
                >
                  <span className="text-6xl font-bold">{stats?.attendancePercent || 0}%</span>
                  <span className="text-sm opacity-90 mt-2">Attendance Rate</span>
                </div>
                <div className="flex-1 p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700">{stats?.presentCount || 0}</p>
                      <p className="text-xs text-green-600">Present</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">{stats?.absentCount || 0}</p>
                      <p className="text-xs text-red-600">Absent</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-700">{stats?.lateCount || 0}</p>
                      <p className="text-xs text-yellow-600">Late</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Total: {stats?.totalDays || 0} days recorded
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : attendance.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No attendance records"
                description="Your attendance will appear here once marked"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {format(new Date(record.date), 'MMMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(record.date), 'EEEE')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            {getStatusBadge(record.status)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
