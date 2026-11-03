import { adsConfig } from "~/config/ads"

/**
 * Page sizes for the public listings. Fixed rather than URL params: no listing
 * has a page-size control, and as a param any visitor could ask for a huge page.
 */
export const paginationConfig = {
  // A full grid, minus whatever the ad slots consume.
  toolsPerPage: 36 - (adsConfig.enabled ? adsConfig.adsPerPage : 0),

  // Tags render as compact chips, so many more fit on a page.
  tagsPerPage: 96,
}
