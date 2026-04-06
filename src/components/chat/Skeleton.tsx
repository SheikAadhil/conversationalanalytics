import { motion } from 'framer-motion';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 4, rows = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full bg-bg-surface border border-border rounded-premium overflow-hidden shadow-sm mb-3">
      <div className="px-4 py-4 border-b border-border-light bg-bg-subtle/30">
        <div className="skeleton-shimmer rounded-md h-5 w-48" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-bg-subtle/20 border-b border-border-light">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-5 py-4 text-left">
                <div className={`skeleton-shimmer rounded-md h-3.5 ${i === 0 ? 'w-24' : i === columns - 1 ? 'w-16' : 'w-20'}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border-light last:border-0">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-5 py-4">
                  <motion.div
                    className={`skeleton-shimmer rounded-md h-3 ${colIndex === 0 ? 'w-28' : colIndex === columns - 1 ? 'w-12' : 'w-20'}`}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 280 }: ChartSkeletonProps) {
  return (
    <div className="bg-bg-surface border border-border rounded-premium p-6 shadow-sm mb-3">
      <div className="space-y-6">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="skeleton-shimmer rounded-md h-5 w-56" />
          <div className="skeleton-shimmer rounded-md h-3 w-40 opacity-60" />
        </div>
        
        {/* Filter bar skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-shimmer rounded-xl h-8 w-16" />
          ))}
        </div>

        {/* Chart area skeleton */}
        <div
          className="skeleton-shimmer rounded-xl w-full"
          style={{ height: `${height}px` }}
        />

        {/* Legend skeleton */}
        <div className="flex gap-6 justify-center pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton-shimmer rounded-full h-3 w-3" />
              <div className="skeleton-shimmer rounded-md h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
