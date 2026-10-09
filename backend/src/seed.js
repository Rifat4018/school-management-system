// Fills the database with demo data.  Run:  npm run seed
// WARNING: this deletes everything in the database named in MONGO_URI first.
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');
const Result = require('./models/Result');
const Fee = require('./models/Fee');
const Notice = require('./models/Notice');
const { dayStart } = require('./utils/helpers');

const TEACHERS = [
  ['Farhana Akter', 'farhana@school.com', 'T-001', 'Mathematics'],
  ['Kamal Hossain', 'kamal@school.com', 'T-002', 'English'],
  ['Nusrat Jahan', 'nusrat@school.com', 'T-003', 'Science'],
];
const STUDENT_NAMES = [
  'Rahim Uddin', 'Karim Ahmed', 'Sadia Islam', 'Tania Sultana',
  'Arif Hasan', 'Mim Akter', 'Tanvir Rahman', 'Jannatul Ferdous',
  'Sakib Khan', 'Riya Das', 'Imran Hossain', 'Lamia Chowdhury',
];
const SUBJECTS = [['Mathematics', 'MAT'], ['English', 'ENG'], ['Science', 'SCI']];

async function seed() {
  await connectDB();
  const models = [User, Student, Teacher, Class, Subject, Attendance, Result, Fee, Notice];
  await Promise.all(models.map((M) => M.deleteMany({})));

  const admin = await User.create({ name: 'Admin User', email: 'admin@school.com', password: 'admin123', role: 'admin' });

  const teachers = [];
  for (const [name, email, employeeId, specialization] of TEACHERS) {
    const user = await User.create({ name, email, password: 'teacher123', role: 'teacher' });
    teachers.push(
      await Teacher.create({ user: user._id, employeeId, specialization, qualification: 'MSc', phone: '01700000000' })
    );
  }

  const classes = await Class.insertMany([
    { name: 'Class 8', section: 'A', classTeacher: teachers[0]._id },
    { name: 'Class 9', section: 'A', classTeacher: teachers[1]._id },
    { name: 'Class 10', section: 'A', classTeacher: teachers[2]._id },
  ]);

  const subjects = [];
  for (const cls of classes) {
    const grade = cls.name.split(' ')[1];
    for (let i = 0; i < SUBJECTS.length; i += 1) {
      const [name, prefix] = SUBJECTS[i];
      subjects.push(
        await Subject.create({ name, code: `${prefix}-${grade}`, class: cls._id, teacher: teachers[i]._id })
      );
    }
  }

  const students = [];
  for (let i = 0; i < STUDENT_NAMES.length; i += 1) {
    const cls = classes[i % classes.length];
    const user = await User.create({
      name: STUDENT_NAMES[i],
      email: `student${i + 1}@school.com`,
      password: 'student123',
      role: 'student',
    });
    students.push(
      await Student.create({
        user: user._id,
        class: cls._id,
        rollNo: Math.floor(i / classes.length) + 1,
        gender: i % 2 === 0 ? 'male' : 'female',
        dateOfBirth: new Date(Date.UTC(2011 + (i % 3), i % 12, 10)),
        guardianName: `Guardian of ${STUDENT_NAMES[i].split(' ')[0]}`,
        guardianPhone: `0171000000${i % 10}`,
        address: 'Dhanmondi, Dhaka',
      })
    );
  }

  // Attendance for the last 10 days, skipping the weekend (Friday and Saturday).
  const attendance = [];
  for (let d = 0; d < 10; d += 1) {
    const date = dayStart(new Date(Date.now() - d * 24 * 60 * 60 * 1000));
    if ([5, 6].includes(date.getUTCDay())) continue;
    students.forEach((s, i) => {
      const n = i + d;
      const status = n % 7 === 0 ? 'absent' : n % 11 === 0 ? 'late' : 'present';
      attendance.push({ student: s._id, class: s.class, date, status, markedBy: admin._id });
    });
  }
  await Attendance.insertMany(attendance);

  // Midterm marks for every student in every subject of their class.
  const results = [];
  students.forEach((s, i) => {
    subjects
      .filter((sub) => String(sub.class) === String(s.class))
      .forEach((sub, j) => {
        results.push({
          student: s._id,
          subject: sub._id,
          exam: 'Midterm',
          marks: 40 + ((i * 7 + j * 13) % 56),
          totalMarks: 100,
          enteredBy: admin._id,
        });
      });
  });
  await Result.insertMany(results);

  const now = new Date();
  const fees = [];
  students.forEach((s, i) => {
    fees.push({ student: s._id, title: 'Tuition Fee - Last month', amount: 2500, status: 'paid', paidAt: now });
    fees.push({
      student: s._id,
      title: 'Tuition Fee - This month',
      amount: 2500,
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      status: i % 3 === 0 ? 'paid' : 'unpaid',
      paidAt: i % 3 === 0 ? now : undefined,
    });
  });
  await Fee.insertMany(fees);

  await Notice.insertMany([
    { title: 'Midterm results published', body: 'Students can now see their Midterm report card.', audience: 'all', createdBy: admin._id },
    { title: 'Staff meeting on Sunday', body: 'All teachers are requested to attend at 2 PM.', audience: 'teacher', createdBy: admin._id },
    { title: 'Fee deadline', body: 'Please pay this month\'s tuition fee before the due date.', audience: 'student', createdBy: admin._id },
  ]);

  console.log('\nDatabase seeded. Demo logins:');
  console.log('  Admin    admin@school.com     / admin123');
  console.log('  Teacher  farhana@school.com   / teacher123');
  console.log('  Student  student1@school.com  / student123\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
