import NavBar from '@/components/NavBar'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <Shimmer className="h-4 w-24" />
      <Shimmer className="h-8 w-16" />
      <Shimmer className="h-3 w-32" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="w-full px-4 md:px-4 pt-5 pb-4 flex flex-col md:flex-row gap-4 items-start">
        {/* Sidebar skeleton */}
        <div className="w-full md:w-52 shrink-0 flex flex-col gap-2">
          <Shimmer className="h-10 w-full rounded-xl" />
          <div className="flex md:flex-col gap-1.5">
            {[1, 2, 3, 4].map(i => (
              <Shimmer key={i} className="h-10 w-20 md:w-full rounded-xl" />
            ))}
          </div>
        </div>
        {/* Grid skeleton */}
        <div className="flex-1 min-w-0 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
