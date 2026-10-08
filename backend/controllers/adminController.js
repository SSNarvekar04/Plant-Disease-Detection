/**
 * Admin controller: user management, prediction oversight and statistics.
 */

const User = require('../models/User');
const Prediction = require('../models/Prediction');
const Disease = require('../models/Disease');
const { asyncHandler, ApiError, getPagination, buildPaginationMeta, withId } = require('../utils/helpers');
const { isValidObjectId } = require('../utils/validators');
const cloudinaryService = require('../services/cloudinaryService');
const { toPublicUser } = require('./authController');

/**
 * GET /api/admin/users
 * Query: ?search=&role=&page=&limit=
 */
const listUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (role && ['user', 'admin'].includes(role)) filter.role = role;
  if (search) {
    const pattern = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Attach the scan count per user for a richer table.
  const userIds = users.map((user) => user._id);
  const scanCounts = await Prediction.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(scanCounts.map((item) => [String(item._id), item.count]));

res.json({
    success: true,
    data: withId(users.map((user) => ({ ...toPublicUser(user), predictionCount: countMap.get(String(user._id)) || 0 }))),
    pagination: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/admin/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid user id');

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  const predictionCount = await Prediction.countDocuments({ user: id });

  res.json({ success: true, data: { ...toPublicUser(user), predictionCount } });
});

/**
 * PUT /api/admin/users/:id
 * Lets an admin change a user's role and/or activation state.
 * The `role` and `isActive` fields are the only ones exposed here -- profile
 * details are edited by the user themselves.
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid user id');

  const { role, isActive } = req.body;

  if (role !== undefined && !['user', 'admin'].includes(role)) {
    throw ApiError.badRequest('Role must be either user or admin');
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw ApiError.badRequest('isActive must be true or false');
  }

  // Safety rails: an admin must not be able to lock everyone out.
  if (id === req.user._id.toString() && role === 'user') {
    throw ApiError.badRequest('You cannot change your own role');
  }
  if (id === req.user._id.toString() && isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const user = await User.findByIdAndUpdate(
    id,
    { ...(role !== undefined ? { role } : {}), ...(isActive !== undefined ? { isActive } : {}) },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');

  res.json({ success: true, message: 'User updated successfully', data: toPublicUser(user) });
});

/**
 * DELETE /api/admin/users/:id
 * Removes the user together with their prediction history.
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid user id');

  if (id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) throw ApiError.notFound('User not found');

  await Prediction.deleteMany({ user: id });

  res.json({ success: true, message: `${user.name} was deleted successfully`, data: { id } });
});

/**
 * GET /api/admin/predictions
 * Query: ?user=&status=&plant=&search=&page=&limit=
 */
const listPredictions = asyncHandler(async (req, res) => {
  const { user, status, plant, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (isValidObjectId(user)) filter.user = user;
  if (status) filter.predictionStatus = status;
  if (plant) filter.plantName = plant;
  if (search) {
    const pattern = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ diseaseName: pattern }, { plantName: pattern }];
  }

  const [predictions, total] = await Promise.all([
    Prediction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('disease', 'diseaseName plantName severity')
      .lean(),
    Prediction.countDocuments(filter),
  ]);

res.json({
    success: true,
    data: withId(predictions),
    pagination: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/admin/statistics
 * Everything the admin dashboard needs in one call.
 */
const getStatistics = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalActiveUsers,
    totalDiseases,
    totalPredictions,
    statusBreakdown,
    topDiseases,
    plantBreakdown,
    severityBreakdown,
    recentPredictions,
    dailyTrend,
    storageInfo,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Disease.countDocuments(),
    Prediction.countDocuments(),
    Prediction.aggregate([{ $group: { _id: '$predictionStatus', count: { $sum: 1 } } }]),
    Prediction.aggregate([
      { $group: { _id: '$diseaseName', count: { $sum: 1 }, plantName: { $first: '$plantName' } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Prediction.aggregate([{ $group: { _id: '$plantName', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Disease.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Prediction.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name email')
      .lean(),
    Prediction.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 14 },
    ]),
    Promise.resolve(cloudinaryService.getStorageStatus()),
  ]);

  const averageConfidenceAgg = await Prediction.aggregate([
    { $group: { _id: null, average: { $avg: '$confidence' } } },
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        users: totalUsers,
        activeUsers: totalActiveUsers,
        diseases: totalDiseases,
        predictions: totalPredictions,
        averageConfidence: averageConfidenceAgg[0]
          ? Number(averageConfidenceAgg[0].average.toFixed(1))
          : 0,
      },
      statusBreakdown: statusBreakdown.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {}
      ),
      topDiseases: topDiseases.map((item) => ({
        name: item._id,
        plantName: item.plantName,
        count: item.count,
      })),
      plantBreakdown: plantBreakdown.map((item) => ({ name: item._id, count: item.count })),
      severityBreakdown: severityBreakdown.map((item) => ({ name: item._id, count: item.count })),
recentPredictions: withId(recentPredictions),
      dailyTrend,
      storage: storageInfo,
    },
  });
});

/**
 * DELETE /api/admin/predictions/:id
 * Lets an admin remove a single prediction record.
 */
const deletePrediction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid prediction id');

  const deleted = await Prediction.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound('Prediction record not found');

  res.json({ success: true, message: 'Prediction record deleted', data: { id } });
});

/**
 * POST /api/admin/users
 * Creates an admin account from the admin panel (no confirmation field).
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email and password are required');
  }
  if (String(password).length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long');
  }
  if (!['user', 'admin'].includes(role)) {
    throw ApiError.badRequest('Role must be either user or admin');
  }

  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, role });

  res.status(201).json({ success: true, message: 'User created successfully', data: toPublicUser(user) });
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listPredictions,
  deletePrediction,
  getStatistics,
};
