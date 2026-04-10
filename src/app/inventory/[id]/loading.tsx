import NavBar from '@/components/NavBar'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
  )
}

export default function ItemDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 md:px-6">
        {/* Breadcrumb + title */}
        <div className="flex items-center gap-3 mb-6">
          <Shimmer className="h-4 w-16" />
          <span className="text-slate-300 text-sm">/</span>
          <Shimmer className="h-6 w-40" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <Shimmer className="h-3 w-20 mb-2" />
              <Shimmer className="h-6 w-14" />
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier section */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="h-12 w-full rounded-xl" />
            <Shimmer className="h-12 w-full rounded-xl" />
          </div>
          {/* History section */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <Shimmer className="h-3 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
