/**
 * Lightweight request validation helpers.
 *
 * Kept dependency-free on purpose: the API surface is small, so a handful of
 * readable functions are easier for a student to follow (and to debug) than a
 * schema library. Every helper returns an array of `{ field, message }`
 * problems, which the controllers pass straight into `ApiError`.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const ALLOWED_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const isValidEmail = (value) => EMAIL_PATTERN.test(String(value).trim());

const isValidObjectId = (value) => OBJECT_ID_PATTERN.test(String(value));

/**
 * Trims a value and converts arrays of strings to a clean string array.
 * Accepts both `["a","b"]` and `"a, b"` input styles from the frontend.
 */
function toStringList(value) {
  if (isEmpty(value)) return [];
  const raw = Array.isArray(value) ? value : String(value).split(',');
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

/** Collects problems for a required text field. */
function requiredText(value, field, label, { max = 5000 } = {}) {
  if (isEmpty(value)) return [{ field, message: `${label} is required` }];
  if (String(value).trim().length > max) {
    return [{ field, message: `${label} must be at most ${max} characters` }];
  }
  return [];
}

/**
 * Validates the registration payload.
 * @returns {Array<{field: string, message: string}>}
 */
function validateRegister({ name, email, password, confirmPassword }) {
  const errors = [
    ...requiredText(name, 'name', 'Name', { max: 80 }),
    ...requiredText(email, 'email', 'Email', { max: 120 }),
    ...requiredText(password, 'password', 'Password', { max: 128 }),
  ];

  if (!isEmpty(name) && String(name).trim().length < 3) {
    errors.push({ field: 'name', message: 'Name must be at least 3 characters long' });
  }
  if (!isEmpty(email) && !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }
  if (!isEmpty(password) && String(password).length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }
  if (!isEmpty(confirmPassword) && password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  return errors;
}

/** Validates login credentials. */
function validateLogin({ email, password }) {
  const errors = [
    ...requiredText(email, 'email', 'Email', { max: 120 }),
    ...requiredText(password, 'password', 'Password', { max: 128 }),
  ];
  if (!isEmpty(email) && !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }
  return errors;
}

/** Validates the disease create/update payload (partial updates allowed). */
function validateDisease(payload = {}) {
  const errors = [];
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key);

  if (has('diseaseName')) errors.push(...requiredText(payload.diseaseName, 'diseaseName', 'Disease name', { max: 160 }));
  if (has('plantName')) errors.push(...requiredText(payload.plantName, 'plantName', 'Plant name', { max: 120 }));
  if (has('description')) errors.push(...requiredText(payload.description, 'description', 'Description', { max: 5000 }));

  if (has('severity')) {
    const severity = String(payload.severity).trim();
    if (!ALLOWED_SEVERITIES.includes(severity)) {
      errors.push({ field: 'severity', message: `Severity must be one of: ${ALLOWED_SEVERITIES.join(', ')}` });
    }
  }

  const listFields = [
    'symptoms',
    'causes',
    'organicRemedies',
    'chemicalTreatment',
    'prevention',
    'precautions',
  ];
  listFields.forEach((field) => {
    if (has(field) && !isEmpty(payload[field]) && toStringList(payload[field]).length === 0) {
      errors.push({ field, message: `${field} must contain at least one entry` });
    }
  });

  return errors;
}

module.exports = {
  EMAIL_PATTERN,
  ALLOWED_SEVERITIES,
  isEmpty,
  isValidEmail,
  isValidObjectId,
  toStringList,
  requiredText,
  validateRegister,
  validateLogin,
  validateDisease,
};
