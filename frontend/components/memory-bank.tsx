"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, Trash2, FileText, Loader2 } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { fetchMemories, addMemory, deleteMemory, setSearchQuery } from "@/lib/store/slices/memorySlice"

export default function MemoryBank() {
  const { memories, loading, adding, hasMore, page, searchQuery, hasLoaded } = useAppSelector((state) => state.memory)
  const dispatch = useAppDispatch()
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newMemoryContent, setNewMemoryContent] = useState("")
  const [localSearch, setLocalSearch] = useState(searchQuery)
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        dispatch(setSearchQuery(localSearch))
        dispatch(fetchMemories({ query: localSearch, page: 1, reset: true }))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [localSearch, searchQuery, dispatch])

  // Initial load
  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchMemories({ query: searchQuery, page: 1, reset: true }))
    }
  }, [dispatch, hasLoaded, searchQuery])

  // Infinite Scroll
  const observerTarget = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          dispatch(fetchMemories({ query: searchQuery, page: page + 1 }))
        }
      },
      { threshold: 1.0 }
    )
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }
    
    return () => observer.disconnect()
  }, [hasMore, loading, page, searchQuery, dispatch])

  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return
    await dispatch(addMemory(newMemoryContent))
    setNewMemoryContent("")
    setIsAddModalOpen(false)
  }

  return (
    <section className="relative h-full flex flex-col">
       {/* Search and Add Header */}
       <div className="flex items-center gap-4 mb-6">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
           <input 
             type="text"
             placeholder="Search your memories..."
             value={localSearch}
             onChange={(e) => setLocalSearch(e.target.value)}
             className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-[#C586C0]/50 outline-none"
           />
         </div>
         <button 
           onClick={() => setIsAddModalOpen(true)}
           className="flex items-center gap-2 px-4 py-2 bg-[#C586C0] hover:bg-[#C586C0]/90 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
         >
           <Plus className="w-4 h-4" />
           Add Memory
         </button>
       </div>

       {/* List */}
       <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
         {memories.map((memory) => (
           <div key={memory.id} className="glassmorphic p-4 border border-white/10 rounded-lg group hover:border-[#C586C0]/30 transition-all">
             <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2">
                 <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
                   <FileText className="w-4 h-4" />
                 </span>
                 <span className="text-xs text-gray-400 font-mono">{memory.createdAt}</span>
               </div>
               <button 
                 onClick={() => dispatch(deleteMemory(memory.id))}
                 className="p-1.5 rounded-md hover:bg-white/10 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                 title="Delete memory"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
             <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{memory.content}</p>
           </div>
         ))}
         
         {loading && (
           <div className="flex justify-center py-4">
             <Loader2 className="w-6 h-6 text-[#C586C0] animate-spin" />
           </div>
         )}
         
         {!loading && memories.length === 0 && (
           <div className="text-center py-12 text-gray-500">
             No memories found. Start adding some!
           </div>
         )}
         
         <div ref={observerTarget} className="h-4" />
       </div>

       {/* Add Modal Overlay */}
       {isAddModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="w-full max-w-md glassmorphic border border-white/10 rounded-xl p-6 shadow-2xl bg-[#0f111a]">
             <h3 className="text-lg font-semibold text-white mb-4">Add New Memory</h3>
             <textarea
               value={newMemoryContent}
               onChange={(e) => setNewMemoryContent(e.target.value)}
               placeholder="What would you like to remember?"
               className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-500 focus:border-[#C586C0]/50 outline-none resize-none mb-4"
               autoFocus
             />
             <div className="flex justify-end gap-3">
               <button 
                 onClick={() => setIsAddModalOpen(false)}
                 className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleAddMemory}
                 disabled={adding || !newMemoryContent.trim()}
                 className="px-4 py-2 bg-[#C586C0] hover:bg-[#C586C0]/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
               >
                 {adding && <Loader2 className="w-3 h-3 animate-spin" />}
                 Save Memory
               </button>
             </div>
           </div>
         </div>
       )}
    </section>
  )
}
