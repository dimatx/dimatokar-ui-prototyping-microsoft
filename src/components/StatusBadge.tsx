import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Running: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Adding: 'bg-blue-50 text-blue-700 border-blue-200',
  Warning: 'bg-amber-50 text-amber-700 border-amber-200',
  Degraded: 'bg-amber-50 text-amber-700 border-amber-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Disabled: 'bg-gray-100 text-gray-500 border-gray-200',
  Error: 'bg-red-50 text-red-700 border-red-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
}

const dotStyles: Record<string, string> = {
  Active: 'bg-emerald-500',
  Healthy: 'bg-emerald-500',
  Running: 'bg-emerald-500',
  Adding: 'bg-blue-500 animate-pulse',
  Warning: 'bg-amber-500',
  Degraded: 'bg-amber-500',
  Inactive: 'bg-gray-400',
  Disabled: 'bg-gray-400',
  Error: 'bg-red-500',
  Critical: 'bg-red-500',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status] || statusStyles.Active,
        className
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          dotStyles[status] || dotStyles.Active
        )}
      />
      {status}
    </span>
  )
}
