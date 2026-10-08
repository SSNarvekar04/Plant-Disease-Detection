/**
 * User model.
 *
 * Passwords are hashed with bcrypt in a pre-save hook, so controllers never
 * deal with hashing. `password` is `select: false`, meaning it is omitted from
 * query results unless explicitly requested with `.select('+password')`.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long'],
      maxlength: [80, 'Name must be at most 80 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: { values: ['user', 'admin'], message: 'Role must be either user or admin' },
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },
    location: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password; // never leak the hash
        return ret;
      },
    },
  }
);

// Indexes ---------------------------------------------------------------------
// `unique: true` on the email field already creates a unique index, so it is not
// repeated here.
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Password hashing ------------------------------------------------------------
/** Hash the password whenever it is set or changed. */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

/** Compare a plain-text candidate with the stored bcrypt hash. */
userSchema.methods.matchPassword = function matchPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
