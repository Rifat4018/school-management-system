import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Classes from './pages/Classes.jsx';
import Subjects from './pages/Subjects.jsx';
import Attendance from './pages/Attendance.jsx';
import Results from './pages/Results.jsx';
import Fees from './pages/Fees.jsx';
import Notices from './pages/Notices.jsx';

const ALL = ['admin', 'teacher', 'student'];
const STAFF = ['admin', 'teacher'];

// Single source of truth: the router (App.jsx) and the sidebar (Layout.jsx) both read this list.
export const PAGES = [
  { path: '/', label: 'Dashboard', roles: ALL, element: <Dashboard /> },
  { path: '/students', label: 'Students', roles: STAFF, element: <Students /> },
  { path: '/teachers', label: 'Teachers', roles: ['admin'], element: <Teachers /> },
  { path: '/classes', label: 'Classes', roles: ['admin'], element: <Classes /> },
  { path: '/subjects', label: 'Subjects', roles: ['admin'], element: <Subjects /> },
  { path: '/attendance', label: 'Attendance', roles: ALL, element: <Attendance /> },
  { path: '/results', label: 'Results', roles: ALL, element: <Results /> },
  { path: '/fees', label: 'Fees', roles: ['admin', 'student'], element: <Fees /> },
  { path: '/notices', label: 'Notices', roles: ALL, element: <Notices /> },
];
