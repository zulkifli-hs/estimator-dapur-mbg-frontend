"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { GemaLogo } from "@/components/gema-logo"
import { Menu, Search, Bell, User, LogOut, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

interface AppHeaderProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onMenuClick?: () => void
  showSearch?: boolean
  mobileMenuContent?: React.ReactNode
}

export function AppHeader({ user, onMenuClick, showSearch = true, mobileMenuContent }: AppHeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          {mobileMenuContent ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                {mobileMenuContent}
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Search Bar - Desktop */}
        {showSearch && (
          <div className="hidden flex-1 md:flex md:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Search projects, documents..." className="w-full pl-9" />
            </div>
          </div>
        )}

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Search Button - Mobile */}
          {showSearch && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium text-primary">{user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="hidden md:flex md:flex-col md:items-start">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && searchOpen && (
        <div className="border-t px-4 py-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search projects, documents..." className="w-full pl-9" autoFocus />
          </div>
        </div>
      )}
    </header>
  )
}
