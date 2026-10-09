import CrudPage from '../components/CrudPage.jsx';
import useOptions from '../hooks/useOptions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { classLabel, inputDate } from '../utils/format.js';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function Students() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin'; // teachers can view, only admin can change
  const classes = useOptions('/classes', classLabel);

  return (
    <CrudPage
      title="Students"
      singular="student"
      endpoint="/students"
      searchable
      canCreate={isAdmin}
      canEdit={isAdmin}
      canDelete={isAdmin}
      filters={[{ name: 'class', label: 'All classes', options: classes }]}
      columns={[
        { header: 'Roll', render: (s) => s.rollNo },
        { header: 'Name', render: (s) => s.user?.name },
        { header: 'Email', render: (s) => s.user?.email },
        { header: 'Class', render: (s) => classLabel(s.class) },
        { header: 'Guardian', render: (s) => s.guardianName },
        { header: 'Phone', render: (s) => s.guardianPhone },
      ]}
      fields={[
        { name: 'name', label: 'Full name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true, minLength: 6, createOnly: true },
        { name: 'class', label: 'Class', type: 'select', options: classes, required: true },
        { name: 'rollNo', label: 'Roll number', type: 'number', min: 1, required: true },
        { name: 'gender', label: 'Gender', type: 'select', options: GENDERS },
        { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
        { name: 'guardianName', label: 'Guardian name' },
        { name: 'guardianPhone', label: 'Guardian phone' },
        { name: 'address', label: 'Address', full: true },
      ]}
      toForm={(s) => ({
        name: s.user?.name,
        email: s.user?.email,
        class: s.class?._id,
        rollNo: s.rollNo,
        gender: s.gender,
        dateOfBirth: inputDate(s.dateOfBirth),
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        address: s.address,
      })}
    />
  );
}
