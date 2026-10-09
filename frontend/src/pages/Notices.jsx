import CrudPage from '../components/CrudPage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate } from '../utils/format.js';

const AUDIENCE = [
  { value: 'all', label: 'Everyone' },
  { value: 'teacher', label: 'Teachers only' },
  { value: 'student', label: 'Students only' },
];

export default function Notices() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  return (
    <CrudPage
      title="Notices"
      singular="notice"
      endpoint="/notices"
      searchable
      canCreate={user.role !== 'student'}
      canEdit={isAdmin}
      canDelete={isAdmin}
      columns={[
        { header: 'Date', render: (n) => fmtDate(n.createdAt) },
        { header: 'Title', render: (n) => n.title },
        { header: 'Message', render: (n) => n.body },
        { header: 'For', render: (n) => <span className="badge">{n.audience}</span> },
        { header: 'Posted by', render: (n) => n.createdBy?.name },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true, full: true },
        { name: 'body', label: 'Message', type: 'textarea', required: true, full: true },
        { name: 'audience', label: 'Audience', type: 'select', options: AUDIENCE, required: true },
      ]}
      toForm={(n) => ({ title: n.title, body: n.body, audience: n.audience })}
    />
  );
}
