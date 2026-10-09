import CrudPage from '../components/CrudPage.jsx';
import useOptions from '../hooks/useOptions.js';
import { classLabel, personLabel } from '../utils/format.js';

export default function Subjects() {
  const classes = useOptions('/classes', classLabel);
  const teachers = useOptions('/teachers', personLabel);

  return (
    <CrudPage
      title="Subjects"
      singular="subject"
      endpoint="/subjects"
      searchable
      canCreate
      canEdit
      canDelete
      filters={[{ name: 'class', label: 'All classes', options: classes }]}
      columns={[
        { header: 'Code', render: (s) => s.code },
        { header: 'Subject', render: (s) => s.name },
        { header: 'Class', render: (s) => classLabel(s.class) },
        { header: 'Teacher', render: (s) => s.teacher && personLabel(s.teacher) },
      ]}
      fields={[
        { name: 'name', label: 'Subject name', required: true },
        { name: 'code', label: 'Code (unique, e.g. MAT-9)', required: true },
        { name: 'class', label: 'Class', type: 'select', options: classes, required: true },
        { name: 'teacher', label: 'Teacher', type: 'select', options: teachers },
      ]}
      toForm={(s) => ({ name: s.name, code: s.code, class: s.class?._id, teacher: s.teacher?._id })}
    />
  );
}
