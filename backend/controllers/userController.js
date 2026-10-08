/**
 * User controller -- everything a signed-in user can do with their own account.
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Prediction = require('../models/Prediction');
const { asyncHandler, ApiError } = require('../utils/helpers');
const { isValidEmail } = require('../utils/validators');
const { toPublicUser } = require('./authController');

/**
 * GET /api/users/profile
 * Returns the signed-in user's profile plus a couple of summary counters.
 */
const getProfile = asyncHandler(async (req, res) => {
  const [predictionCount, diseaseCount] = await Promise.all([
    Prediction.countDocuments({ user: req.user._id }),
    Prediction.distinct('diseaseName', { user: req.user._id }),
  ]);

  res.json({
    success: true,
    data: {
      user: toPublicUser(req.user),
      stats: { predictionCount, uniqueDiseases: diseaseCount.length },
    },
  });
});

/**
 * PUT /api/users/profile
 * Updates name / phone / location / avatarUrl. Email is intentionally NOT
 * updatable here -- changing an email needs verification, which is out of scope.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, location, avatarUrl } = req.body;
  const user = req.user;

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < 3) {
      throw ApiError.badRequest('Please correct the highlighted fields', [
        { field: 'name', message: 'Name must be at least 3 characters long' },
      ]);
    }
    user.name = trimmed;
  }
  if (phone !== undefined) user.phone = String(phone).trim().slice(0, 20);
  if (location !== undefined) user.location = String(location).trim().slice(0, 120);
  if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl).trim();

  await user.save({ validateBeforeSave: true });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: toPublicUser(user) },
  });
});

/**
 * PUT /api/users/password
 * Changing a password requires the current one.
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword) errors.push({ field: 'currentPassword', message: 'Current password is required' });
  if (!newPassword) errors.push({ field: 'newPassword', message: 'New password is required' });
  if (newPassword && String(newPassword).length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters long' });
  }
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }
  if (errors.length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw ApiError.unauthorized('Your current password is incorrect');
  }

  user.password = newPassword; // re-hashed automatically by the pre-save hook
  await user.save();

  res.json({ success: true, message: 'Password changed successfully', data: null });
});

/**
 * PUT /api/users/email
 * Changes the email address after verifying the current password.
 */
const changeEmail = asyncHandler(async (req, res) => {
  const { newEmail, password } = req.body;

  if (!newEmail || !isValidEmail(newEmail)) {
    throw ApiError.badRequest('Please correct the highlighted fields', [
      { field: 'newEmail', message: 'Please provide a valid email address' },
    ]);
  }
  if (!password) {
    throw ApiError.badRequest('Please correct the highlighted fields', [
      { field: 'password', message: 'Password is required to change your email' },
    ]);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Your password is incorrect');
  }

  const normalisedEmail = String(newEmail).toLowerCase().trim();
  const duplicate = await User.findOne({ email: normalisedEmail, _id: { $ne: user._id } });
  if (duplicate) throw ApiError.conflict('That email address is already in use');

  user.email = normalisedEmail;
  await user.save();

  res.json({ success: true, message: 'Email updated successfully', data: { user: toPublicUser(user) } });
});

/**
 * DELETE /api/users/profile
 * Permanently deletes the account and its prediction history.
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw ApiError.notFound('Account not found');

  const { password } = req.body || {};
  if (!password || !(await verifyCurrentPassword(user, password))) {
    throw ApiError.unauthorized('Password is required to delete your account');
  }

  await Prediction.deleteMany({ user: user._id });
  await User.findByIdAndDelete(user._id);

  res.json({ success: true, message: 'Your account has been deleted', data: null });
});

/**
 * Helper used by the account-deletion flow: verifies a password against the
 * bcrypt hash that is only present because of `.select('+password')`.
 */
const verifyCurrentPassword = (user, password) => bcrypt.compare(password, user.password);

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  changeEmail,
  deleteAccount,
  verifyCurrentPassword,
};
