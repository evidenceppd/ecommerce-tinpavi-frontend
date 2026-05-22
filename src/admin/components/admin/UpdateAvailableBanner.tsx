interface UpdateAvailableBannerProps {
  onRefresh: () => void
  onDismiss: () => void
}

export default function UpdateAvailableBanner({ onRefresh, onDismiss }: UpdateAvailableBannerProps) {
  return (
    <div className="sticky top-0 z-[120] border-b border-[#f5c518]/25 bg-[#0C0C0C] text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 text-sm">
        <p className="text-white/85">Nova versao disponivel. Atualize para aplicar melhorias de performance.</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-white/20 px-3 py-1 text-white/80 transition-colors hover:text-white"
          >
            Depois
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg bg-[#f5c518] px-3 py-1 font-semibold text-[#0A0A0A] transition-colors hover:bg-[#D4AA52]"
          >
            Atualizar
          </button>
        </div>
      </div>
    </div>
  )
}
