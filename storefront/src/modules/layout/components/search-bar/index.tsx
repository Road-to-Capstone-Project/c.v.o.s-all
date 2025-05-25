"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function SearchBar() {

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams)
            params.set(name, value)

            return params.toString()
        },
        [searchParams]
    )

    const setQueryParams = (name: string, value: string) => {
        const query = createQueryString(name, value)
        router.push(`${pathname}?${value ? query : ''}`)
    }

    const handleChange = (value: string) => {
        setQueryParams("q", value)
    }
    return (<div className="relative mr-2 hidden small:inline-flex">
        <input
            type="text"
            placeholder="Search for gaming products"
            onChange={(e) => handleChange(e.target.value as string)}
        />
    </div>)
}