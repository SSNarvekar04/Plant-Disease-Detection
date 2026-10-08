/**
 * Disease controller -- public read access + admin full CRUD.
 *
 * The list endpoint supports search, filtering and pagination, which is what
 * powers the search bar and filter dropdowns on the frontend.
 */

const Disease = require('../models/Disease');
const {
  asyncHandler,
  ApiError,
  getPagination,
  buildPaginationMeta,
  withId,
} = require('../utils/helpers');
const { isValidObjectId, toStringList, validateDisease } = require('../utils/validators');

/** Escapes user input before it is used inside a RegExp. */
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/diseases
 * Query: ?search=&plant=&severity=&page=&limit=&sort=
 */
const listDiseases = asyncHandler(async (req, res) => {
  const { search, plant, severity, sort = 'diseaseName' } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};

  if (plant) {
    filter.plantName = new RegExp(`^${escapeRegExp(plant)}$`, 'i');
  }
  if (severity) {
    filter.severity = new RegExp(`^${escapeRegExp(severity)}$`, 'i');
  }
  if (search) {
    // Case-insensitive "contains" across the main text fields.
    const pattern = new RegExp(escapeRegExp(search.trim()), 'i');
    filter.$or = [{ diseaseName: pattern }, { plantName: pattern }, { description: pattern }];
  }

  // Whitelist the sort field so a crafted query cannot sort by anything else.
  const allowedSort = ['diseaseName', 'plantName', 'severity', 'createdAt', 'updatedAt'];
  const sortField = allowedSort.includes(sort) ? sort : 'diseaseName';
  const sortDirection = sortField === 'diseaseName' ? 1 : -1;

  const [diseases, total] = await Promise.all([
    Disease.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Disease.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: withId(diseases),
    pagination: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /api/diseases/plants
 * Distinct plant names + severity values, used to fill the filter dropdowns.
 * Declared before `/:id` so "plants" is not treated as an id.
 */
const listPlantOptions = asyncHandler(async (_req, res) => {
  const [plants, severities] = await Promise.all([
    Disease.distinct('plantName'),
    Disease.distinct('severity'),
  ]);

  res.json({
    success: true,
    data: {
      plants: plants.filter(Boolean).sort(),
      severities: severities.filter(Boolean).sort(),
    },
  });
});

/**
 * GET /api/diseases/:id
 */
const getDisease = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid disease id');

  const disease = await Disease.findById(id).lean({ virtuals: true });
  if (!disease) throw ApiError.notFound('Disease record not found');

  res.json({ success: true, data: withId(disease) });
});

/**
 * POST /api/diseases            (admin)
 */
const createDisease = asyncHandler(async (req, res) => {
  const errors = validateDisease(req.body);
  if (errors.length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const duplicate = await Disease.findOne({
    plantName: req.body.plantName,
    diseaseName: req.body.diseaseName,
  });
  if (duplicate) {
    throw ApiError.conflict(`"${req.body.diseaseName}" already exists for ${req.body.plantName}`);
  }

  const disease = await Disease.create(normaliseDiseasePayload(req.body));

  res.status(201).json({
    success: true,
    message: 'Disease added successfully',
    data: disease.toJSON(),
  });
});

/**
 * PUT /api/diseases/:id         (admin)
 * Accepts a partial update -- only the provided fields change.
 */
const updateDisease = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid disease id');

  const errors = validateDisease(req.body);
  if (errors.length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const existing = await Disease.findById(id);
  if (!existing) throw ApiError.notFound('Disease record not found');

  if (req.body.plantName || req.body.diseaseName) {
    const duplicate = await Disease.findOne({
      _id: { $ne: id },
      plantName: req.body.plantName || existing.plantName,
      diseaseName: req.body.diseaseName || existing.diseaseName,
    });
    if (duplicate) throw ApiError.conflict('Another disease already uses this plant and disease name');
  }

  const updates = normaliseDiseasePayload(req.body, true);
  existing.set(updates);
  await existing.save();

  res.json({
    success: true,
    message: 'Disease updated successfully',
    data: existing.toJSON(),
  });
});

/**
 * DELETE /api/diseases/:id      (admin)
 * History entries keep their own copy of the prediction, so deleting a disease
 * never breaks the prediction history page.
 */
const deleteDisease = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid disease id');

  const disease = await Disease.findByIdAndDelete(id);
  if (!disease) throw ApiError.notFound('Disease record not found');

  res.json({
    success: true,
    message: `"${disease.diseaseName}" was deleted successfully`,
    data: { id },
  });
});

/**
 * Converts a request body into Disease document fields.
 * Accepts comma-separated strings or arrays and always stores arrays.
 * @param {object} body
 * @param {boolean} [isPartial] When true, empty/absent keys are skipped.
 */
function normaliseDiseasePayload(body, isPartial = false) {
  const payload = {};

  const assign = (key, value) => {
    if (isPartial && value === undefined) return;
    payload[key] = value;
  };

  assign('diseaseName', body.diseaseName?.trim());
  assign('plantName', body.plantName?.trim());
  assign('description', body.description?.trim());
  assign('severity', body.severity?.trim());
  assign('pathogenType', body.pathogenType?.trim());
  assign('favourableConditions', body.favourableConditions?.trim());
  assign('imageUrl', body.imageUrl?.trim());
  assign('isActive', body.isActive);

  const listFields = [
    'symptoms',
    'causes',
    'organicRemedies',
    'chemicalTreatment',
    'prevention',
    'precautions',
  ];
  listFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = toStringList(body[field]);
  });

  if (body.mlLabels !== undefined) payload.mlLabels = toStringList(body.mlLabels);

  // `isActive` should not be cleared when a partial update omits it.
  if (isPartial && payload.isActive === undefined) delete payload.isActive;

  return payload;
}

module.exports = {
  listDiseases,
  listPlantOptions,
  getDisease,
  createDisease,
  updateDisease,
  deleteDisease,
};
