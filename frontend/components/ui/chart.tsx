import { cn } from "@/lib/utils"

const Chart = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "border-white/10 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {/* ... existing code here ... */}
    </div>
  )
}
