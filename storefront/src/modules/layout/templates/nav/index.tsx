import AccountButton from "@modules/account/components/account-button"
import CartButton from "@modules/cart/components/cart-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FilePlus from "@modules/common/icons/file-plus"
import LogoIcon from "@modules/common/icons/_logo"
import { MegaMenuWrapper } from "@modules/layout/components/mega-menu"
import { RequestQuotePrompt } from "@modules/quotes/components/request-quote-prompt"
import SkeletonAccountButton from "@modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@modules/skeletons/components/skeleton-cart-button"
import SkeletonMegaMenu from "@modules/skeletons/components/skeleton-mega-menu"
import { Suspense, useCallback } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { SearchBar } from "@modules/layout/components/search-bar"


export function NavigationHeader() {

  return (
    <div className="sticky top-0 inset-x-0 group bg-white text-zinc-900 small:p-4 p-2 text-sm border-b duration-200 border-ui-border-base z-50">
      <header className="flex w-full content-container relative small:mx-auto justify-between">
        <div className="small:mx-auto flex justify-between items-center min-w-full">
          <div className="flex items-center small:space-x-4">
            <LocalizedClientLink
              className="hover:text-ui-fg-base flex items-center w-fit"
              href="/"
            >
              <h1 className="small:text-base text-sm font-medium flex items-center gap-1">
                <LogoIcon className="inline mr-2" />
                C.V.O.S
              </h1>
            </LocalizedClientLink>

            <nav>
              <ul className="space-x-4 hidden small:flex">
                <li>
                  <Suspense fallback={<SkeletonMegaMenu />}>
                    <MegaMenuWrapper />
                  </Suspense>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex justify-end items-center gap-2">
            <SearchBar />

            <div className="h-4 w-px bg-neutral-300" />

            {/* <RequestQuotePrompt>
              <button className="flex gap-1.5 items-center rounded-2xl bg-none shadow-none border-none hover:bg-neutral-100 px-2 py-1">
                <FilePlus />
                <span className="hidden small:inline-block">Quote</span>
              </button>
            </RequestQuotePrompt> */}

            <Suspense fallback={<SkeletonAccountButton />}>
              <AccountButton />
            </Suspense>

            <Suspense fallback={<SkeletonCartButton />}>
              <CartButton />
            </Suspense>
          </div>
        </div>
      </header>
    </div>
  )
}
