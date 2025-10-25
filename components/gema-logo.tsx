import Image from "next/image"

export function GemaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/images/gema-logo.png"
        alt="Gema Interior Design"
        width={160}
        height={53}
        className="h-10 w-auto"
        priority
      />
    </div>
  )
}
