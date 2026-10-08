/**
 * Prediction controller.
 *
 * Flow for POST /api/predictions:
 *   1. validate + buffer the uploaded image (multer, see uploadMiddleware)
 *   2. store the image on Cloudinary (or local disk)
 *   3. send the buffer to the Python ML service
 *   4. translate the model's class into a Disease knowledge-base record
 *   5. persist the result to the user's history
 *   6. return everything the result page needs in a single response
 *
 * Steps 2-5 live in `createPredictionRecord()` so that the "preview only"
 * endpoint (POST /api/predict) can reuse them without duplicating logic.
 */

const mongoose = require('mongoose');
const Prediction = require('../models/Prediction');
const {
  asyncHandler,
  ApiError,
  getPagination,
  buildPaginationMeta,
  withId,
} = require('../utils/helpers');
const { isValidObjectId } = require('../utils/validators');
const mlService = require('../services/mlService');
const cloudinaryService = require('../services/cloudinaryService');
const {
  findBestDiseaseMatch,
  isHealthyPrediction,
  NO_RECORD_MESSAGE,
} = require('../services/diseaseMatchService');

/** Below this percentage the UI asks for a clearer image. */
const LOW_CONFIDENCE_THRESHOLD = 70;

/**
 * Maps a raw ML result onto the disease document / prediction status.
 *
 * @param {object} mlResult   Output of mlService.predictDisease
 * @param {import('mongoose').Document|null} disease
 */
function buildOutcome(mlResult, disease) {
  const isHealthy = isHealthyPrediction(mlResult);
  const isLowConfidence = mlResult.confidence < LOW_CONFIDENCE_THRESHOLD;

  let predictionStatus;
  if (isHealthy) {
    predictionStatus = 'healthy';
  } else if (isLowConfidence) {
    predictionStatus = 'low_confidence';
  } else {
    predictionStatus = 'detected';
  }

  return {
    predictionStatus,
    diseaseName: disease?.diseaseName || mlResult.disease,
    plantName: disease?.plantName || mlResult.plant,
    // Explanatory note rendered at the top of the result card.
    message: isHealthy
      ? 'No disease was detected on this leaf. Keep following the prevention checklist below.'
      : isLowConfidence
        ? 'Prediction confidence is low. Please upload a clearer image in good lighting.'
        : null,
    remedyNotice: disease || isHealthy ? null : NO_RECORD_MESSAGE,
  };
}

/**
 * Runs the full detection pipeline and returns (without saving):
 * { prediction fields, uploaded image, disease document }
 */
async function analyseImage(file, req) {
  // 1. Store the image first, so a stored record always has an image URL.
  const stored = await cloudinaryService.uploadImage(file);
  const imageUrl = stored.provider === 'local' ? `${req.protocol}://${req.get('host')}${stored.url}` : stored.url;

  // 2. Ask the AI model.
  const mlResult = await mlService.predictDisease(file);

  // 3. Resolve the matching disease record from the knowledge base.
  const disease = await findBestDiseaseMatch(mlResult);
  const outcome = buildOutcome(mlResult, disease);

  return {
    mlResult,
    disease,
    imageUrl,
    publicId: stored.publicId,
    storageProvider: stored.provider,
    ...outcome,
  };
}

/**
 * POST /api/predictions
 * Analyses the image, stores the image and saves the result to history.
 */
const createPrediction = asyncHandler(async (req, res) => {
  const outcome = await analyseImage(req.file, req);

  const prediction = await Prediction.create({
    user: req.user._id,
    imageUrl: outcome.imageUrl,
    publicId: outcome.publicId,
    plantName: outcome.plantName,
    diseaseName: outcome.diseaseName,
    confidence: outcome.mlResult.confidence,
    predictionSource: outcome.mlResult.predictionSource,
    predictionStatus: outcome.predictionStatus,
    disease: outcome.disease ? outcome.disease._id : null,
    rawResult: {
      classIndex: outcome.mlResult.classIndex,
      modelName: outcome.mlResult.modelName,
      topPredictions: outcome.mlResult.topPredictions,
      storageProvider: outcome.storageProvider,
    },
    notes: outcome.message || '',
  });

  res.status(201).json({
    success: true,
    message: outcome.message || 'Disease detected successfully',
    data: buildResultPayload(prediction, outcome.disease, outcome.message),
  });
});

/**
 * POST /api/predict
 * Detection only -- the result is NOT saved to history. Used by the "try it"
 * flow and available for API demos.
 */
