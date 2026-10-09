// Every API endpoint and who may call it, in one place.
// (In a bigger project each resource would get its own file, e.g. routes/student.routes.js.)
const router = require('express').Router();
const rateLimit = require('express-rate-limit');

const { protect, authorize } = require('../middleware/auth');
const auth = require('../controllers/auth.controller');
const dashboard = require('../controllers/dashboard.controller');
const student = require('../controllers/student.controller');
const teacher = require('../controllers/teacher.controller');
const { classes, subjects, fees, notices, payFee } = require('../controllers/academic.controller');
const attendance = require('../controllers/attendance.controller');
const result = require('../controllers/result.controller');

const ADMIN = authorize('admin');
const STAFF = authorize('admin', 'teacher');

// Slow down password guessing: max 20 login attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// ---------- Auth ----------
router.post('/auth/login', loginLimiter, auth.login);

router.use(protect); // every route below this line needs a valid JWT

router.get('/auth/me', auth.me);
router.put('/auth/password', auth.changePassword);

// ---------- Dashboard (content depends on the role) ----------
router.get('/dashboard', dashboard.getDashboard);

// ---------- Students ----------
router.get('/students/me', authorize('student'), student.getMe); // must come before /students/:id
router.route('/students').get(STAFF, student.getAll).post(ADMIN, student.create);
router.route('/students/:id').get(STAFF, student.getOne).put(ADMIN, student.update).delete(ADMIN, student.remove);

// ---------- Teachers ----------
router.route('/teachers').get(STAFF, teacher.getAll).post(ADMIN, teacher.create);
router.route('/teachers/:id').get(STAFF, teacher.getOne).put(ADMIN, teacher.update).delete(ADMIN, teacher.remove);

// ---------- Classes ----------
router.route('/classes').get(STAFF, classes.getAll).post(ADMIN, classes.create);
router.route('/classes/:id').get(STAFF, classes.getOne).put(ADMIN, classes.update).delete(ADMIN, classes.remove);

// ---------- Subjects ----------
router.route('/subjects').get(STAFF, subjects.getAll).post(ADMIN, subjects.create);
router.route('/subjects/:id').get(STAFF, subjects.getOne).put(ADMIN, subjects.update).delete(ADMIN, subjects.remove);

// ---------- Attendance ----------
router.route('/attendance').get(STAFF, attendance.getRegister).post(STAFF, attendance.mark);
router.get('/attendance/student/:id', attendance.getForStudent); // students are forced to their own id

// ---------- Results ----------
router.route('/results').get(STAFF, result.getSheet).post(STAFF, result.saveSheet);
router.get('/results/student/:id', result.getReport);

// ---------- Fees (students see only their own) ----------
router.route('/fees').get(authorize('admin', 'student'), fees.getAll).post(ADMIN, fees.create);
router.patch('/fees/:id/pay', ADMIN, payFee);
router.route('/fees/:id').get(authorize('admin', 'student'), fees.getOne).put(ADMIN, fees.update).delete(ADMIN, fees.remove);

// ---------- Notices ----------
router.route('/notices').get(notices.getAll).post(STAFF, notices.create);
router.route('/notices/:id').get(notices.getOne).put(ADMIN, notices.update).delete(ADMIN, notices.remove);

module.exports = router;
