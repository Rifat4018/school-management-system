import CrudPage from '../components/CrudPage.jsx';
import useOptions from '../hooks/useOptions.js';
import api, { errMsg } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, inputDate, money, personLabel, studentLabel } from '../utils/format.js';

const STATUS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
];

export default function Fees() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  // Students cannot list other students, so only load the options for the admin.
  const students = useOptions('/students', studentLabel, isAdmin);

  const markPaid = async (fee, reload) => {
    try {
      await api.patch(`/fees/${fee._id}/pay`);
      reload();
    } catch (err) {
      window.alert(errMsg(err));
    }
  };

  const columns = [
    { header: 'Title', render: (f) => f.title },
    { header: 'Amount', render: (f) => money(f.amount) },
    { header: 'Due date', render: (f) => fmtDate(f.dueDate) },
    {
      header: 'Status',
      render: (f) => <span className={f.status === 'paid' ? 'badge badge-green' : 'badge badge-red'}>{f.status}</span>,
    },
    { header: 'Paid on', render: (f) => fmtDate(f.paidAt) },
  ];
  if (isAdmin) columns.unshift({ header: 'Student', render: (f) => f.student && personLabel(f.student) });

  return (
    <CrudPage
      title={isAdmin ? 'Fees' : 'My fees'}
      singular="fee"
      endpoint="/fees"
      searchable={isAdmin}
      canCreate={isAdmin}
      canEdit={isAdmin}
      canDelete={isAdmin}
      filters={[{ name: 'status', label: 'All statuses', options: STATUS }]}
      columns={columns}
      fields={[
        { name: 'student', label: 'Student', type: 'select', options: students, required: true, full: true },
        { name: 'title', label: 'Title (e.g. Tuition Fee - October)', required: true, full: true },
        { name: 'amount', label: 'Amount (BDT)', type: 'number', min: 0, required: true },
        { name: 'dueDate', label: 'Due date', type: 'date' },
      ]}
      toForm={(f) => ({ student: f.student?._id, title: f.title, amount: f.amount, dueDate: inputDate(f.dueDate) })}
      rowActions={
        isAdmin
          ? (fee, reload) =>
              fee.status === 'unpaid' && (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => markPaid(fee, reload)}>
                  Mark paid
                </button>
              )
          : undefined
      }
    />
  );
}
