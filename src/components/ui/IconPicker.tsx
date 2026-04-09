import { ICONS } from './icons'

interface Props {
  value: string
  onChange: (id: string) => void
}

export default function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ICONS.map(icon => {
        const isActive = value === icon.id
        return (
          <button
            key={icon.id}
            type="button"
            onClick={() => onChange(icon.id)}
            title={icon.label}
            className={`
              flex flex-col items-center justify-center gap-1
              h-14 rounded-lg border text-xs font-medium
              transition-all duration-100
              ${isActive
                ? 'bg-teal-50 border-teal-500 text-teal-700 ring-2 ring-teal-400 ring-offset-1'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }
            `}
          >
            <span className={isActive ? 'text-teal-600' : 'text-slate-400'}>
              {icon.render('w-5 h-5')}
            </span>
            <span className="text-[9px] leading-none truncate px-1 w-full text-center">
              {icon.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
