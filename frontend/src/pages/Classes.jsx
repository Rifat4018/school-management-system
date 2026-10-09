import CrudPage from '../components/CrudPage.jsx';
import useOptions from '../hooks/useOptions.js';
import { personLabel } from '../utils/format.js';

export default function Classes() {
  const teachers = useOptions('/teachers', personLabel);

  return (
    <CrudPage
      title="Classes"
      singular="class"
      endpoint="/classes"
      searchable
      canCreate
      canEdit
      canDelete
      columns={[
        { header: 'Class', render: (c) => c.name },
        { header: 'Section', render: (c) => c.section },
        { header: 'Class teacher', render: (c) => c.classTeacher && personLabel(c.classTeacher) },
      ]}
      fields={[
        { name: 'name', label: 'Class name (e.g. Class 9)', required: true },
        { name: 'section', label: 'Section (e.g. A)', required: true },
        { name: 'classTeacher', label: 'Class teacher', type: 'select', options: teachers },
      ]}
      toForm={(c) => ({ name: c.name, section: c.section, classTeacher: c.classTeacher?._id })}
    />
  );
}
