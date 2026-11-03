// Weekdays that publish one scheduled listing each, with 0 as Sunday. The publish cron runs daily
// at midnight UTC, so a listing goes live at the start of its day.
const publishDays = [1, 3, 5]

export const submissionsConfig = {
  publishDays,

  // Number of submissions per week (to calculate the submission queue length).
  postingRate: publishDays.length,

  // Queue size above which submitters see the expected wait for a free listing.
  queueNoticeThreshold: 10,

  // Minimum days into the future a post must be scheduled to show expedite nudges.
  expediteThreshold: 7,
}
