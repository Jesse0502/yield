"use client"

import { MessageSquare, Mail, FileText, HelpCircle, X, LogOut } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { setSidebarOpen } from "@/lib/store/slices/uiSlice"
import { logout } from "@/lib/store/slices/authSlice"
import { fetchNotifications } from "@/lib/store/slices/inboxSlice"
import { useMemo, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen)
  const user = useAppSelector((state) => state.auth.user)
  const insights = useAppSelector((state) => state.inbox.insights)
  const dispatch = useAppDispatch()
  const pathname = usePathname()

  // Fetch notifications on mount to update badge
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications())
    }
  }, [dispatch, user])

  const unreadCount = useMemo(() => {
    return insights.filter(i => !i.isRead).length
  }, [insights])

  const navItems = [
    { id: "chat", label: "Chat Assistant", icon: MessageSquare, notification: false, path: "/chat" },
    { id: "inbox", label: "Smart Inbox", icon: Mail, notification: unreadCount > 0, path: "/inbox" },
    { id: "memory", label: "Memory Bank", icon: FileText, notification: false, path: "/memory" },
    { id: "files", label: "File Uploads", icon: FileText, notification: false, path: "/files" },
  ]

  const initials = useMemo(() => {
    const fullName = (user?.user_metadata?.full_name as string) || user?.email || ""
    return fullName
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "YY"
  }, [user])

  const handleLogout = () => {
    dispatch(logout())
    dispatch(setSidebarOpen(false))
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => dispatch(setSidebarOpen(false))}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glassmorphic flex flex-col border-r border-white/10 max-h-screen overflow-y-auto transform transition-transform duration-300 md:static md:translate-x-0 md:h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-400">&gt;</span>
            <h1 className="text-lg font-mono font-normal text-[#C586C0] lowercase">yield</h1>
          </div>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Logo */}
        <div className="hidden md:flex items-center gap-2 p-6 border-b border-white/10">
          <span className="text-sm font-mono text-gray-400">&gt;</span>
          <h1 className="text-lg font-mono font-normal text-[#C586C0] lowercase">
            yield<span className="cursor-blink"></span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => dispatch(setSidebarOpen(false))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#C586C0]/20 to-cyan-500/20 border border-[#C586C0]/50 text-[#C586C0]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.notification && (
                  <div className="ml-auto flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 glow-cyan animate-pulse" />
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Help & Logout Section */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Help</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log Out</span>
          </button>
        </div>

        {/* User Profile */}
        <Link
          href="/profile"
          onClick={() => dispatch(setSidebarOpen(false))}
          className={`p-4 border-t border-white/10 flex items-center gap-3 w-full text-left hover:bg-white/5 transition-colors ${
            pathname === "/profile" ? "bg-white/5" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C586C0] to-cyan-500 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {(user?.user_metadata?.full_name as string) || "New Yield User"}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email || "email@yield.com"}</p>
          </div>
        </Link>
      </aside>
    </>
  )
}
