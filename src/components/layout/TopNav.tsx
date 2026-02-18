import { Bell, Clock } from 'lucide-react'
import { CommandSearch } from '@/components/CommandSearch'
import { useState } from 'react'

declare const __BUILD_TIME__: string

function formatBuildTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export function TopNav() {
  const [showTip, setShowTip] = useState(false)

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b px-8">
      <div />
      <div className="rounded-md bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-700">
        Prototype for storytelling only — not a design or implementation direction.
      </div>
      <div className="flex items-center gap-4">
        {/* Deployment time */}
        <div className="relative" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
            <Clock className="h-4 w-4" />
          </button>
          {showTip && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-max rounded-md border bg-white px-3 py-2 shadow-md">
              <p className="text-[11px] font-medium text-muted-foreground">Last deployed</p>
              <p className="text-xs text-foreground mt-0.5">{formatBuildTime(__BUILD_TIME__)}</p>
            </div>
          )}
        </div>

        <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
      </div>
    </div>
  )
}
