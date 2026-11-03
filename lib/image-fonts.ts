import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

function readFont(url: URL) {
  return readFileSync(fileURLToPath(url))
}

/**
 * Inter, the site's typeface, as static TTF files that satori can read (it
 * reads neither variable fonts nor WOFF2). `inter-display-600` is Inter's cut
 * for large sizes, which the site's variable font switches to on its own for
 * headings. Each file is cut down to Latin, Latin Extended, Greek and Cyrillic
 * from the Inter release (https://github.com/rsms/inter/releases) with:
 *
 * ```sh
 * pyftsubset Inter-Regular.ttf --output-file=inter-400.ttf \
 *   --layout-features="kern,liga,calt,ccmp,locl,mark,mkmk" \
 *   --unicodes="U+0000-024F,U+0259,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-036F,U+0370-03FF,U+0400-04FF,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2212,U+2215,U+FEFF,U+FFFD"
 * ```
 *
 * Each URL is a static literal (not a template) so the bundler traces the exact
 * file into the build output.
 */
export const imageFonts = {
  inter400: readFont(new URL("../assets/fonts/inter-400.ttf", import.meta.url)),
  inter500: readFont(new URL("../assets/fonts/inter-500.ttf", import.meta.url)),
  interDisplay600: readFont(new URL("../assets/fonts/inter-display-600.ttf", import.meta.url)),
}
