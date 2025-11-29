"use client"

import FileUploads from "@/components/file-uploads"

export default function FilesPage() {
  return (
    <div className="h-full overflow-y-auto space-y-6 scrollbar-hide">
      <FileUploads />
    </div>
  )
}

