'use client'

import type { PublishedFrame } from '@/lib/community-frames'
import { frameSlotCount } from '@/lib/community-frames'

type PublishedFrameCardProps = {
  frame: PublishedFrame
  compact?: boolean
}

export default function PublishedFrameCard({ frame, compact = false }: PublishedFrameCardProps) {
  const slotCount = frameSlotCount(frame)
  const createdAt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(frame.createdAt))

  return (
    <article className="overflow-hidden rounded-xl border-2 border-on-background bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition hover:-translate-y-0.5">
      <div className="relative aspect-[3/4] bg-[radial-gradient(circle_at_20%_12%,oklch(93%_0.045_350),transparent_45%),radial-gradient(circle_at_90%_28%,oklch(92%_0.04_205),transparent_42%),linear-gradient(180deg,white,oklch(98.5%_0.006_330))]">
        <div className="absolute inset-3 overflow-hidden rounded-[1.1rem] border border-black/10 bg-white/72">
          {frame.elements.map((element) => {
            const style = {
              left: `${(element.x / frame.canvas.width) * 100}%`,
              top: `${(element.y / frame.canvas.height) * 100}%`,
              width: `${(element.width / frame.canvas.width) * 100}%`,
              height: `${(element.height / frame.canvas.height) * 100}%`,
              transform: `rotate(${element.rotation}deg)`,
            }

            if (element.kind === 'slot') {
              return (
                <div key={element.id} className="absolute grid place-items-center border border-dashed border-primary/35 bg-surface-container-low/80" style={{ ...style, borderRadius: Math.max(4, (element.radius ?? 14) / 2) }}>
                  <span className="material-symbols-outlined text-[18px] text-primary/45">crop_original</span>
                </div>
              )
            }

            if (element.kind === 'text') {
              return (
                <div key={element.id} className="absolute grid place-items-center px-1 text-center leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]" style={{ ...style, color: element.color ?? '#2a1820', fontSize: Math.max(10, (element.fontSize ?? 24) * 0.42), fontWeight: element.weight ?? 800 }}>
                  {element.text}
                </div>
              )
            }

            return (
              <div key={element.id} className="absolute grid place-items-center" style={style}>
                {element.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={element.src} alt="" className="h-full w-full object-contain drop-shadow-[0_5px_10px_rgba(42,24,32,0.16)]" />
                ) : (
                  <span>{element.symbol}</span>
                )}
              </div>
            )
          })}
          <div className="absolute bottom-3 left-5 right-5 rounded-full bg-white/90 py-1 text-center text-[10px] font-extrabold text-primary shadow-sm">Fotbarin</div>
        </div>
        <span className="absolute right-2 top-2 rounded-full bg-white/92 px-2 py-1 text-[11px] font-extrabold text-primary shadow-sm">{frame.status === 'published' ? 'Live' : 'Review'}</span>
      </div>
      <div className={compact ? 'p-2' : 'p-3'}>
        <p className="truncate text-sm font-extrabold text-on-background">{frame.name}</p>
        {frame.description && !compact && <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-on-surface-variant">{frame.description}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-bold text-on-surface-variant">{slotCount} slot · @{frame.creatorUsername}</span>
          <span className="shrink-0 text-xs font-extrabold text-primary">{createdAt}</span>
        </div>
      </div>
    </article>
  )
}
