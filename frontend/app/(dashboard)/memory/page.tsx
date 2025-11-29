"use client"

import MemoryBank from "@/components/memory-bank"

export default function MemoryPage() {
  return (
    <div className="h-full overflow-y-auto space-y-6 scrollbar-hide">
      <MemoryBank />
    </div>
  )
}