const predictOnly = asyncHandler(async (req, res) => {
  const outcome = await analyseImage(req.file, req);

  res.json({
    success: true,
    message: outcome.message || 'Disease detected successfully',
    data: {
      prediction: {
        plantName: outcome.plantName,
        diseaseName: outcome.diseaseName,
        confidence: outcome.mlResult.confidence,
        predictionSource: outcome.mlResult.predictionSource,
        predictionStatus: outcome.predictionStatus,
        imageUrl: outcome.imageUrl,
        notes: outcome.message || '',
      },
      disease: outcome.disease ? outcome.disease.toJSON() : null,
      remedyNotice: outcome.remedyNotice,
      topPredictions: outcome.mlResult.topPredictions,
    },
  });
});

/**
 * GET /api/predictions/my
 * The signed-in user's history: newest first, paginated, filterable.
 * Query: ?plant=&status=&search=&page=&limit=
 */
const getMyPredictions = asyncHandler(async (req, res) => {
  const { plant, status, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { user: req.user._id };

  if (plant) filter.plantName = plant;
  if (status) filter.predictionStatus = status;
  if (search) {
    const pattern = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ diseaseName: pattern }, { plantName: pattern }];
  }

  const [predictions, total] = await Promise.all([
    Prediction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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
 * GET /api/predictions/:id
 * Owners can view their own record; admins can view any record.
 */
const getPredictionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid prediction id');

  const prediction = await Prediction.findById(id).populate('disease');
  if (!prediction) throw ApiError.notFound('Prediction record not found');

  const isOwner = prediction.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view your own predictions');
  }

  res.json({
    success: true,
    data: buildResultPayload(prediction, prediction.disease, prediction.notes),
  });
});

/**
 * DELETE /api/predictions/:id
 * Removes the history row and the associated stored image.
 */
const deletePrediction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid prediction id');

  const prediction = await Prediction.findById(id);
  if (!prediction) throw ApiError.notFound('Prediction record not found');

  const isOwner = prediction.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own predictions');
  }

  await Prediction.findByIdAndDelete(id);

  // Best effort cleanup -- a leftover image must never fail the request.
  const provider = prediction.rawResult?.storageProvider || (prediction.imageUrl.startsWith('/uploads/') ? 'local' : 'cloudinary');
  await cloudinaryService.deleteImage(prediction.publicId || prediction.imageUrl, provider);

  res.json({ success: true, message: 'Prediction deleted successfully', data: { id } });
});

/**
 * GET /api/predictions/stats/my
 * Small aggregate used by the user dashboard (total scans, most detected
 * disease, weekly activity).
 */
const getMyStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [totalScans, statusCounts, topDiseases, plantBreakdown] = await Promise.all([
    Prediction.countDocuments({ user: userId }),
    Prediction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$predictionStatus', count: { $sum: 1 } } },
    ]),
    Prediction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$diseaseName', count: { $sum: 1 }, plantName: { $first: '$plantName' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Prediction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$plantName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const weeklyActivity = await Prediction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalScans,
      statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      topDiseases,
      plantBreakdown,
      weeklyActivity,
      mostDetectedDisease: topDiseases[0] || null,
    },
  });
});

/**
 * Builds the single payload consumed by the result page, so the page never has
 * to make follow-up requests.
 */
function buildResultPayload(prediction, disease, note) {
  const json = typeof prediction.toJSON === 'function' ? prediction.toJSON() : prediction;

  return {
    prediction: {
      id: json.id || json._id,
      imageUrl: json.imageUrl,
      plantName: json.plantName,
      diseaseName: json.diseaseName,
      confidence: json.confidence,
      predictionSource: json.predictionSource,
      predictionStatus: json.predictionStatus,
      notes: note ?? json.notes ?? '',
      createdAt: json.createdAt,
      topPredictions: json.rawResult?.topPredictions || [],
    },
    disease: disease
      ? typeof disease.toJSON === 'function'
        ? disease.toJSON()
        : disease
      : null,
    remedyNotice: disease ? null : NO_RECORD_MESSAGE,
    lowConfidenceWarning:
      json.predictionStatus === 'low_confidence'
        ? 'Prediction confidence is low. Please upload a clearer image in good lighting and avoid shadows.'
        : null,
    disclaimer:
      'This result is generated by a machine learning model and is an aid for decision making only. ' +
      'Please confirm with a local agriculture expert before applying any treatment.',
  };
}

module.exports = {
  createPrediction,
  predictOnly,
  getMyPredictions,
  getPredictionById,
  deletePrediction,
  getMyStats,
  buildResultPayload,
  LOW_CONFIDENCE_THRESHOLD,
};
