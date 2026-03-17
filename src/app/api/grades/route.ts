import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Fetch grades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const examId = searchParams.get('examId');

    let where: any = {};
    
    if (studentId) {
      where.studentId = studentId;
    }
    if (examId) {
      where.examId = examId;
    }

    const grades = await db.grade.findMany({
      where,
      include: {
        exam: {
          select: { title: true, subject: true, examDate: true }
        },
        student: {
          select: { fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update grades
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

    const { examId, grades } = await request.json();

    // Delete existing grades for this exam
    await db.grade.deleteMany({
      where: { examId }
    });

    // Create new grades
    const createdGrades = await Promise.all(
      grades.map((g: any) => 
        db.grade.create({
          data: {
            examId,
            studentId: g.studentId,
            score: parseFloat(g.score),
            remarks: g.remarks || null,
          },
          include: {
            student: {
              select: { fullName: true }
            }
          }
        })
      )
    );

    return NextResponse.json(createdGrades);
  } catch (error) {
    console.error('Error saving grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
