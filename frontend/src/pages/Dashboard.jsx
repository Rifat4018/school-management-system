import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, money, todayStr } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/dashboard', { params: { date: todayStr() } })
      .then((res) => active && setData(res.data.data))
      .catch((err) => active && setError(errMsg(err)));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="alert">{error}</p>;
  if (!data) return <p className="muted">Loading dashboard…</p>;

  const isStudent = data.role === 'student';
  const stats = isStudent
    ? [
        ['Attendance', `${data.attendance.percentage}%`],
        ['Days absent', data.attendance.absent],
        ['Unpaid fees', money(data.fees.unpaidTotal)],
        ['Published marks', data.resultCount],
      ]
    : [
        ['Students', data.counts.students],
        ['Teachers', data.counts.teachers],
        ['Classes', data.counts.classes],
        ['Subjects', data.counts.subjects],
        ['Fees collected', money(data.fees.paid)],
        ['Fees pending', money(data.fees.unpaid)],
      ];

  const maxCount = isStudent ? 0 : Math.max(1, ...data.studentsPerClass.map((c) => c.count));

  return (
    <section>
      <div className="page-head">
        <h1>Welcome, {user.name.split(' ')[0]}</h1>
      </div>

      <div className="stats">
        {stats.map(([label, value]) => (
          <div className="card stat" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="two-col">
        {!isStudent && (
          <div className="card">
            <h3>Students per class</h3>
            {data.studentsPerClass.length === 0 && <p className="muted">No students yet.</p>}
            {data.studentsPerClass.map((c) => (
              <div className="bar-row" key={c.name}>
                <span>{c.name}</span>
                <div className="bar">
                  <div style={{ width: `${(c.count / maxCount) * 100}%` }} />
                </div>
                <strong>{c.count}</strong>
              </div>
            ))}

            <h3>Attendance today</h3>
            <p>
              <span className="badge badge-green">Present {data.attendanceToday.present}</span>{' '}
              <span className="badge badge-amber">Late {data.attendanceToday.late}</span>{' '}
              <span className="badge badge-red">Absent {data.attendanceToday.absent}</span>
            </p>
          </div>
        )}

        <div className="card">
          <h3>Latest notices</h3>
          {data.notices.length === 0 && <p className="muted">No notices.</p>}
          {data.notices.map((n) => (
            <div className="notice" key={n._id}>
              <strong>{n.title}</strong>
              <span className="muted"> · {fmtDate(n.createdAt)}</span>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
