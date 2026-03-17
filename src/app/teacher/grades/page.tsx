'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, Loader2, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Exam {
  id: string;
  title: string;
  subject: string;
  examDate: string;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
}

interface GradeEntry {
  studentId: string;
  score: string;
  remarks: string;
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

export default function TeacherGrades() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, studentsRes] = await Promise.all([
          fetch('/api/exams'),
          fetch('/api/profiles?role=student')
        ]);

        const examsData = await examsRes.json();
        const studentsData = await studentsRes.json();

        setExams(examsData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedExam) return;
      
      setLoadingGrades(true);
      try {
        const res = await fetch(`/api/grades?examId=${selectedExam}`);
        const data = await res.json();

        const gradeEntries: Record<string, GradeEntry> = {};
        data.forEach((g: any) => {
          gradeEntries[g.studentId] = {
            studentId: g.studentId,
            score: g.score.toString(),
            remarks: g.remarks || ''
          };
        });

        // Initialize missing students with empty scores
        students.forEach(s => {
          if (!gradeEntries[s.id]) {
            gradeEntries[s.id] = {
              studentId: s.id,
              score: '',
              remarks: ''
            };
          }
        });

        setGrades(gradeEntries);
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [selectedExam, students]);

  const handleScoreChange = (studentId: string, score: string) => {
    // Validate score is between 0-100
    const numScore = parseFloat(score);
    if (score === '' || (numScore >= 0 && numScore <= 100)) {
      setGrades(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          score
        }
      }));
    }
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedExam) return;

    setSaving(true);
    try {
      // Filter out empty scores and format data
      const gradeRecords = Object.values(grades)
        .filter(g => g.score !== '')
        .map(g => ({
          studentId: g.studentId,
          score: parseFloat(g.score),
          remarks: g.remarks
        }));

      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          grades: gradeRecords
        })
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Grades saved successfully!',
          className: 'bg-green-50 border-green-200 text-green-800',
        });
      } else {
        throw new Error('Failed to save grades');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save grades. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedExamData = exams.find(e => e.id === selectedExam);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enter Grades</h1>
          <p className="text-gray-500 mt-1">Record student scores for examinations</p>
        </div>

        {/* Exam Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Exam</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Select an exam to enter grades" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title} - {exam.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Grades Entry */}
        {selectedExam && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-primary" />
                {selectedExamData?.title} - {selectedExamData?.subject}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGrades ? (
                <TableSkeleton rows={10} />
              ) : students.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No students found"
                  description="Add students to enter their grades"
                />
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-500">
                    <div className="col-span-4">Student Name</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-1 text-center">Grade</div>
                    <div className="col-span-4">Remarks</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Students List */}
                  <div className="space-y-2">
                    {students.map((student) => {
                      const score = grades[student.id]?.score || '';
                      const numericScore = parseFloat(score);
                      const grade = !isNaN(numericScore) ? getGradeLetter(numericScore) : '';

                      return (
                        <div 
                          key={student.id} 
                          className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 bg-white border rounded-lg items-center"
                        >
                          <div className="sm:col-span-4">
                            <p className="font-medium text-gray-900">{student.fullName}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0-100"
                              value={score}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              className="text-center"
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-center">
                            {grade && (
                              <Badge className={getGradeColor(grade)}>
                                {grade}
                              </Badge>
                            )}
                          </div>
                          <div className="sm:col-span-4">
                            <Input
                              placeholder="Optional remarks..."
                              value={grades[student.id]?.remarks || ''}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-center">
                            {score && parseFloat(score) >= 0 && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save All Grades
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
