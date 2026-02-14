import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { SparklineChart } from './SparklineChart'

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType?: 'positive' | 'negative'
  data: number[]
  color?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'positive',
  data,
  color = '#3B82F6',
}: MetricCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              changeType === 'positive' ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {changeType === 'positive' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change}
          </div>
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        <div className="mt-4">
          <SparklineChart data={data} color={color} />
        </div>
      </CardContent>
    </Card>
  )
}
