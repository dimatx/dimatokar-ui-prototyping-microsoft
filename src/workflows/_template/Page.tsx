import { motion } from 'framer-motion'

/**
 * WORKFLOW TEMPLATE
 *
 * To create a new workflow:
 * 1. Copy this entire _template folder → src/workflows/my-flow/
 * 2. Update the component below with your mockup content
 * 3. Add an entry to src/workflows/registry.ts
 *
 * Available components you can import:
 *
 *   import { MetricCard } from '@/components/MetricCard'
 *   import { StatusBadge } from '@/components/StatusBadge'
 *   import { SparklineChart } from '@/components/SparklineChart'
 *   import { CommandSearch } from '@/components/CommandSearch'
 *   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
 *   import { Button } from '@/components/ui/button'
 *   import { Badge } from '@/components/ui/badge'
 *   import { Input } from '@/components/ui/input'
 *   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
 *
 * Icons — browse at https://lucide.dev/icons
 *
 *   import { Settings, Users, BarChart3, ArrowRight } from 'lucide-react'
 */

export default function TemplatePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workflow Title
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe what this workflow demonstrates.
        </p>
      </div>

      {/* Replace this with your mockup content */}
      <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-16">
        <p className="text-sm text-muted-foreground">
          Start building your mockup here.
        </p>
      </div>
    </motion.div>
  )
}
