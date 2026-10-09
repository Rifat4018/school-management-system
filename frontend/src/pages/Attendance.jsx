import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/client.js';
import useOptions from '../hooks/useOptions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { classLabel, fmtDate, todayStr } from '../utils/format.js';

const STATUSES = ['present', 'late', 'absent'];
const BADGE = { present: 'badge badge-green', late: 'badge badge-amber', absent: 'badge badge-red' };

// One URL, two views: staff mark the register, students see their own record.
export default function Attendance() {
  const { user } = useAuth();
  return user.role === 'student' ? <MyAttendance /> : <Register />;
}

function Register() {
  const classes = useOptions('/classes', classLabel);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { ok: boolean, text: string }

  // Reload the register whenever the class or the date changes.
  useEffect(() => {
    if (!classId || !date) {
      setRows([]);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setMessage(null);
    api
      .get('/attendance', { params: { class: classId, date } })
      .then(({ data }) => {
        if (!active) return;
        setAlreadyMarked(data.data.some((r) => r.status));
        setRows(data.data.map((r) => ({ ...r, status: r.status || 'present' }))); // default = present
      })
      .catch((err) => active && setMessage({ ok: false, text: errMsg(err) }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [classId, date]);

  // Immutable update: build a new array instead of changing the old one.
  const setStatus = (studentId, status) =>
    setRows((prev) => prev.map((r) => (r.student === studentId ? { ...r, status } : r)));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const records = rows.map(({ student, status }) => ({ student, status }));
      const { data } = await api.post('/attendance', { class: classId, date, records });
      setAlreadyMarked(true);
      setMessage({ ok: true, text: data.message });
    } catch (err) {
      setMessage({ ok: false, text: errMsg(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h1>Attendance</h1>
      </div>

      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
          <option value="">Select a class…</option>
          {classes.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      </div>

      {message && <p className={message.ok ? 'alert alert-ok' : 'alert'}>{message.text}</p>}
      {!classId && <p className="muted">Choose a class to open its register.</p>}
      {classId && loading && <p className="muted">Loading…</p>}
      {classId && !loading && rows.length === 0 && <p className="muted">This class has no students.</p>}

      {classId && !loading && rows.length > 0 && (
        <>
          <p className="muted">
            {alreadyMarked ? 'Attendance is already saved for this day. You can change it.' : 'Not marked yet for this day.'}
          </p>
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student}>
                    <td>{r.rollNo}</td>
                    <td>{r.name}</td>
                    <td className="segmented">
                      {STATUSES.map((s) => (
                        <button
                          type="button"
                          key={s}
                          className={r.status === s ? `btn btn-sm on ${s}` : 'btn btn-sm'}
                          aria-pressed={r.status === s}
                          onClick={() => setStatus(r.student, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <span className="muted">{rows.filter((r) => r.status !== 'absent').length} of {rows.length} present</span>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save attendance'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function MyAttendance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/attendance/student/me')
      .then((res) => active && setData(res.data.data))
      .catch((err) => active && setError(errMsg(err)));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="alert">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const { summary, records } = data;

  return (
    <section>
      <div className="page-head">
        <h1>My attendance</h1>
      </div>
      <div className="stats">
        {[
          ['Attendance', `${summary.percentage}%`],
          ['Present', summary.present],
          ['Late', summary.late],
          ['Absent', summary.absent],
        ].map(([label, value]) => (
          <div className="card stat" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={2} className="muted">
                  No attendance recorded yet.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r._id}>
                <td>{fmtDate(r.date)}</td>
                <td>
                  <span className={BADGE[r.status]}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
