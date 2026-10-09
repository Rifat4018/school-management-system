import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/client.js';
import useOptions from '../hooks/useOptions.js';
import ReportCard from '../components/ReportCard.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { classLabel } from '../utils/format.js';

const EXAMS = ['Class Test', 'Midterm', 'Final'];

// Students see their own report card; staff get the marks-entry sheet.
export default function Results() {
  const { user } = useAuth();
  if (user.role === 'student') {
    return (
      <section>
        <div className="page-head">
          <h1>My results</h1>
        </div>
        <ReportCard studentId="me" />
      </section>
    );
  }
  return <MarksSheet />;
}

function MarksSheet() {
  const classes = useOptions('/classes', classLabel);
  const [classId, setClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [exam, setExam] = useState('Midterm');
  const [totalMarks, setTotalMarks] = useState(100);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reportFor, setReportFor] = useState(null); // student whose report card is open

  // Dependent dropdown: the subject list depends on the chosen class.
  useEffect(() => {
    setSubjectId('');
    setSubjects([]);
    if (!classId) return undefined;
    let active = true;
    api
      .get('/subjects', { params: { class: classId, limit: 100 } })
      .then(({ data }) => active && setSubjects(data.data))
      .catch((err) => active && setMessage({ ok: false, text: errMsg(err) }));
    return () => {
      active = false;
    };
  }, [classId]);

  // Load the marks sheet for the chosen subject + exam.
  useEffect(() => {
    if (!subjectId) {
      setRows([]);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setMessage(null);
    api
      .get('/results', { params: { subject: subjectId, exam } })
      .then(({ data }) => {
        if (!active) return;
        setTotalMarks(data.totalMarks);
        setRows(data.data.map((r) => ({ ...r, marks: r.marks ?? '' })));
      })
      .catch((err) => active && setMessage({ ok: false, text: errMsg(err) }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [subjectId, exam]);

  const setMarks = (studentId, marks) =>
    setRows((prev) => prev.map((r) => (r.student === studentId ? { ...r, marks } : r)));

  const save = async () => {
    const records = rows
      .filter((r) => r.marks !== '')
      .map((r) => ({ student: r.student, marks: Number(r.marks) }));
    if (records.length === 0) {
      setMessage({ ok: false, text: 'Enter marks for at least one student.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.post('/results', { subject: subjectId, exam, totalMarks: Number(totalMarks), records });
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
        <h1>Results</h1>
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
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classId} aria-label="Subject">
          <option value="">Select a subject…</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
        <select value={exam} onChange={(e) => setExam(e.target.value)} aria-label="Exam">
          {EXAMS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <label className="inline">
          Total marks
          <input type="number" min="1" max="1000" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
        </label>
      </div>

      {message && <p className={message.ok ? 'alert alert-ok' : 'alert'}>{message.text}</p>}
      {!subjectId && <p className="muted">Choose a class and a subject to enter marks.</p>}
      {subjectId && loading && <p className="muted">Loading…</p>}
      {subjectId && !loading && rows.length === 0 && <p className="muted">This class has no students.</p>}

      {subjectId && !loading && rows.length > 0 && (
        <>
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>Marks (out of {totalMarks})</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student}>
                    <td>{r.rollNo}</td>
                    <td>{r.name}</td>
                    <td>
                      <input
                        type="number"
                        className="marks"
                        min="0"
                        max={totalMarks}
                        value={r.marks}
                        onChange={(e) => setMarks(r.student, e.target.value)}
                        aria-label={`Marks for ${r.name}`}
                      />
                    </td>
                    <td className="actions">
                      <button type="button" className="btn btn-sm" onClick={() => setReportFor(r)}>
                        Report card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <span className="muted">Empty rows are skipped.</span>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save marks'}
            </button>
          </div>
        </>
      )}

      {reportFor && (
        <Modal title="Report card" onClose={() => setReportFor(null)}>
          <ReportCard studentId={reportFor.student} />
        </Modal>
      )}
    </section>
  );
}
