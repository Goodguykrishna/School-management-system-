import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const markedToday = searchParams.get('markedToday');

    // Check if attendance is marked today
    if (markedToday === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const count = await db.attendance.count({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });
      
      return NextResponse.json({ marked: count > 0, count });
    }

    let where: any = {};
    
    if (studentId) {
      where.studentId = studentId;
    }
    if (date) {
      const searchDate = new Date(date);
      where.date = {
        gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        lt: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: { fullName: true, email: true }
        },
        marker: {
          select: { fullName: true }
        }
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Mark attendance
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    
    if (session.role !== 'teacher' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { records, date } = await request.json();
    const attendanceDate = new Date(date);

    // Delete existing attendance for this date
    await db.attendance.deleteMany({
      where: {
        date: {
          gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
          lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
        }
      }
    });

    // Create new attendance records
    const createdRecords = await Promise.all(
      records.map((r: any) => 
        db.attendance.create({
          data: {
            studentId: r.studentId,
            date: new Date(date),
            status: r.status,
            markedBy: session.userId,
          },
          include: {
            student: {
              select: { fullName: true }
            }
          }
        })
      )
    );

    return NextResponse.json(createdRecords);
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
