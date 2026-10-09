// User = login account. Students and teachers each have a User plus a profile document.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is not valid'],
    },
    // select:false -> the hash is never returned by queries unless asked for with .select('+password')
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash the password before saving, only when it was changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10); // 10 = salt rounds (cost factor)
});

userSchema.methods.matchPassword = function (plainText) {
  return bcrypt.compare(String(plainText), this.password);
};

module.exports = mongoose.model('User', userSchema);
