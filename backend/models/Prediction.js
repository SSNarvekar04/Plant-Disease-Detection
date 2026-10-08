/**
 * Prediction model -- one document per leaf image analysed by the AI model.
 *
 * `disease` is a soft reference: a prediction is still valuable (and should be
 * viewable in history) even if an admin later deletes the matching disease, so
 * the key prediction facts are denormalised into this document.
 */

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Prediction must belong to a user'],
      index: true,
    },

    /** Cloudinary URL (or local /uploads URL) of the analysed leaf image. */
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },

    publicId: {
      type: String,
      default: '',
      trim: true,
    },

    plantName: {
      type: String,
      required: [true, 'Detected plant name is required'],
      trim: true,
      maxlength: 120,
    },

    diseaseName: {
      type: String,
      required: [true, 'Detected disease name is required'],
      trim: true,
      maxlength: 160,
    },

    /** Confidence percentage produced by the model, e.g. 94.5 */
    confidence: {
      type: Number,
      required: [true, 'Confidence value is required'],
      min: [0, 'Confidence cannot be negative'],
      max: [100, 'Confidence cannot exceed 100'],
    },

    /**
     * How the result was produced:
     *   'ml'        -> returned by the Python TensorFlow service
     *   'mock'      -> deterministic fallback (ML service unavailable)
     *   'manual'    -> submitted by an admin / corrected by the user
     */
    predictionSource: {
      type: String,
      enum: {
        values: ['ml', 'mock', 'manual'],
        message: 'predictionSource must be ml, mock or manual',
      },
      default: 'ml',
    },

    /**
     * Outcome of the prediction:
     *   'detected'  -> a disease was found with reasonable confidence
     *   'low_confidence' -> model ran but confidence was below the threshold
     *   'healthy'   -> leaf classified as healthy
     *   'failed'    -> prediction could not be completed
     */
    predictionStatus: {
      type: String,
      enum: {
        values: ['detected', 'low_confidence', 'healthy', 'failed'],
        message: 'predictionStatus is not a valid value',
      },
      default: 'detected',
    },

    disease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disease',
      default: null,
    },

    /** Raw model output, useful for debugging / future re-analysis. */
    rawResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
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

// Indexes: the history page sorts by newest first and always filters by user.
predictionSchema.index({ user: 1, createdAt: -1 });
predictionSchema.index({ createdAt: -1 });
predictionSchema.index({ diseaseName: 1 });
predictionSchema.index({ plantName: 1 });
predictionSchema.index({ predictionStatus: 1 });

/** Human readable summary used in dashboards and toasts. */
predictionSchema.virtual('summary').get(function summary() {
  return `${this.plantName} - ${this.diseaseName} (${Number(this.confidence).toFixed(1)}%)`;
});

module.exports = mongoose.model('Prediction', predictionSchema);
