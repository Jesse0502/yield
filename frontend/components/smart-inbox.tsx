"use client"

import { useEffect } from "react"
import { Mail, AlertCircle, CheckCircle2, ArrowRight, Bell, Trash2 } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { selectInsight, fetchNotifications, deleteNotification } from "@/lib/store/slices/inboxSlice"

export default function SmartInbox() {
  const { insights, loading } = useAppSelector((state) => state.inbox)
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Initial fetch
    dispatch(fetchNotifications())

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchNotifications())
    }, 30000)

    return () => clearInterval(interval)
  }, [dispatch])

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent triggering card selection
    if (confirm("Are you sure you want to delete this notification?")) {
      dispatch(deleteNotification(id))
    }
  }

  const priorityConfig = {
    high: {
      bg: "from-red-500/10 to-pink-500/10",
      border: "border-red-500/30",
      icon: AlertCircle,
      glow: "shadow-red-500/20",
    },
    medium: {
      bg: "from-yellow-500/10 to-orange-500/10",
      border: "border-yellow-500/30",
      icon: Bell,
      glow: "shadow-yellow-500/20",
    },
    low: {
      bg: "from-cyan-500/10 to-blue-500/10",
      border: "border-cyan-500/30",
      icon: CheckCircle2,
      glow: "shadow-cyan-500/20",
    },
  }

  return (
    <section>
      <h2 className="text-lg font-mono font-semibold text-white mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5 text-[#C586C0]" />
        Smart Inbox Ticker
      </h2>

      {loading && !insights.length && (
        <div className="text-gray-400 text-sm mb-4">Checking for updates...</div>
      )}

      {!loading && !insights.length && (
        <div className="text-center text-sm text-gray-500 bg-white/5 border border-dashed border-white/10 rounded-lg py-10 px-4">
          <p className="mb-2">No new notifications.</p>
          <p>You're all caught up!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight) => {
          const config = priorityConfig[insight.priority] || priorityConfig.medium
          const Icon = config.icon

          return (
            <div
              key={insight.id}
              onClick={() => dispatch(selectInsight(insight.id))}
              className={`glassmorphic border-2 ${config.border} bg-gradient-to-br ${config.bg} p-4 hover:border-opacity-100 transition-all duration-200 cursor-pointer group relative`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <Icon
                  className={`w-5 h-5 ${insight.priority === "high" ? "text-red-400" : insight.priority === "medium" ? "text-yellow-400" : "text-cyan-400"}`}
                />
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      insight.priority === "high"
                        ? "bg-red-500/20 text-red-300"
                        : insight.priority === "medium"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                  </span>
                  
                  <button
                    onClick={(e) => handleDelete(e, insight.id)}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-sm font-mono font-semibold text-white mb-2">{insight.title}</h3>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">{insight.summary}</p>

              {insight.sender && (
                <p className="text-xs font-mono text-gray-500 mb-3">
                  {insight.sender} • {insight.timestamp}
                </p>
              )}

              {/* Action Button */}
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-[#C586C0]/20 to-cyan-500/20 text-[#C586C0] text-xs font-medium hover:from-[#C586C0]/30 hover:to-cyan-500/30 transition-all group-hover:translate-x-1">
                View
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
