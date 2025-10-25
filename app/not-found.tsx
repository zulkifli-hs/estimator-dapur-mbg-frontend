import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Number */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-foreground">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground text-lg">
            Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Halaman Sebelumnya
            </Link>
          </Button>
        </div>

        {/* Decorative Element */}
        <div className="pt-8 opacity-50">
          <svg
            className="mx-auto h-32 w-32 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
