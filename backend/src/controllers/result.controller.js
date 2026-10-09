const Result = require('../models/Result');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { gradeOf } = require('../utils/helpers');
const { resolveStudentId } = require('../utils/scope');

const { EXAMS } = Result;

// GET /api/results?subject=<id>&exam=Midterm  -> marks sheet: every student of the subject's class
exports.getSheet = asyncHandler(async (req, res) => {
  const { subject: subjectId, exam } = req.query;
  if (typeof subjectId !== 'string' || !EXAMS.includes(exam)) {
    throw new ApiError(400, `subject and exam (${EXAMS.join(', ')}) are required`);
  }
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');

  const students = await Student.find({ class: subject.class }).populate('user', 'name').sort('rollNo');
  const results = await Result.find({ subject: subject._id, exam, student: { $in: students.map((s) => s._id) } });
  const byStudent = new Map(results.map((r) => [String(r.student), r]));

  res.json({
    success: true,
    totalMarks: results.length ? results[0].totalMarks : 100,
    data: students.map((s) => {
      const r = byStudent.get(String(s._id));
      return { student: s._id, rollNo: s.rollNo, name: s.user ? s.user.name : 'Unknown', marks: r ? r.marks : null };
    }),
  });
});

// POST /api/results  { subject, exam, totalMarks, records: [{ student, marks }] }
exports.saveSheet = asyncHandler(async (req, res) => {
  const { subject: subjectId, exam, records } = req.body;
  const totalMarks = Number(req.body.totalMarks) || 100;

  if (!EXAMS.includes(exam) || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, 'subject, exam and records are required');
  }
  if (totalMarks < 1 || totalMarks > 1000) throw new ApiError(400, 'totalMarks must be between 1 and 1000');

  const subject = await Subject.findById(String(subjectId));
  if (!subject) throw new ApiError(404, 'Subject not found');

  for (const r of records) {
    const marks = Number(r.marks);
    if (r.marks === null || r.marks === '' || !Number.isFinite(marks) || marks < 0 || marks > totalMarks) {
      throw new ApiError(400, `Marks must be a number between 0 and ${totalMarks}`);
    }
  }
  const ids = records.map((r) => String(r.student));
  const inClass = await Student.countDocuments({ _id: { $in: ids }, class: subject.class });
  if (inClass !== ids.length) throw new ApiError(400, "Some students do not belong to this subject's class");

  await Result.bulkWrite(
    records.map((r) => ({
      updateOne: {
        filter: { student: String(r.student), subject: subject._id, exam },
        update: { $set: { marks: Number(r.marks), totalMarks, enteredBy: req.user._id } },
        upsert: true,
      },
    }))
  );
  res.json({ success: true, message: `Marks saved for ${records.length} students` });
});

// GET /api/results/student/:id  -> report card grouped by exam (students use /student/me)
exports.getReport = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req, req.params.id);
  const [student, results] = await Promise.all([
    Student.findById(studentId).populate('user', 'name').populate('class', 'name section'),
    Result.find({ student: studentId }).populate('subject', 'name code'),
  ]);
  if (!student) throw new ApiError(404, 'Student not found');

  const grouped = {};
  for (const r of results) {
    const row = {
      subject: r.subject ? r.subject.name : 'Deleted subject',
      code: r.subject ? r.subject.code : '',
      marks: r.marks,
      totalMarks: r.totalMarks,
      ...gradeOf((r.marks / r.totalMarks) * 100),
    };
    (grouped[r.exam] = grouped[r.exam] || []).push(row);
  }

  const exams = EXAMS.filter((exam) => grouped[exam]).map((exam) => {
    const rows = grouped[exam].sort((a, b) => a.subject.localeCompare(b.subject));
    const obtained = rows.reduce((sum, x) => sum + x.marks, 0);
    const total = rows.reduce((sum, x) => sum + x.totalMarks, 0);
    const failed = rows.some((x) => x.grade === 'F'); // failing one subject fails the exam
    const gpa = failed ? 0 : rows.reduce((sum, x) => sum + x.point, 0) / rows.length;
    return {
      exam,
      rows,
      obtained,
      total,
      percentage: Number(((obtained / total) * 100).toFixed(1)),
      gpa: Number(gpa.toFixed(2)),
      status: failed ? 'Failed' : 'Passed',
    };
  });

  res.json({
    success: true,
    data: {
      student: {
        name: student.user ? student.user.name : 'Unknown',
        rollNo: student.rollNo,
        class: student.class ? `${student.class.name} - ${student.class.section}` : '',
      },
      exams,
    },
  });
});
