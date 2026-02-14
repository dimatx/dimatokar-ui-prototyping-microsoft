import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Beaker } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { workflows } from '@/workflows/registry'

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <Beaker className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-semibold tracking-tight">Dima's Product Lab</h1>
        </div>
        <p className="max-w-lg text-sm text-muted-foreground">
          High-fidelity UI prototypes for storytelling, iteration, and
          stakeholder feedback. Select a workflow below or from the sidebar.
        </p>
      </div>

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Link key={workflow.id} to={workflow.path}>
            <Card className="group cursor-pointer shadow-sm transition-all hover:shadow-md hover:border-slate-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <workflow.icon className="h-5 w-5 text-muted-foreground" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-4 font-semibold">{workflow.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {workflow.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Placeholder for adding new workflows */}
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex min-h-[140px] flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              + New Workflow
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Copy _template folder to start
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
