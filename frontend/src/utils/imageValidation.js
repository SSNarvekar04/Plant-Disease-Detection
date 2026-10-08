/**
 * Image validation shared by the uploader component and the detect page.
 * Mirrors the rules the backend enforces, so the user gets instant feedback
 * instead of a round trip.
 */

export const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
export const MAX_FILE_SIZE_MB = 5; // must match MAX_FILE_SIZE_MB in backend/.env

/**
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'Please choose an image first.' };

  const extension = `.${String(file.name).split('.').pop()?.toLowerCase() ?? ''}`;
  const typeOk = ACCEPTED_TYPES.includes(file.mimetype?.toLowerCase());
  const extensionOk = ACCEPTED_EXTENSIONS.includes(extension);

  if (!typeOk || !extensionOk) {
    return { valid: false, error: 'Only JPG, JPEG and PNG images are supported.' };
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Image is too large. The maximum size is ${MAX_FILE_SIZE_MB} MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected image is empty.' };
  }

  return { valid: true };
}

/**
 * Reads a File into a data URL for the preview.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected image'));
    reader.readAsDataURL(file);
  });
}