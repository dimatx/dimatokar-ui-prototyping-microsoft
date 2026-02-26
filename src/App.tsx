import { Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Layout } from '@/components/layout/Layout'
import { workflows } from '@/workflows/registry'
import HomePage from '@/pages/Home'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        {workflows.map((workflow) => (
          <Route
            key={workflow.id}
            path={workflow.id === 'adr-namespace' ? workflow.path + '/*' : workflow.path}
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Loading…
                  </div>
                }
              >
                <workflow.component />
              </Suspense>
            }
          />
        ))}
      </Route>
    </Routes>
  )
}
