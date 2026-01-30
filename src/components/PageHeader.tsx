import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
}

export function PageHeader({ icon: Icon, title, subtitle }: PageHeaderProps) {
  return (
    <div className="brand-card-tint p-4 mb-6">
      <div className="brand-card-header">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-brand-orange" />
          </div>
          <div>
            <h1 className="brand-section-title text-xl">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        <img 
          src="/logo.png" 
          alt="Bensine" 
          className="h-8 w-8 rounded-full ring-2 ring-brand-orange/20 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    </div>
  )
}
