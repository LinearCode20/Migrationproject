import { isTruthy, tryCatch } from "@dirstack/utils"
import { redirect } from "next/navigation"
import { createLoader, parseAsString, type SearchParams } from "nuqs/server"
import type { ComponentProps } from "react"
import { Product } from "~/components/web/products/product"
import { ProductList } from "~/components/web/products/product-list"
import type { ProductProps, ProductWithPrices } from "~/lib/products"
import { getProductsForListing } from "~/server/products/queries"

interface ProductQueryProps extends ComponentProps<typeof ProductList> {
  searchParams: Promise<SearchParams>
  checkoutData: Omit<ComponentProps<typeof Product>["checkoutData"], "discountCode">
  getProductProps?: (item: ProductWithPrices) => ProductProps
  redirectToIfEmpty?: string
}

export async function ProductQuery({
  searchParams,
  checkoutData,
  getProductProps,
  redirectToIfEmpty,
  ...props
}: ProductQueryProps) {
  const loadSearchParams = createLoader({ discountCode: parseAsString.withDefault("") })
  const { discountCode } = await loadSearchParams(searchParams)
  const { data: products, error } = await tryCatch(getProductsForListing(discountCode))

  // A failed catalog load lists nothing, so the page falls through to `redirectToIfEmpty`.
  // The catch sits here, not in the cached Stripe query, so one outage is not cached for
  // hours as an empty catalog.
  if (error) {
    console.error("Failed to load products for listing:", error)
  }

  const items = (products ?? [])
    .map(item => ({ ...item, customProps: getProductProps?.(item) }))
    .filter(({ customProps }) => isTruthy(customProps))

  // Nothing is purchasable when every listed product is disabled.
  if (!items.some(({ customProps }) => !customProps?.isDisabled)) {
    if (redirectToIfEmpty) {
      throw redirect(redirectToIfEmpty)
    }

    return null
  }

  return (
    <ProductList {...props}>
      {items.map(({ product, prices, coupon, customProps }, index) => (
        <Product
          key={product.id}
          data={{ product: { ...product, ...customProps?.product }, prices, coupon }}
          checkoutData={{ ...checkoutData, discountCode }}
          features={customProps?.features}
          isHighlighted={index === items.length - 1}
          isDisabled={customProps?.isDisabled}
          buttonLabel={customProps?.buttonLabel}
        />
      ))}
    </ProductList>
  )
}
