import { RevinelProvider } from "@revinel/react"
import { Highseat } from "highseat/next"
import { type PropsWithChildren, Suspense } from "react"
import { Wrapper } from "~/components/common/wrapper"
import { AdBanner, AdBannerSkeleton } from "~/components/web/ads/ad-banner"
import { Footer } from "~/components/web/footer"
import { Header } from "~/components/web/header"
import { Backdrop } from "~/components/web/ui/backdrop"
import { Container } from "~/components/web/ui/container"
import { adsConfig } from "~/config/ads"
import { env } from "~/env"
import { isHighseatEnabled } from "~/services/analytics"

export default function ({ children }: PropsWithChildren) {
  return (
    <>
      <RevinelProvider
        workspaceId={env.NEXT_PUBLIC_REVINEL_WORKSPACE_ID ?? ""}
        apiUrl="/_proxy/revinel"
        appUrl={env.NEXT_PUBLIC_REVINEL_APP_URL}
      >
        <div className="flex flex-col min-h-dvh overflow-clip pt-(--header-inner-offset)">
          <Header />

          <Backdrop isFixed />

          {adsConfig.enabled && (
            <Suspense fallback={<AdBannerSkeleton />}>
              <AdBanner />
            </Suspense>
          )}

          <Container render={<Wrapper className="grow py-fluid-md" />}>
            {children}

            <Footer />
          </Container>
        </div>
      </RevinelProvider>

      {/* Loads the tracker from the site's own proxy path when `HIGHSEAT_PATH` is set. */}
      {isHighseatEnabled && <Highseat />}
    </>
  )
}
