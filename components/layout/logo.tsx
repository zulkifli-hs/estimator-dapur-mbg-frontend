import Image from "next/image"
import Link from "next/link"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
      <Image src="/images/id-build-logo.png" alt="D+b Interior Design" width={120} height={40} className="h-8 w-auto" />
    </Link>
  )
}
