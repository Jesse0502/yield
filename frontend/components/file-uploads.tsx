"use client"

import { useRef } from "react"
import { FileText, Upload, Download, Share2, Trash2, File, Clock, User } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { uploadFile, resetError } from "@/lib/store/slices/filesSlice"

export default function FileUploads() {
  const { files, uploadProgress, loading, error } = useAppSelector((state) => state.files)
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (file: File | null | undefined) => {
    if (!file) return
    dispatch(uploadFile(file))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    handleUpload(selectedFile)
    // Allow selecting the same file again
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    handleUpload(droppedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }


  const fileTypeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    pdf: { icon: FileText, color: "text-red-400", bg: "bg-red-500/10" },
    document: { icon: File, color: "text-blue-400", bg: "bg-blue-500/10" },
    spreadsheet: { icon: FileText, color: "text-green-400", bg: "bg-green-500/10" },
    image: { icon: FileText, color: "text-[#C586C0]", bg: "bg-[#C586C0]/10" },
    other: { icon: FileText, color: "text-gray-400", bg: "bg-gray-500/10" },
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-mono font-semibold text-white flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#C586C0]" />
          File Uploads
        </h2>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="glassmorphic border-2 border-dashed border-white/20 rounded-lg p-8 hover:border-[#C586C0]/50 transition-all cursor-pointer group"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            multiple={false}
          />
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-8 h-8 text-[#C586C0] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white mb-1">Drag and drop files here</p>
            <p className="text-xs text-gray-500">or click to browse (TXT, MD, PDF, CSV, XLSX, XLS)</p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4 w-full max-w-xs">
                <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#C586C0] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">{uploadProgress}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-2 rounded-lg">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              onClick={() => dispatch(resetError())}
              className="text-xs underline hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading && !files.length && <div className="text-gray-400 text-sm mb-4">Loading files...</div>}

      {/* Files List */}
      <div className="space-y-3">
        {files.length === 0 && !loading && (
             <div className="text-center text-sm text-gray-500 bg-white/5 border border-dashed border-white/10 rounded-lg py-12">
               No files uploaded yet.
             </div>
        )}
        {files.map((file) => {
          const fileConfig = fileTypeConfig[file.type] || fileTypeConfig.other
          const FileIcon = fileConfig.icon

          return (
            <div
              key={file.id}
              className={`glassmorphic border border-white/10 ${fileConfig.bg} bg-gradient-to-r from-white/5 to-transparent p-4 hover:border-white/20 transition-all group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${fileConfig.bg}`}>
                    <FileIcon className={`w-5 h-5 ${fileConfig.color}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-mono font-semibold text-white">{file.name}</h3>
                    <p className="text-xs font-mono text-gray-500">{file.size}</p>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
                    <Download className="w-4 h-4 text-gray-400 hover:text-[#C586C0]" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
                    <Share2 className="w-4 h-4 text-gray-400 hover:text-[#C586C0]" />
                  </button>
                  <button
                    // onClick={() => dispatch(deleteFile(file.id))}
                    className="p-2 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {file.uploadedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {file.uploadedAt}
                  </span>
                </div>

                <div className="flex gap-1">
                  {file.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs font-mono px-2 py-1 rounded-full bg-white/5 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
