import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const studentId = searchParams.get('studentId');

    // Student stats
    if (type === 'student' && studentId) {
      const attendance = await db.attendance.findMany({
        where: { studentId }
      });

      const presentCount = attendance.filter(a => a.status === 'present').length;
      const totalDays = attendance.length;
      const attendancePercent = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;

      return NextResponse.json({
        attendancePercent: attendancePercent.toFixed(1),
        totalDays,
        presentCount,
        absentCount: attendance.filter(a => a.status === 'absent').length,
        lateCount: attendance.filter(a => a.status === 'late').length,
      });
    }

    // Admin/Teacher stats
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    // Common stats
    const totalStudents = await db.profile.count({
      where: { role: 'student' }
    });

    const totalTeachers = await db.profile.count({
      where: { role: 'teacher' }
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await db.attendance.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const todayPresent = await db.attendance.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        status: 'present'
      }
    });

    const todayAttendancePercent = totalStudents > 0 ? (todayPresent / totalStudents) * 100 : 0;

    // Exams this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const examsThisWeek = await db.exam.count({
      where: {
        examDate: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    });

    // Attendance trends (last 7 days)
    const attendanceTrends = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayPresent = await db.attendance.count({
        where: {
          date: {
            gte: day,
            lt: nextDay
          },
          status: 'present'
        }
      });

      const dayTotal = await db.attendance.count({
        where: {
          date: {
            gte: day,
            lt: nextDay
          }
        }
      });

      attendanceTrends.push({
        date: day.toLocaleDateString('en-US', { weekday: 'short' }),
        present: dayPresent,
        absent: dayTotal - dayPresent,
      });
    }

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      todayAttendanceMarked: todayAttendance > 0,
      todayAttendancePercent: todayAttendancePercent.toFixed(1),
      examsThisWeek,
      attendanceTrends,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
