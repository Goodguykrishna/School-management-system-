'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CalendarCheck, CheckCircle, XCircle, Clock, Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Student {
  id: string;
  fullName: string;
  email: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: string;
}

export default function TeacherAttendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all students
        const studentsRes = await fetch('/api/profiles?role=student');
        const studentsData = await studentsRes.json();
        setStudents(studentsData);

        // Check if today's attendance is already marked
        const today = format(new Date(), 'yyyy-MM-dd');
        const attendanceRes = await fetch(`/api/attendance?date=${today}`);
        const attendanceData = await attendanceRes.json();

        if (attendanceData.length > 0) {
          setAlreadyMarked(true);
          setExistingAttendance(attendanceData);
          
          // Pre-fill the attendance records
          const records: Record<string, string> = {};
          attendanceData.forEach((a: any) => {
            records[a.studentId] = a.status;
          });
          setAttendance(records);
        } else {
          // Initialize all students as present by default
          const initialAttendance: Record<string, string> = {};
          studentsData.forEach((s: Student) => {
            initialAttendance[s.id] = 'present';
          });
          setAttendance(initialAttendance);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendance[s.id] || 'present'
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          date: format(new Date(), 'yyyy-MM-dd')
        })
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Attendance marked successfully!',
          className: 'bg-green-50 border-green-200 text-green-800',
        });
        setAlreadyMarked(true);
        setIsEditMode(false);
      } else {
        throw new Error('Failed to save attendance');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save attendance. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="text-gray-500 mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {alreadyMarked && !isEditMode && (
            <Button onClick={() => setIsEditMode(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Attendance
            </Button>
          )}
        </div>

        {alreadyMarked && !isEditMode && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Today's attendance has been marked</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Student Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : students.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No students found"
                description="Add students to mark their attendance"
              />
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-500">
                  <div className="col-span-5">Student Name</div>
                  <div className="col-span-2 text-center">Present</div>
                  <div className="col-span-2 text-center">Absent</div>
                  <div className="col-span-2 text-center">Late</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Students List */}
                <div className="space-y-2">
                  {students.map((student) => (
                    <div 
                      key={student.id} 
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 bg-white border rounded-lg items-center"
                    >
                      <div className="sm:col-span-5">
                        <p className="font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <div className="sm:col-span-6">
                        <RadioGroup
                          value={attendance[student.id] || 'present'}
                          onValueChange={(value) => handleAttendanceChange(student.id, value)}
                          disabled={alreadyMarked && !isEditMode}
                          className="flex justify-start sm:justify-center gap-4 sm:gap-8"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id={`${student.id}-present`} />
                            <Label htmlFor={`${student.id}-present`} className="flex items-center gap-1 cursor-pointer">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="hidden sm:inline">Present</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                            <Label htmlFor={`${student.id}-absent`} className="flex items-center gap-1 cursor-pointer">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="hidden sm:inline">Absent</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="late" id={`${student.id}-late`} />
                            <Label htmlFor={`${student.id}-late`} className="flex items-center gap-1 cursor-pointer">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <span className="hidden sm:inline">Late</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        {getStatusIcon(attendance[student.id] || 'present')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                {(!alreadyMarked || isEditMode) && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSubmit} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Attendance
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
