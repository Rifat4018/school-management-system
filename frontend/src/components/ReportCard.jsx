import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/client.js';

// Shows one student's results grouped by exam. studentId = 'me' for the logged-in student.
export default function ReportCard({ studentId }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setReport(null);
    setError('');
    api
      .get(`/results/student/${studentId}`)
      .then(({ data }) => active && setReport(data.data))
      .catch((err) => active && setError(errMsg(err)));
    return () => {
      active = false;
    };
  }, [studentId]);

  if (error) return <p className="alert">{error}</p>;
  if (!report) return <p className="muted">Loading report…</p>;

  return (
    <div>
      <p className="muted">
        <strong>{report.student.name}</strong> · {report.student.class} · Roll {report.student.rollNo}
      </p>
      {report.exams.length === 0 && <p className="muted">No results published yet.</p>}
      {report.exams.map((exam) => (
        <div className="card" key={exam.exam}>
          <div className="page-head">
            <h3>{exam.exam}</h3>
            <span className={exam.status === 'Passed' ? 'badge badge-green' : 'badge badge-red'}>{exam.status}</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Point</th>
                </tr>
              </thead>
              <tbody>
                {exam.rows.map((row) => (
                  <tr key={row.code || row.subject}>
                    <td>{row.subject}</td>
                    <td>
                      {row.marks} / {row.totalMarks}
                    </td>
                    <td>{row.grade}</td>
                    <td>{row.point.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th>
                    {exam.obtained} / {exam.total} ({exam.percentage}%)
                  </th>
                  <th colSpan={2}>GPA {exam.gpa.toFixed(2)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
