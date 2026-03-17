import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const admin = await prisma.profile.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      password: 'admin123',
      fullName: 'John Admin',
      role: 'admin',
    },
  });
  console.log('Created admin:', admin.email);

  // Create teacher
  const teacher = await prisma.profile.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      email: 'teacher@school.com',
      password: 'teacher123',
      fullName: 'Sarah Johnson',
      role: 'teacher',
    },
  });
  console.log('Created teacher:', teacher.email);

  // Create students
  const students = await Promise.all([
    prisma.profile.upsert({
      where: { email: 'student@school.com' },
      update: {},
      create: {
        email: 'student@school.com',
        password: 'student123',
        fullName: 'Alice Smith',
        role: 'student',
      },
    }),
    prisma.profile.upsert({
      where: { email: 'bob@school.com' },
      update: {},
      create: {
        email: 'bob@school.com',
        password: 'student123',
        fullName: 'Bob Wilson',
        role: 'student',
      },
    }),
    prisma.profile.upsert({
      where: { email: 'carol@school.com' },
      update: {},
      create: {
        email: 'carol@school.com',
        password: 'student123',
        fullName: 'Carol Davis',
        role: 'student',
      },
    }),
    prisma.profile.upsert({
      where: { email: 'david@school.com' },
      update: {},
      create: {
        email: 'david@school.com',
        password: 'student123',
        fullName: 'David Brown',
        role: 'student',
      },
    }),
    prisma.profile.upsert({
      where: { email: 'emma@school.com' },
      update: {},
      create: {
        email: 'emma@school.com',
        password: 'student123',
        fullName: 'Emma Taylor',
        role: 'student',
      },
    }),
  ]);
  console.log('Created students:', students.length);

  // Create attendance records for the past 7 days
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (const student of students) {
      const random = Math.random();
      let status = 'present';
      if (random > 0.9) status = 'absent';
      else if (random > 0.8) status = 'late';

      await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: student.id,
            date: date,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          date: date,
          status: status,
          markedBy: teacher.id,
        },
      });
    }
  }
  console.log('Created attendance records for past 7 days');

  // Create exams
  const mathExam = await prisma.exam.upsert({
    where: { id: 'exam-math-midterm' },
    update: {},
    create: {
      id: 'exam-math-midterm',
      title: 'Mathematics Midterm',
      subject: 'Mathematics',
      examDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      durationMinutes: 90,
      createdBy: teacher.id,
    },
  });

  const scienceExam = await prisma.exam.upsert({
    where: { id: 'exam-science-final' },
    update: {},
    create: {
      id: 'exam-science-final',
      title: 'Science Final',
      subject: 'Science',
      examDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      durationMinutes: 120,
      createdBy: teacher.id,
    },
  });

  const historyExam = await prisma.exam.upsert({
    where: { id: 'exam-history-quiz' },
    update: {},
    create: {
      id: 'exam-history-quiz',
      title: 'History Quiz',
      subject: 'History',
      examDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      durationMinutes: 45,
      createdBy: teacher.id,
    },
  });
  console.log('Created exams:', 3);

  // Create grades for past exam
  const gradeScores = [85, 92, 78, 88, 95];
  for (let i = 0; i < students.length; i++) {
    await prisma.grade.upsert({
      where: {
        examId_studentId: {
          examId: historyExam.id,
          studentId: students[i].id,
        },
      },
      update: {},
      create: {
        examId: historyExam.id,
        studentId: students[i].id,
        score: gradeScores[i],
        remarks: gradeScores[i] >= 90 ? 'Excellent work!' : gradeScores[i] >= 80 ? 'Good job!' : 'Keep practicing!',
      },
    });
  }
  console.log('Created grades for past exam');

  // Create events
  await prisma.event.upsert({
    where: { id: 'event-sports-day' },
    update: {},
    create: {
      id: 'event-sports-day',
      title: 'Annual Sports Day',
      description: 'Annual sports competition for all students. Events include running, jumping, and team sports.',
      eventDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
      type: 'activity',
      createdBy: admin.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event-holiday' },
    update: {},
    create: {
      id: 'event-holiday',
      title: 'Winter Break',
      description: 'School will be closed for winter holidays.',
      eventDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
      type: 'holiday',
      createdBy: admin.id,
    },
  });
  console.log('Created events');

  // Create notices
  await prisma.notice.upsert({
    where: { id: 'notice-welcome' },
    update: {},
    create: {
      id: 'notice-welcome',
      title: 'Welcome to EduPortal',
      message: 'Welcome to the new school management system! Please check back regularly for updates and announcements.',
      createdBy: admin.id,
    },
  });

  await prisma.notice.upsert({
    where: { id: 'notice-library' },
    update: {},
    create: {
      id: 'notice-library',
      title: 'Library Hours Extended',
      message: 'The school library will now remain open until 6 PM on weekdays. Students are encouraged to utilize this extended time for studying and reading.',
      createdBy: teacher.id,
    },
  });
  console.log('Created notices');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
