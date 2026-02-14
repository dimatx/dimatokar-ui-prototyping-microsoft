import { Bell } from 'lucide-react'
import { CommandSearch } from '@/components/CommandSearch'

export function TopNav() {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b px-8">
      <CommandSearch />
      <div className="flex items-center gap-4">
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
      </div>
    </div>
  )
}
