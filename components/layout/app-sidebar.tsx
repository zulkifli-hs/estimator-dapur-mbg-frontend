"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { GemaLogo } from "@/components/gema-logo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { LayoutDashboard, FolderKanban, MessageSquare, Users, Settings, HelpCircle } from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface AppSidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  className?: string
}

const mainNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "AI Assistant", href: "/ai-assistant", icon: MessageSquare },
  { name: "Users", href: "/users", icon: Users },
]

const secondaryNavigation: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
]

export function AppSidebar({ collapsed = false, onCollapse, className }: AppSidebarProps) {
  const pathname = usePathname()

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
          isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "h-6 w-6")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Logo Header */}
      <div className="flex h-14 sm:h-16 items-center justify-between border-b px-4">
        {!collapsed && <GemaLogo className="h-6 sm:h-8" />}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main Menu</p>
          )}
          {mainNavigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other</p>
          )}
          {secondaryNavigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </ScrollArea>

      {!collapsed && (
        <div className="hidden lg:block border-t p-4">
          <div className="rounded-lg bg-primary/5 p-3">
            <p className="text-sm font-medium">Need Help?</p>
            <p className="text-xs text-muted-foreground mt-1">Contact our support team for assistance</p>
            <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
              Get Support
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}
