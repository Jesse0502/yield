"use client"

import { useMemo } from "react"
import { Search, Menu } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { toggleSidebar } from "@/lib/store/slices/uiSlice"

export default function Header() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const initials = useMemo(() => {
    const fullName = (user?.user_metadata?.full_name as string) || user?.email || ""
    return fullName
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "YY"
  }, [user])

  return (
    <header className="px-4 sm:px-6 py-4 border-b border-white/10 glassmorphic mx-4 sm:mx-6 mt-4 rounded-lg sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <button
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors md:hidden"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search your second brain..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C586C0]/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C586C0] to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm text-white truncate max-w-[120px]">
                {(user?.user_metadata?.full_name as string) || user?.email || "Yield User"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
