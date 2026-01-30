import { cn } from "@/lib/utils"

interface BrandMarkProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function BrandMark({ size = "md", showText = false, className }: BrandMarkProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span 
        className={cn("brand-mascot", sizeClasses[size])} 
        role="img" 
        aria-label="Bensine CRM - Scoiattolo che mette benzina"
      >
        🐿️⛽
      </span>
      {showText && (
        <span className={cn(
          "font-semibold text-gray-800",
          size === "sm" && "text-sm",
          size === "md" && "text-lg",
          size === "lg" && "text-2xl"
        )}>
          Bensine CRM
        </span>
      )}
    </div>
  )
}
