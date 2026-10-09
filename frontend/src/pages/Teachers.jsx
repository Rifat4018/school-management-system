import CrudPage from '../components/CrudPage.jsx';

export default function Teachers() {
  return (
    <CrudPage
      title="Teachers"
      singular="teacher"
      endpoint="/teachers"
      searchable
      canCreate
      canEdit
      canDelete
      columns={[
        { header: 'Employee ID', render: (t) => t.employeeId },
        { header: 'Name', render: (t) => t.user?.name },
        { header: 'Email', render: (t) => t.user?.email },
        { header: 'Specialization', render: (t) => t.specialization },
        { header: 'Phone', render: (t) => t.phone },
      ]}
      fields={[
        { name: 'name', label: 'Full name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true, minLength: 6, createOnly: true },
        { name: 'employeeId', label: 'Employee ID', required: true },
        { name: 'specialization', label: 'Specialization' },
        { name: 'qualification', label: 'Qualification' },
        { name: 'phone', label: 'Phone' },
      ]}
      toForm={(t) => ({
        name: t.user?.name,
        email: t.user?.email,
        employeeId: t.employeeId,
        specialization: t.specialization,
        qualification: t.qualification,
        phone: t.phone,
      })}
    />
  );
}
