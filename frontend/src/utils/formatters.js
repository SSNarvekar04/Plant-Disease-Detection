/**
 * Small formatting helpers shared by the UI.
 * Kept dependency-free so the output is predictable.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "5 Oct 2026, 14:32" */
export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${time}`;
}

/** "5 Oct 2026" */
export function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "3 minutes ago", "Yesterday", "12 Sep 2026" */
export function formatRelative(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return formatShortDate(value);
}

/** "94.5%" */
export function formatPercent(value, decimals = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${value.toFixed(decimals)}%`;
}

/** "Tomato Early Blight" -> "Tomato — Early Blight" */
export function formatPlantDisease(plantName, diseaseName) {
  if (!plantName) return diseaseName || '';
  if (!diseaseName) return plantName;
  return `${plantName} — ${diseaseName}`;
}

/** Turns "Tomato___Early_blight" into "Tomato Early Blight". */
export function prettifyClassName(className) {
  if (!className) return '';
  const [plant, label] = String(className).split('___');
  const disease = (label || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return disease ? `${plant} ${disease}` : plant;
}

/** Turns "leaf.jpg" into "JPG". */
export function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** Uppercases the first letter, e.g. for status labels. */
export function titleCase(value) {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** First letter of a name, for avatar placeholders. */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}