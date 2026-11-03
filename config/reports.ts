export const reportsConfig = {
  // Whether to enable reports.
  enabled: true,

  // Whether to require sign in to report.
  requireSignIn: false,
}

/** Short, human-friendly report reference, e.g. `#A1B2C3`. */
export function formatReportId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`
}
