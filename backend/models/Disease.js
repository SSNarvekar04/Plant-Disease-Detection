/**
 * Disease model -- the knowledge base of the system.
 *
 * One document per disease. Every document carries the full remedy
 * information (symptoms, causes, treatments, prevention, precautions) so the
 * React components never hardcode agricultural content.
 *
 * `mlLabels` maps this document onto the class names produced by the AI model.
 * That indirection means the ML model can be retrained/renamed later without
 * breaking the database.
 */

const mongoose = require('mongoose');

const { ALLOWED_SEVERITIES } = require('../utils/validators');

/**
 * Builds the definition of an "array of bullet points" field, e.g. symptoms or
 * prevention steps. Values arrive either as arrays or as comma separated
 * strings (the controller normalises them) and are stored as a string array.
 *
 * @param {string} label  Field label used in validation messages.
 * @param {number} maxItems Maximum number of bullets allowed.
 */
const bulletListField = (label, maxItems = 20) => ({
  type: [String],
  required: [true, `${label} must contain at least one entry`],
  validate: {
    validator: (items) =>
      Array.isArray(items) &&
      items.length > 0 &&
      items.length <= maxItems &&
      items.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 400),
    message: `${label} must contain between 1 and ${maxItems} entries of at most 400 characters each`,
  },
});

const diseaseSchema = new mongoose.Schema(
  {
    diseaseName: {
      type: String,
      required: [true, 'Disease name is required'],
      trim: true,
      maxlength: [160, 'Disease name must be at most 160 characters'],
    },
    plantName: {
      type: String,
      required: [true, 'Plant name is required'],
      trim: true,
      maxlength: [120, 'Plant name must be at most 120 characters'],
      index: true,
    },

    /** Short one or two sentence summary shown on cards. */
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description must be at most 5000 characters'],
    },

    symptoms: bulletListField('Symptoms'),
    causes: bulletListField('Causes'),

    severity: {
      type: String,
      enum: {
        values: ALLOWED_SEVERITIES,
        message: `Severity must be one of: ${ALLOWED_SEVERITIES.join(', ')}`,
      },
      default: 'Medium',
      index: true,
    },

    organicRemedies: bulletListField('Organic remedies'),
    chemicalTreatment: bulletListField('Chemical treatment'),

    prevention: bulletListField('Prevention'),
    precautions: bulletListField('Precautions'),

    /**
     * Link to the AI model class, e.g. "Tomato___Early_blight".
     * Used by the ML service to translate a prediction into a disease record.
     */
    mlLabels: {
      type: [String],
      default: [],
    },

    /** Informational banner shown on the result page (e.g. pathogen type). */
    pathogenType: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },

    /** Seasonal / agronomic context, e.g. "Warm, humid weather". */
    favourableConditions: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },

    /** Image URL shown on the disease details page. */
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes ---------------------------------------------------------------------
// Supports the search bar on the diseases page (partial, case-insensitive).
diseaseSchema.index({ diseaseName: 'text', plantName: 'text', description: 'text' });
diseaseSchema.index({ plantName: 1, diseaseName: 1 });
diseaseSchema.index({ mlLabels: 1 });
diseaseSchema.index({ createdAt: -1 });

/** Value shown on cards, e.g. "Tomato — Early Blight". */
diseaseSchema.virtual('fullName').get(function fullName() {
  return `${this.plantName} - ${this.diseaseName}`;
});

module.exports = mongoose.model('Disease', diseaseSchema);
