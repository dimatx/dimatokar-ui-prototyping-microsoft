import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  return (
    <div className="flex h-screen min-h-dvh overflow-hidden bg-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
