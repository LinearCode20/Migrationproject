import type { LucideIcon } from "lucide-react"
import {
  BookmarkIcon,
  FileTextIcon,
  GalleryHorizontalEndIcon,
  GemIcon,
  MegaphoneIcon,
  TagIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"

/**
 * Canonical icon per entity, the single source of truth for entity iconography.
 * Always reference these instead of importing a lucide icon directly, so an entity
 * is recognisable by the same icon everywhere and the choice can't drift per-file.
 */
export const entityIcons = {
  tool: GemIcon,
  category: GalleryHorizontalEndIcon,
  tag: TagIcon,
  blog: FileTextIcon,
  user: UsersIcon,
  report: TriangleAlertIcon,
  ad: MegaphoneIcon,
  bookmark: BookmarkIcon,
} satisfies Record<string, LucideIcon>
