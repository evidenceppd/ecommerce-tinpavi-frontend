interface AdminSectionSkeletonProps {
  label?: string
}

export default function AdminSectionSkeleton({ label = 'Carregando secao' }: AdminSectionSkeletonProps) {
  return (
    <div
      className="flex min-h-24 items-center gap-3 text-sm text-slate-500"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#f5c518]" />
      <span>{label}</span>
    </div>
  )
}
