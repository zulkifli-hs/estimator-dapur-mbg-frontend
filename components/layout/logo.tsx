import Link from "next/link"
import { DapurCekLogo } from "@/components/dapurcek-logo"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <DapurCekLogo className="h-8" />
    </Link>
  )
}
