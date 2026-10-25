/**
 * Visual constants for disease severity.
 *
 * Severity values come from the `severity` field of the Disease model:
 * Low | Medium | High | Critical. Keeping the colours here means the badge,
 * the filter chips and the result card always agree.
 */

const SEVERITY_STYLES = {
  Low: {
    label: 'Low',
    badge: 'bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200',
    dot: 'bg-leaf-500',
    border: 'border-l-leaf-500',
    bar: 'bg-leaf-500',
    description: 'Minor damage. Monitor the plant and follow the prevention steps.',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
    bar: 'bg-amber-500',
    description: 'Treatable damage. Apply the recommended treatment promptly.',
  },
  High: {
    label: 'High',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    dot: 'bg-orange-500',
    border: 'border-l-orange-500',
    bar: 'bg-orange-500',
    description: 'Serious damage. Act quickly to stop it spreading to other plants.',
  },
  Critical: {
    label: 'Critical',
    badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    dot: 'bg-red-500',
    border: 'border-l-red-500',
    bar: 'bg-red-500',
    description: 'Severe damage. Isolate the plant and seek expert advice immediately.',
  },
};

/** @returns {{label:string, badge:string, dot:string, border:string, bar:string, description:string}} */
export function severityStyle(severity = 'Medium') {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.Medium;
}

/** Colour of the confidence bar, based on the percentage. */
export function confidenceStyle(confidence = 0) {
  if (confidence >= 85) return { label: 'High confidence', text: 'text-leaf-600 dark:text-leaf-400', bar: 'bg-leaf-500' };
  if (confidence >= 70) return { label: 'Good confidence', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' };
  return { label: 'Low confidence', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' };
}

/** Badge + colours for a prediction status. */
export const STATUS_STYLES = {
  detected: {
    label: 'Disease detected',
    badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  },
  healthy: {
    label: 'Healthy leaf',
    badge: 'bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200',
  },
  low_confidence: {
    label: 'Low confidence',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  },
  failed: {
    label: 'Failed',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

export function statusStyle(status = 'detected') {
  return STATUS_STYLES[status] || STATUS_STYLES.detected;
}

/** Marks where a prediction came from. Every AI answer comes from Plant.id. */
export const SOURCE_STYLES = {
  'plant.id': { label: 'Plant.id AI', badge: 'bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200' },
  manual: { label: 'Sample record', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' },
};

export function sourceStyle(source = 'plant.id') {
  return SOURCE_STYLES[source] || SOURCE_STYLES['plant.id'];
}

/** Plants shown on the landing page and in the detection tips. */
export const SUPPORTED_PLANTS = [
  { name: 'Tomato', icon: '🍅', diseases: 10 },
  { name: 'Potato', icon: '🥔', diseases: 3 },
  { name: 'Apple', icon: '🍎', diseases: 4 },
  { name: 'Corn', icon: '🌽', diseases: 4 },
  { name: 'Grape', icon: '🍇', diseases: 4 },
  { name: 'Pepper', icon: '🫑', diseases: 2 },
  { name: 'Strawberry', icon: '🍓', diseases: 2 },
];