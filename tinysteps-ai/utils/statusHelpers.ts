/**
 * Shared status/color utility functions used across multiple components.
 *
 * Centralises the duplicate colorMap objects and status formatting functions
 * that were previously defined independently in ResultsView, GeneratedReportView,
 * PediatricianReportView, and ImproveDomainView.
 */

// ---------------------------------------------------------------------------
// Status -> Tailwind class helpers
// ---------------------------------------------------------------------------

/** Returns { bg, text, border } Tailwind classes for a domain-level status. */
export function getStatusClasses(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'ahead':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    case 'on-track':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'monitor':
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
    case 'discuss':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

/** Returns a combined "bg + text" class string for status badges (e.g. report views). */
export function statusBadgeClasses(status: string): string {
  const styles: Record<string, string> = {
    ahead: 'bg-emerald-100 text-emerald-700',
    'on-track': 'bg-blue-100 text-blue-700',
    monitor: 'bg-amber-100 text-amber-700',
    discuss: 'bg-red-100 text-red-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-700';
}

/** Returns a combined "text + bg" class string used in the PediatricianReportView. */
export function statusBadgeClassesPediatrician(status: string): string {
  switch (status) {
    case 'ahead':
      return 'text-emerald-600 bg-emerald-50';
    case 'on-track':
      return 'text-blue-600 bg-blue-50';
    case 'monitor':
      return 'text-amber-600 bg-amber-50';
    case 'discuss':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

// ---------------------------------------------------------------------------
// Score -> color
// ---------------------------------------------------------------------------

/** Returns a Tailwind text-color class based on a numeric score (0-100). */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

// ---------------------------------------------------------------------------
// Status labels
// ---------------------------------------------------------------------------

/** Default human-readable labels for status keys. */
export const DEFAULT_STATUS_LABELS: Record<string, string> = {
  ahead: 'Ahead',
  'on-track': 'On Track',
  monitor: 'Monitor',
  discuss: 'Discuss',
};

/**
 * Returns a human-readable label for a status string.
 * Falls back to title-casing the raw value when no mapping exists.
 */
export function getStatusLabel(status: string, overrides?: Record<string, string>): string {
  if (overrides?.[status]) return overrides[status];
  if (DEFAULT_STATUS_LABELS[status]) return DEFAULT_STATUS_LABELS[status];
  // Fallback: "on-track" -> "On Track", "ahead" -> "Ahead"
  return status
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
