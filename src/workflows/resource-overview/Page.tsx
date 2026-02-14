import { motion } from 'framer-motion'
import { MetricCard } from '@/components/MetricCard'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const metrics = [
  {
    title: 'Total Requests',
    value: '24,521',
    change: '+12.5%',
    changeType: 'positive' as const,
    data: [30, 35, 25, 40, 45, 42, 50, 48, 55, 60, 58, 65],
    color: '#3B82F6',
  },
  {
    title: 'Avg Latency',
    value: '45ms',
    change: '-8.2%',
    changeType: 'positive' as const,
    data: [80, 75, 70, 68, 65, 60, 55, 52, 50, 48, 45, 42],
    color: '#10B981',
  },
  {
    title: 'Active Users',
    value: '1,429',
    change: '+3.1%',
    changeType: 'positive' as const,
    data: [100, 105, 102, 110, 108, 115, 120, 118, 125, 128, 130, 135],
    color: '#8B5CF6',
  },
  {
    title: 'Error Rate',
    value: '0.12%',
    change: '+0.03%',
    changeType: 'negative' as const,
    data: [5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 12],
    color: '#EF4444',
  },
]

const services = [
  { name: 'API Gateway', status: 'Active', region: 'US-East', uptime: '99.99%', lastDeployed: '2 hours ago' },
  { name: 'Auth Service', status: 'Active', region: 'US-West', uptime: '99.95%', lastDeployed: '1 day ago' },
  { name: 'Payment Processor', status: 'Active', region: 'EU-West', uptime: '99.98%', lastDeployed: '3 days ago' },
  { name: 'Cache Layer', status: 'Warning', region: 'US-East', uptime: '98.20%', lastDeployed: '5 hours ago' },
  { name: 'Search Index', status: 'Active', region: 'AP-South', uptime: '99.90%', lastDeployed: '12 hours ago' },
  { name: 'Notification Hub', status: 'Inactive', region: 'US-West', uptime: '—', lastDeployed: '2 weeks ago' },
  { name: 'CDN Edge', status: 'Active', region: 'Global', uptime: '99.97%', lastDeployed: '6 hours ago' },
  { name: 'Analytics Pipeline', status: 'Active', region: 'US-East', uptime: '99.91%', lastDeployed: '4 days ago' },
]

export default function ResourceOverviewPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resource Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your infrastructure and services at a glance.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Services Table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Active Services</h2>
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Last Deployed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.name}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={service.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{service.region}</TableCell>
                  <TableCell className="font-mono text-sm">{service.uptime}</TableCell>
                  <TableCell className="text-muted-foreground">{service.lastDeployed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}
