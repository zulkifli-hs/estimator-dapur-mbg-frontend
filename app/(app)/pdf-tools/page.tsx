"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, X, FileText, GitMerge, Scissors, Archive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mergePdf, splitPdf, compressPdf, downloadBlob } from "@/lib/api/pdf-tools"
import { cn } from "@/lib/utils"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function DropZone({
  label,
  multiple,
  onFiles,
}: {
  label: string
  multiple?: boolean
  onFiles: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf")
      if (dropped.length > 0) onFiles(dropped)
    },
    [onFiles]
  )

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center">{label}</p>
      <p className="text-xs text-muted-foreground/70">Hanya file PDF</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? [])
          if (selected.length > 0) onFiles(selected)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// ─── Merge Tab ────────────────────────────────────────────────────────────────

function MergeTab() {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name))
      return [...prev, ...incoming.filter((f) => !existingNames.has(f.name))]
    })
  }

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ title: "Minimal 2 file PDF", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const blob = await mergePdf(files)
      downloadBlob(blob, "merged.pdf")
      toast({ title: "Berhasil!", description: "File PDF berhasil digabung dan diunduh." })
    } catch (err: any) {
      toast({ title: "Gagal Merge", description: err?.message ?? "Terjadi kesalahan.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <DropZone
        label="Klik atau drag & drop beberapa file PDF di sini"
        multiple
        onFiles={addFiles}
      />

      {files.length > 0 && (
        <div className="rounded-lg border divide-y">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleMerge}
        disabled={loading || files.length < 2}
        className="w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitMerge className="h-4 w-4 mr-2" />}
        Merge & Download
      </Button>
    </div>
  )
}

// ─── Split Tab ────────────────────────────────────────────────────────────────

function SplitTab() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<"all" | "range">("all")
  const [ranges, setRanges] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSplit = async () => {
    if (!file) {
      toast({ title: "Pilih file PDF terlebih dahulu", variant: "destructive" })
      return
    }
    if (mode === "range" && !ranges.trim()) {
      toast({ title: "Masukkan range halaman", description: "Contoh: 1-3,4,5-7", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const blob = await splitPdf(file, mode, ranges.trim() || undefined)
      downloadBlob(blob, "split-pages.zip")
      toast({ title: "Berhasil!", description: "Halaman PDF berhasil dipecah dan diunduh sebagai ZIP." })
    } catch (err: any) {
      toast({ title: "Gagal Split", description: err?.message ?? "Terjadi kesalahan.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <DropZone
          label="Klik atau drag & drop satu file PDF di sini"
          onFiles={([f]) => setFile(f)}
        />
      )}

      <div className="space-y-2">
        <Label>Mode Split</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "all" ? "default" : "outline"}
            onClick={() => setMode("all")}
          >
            Per Halaman
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "range" ? "default" : "outline"}
            onClick={() => setMode("range")}
          >
            Berdasarkan Range
          </Button>
        </div>
      </div>

      {mode === "range" && (
        <div className="space-y-1">
          <Label htmlFor="ranges">Range Halaman</Label>
          <Input
            id="ranges"
            placeholder="Contoh: 1-3,4,5-7"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Gunakan koma untuk memisahkan range. Setiap range akan menjadi satu file PDF dalam ZIP.
          </p>
        </div>
      )}

      <Button
        onClick={handleSplit}
        disabled={loading || !file}
        className="w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scissors className="h-4 w-4 mr-2" />}
        Split & Download ZIP
      </Button>
    </div>
  )
}

// ─── Compress Tab ─────────────────────────────────────────────────────────────

type CompressPreset = "auto" | "light" | "balanced" | "aggressive" | "maximum"

const PRESETS: { value: CompressPreset; label: string; description: string; dpi?: string }[] = [
  { value: "auto",       label: "Auto",      description: "Pilih otomatis tingkat terbaik (≥20% lebih kecil)" },
  { value: "light",      label: "Ringan",    description: "250 dpi — kualitas hampir sama",     dpi: "250 dpi" },
  { value: "balanced",   label: "Seimbang",  description: "150 dpi — kompresi baik",            dpi: "150 dpi" },
  { value: "aggressive", label: "Agresif",   description: "96 dpi — ukuran lebih kecil",        dpi: "96 dpi" },
  { value: "maximum",    label: "Maksimal",  description: "48 dpi — ukuran terkecil",           dpi: "48 dpi" },
]

function CompressTab() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preset, setPreset] = useState<CompressPreset>("auto")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ originalSize: number; compressedSize: number; engine: "ghostscript" | "pdf-lib"; dpiUsed?: number } | null>(null)

  const resetResult = () => setResult(null)

  const handleCompress = async () => {
    if (!file) {
      toast({ title: "Pilih file PDF terlebih dahulu", variant: "destructive" })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const { blob, originalSize, compressedSize, engine, dpiUsed } = await compressPdf(file, preset)
      setResult({ originalSize, compressedSize, engine, dpiUsed })
      downloadBlob(blob, "compressed.pdf")
      toast({ title: "Berhasil!", description: "File PDF berhasil dikompres dan diunduh." })
    } catch (err: any) {
      toast({ title: "Gagal Compress", description: err?.message ?? "Terjadi kesalahan.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={() => { setFile(null); resetResult() }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <DropZone
          label="Klik atau drag & drop satu file PDF di sini"
          onFiles={([f]) => { setFile(f); resetResult() }}
        />
      )}

      {/* Preset selector */}
      <div className="space-y-2">
        <Label>Tingkat Kompresi</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => { setPreset(p.value); resetResult() }}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                preset === p.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span className="text-sm font-medium">{p.label}</span>
                {p.dpi && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 tabular-nums">
                    {p.dpi}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground leading-snug">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Result info */}
      {result && (
        <div className={cn(
          "rounded-lg border p-4 space-y-2 text-sm",
          result.originalSize > result.compressedSize ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {result.originalSize > result.compressedSize ? "✓ Kompresi berhasil" : "File sudah teroptimasi"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                result.engine === "ghostscript" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"
              )}>
                {result.engine === "ghostscript" ? "Ghostscript" : "pdf-lib"}
              </span>
              {result.dpiUsed !== undefined && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
                  {result.dpiUsed} dpi
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Ukuran awal</span>
              <span>{formatBytes(result.originalSize)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ukuran setelah compress</span>
              <span>{formatBytes(result.compressedSize)}</span>
            </div>
            {result.originalSize > result.compressedSize ? (
              <div className="flex justify-between font-medium text-green-700">
                <span>Penghematan</span>
                <span>
                  {formatBytes(result.originalSize - result.compressedSize)}
                  {" "}({Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)}%)
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                File sudah dalam kondisi optimal, tidak ada penghematan lebih lanjut yang bisa dilakukan.
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={handleCompress}
        disabled={loading || !file}
        className="w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
        Compress & Download
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PdfToolsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PDF Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gabung, pecah, atau kompres file PDF langsung dari browser.
        </p>
      </div>

      <Tabs defaultValue="merge">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="merge" className="gap-2">
            <GitMerge className="h-4 w-4" />
            Merge
          </TabsTrigger>
          <TabsTrigger value="split" className="gap-2">
            <Scissors className="h-4 w-4" />
            Split
          </TabsTrigger>
          <TabsTrigger value="compress" className="gap-2">
            <Archive className="h-4 w-4" />
            Compress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="merge" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Merge PDF</CardTitle>
              <CardDescription>
                Gabungkan beberapa file PDF menjadi satu dokumen. Pilih minimal 2 file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MergeTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="split" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Split PDF</CardTitle>
              <CardDescription>
                Pecah satu file PDF menjadi beberapa file. Hasilnya akan diunduh sebagai file ZIP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SplitTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compress" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compress PDF</CardTitle>
              <CardDescription>
                Optimalkan ukuran file PDF dengan mengompres struktur dokumen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompressTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
