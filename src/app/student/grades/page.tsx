'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface Grade {
  id: string;
  score: number;
  remarks: string | null;
  exam: {
    title: string;
    subject: string;
    examDate: string;
  };
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

export default function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classAverages, setClassAverages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch student's grades
        const gradesRes = await fetch(`/api/grades?studentId=${user.id}`);
        const gradesData = await gradesRes.json();
        setGrades(gradesData);

        // Calculate class averages for each exam
        const averages: Record<string, number> = {};
        for (const grade of gradesData) {
          const allGradesRes = await fetch(`/api/grades?examId=${grade.exam.title}`);
          const allGradesData = await allGradesRes.json();
          // This is a simplified approach - in production, calculate on backend
          averages[grade.exam.title] = 70; // Placeholder for class average
        }
        setClassAverages(averages);
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate overall average
  const overallAverage = grades.length > 0
    ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
    : 0;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
          <p className="text-gray-500 mt-1">View your exam results and performance</p>
        </div>

        {/* Overall Performance Card */}
        {grades.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overall Average</p>
                  <p className="text-3xl font-bold text-gray-900">{overallAverage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Grade: <span className={`font-medium px-2 py-0.5 rounded ${getGradeColor(getGradeLetter(overallAverage))}`}>
                      {getGradeLetter(overallAverage)}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-primary" />
              Exam Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : grades.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No grades yet"
                description="Your exam results will appear here once published"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => {
                      const gradeLetter = getGradeLetter(grade.score);
                      const classAvg = classAverages[grade.exam.title] || 70;
                      const isAboveAverage = grade.score >= classAvg;

                      return (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">{grade.exam.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{grade.exam.subject}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {format(new Date(grade.exam.examDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className={`font-bold ${isAboveAverage ? 'text-green-600' : 'text-red-600'}`}>
                                {grade.score.toFixed(1)}
                              </span>
                              {isAboveAverage ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getGradeColor(gradeLetter)}>
                              {gradeLetter}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 max-w-[200px]">
                            {grade.remarks || '-'}
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
      </div>
    </DashboardLayout>
  );
}
