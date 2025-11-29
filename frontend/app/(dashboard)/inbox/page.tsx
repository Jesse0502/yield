"use client"

import SmartInbox from "@/components/smart-inbox"

export default function InboxPage() {
  return (
    <div className="h-full overflow-y-auto space-y-6 scrollbar-hide">
      <SmartInbox />
    </div>
  )
}

