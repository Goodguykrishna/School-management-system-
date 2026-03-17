'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Clock, Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Exam {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  durationMinutes: number;
  creator: { fullName: string };
}

export default function StudentExams() {
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [pastExams, setPastExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [upcomingRes, pastRes] = await Promise.all([
          fetch('/api/exams?upcoming=true'),
          fetch('/api/exams?past=true')
        ]);

        const upcomingData = await upcomingRes.json();
        const pastData = await pastRes.json();

        setUpcomingExams(upcomingData);
        setPastExams(pastData);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-500 mt-1">View your upcoming and past examinations</p>
        </div>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={3} />
            ) : upcomingExams.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming exams"
                description="You have no scheduled exams at the moment"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingExams.map((exam) => {
                      const daysLeft = differenceInDays(new Date(exam.examDate), new Date());
                      return (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{exam.subject}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(exam.examDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className={daysLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                              {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {exam.durationMinutes} min
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-gray-500" />
              Past Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : pastExams.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No past exams"
                description="Your exam history will appear here"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastExams.map((exam) => (
                      <TableRow key={exam.id} className="bg-gray-50/50">
                        <TableCell className="font-medium text-gray-600">{exam.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-gray-600">{exam.subject}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(exam.examDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.durationMinutes} min
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
