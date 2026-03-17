'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Grade {
  id: string;
  score: number;
  remarks: string | null;
  exam: { title: string; subject: string; examDate: string };
  student: { fullName: string; email: string };
}

const getGradeLetter = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A':
      return 'bg-green-100 text-green-700';
    case 'B':
      return 'bg-blue-100 text-blue-700';
    case 'C':
      return 'bg-yellow-100 text-yellow-700';
    case 'D':
      return 'bg-orange-100 text-orange-700';
    case 'F':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function AdminGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      const data = await res.json();
      setGrades(data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    setExporting(true);
    
    try {
      // Create CSV content
      const headers = ['Student Name', 'Email', 'Exam', 'Subject', 'Date', 'Score', 'Grade', 'Remarks'];
      const rows = grades.map(g => [
        g.student.fullName,
        g.student.email,
        g.exam.title,
        g.exam.subject,
        format(new Date(g.exam.examDate), 'MMM d, yyyy'),
        g.score.toString(),
        getGradeLetter(g.score),
        g.remarks || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grades_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Grades</h1>
            <p className="text-gray-500 mt-1">View and export all student grades</p>
          </div>
          <Button onClick={exportToCSV} disabled={exporting || grades.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-green-50">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Grade A</p>
              <p className="text-2xl font-bold text-green-700">
                {grades.filter(g => getGradeLetter(g.score) === 'A').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Grade B</p>
              <p className="text-2xl font-bold text-blue-700">
                {grades.filter(g => getGradeLetter(g.score) === 'B').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-600">Grade C</p>
              <p className="text-2xl font-bold text-yellow-700">
                {grades.filter(g => getGradeLetter(g.score) === 'C').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Grade D & F</p>
              <p className="text-2xl font-bold text-red-700">
                {grades.filter(g => ['D', 'F'].includes(getGradeLetter(g.score))).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-primary" />
              All Grades ({grades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : grades.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No grades recorded"
                description="Grades will appear here once teachers enter them"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{grade.student.fullName}</p>
                            <p className="text-sm text-gray-500">{grade.student.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{grade.exam.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{grade.exam.subject}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(grade.exam.examDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {grade.score.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getGradeColor(getGradeLetter(grade.score))}>
                            {getGradeLetter(grade.score)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 max-w-[150px] truncate">
                          {grade.remarks || '-'}
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
