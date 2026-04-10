import NavBar from '@/components/NavBar'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
  )
}

function SupplierCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-6 w-6 rounded" />
      </div>
      <div className="space-y-1.5">
        <Shimmer className="h-3 w-28" />
        <Shimmer className="h-3 w-40" />
      </div>
      <Shimmer className="h-3 w-48" />
    </div>
  )
}

export default function SuppliersLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-6">
          <Shimmer className="h-6 w-28 mb-2" />
          <Shimmer className="h-4 w-44" />
        </div>

        {/* Add button skeleton */}
        <div className="mb-4">
          <Shimmer className="h-8 w-32 rounded-lg" />
        </div>

        {/* Supplier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SupplierCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
