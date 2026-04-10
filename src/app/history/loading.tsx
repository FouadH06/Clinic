import NavBar from '@/components/NavBar'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
  )
}

function LogRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-3 py-3"><Shimmer className="h-4 w-28" /></td>
      <td className="px-3 py-3"><Shimmer className="h-4 w-20" /></td>
      <td className="px-3 py-3"><Shimmer className="h-4 w-12" /></td>
      <td className="px-3 py-3"><Shimmer className="h-4 w-10" /></td>
      <td className="px-3 py-3 hidden md:table-cell"><Shimmer className="h-4 w-20" /></td>
      <td className="px-3 py-3 hidden md:table-cell"><Shimmer className="h-4 w-24" /></td>
    </tr>
  )
}

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 md:px-6">
        {/* Header */}
        <div className="mb-6">
          <Shimmer className="h-6 w-36 mb-2" />
          <Shimmer className="h-4 w-56" />
        </div>

        {/* Filter bar skeleton */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
          <Shimmer className="h-7 w-40 rounded-lg" />
          <Shimmer className="h-7 w-28 rounded-lg" />
          <Shimmer className="h-7 w-28 rounded-lg" />
          <Shimmer className="h-7 w-28 rounded-lg" />
          <div className="flex-1" />
          <Shimmer className="h-7 w-56 rounded-lg" />
        </div>

        {/* Table skeleton */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-3 text-left"><Shimmer className="h-3 w-16" /></th>
                <th className="px-3 py-3 text-left"><Shimmer className="h-3 w-12" /></th>
                <th className="px-3 py-3 text-left"><Shimmer className="h-3 w-10" /></th>
                <th className="px-3 py-3 text-left"><Shimmer className="h-3 w-8" /></th>
                <th className="px-3 py-3 text-left hidden md:table-cell"><Shimmer className="h-3 w-14" /></th>
                <th className="px-3 py-3 text-left hidden md:table-cell"><Shimmer className="h-3 w-20" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }).map((_, i) => (
                <LogRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
