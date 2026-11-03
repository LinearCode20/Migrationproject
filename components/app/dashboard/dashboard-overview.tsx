import {
  RevenueMetric,
  UserMetric,
  VisitorMetric,
} from "~/components/app/dashboard/dashboard-metrics"
import { DashboardStats } from "~/components/app/dashboard/dashboard-stats"
import { ScheduleCalendar } from "~/components/app/dashboard/schedule-calendar"

/**
 * Admin operations overview: counts, traffic/revenue/signup charts, and the
 * publication calendar. Gated by the `metrics.read` permission at the call
 * site, so it only renders for roles that hold it.
 */
export function DashboardOverview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 snap-row *:flex-1 *:min-w-48">
        <DashboardStats />
      </div>

      <div className="flex gap-4 snap-row *:flex-1 *:min-w-72">
        <VisitorMetric />
        <RevenueMetric />
        <UserMetric />
      </div>

      <ScheduleCalendar className="w-full" />
    </div>
  )
}
