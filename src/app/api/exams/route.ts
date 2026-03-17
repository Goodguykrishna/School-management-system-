import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Fetch all exams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming');
    const past = searchParams.get('past');
    const studentId = searchParams.get('studentId');

    let where: any = {};
    
    if (upcoming === 'true') {
      where.examDate = { gte: new Date() };
    } else if (past === 'true') {
      where.examDate = { lt: new Date() };
    }

    const exams = await db.exam.findMany({
      where,
      include: {
        creator: {
          select: { fullName: true }
        },
        grades: studentId ? {
          where: { studentId }
        } : false
      },
      orderBy: { examDate: upcoming === 'true' ? 'asc' : 'desc' },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new exam
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

    const { title, subject, examDate, durationMinutes } = await request.json();

    if (!title || !subject || !examDate || !durationMinutes) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const exam = await db.exam.create({
      data: {
        title,
        subject,
        examDate: new Date(examDate),
        durationMinutes: parseInt(durationMinutes),
        createdBy: session.userId,
      },
      include: {
        creator: {
          select: { fullName: true }
        }
      }
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an exam
export async function PUT(request: NextRequest) {
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

    const { id, title, subject, examDate, durationMinutes } = await request.json();

    const exam = await db.exam.update({
      where: { id },
      data: {
        title,
        subject,
        examDate: new Date(examDate),
        durationMinutes: parseInt(durationMinutes),
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an exam
export async function DELETE(request: NextRequest) {
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

    const { id } = await request.json();

    await db.exam.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
