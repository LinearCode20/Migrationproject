import type { Prisma } from "~/.generated/prisma/client"
import { db } from "~/services/db"

/**
 * Create a report. Caller is responsible for permission gating; this function
 * performs pure data access.
 */
export async function createReport(data: Prisma.ReportUncheckedCreateInput) {
  return db.report.create({ data })
}

/**
 * Partial update on a report by id.
 */
export async function updateReport(id: string, data: Prisma.ReportUncheckedUpdateInput) {
  return db.report.update({ where: { id }, data })
}

/**
 * Hard-delete reports by id.
 */
export async function removeReports(ids: string[]) {
  return db.report.deleteMany({ where: { id: { in: ids } } })
}
