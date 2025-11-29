"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Menu, Loader2, FileText, Brain, Bell, MessageSquare } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { toggleSidebar } from "@/lib/store/slices/uiSlice"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import {
  GlobalSearchResponse,
  ChatSearchResult,
  FileSearchResult,
  MemorySearchResult,
  SmartInboxSearchResult,
} from "@/lib/api/types"

interface SearchResultsState {
  memories: MemorySearchResult[]
  files: FileSearchResult[]
  smartInbox: SmartInboxSearchResult[]
  chats: ChatSearchResult[]
}

export default function Header() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResultsState | null>(null)

  const latestQueryRef = useRef("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const initials = useMemo(() => {
    const fullName = (user?.user_metadata?.full_name as string) || user?.email || ""
    return fullName
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "YY"
  }, [user])

  const trimmedQuery = query.trim()

  const fetchResults = useCallback(
    async (term: string) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      latestQueryRef.current = term
      setLoading(true)
      setError(null)

      try {
        const { data } = await apiClient.get<GlobalSearchResponse>(API_ENDPOINTS.SEARCH, {
          params: { q: term },
          signal: controller.signal,
        })

        if (latestQueryRef.current === term) {
          setResults(data.results)
          setSearchOpen(true)
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        if (latestQueryRef.current === term) {
          setError("Unable to fetch search results. Please try again.")
          setResults(null)
          setSearchOpen(true)
        }
      } finally {
        if (latestQueryRef.current === term) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    const term = trimmedQuery
    if (term.length < 2) {
      abortControllerRef.current?.abort()
      setLoading(false)
      if (term.length === 0) {
        setResults(null)
        setError(null)
      }
      return
    }

    const handler = setTimeout(() => {
      fetchResults(term)
    }, 350)

    return () => clearTimeout(handler)
  }, [trimmedQuery, fetchResults])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const handleNavigate = (path: string, itemId?: string, itemType?: string) => {
    setSearchOpen(false)
    // For chat messages, add message ID to URL hash for scrolling
    if (itemType === "chat" && itemId) {
      router.push(`${path}#message-${itemId}`)
    }
    // For notifications, add notification ID to URL
    else if (itemType === "notification" && itemId) {
      router.push(`${path}?notification=${itemId}`)
    }
    // For memories, add memory ID to URL
    else if (itemType === "memory" && itemId) {
      router.push(`${path}?memory=${itemId}`)
    }
    // For files, add file ID to URL
    else if (itemType === "file" && itemId) {
      router.push(`${path}?file=${itemId}`)
    }
    // Default navigation
    else {
      router.push(path)
    }
  }

  const highlightMatch = (text: string) => {
    if (!trimmedQuery) return text
    const lower = text.toLowerCase()
    const needle = trimmedQuery.toLowerCase()
    const idx = lower.indexOf(needle)
    if (idx === -1) return text
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + trimmedQuery.length)
    const after = text.slice(idx + trimmedQuery.length)
    return (
      <>
        {before}
        <span className="text-white font-semibold">{match}</span>
        {after}
      </>
    )
  }

  const renderSnippet = (text: string) => {
    const snippet = text.length > 160 ? `${text.slice(0, 157)}…` : text
    return highlightMatch(snippet)
  }

  const categoryConfig = [
    {
      key: "memories" as const,
      label: "Memory Bank",
      icon: Brain,
      path: "/memory",
      items: results?.memories ?? [],
      emptyMessage: "No memories match that query yet.",
      render: (item: MemorySearchResult) => renderSnippet(item.content),
    },
    {
      key: "files" as const,
      label: "Uploaded Files",
      icon: FileText,
      path: "/files",
      items: results?.files ?? [],
      emptyMessage: "No files matched that query.",
      render: (item: FileSearchResult) => (
        <>
          <p className="text-sm text-white font-medium">{item.fileName}</p>
          <p className="mt-1 text-xs text-gray-400">{renderSnippet(item.content)}</p>
        </>
      ),
    },
    {
      key: "smartInbox" as const,
      label: "Smart Inbox",
      icon: Bell,
      path: "/inbox",
      items: results?.smartInbox ?? [],
      emptyMessage: "No notifications match yet.",
      render: (item: SmartInboxSearchResult) => renderSnippet(item.content),
    },
    {
      key: "chats" as const,
      label: "Chat History",
      icon: MessageSquare,
      path: "/chat",
      items: results?.chats ?? [],
      emptyMessage: "No chat messages match that query.",
      render: (item: ChatSearchResult) => (
        <>
          <p className="text-xs uppercase text-gray-500">{item.role === "assistant" ? "Assistant" : "You"}</p>
          <p className="text-sm text-white">{renderSnippet(item.content)}</p>
        </>
      ),
    },
  ]

  const hasResults =
    !!results &&
    (results.memories.length > 0 ||
      results.files.length > 0 ||
      results.smartInbox.length > 0 ||
      results.chats.length > 0)

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
          <div className="flex-1 relative" ref={searchContainerRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search chats, memories, files, inbox..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                if (!searchOpen) setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C586C0]/50 focus:bg-white/10 transition-all"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C586C0] animate-spin" />
            )}

            {searchOpen && (
              <div className="absolute left-0 right-0 top-[110%] bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl p-4 mt-2 space-y-4 max-h-[28rem] overflow-y-auto">
                {trimmedQuery.length < 2 && !error ? (
                  <p className="text-xs text-gray-400">
                    Type at least two characters to search your uploaded files, memory bank, smart inbox, and chats.
                  </p>
                ) : loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C586C0]" />
                    Searching your second brain…
                  </div>
                ) : error ? (
                  <p className="text-xs text-red-400">{error}</p>
                ) : hasResults ? (
                  categoryConfig.map(({ key, label, icon: Icon, path, items, emptyMessage, render }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          <Icon className="w-4 h-4 text-[#C586C0]" />
                          {label}
                        </div>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleNavigate(path)}
                          className="text-[11px] text-gray-400 hover:text-white transition-colors"
                        >
                          View page
                        </button>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-xs text-gray-600">{emptyMessage}</p>
                      ) : (
                        <ul className="space-y-2">
                          {items.map((item) => {
                            // Determine item type and ID for deep linking
                            let itemId: string | undefined
                            let itemType: string | undefined
                            
                            if (key === "chats") {
                              itemId = (item as ChatSearchResult).messageId || item.id
                              itemType = "chat"
                            } else if (key === "smartInbox") {
                              itemId = (item as SmartInboxSearchResult).notificationId || item.id
                              itemType = "notification"
                            } else if (key === "memories") {
                              itemId = item.id
                              itemType = "memory"
                            } else if (key === "files") {
                              itemId = (item as FileSearchResult).fileId || item.id
                              itemType = "file"
                            }
                            
                            return (
                              <li
                                key={item.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleNavigate(path, itemId, itemType)}
                                className="p-3 rounded-lg border border-white/5 hover:border-[#C586C0]/40 hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <div className="text-sm text-gray-300 leading-snug">{render(item)}</div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">
                    No results yet. Try adjusting your keywords or provide more context.
                  </p>
                )}
              </div>
            )}
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
