"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Send, Paperclip, Bot, Loader2 } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { sendMessage, setInputValue, resetError, fetchChatHistory } from "@/lib/store/slices/chatSlice"
import type { RootState } from "@/lib/store/types"
import type { Message } from "@/lib/store/slices/chatSlice"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function ChatInterface() {
  const {
    messages,
    inputValue,
    loading,
    error,
    streaming,
    currentStreamId,
    historyLoading,
    hasMoreHistory,
    historyCursor,
    initialHistoryLoaded,
  } = useAppSelector((state: RootState) => state.chat)
  const dispatch = useAppDispatch()
  const listRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingOlderRef = useRef(false)

  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false)

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'instant', block: 'end' })
    }
  }, [])

  const fetchOlderMessagesRef = useRef<(() => Promise<void> | void) | null>(null)

  useEffect(() => {
    fetchOlderMessagesRef.current = async () => {
      if (
        fetchingOlderRef.current ||
        !hasMoreHistory ||
        historyLoading ||
        !historyCursor ||
        !scrollContainerRef.current
      ) {
        return
      }

      fetchingOlderRef.current = true
      const container = scrollContainerRef.current
      const previousHeight = container.scrollHeight
      const previousScrollTop = container.scrollTop

      await dispatch(fetchChatHistory({ before: historyCursor }))

      requestAnimationFrame(() => {
        if (container) {
          const diff = container.scrollHeight - previousHeight
          container.scrollTop = previousScrollTop + diff
        }
        fetchingOlderRef.current = false
      })
    }
  }, [dispatch, hasMoreHistory, historyLoading, historyCursor])

  useEffect(() => {
    if (!initialHistoryLoaded || !hasMoreHistory || !isInitialScrollDone) return
    if (!topSentinelRef.current || !scrollContainerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchOlderMessagesRef.current?.()
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0,
      }
    )

    observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [hasMoreHistory, initialHistoryLoaded, isInitialScrollDone])

  const handleSend = () => {
    if (inputValue.trim() && !loading) {
      dispatch(sendMessage(inputValue))
      dispatch(setInputValue(""))
    }
  }

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(resetError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  useEffect(() => {
    if (!listRef.current) return
    const distanceFromBottom =
      listRef.current.scrollHeight - listRef.current.scrollTop - listRef.current.clientHeight

    if (
      !initialHistoryLoaded ||
      (!fetchingOlderRef.current && distanceFromBottom < 160)
    ) {
      scrollToBottom()
      if (initialHistoryLoaded && messages.length > 0) {
        setIsInitialScrollDone(true)
      }
    }
  }, [messages, streaming, initialHistoryLoaded, scrollToBottom])

  return (
    <section className="flex flex-col h-full min-h-0 glassmorphic rounded-lg overflow-hidden">
      {error && (
        <div className="px-4 sm:px-6 pt-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        </div>
      )}

      <div 
      className="flex-1 flex flex-col min-h-0"
      // ref={listRef}
      >
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-hide"
        >
          <div ref={topSentinelRef} className="h-px" />

          {historyLoading && !initialHistoryLoaded && (
            <div className="flex items-center justify-center text-sm text-gray-400 py-10 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading conversation…
            </div>
          )}

          {historyLoading && initialHistoryLoaded && hasMoreHistory && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading earlier messages…
            </div>
          )}

          {!historyLoading && messages.length === 0 && (
            <div className="text-center text-sm text-gray-500 bg-white/5 border border-dashed border-white/10 rounded-lg py-12">
              Start the conversation—your context will appear here.
            </div>
          )}

          {messages.map((message: Message) => {
            const isStreaming = streaming && message.id === currentStreamId
            return (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
                {message.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C586C0] to-cyan-500 flex-shrink-0 flex items-center justify-center relative">
                    {isStreaming ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-[#C586C0]/30 to-cyan-500/30 text-[#C586C0] border border-[#C586C0]/50"
                      : "bg-slate-800/50 text-gray-300 border border-white/10"
                  }`}
                >
                  {message.role === "ai" ? (
                    <div className="text-sm prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 text-[#C586C0]" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 text-[#C586C0]" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 text-cyan-400" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                          code: ({ node, inline, ...props }: any) =>
                            inline ? (
                              <code className="bg-slate-700 px-1 py-0.5 rounded text-cyan-300" {...props} />
                            ) : (
                              <code className="block bg-slate-700 p-2 rounded my-2 overflow-x-auto" {...props} />
                            ),
                          strong: ({ node, ...props }) => <strong className="font-bold text-[#C586C0]" {...props} />,
                          em: ({ node, ...props }) => <em className="italic text-cyan-300" {...props} />,
                          a: ({ node, ...props }) => <a className="text-cyan-400 hover:underline" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs mt-2 opacity-60">{message.timestamp}</p>
                </div>
              </div>
            )
          })}

          {loading && !currentStreamId && (
            <div className="flex justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C586C0] to-cyan-500 flex-shrink-0 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-slate-800/50 text-gray-300 border border-white/10">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={listRef} />
        </div>

        <div
        className="border-t border-white/10 p-4 bg-slate-950/80 backdrop-blur md:bg-transparent sticky bottom-0 md:static">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-[#C586C0]">
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => dispatch(setInputValue(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C586C0]/50 focus:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              onClick={handleSend}
              disabled={loading || !inputValue.trim()}
              className="p-2 rounded-lg bg-gradient-to-r from-[#C586C0] to-cyan-500 text-white hover:opacity-90 transition-opacity glow-magenta disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
