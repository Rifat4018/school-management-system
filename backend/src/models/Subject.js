const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Subject name is required'], trim: true },
    code: { type: String, required: [true, 'Subject code is required'], unique: true, trim: true, uppercase: true },
    class: { type: ObjectId, ref: 'Class', required: [true, 'Class is required'] },
    teacher: { type: ObjectId, ref: 'Teacher' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
