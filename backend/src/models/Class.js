const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Class name is required'], trim: true }, // e.g. "Class 9"
    section: { type: String, required: [true, 'Section is required'], trim: true, uppercase: true }, // e.g. "A"
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  },
  { timestamps: true }
);

classSchema.index({ name: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
