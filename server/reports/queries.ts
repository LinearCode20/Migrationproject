import { getPageCount, getPagination, isTruthy } from "@dirstack/utils"
import type { Prisma } from "~/.generated/prisma/client"
import type { ReportListParams } from "~/server/reports/schema"
import { createdAtRange, toOrderBy } from "~/server/shared/pagination"
import { db } from "~/services/db"

const reportToolInclude = {
  tool: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.ReportInclude

export async function findReports(search: ReportListParams) {
  const { message, page, perPage, sort, from, to, type } = search

  const expressions: (Prisma.ReportWhereInput | undefined)[] = [
    message ? { message: { contains: message, mode: "insensitive" } } : undefined,
    type.length > 0 ? { type: { in: type } } : undefined,
    createdAtRange(from, to),
  ]

  const where: Prisma.ReportWhereInput = {
    AND: expressions.filter(isTruthy),
  }

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: toOrderBy(sort),
      ...getPagination({ page, perPage }),
      include: reportToolInclude,
    }),

    db.report.count({
      where,
    }),
  ])

  return { reports, total, pageCount: getPageCount(total, perPage) }
}

export async function findReportById(id: string) {
  return db.report.findUnique({
    where: { id },
    include: reportToolInclude,
  })
}
