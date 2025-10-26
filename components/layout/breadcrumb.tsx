"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

export function Breadcrumb() {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname?.split("/").filter(Boolean) || []
    const breadcrumbs = [{ label: "Home", href: "/dashboard" }]

    let currentPath = ""
    paths.forEach((path, index) => {
      currentPath += `/${path}`

      // Format the label (capitalize and replace hyphens)
      let label = path.charAt(0).toUpperCase() + path.slice(1)
      label = label.replace(/-/g, " ")

      // Check if it's an ID (MongoDB ObjectId pattern or UUID)
      const isId =
        /^[a-f0-9]{24}$/i.test(path) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path)

      if (isId) {
        label = "Detail"
      }

      breadcrumbs.push({
        label,
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground truncate max-w-[200px]">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0"
            >
              {index === 0 && <Home className="h-4 w-4" />}
              <span className="hidden sm:inline">{crumb.label}</span>
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
