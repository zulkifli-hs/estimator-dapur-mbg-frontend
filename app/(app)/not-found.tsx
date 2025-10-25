import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, FolderSearch } from "lucide-react"

export default function AppNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <FolderSearch className="h-16 w-16 text-primary" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-foreground">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground">
            Halaman yang Anda cari tidak tersedia. Mungkin telah dihapus atau URL-nya salah.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
            <Link href="/projects">
              <FolderSearch className="h-4 w-4" />
              Lihat Projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
