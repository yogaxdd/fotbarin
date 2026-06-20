'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { savePublishedFrame } from '@/lib/community-frames'

type ElementKind = 'slot' | 'text' | 'sticker'

type BaseElement = {
  id: string
  kind: ElementKind
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

type PhotoSlotElement = BaseElement & {
  kind: 'slot'
  radius: number
  fit: 'cover' | 'contain' | 'fill'
}

type TextElement = BaseElement & {
  kind: 'text'
  text: string
  color: string
  fontSize: number
  weight: 700 | 800
}

type StickerElement = BaseElement & {
  kind: 'sticker'
  src?: string
  symbol?: string
}

type FrameElement = PhotoSlotElement | TextElement | StickerElement

type DragState = {
  id: string
  mode: 'move' | 'resize'
  startPointerX: number
  startPointerY: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 540
const MIN_ELEMENT_SIZE = 36

const stickerAssets = [
  {
    name: 'Chibi OC',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><g fill="none"><path d="M34 137c20 25 90 25 111-1 13-16 7-45-10-62-13-14-28-21-46-21s-34 7-47 21c-17 17-21 47-8 63Z" fill="#fff"/><path d="M42 72c6-29 25-43 49-43 23 0 42 14 49 43-24-17-70-17-98 0Z" fill="#7b4d78"/><path d="M45 132c15 24 77 27 96 0" stroke="#2b1725" stroke-width="7" stroke-linecap="round"/><path d="M60 96c5-7 16-7 21 0M102 96c5-7 16-7 21 0" stroke="#2b1725" stroke-width="7" stroke-linecap="round"/><path d="M84 116c5 4 11 4 16 0" stroke="#d16a91" stroke-width="5" stroke-linecap="round"/><path d="M36 116c-15 4-23 13-24 27 16 2 28-3 36-16M144 116c15 4 23 13 24 27-16 2-28-3-36-16" fill="#ffd7e8"/><path d="M29 48 48 23l15 29M151 48l-19-25-15 29" fill="#fff" stroke="#2b1725" stroke-width="7" stroke-linejoin="round"/><path d="M42 71c29-19 72-19 98 0" stroke="#2b1725" stroke-width="7" stroke-linecap="round"/></g></svg>`)}`,
  },
  {
    name: 'Star bow',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><path d="M31 88C16 76 15 51 29 40c20-16 51 10 61 30 10-20 41-46 61-30 14 11 13 36-2 48-14 11-40 7-55-3 15 11 23 36 7 47-22 16-47-17-50-38-3 21-28 54-50 38-16-11-8-36 7-47-15 10-41 14-55 3Z" fill="#ffd5e4" stroke="#2b1725" stroke-width="7"/><circle cx="90" cy="87" r="18" fill="#fff" stroke="#2b1725" stroke-width="7"/><path d="m91 42 7 16 18 2-14 12 4 18-15-10-16 10 5-18-14-12 18-2 7-16Z" fill="#ffe68f" stroke="#2b1725" stroke-width="5"/></svg>`)}`,
  },
  {
    name: 'Soft camera',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect x="25" y="52" width="130" height="92" rx="28" fill="#ffe2eb" stroke="#2b1725" stroke-width="7"/><path d="M59 52 70 36h40l11 16" fill="#fff" stroke="#2b1725" stroke-width="7" stroke-linejoin="round"/><circle cx="91" cy="99" r="33" fill="#bce8ec" stroke="#2b1725" stroke-width="7"/><circle cx="91" cy="99" r="16" fill="#fff" opacity=".9"/><circle cx="132" cy="72" r="9" fill="#fff" stroke="#2b1725" stroke-width="5"/><path d="M52 132c19 12 58 12 77 0" stroke="#2b1725" stroke-width="6" stroke-linecap="round"/></svg>`)}`,
  },
]

const layoutPresets = [
  {
    name: '4-cut strip',
    slots: [
      { x: 24, y: 26, width: 312, height: 104 },
      { x: 24, y: 144, width: 312, height: 104 },
      { x: 24, y: 262, width: 312, height: 104 },
      { x: 24, y: 380, width: 312, height: 104 },
    ],
  },
  {
    name: 'Hero + two',
    slots: [
      { x: 24, y: 28, width: 312, height: 238 },
      { x: 24, y: 284, width: 150, height: 170 },
      { x: 186, y: 284, width: 150, height: 170 },
    ],
  },
  {
    name: 'Photocard',
    slots: [{ x: 42, y: 54, width: 276, height: 368 }],
  },
]

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function createSlot(index: number, slot: { x: number; y: number; width: number; height: number }): PhotoSlotElement {
  return {
    id: makeId('slot'),
    kind: 'slot',
    name: `Photo slot ${index + 1}`,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    rotation: 0,
    radius: 18,
    fit: 'cover',
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function FrameEditorClient() {
  const router = useRouter()
  const { displayName, username, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [frameName, setFrameName] = useState('My Kawaii Frame')
  const [publishDescription, setPublishDescription] = useState('')
  const [selectedId, setSelectedId] = useState('slot-1')
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [elements, setElements] = useState<FrameElement[]>([
    { id: 'slot-1', kind: 'slot', name: 'Photo slot 1', x: 24, y: 28, width: 312, height: 116, rotation: 0, radius: 18, fit: 'cover' },
    { id: 'slot-2', kind: 'slot', name: 'Photo slot 2', x: 24, y: 158, width: 312, height: 116, rotation: 0, radius: 18, fit: 'cover' },
    { id: 'slot-3', kind: 'slot', name: 'Photo slot 3', x: 24, y: 288, width: 312, height: 116, rotation: 0, radius: 18, fit: 'cover' },
    { id: 'text-1', kind: 'text', name: 'Title text', x: 54, y: 442, width: 252, height: 52, rotation: -1, text: 'best day ✨', color: '#2a1820', fontSize: 31, weight: 800 },
    { id: 'sticker-1', kind: 'sticker', name: 'Chibi OC', x: 272, y: 34, width: 84, height: 84, rotation: 9, src: stickerAssets[0].src },
  ])

  const selectedElement = useMemo(() => elements.find((element) => element.id === selectedId) ?? null, [elements, selectedId])

  function updateElement(id: string, patch: Partial<FrameElement>) {
    setElements((current) => current.map((element) => (element.id === id ? ({ ...element, ...patch } as FrameElement) : element)))
  }

  function applyLayout(index: number) {
    const preset = layoutPresets[index]
    const nonSlots = elements.filter((element) => element.kind !== 'slot')
    const slots = preset.slots.map((slot, slotIndex) => createSlot(slotIndex, slot))
    setElements([...slots, ...nonSlots])
    setSelectedId(slots[0]?.id ?? nonSlots[0]?.id ?? '')
  }

  function addPhotoSlot() {
    const slotCount = elements.filter((element) => element.kind === 'slot').length
    const slot = createSlot(slotCount, { x: 42, y: 52 + slotCount * 22, width: 276, height: 126 })
    setElements((current) => [...current, slot])
    setSelectedId(slot.id)
  }

  function addText() {
    const text: TextElement = {
      id: makeId('text'),
      kind: 'text',
      name: 'Text layer',
      x: 64,
      y: 430,
      width: 232,
      height: 54,
      rotation: 0,
      text: 'new text ♡',
      color: '#2a1820',
      fontSize: 28,
      weight: 800,
    }
    setElements((current) => [...current, text])
    setSelectedId(text.id)
  }

  function addSticker(asset = stickerAssets[0]) {
    const sticker: StickerElement = {
      id: makeId('sticker'),
      kind: 'sticker',
      name: asset.name,
      x: 238,
      y: 72,
      width: 88,
      height: 88,
      rotation: 8,
      src: asset.src,
    }
    setElements((current) => [...current, sticker])
    setSelectedId(sticker.id)
  }

  function duplicateSelected() {
    if (!selectedElement) return
    const duplicate = {
      ...selectedElement,
      id: makeId(selectedElement.kind),
      name: `${selectedElement.name} copy`,
      x: clamp(selectedElement.x + 18, 0, CANVAS_WIDTH - MIN_ELEMENT_SIZE),
      y: clamp(selectedElement.y + 18, 0, CANVAS_HEIGHT - MIN_ELEMENT_SIZE),
    } as FrameElement
    setElements((current) => [...current, duplicate])
    setSelectedId(duplicate.id)
  }

  function deleteSelected() {
    if (!selectedElement) return
    const nextElements = elements.filter((element) => element.id !== selectedElement.id)
    setElements(nextElements)
    setSelectedId(nextElements[0]?.id ?? '')
  }

  function handleUploadAsset(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const sticker: StickerElement = {
        id: makeId('upload'),
        kind: 'sticker',
        name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded asset',
        x: 224,
        y: 80,
        width: 96,
        height: 96,
        rotation: 0,
        src: String(reader.result),
      }
      setElements((current) => [...current, sticker])
      setSelectedId(sticker.id)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function beginDrag(event: React.PointerEvent, element: FrameElement, mode: DragState['mode']) {
    event.preventDefault()
    event.stopPropagation()
    setSelectedId(element.id)
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({
      id: element.id,
      mode,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: element.x,
      startY: element.y,
      startWidth: element.width,
      startHeight: element.height,
    })
  }

  function handleCanvasPointerMove(event: React.PointerEvent) {
    if (!dragState) return
    const dx = event.clientX - dragState.startPointerX
    const dy = event.clientY - dragState.startPointerY

    if (dragState.mode === 'move') {
      updateElement(dragState.id, {
        x: clamp(dragState.startX + dx, -40, CANVAS_WIDTH - MIN_ELEMENT_SIZE),
        y: clamp(dragState.startY + dy, -40, CANVAS_HEIGHT - MIN_ELEMENT_SIZE),
      })
      return
    }

    updateElement(dragState.id, {
      width: clamp(dragState.startWidth + dx, MIN_ELEMENT_SIZE, CANVAS_WIDTH - dragState.startX),
      height: clamp(dragState.startHeight + dy, MIN_ELEMENT_SIZE, CANVAS_HEIGHT - dragState.startY),
    })
  }

  function updateNumber(field: 'x' | 'y' | 'width' | 'height' | 'rotation', value: string) {
    if (!selectedElement) return
    updateElement(selectedElement.id, { [field]: Number(value) || 0 } as Partial<FrameElement>)
  }

  function publishFrame() {
    const creatorUsername = username || profile?.username || 'yogaxd'
    savePublishedFrame({
      id: makeId('frame'),
      name: frameName.trim() || 'Untitled frame',
      description: publishDescription.trim(),
      creatorName: displayName || profile?.name || 'Fotbarin Creator',
      creatorUsername,
      createdAt: Date.now(),
      status: 'published',
      canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      elements,
    })
    setPublishOpen(false)
    router.push(`/${creatorUsername}`)
  }

  const layerLabel = selectedElement
    ? selectedElement.kind === 'slot'
      ? 'Image container'
      : selectedElement.kind === 'text'
        ? 'Text layer'
        : 'Transparent asset'
    : 'No layer selected'

  return (
    <DashboardShell active="community" title="Frame editor" subtitle="Buat frame lokal sebelum publish ke komunitas." sidebarLabel="Creator workspace">
      <input ref={fileInputRef} type="file" accept="image/png,image/webp,image/svg+xml,image/jpeg" className="hidden" onChange={handleUploadAsset} />

      <div className="grid gap-4 pb-10 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <section className="app-panel overflow-hidden xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)]">
          <div className="border-b border-outline-variant p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">Creator tools</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-on-background">Custom frame</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Susun slot foto, teks, dan asset transparan. Semua masih lokal di browser.</p>
          </div>

          <div className="grid gap-5 p-4">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold text-on-background">Layout</h2>
                <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-bold text-on-surface-variant">{elements.filter((element) => element.kind === 'slot').length} slots</span>
              </div>
              <div className="grid grid-cols-3 gap-2 xl:grid-cols-2">
                {layoutPresets.map((preset, index) => (
                  <button key={preset.name} type="button" onClick={() => applyLayout(index)} className="rounded-2xl border border-outline-variant bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <span className="flex aspect-[2/3] flex-col gap-1.5 rounded-xl bg-primary-container/55 p-1.5">
                      {preset.slots.map((slot, slotIndex) => (
                        <span key={slotIndex} className="rounded-md border border-primary/20 bg-white/80" style={{ height: `${Math.max(18, (slot.height / CANVAS_HEIGHT) * 100)}%` }} />
                      ))}
                    </span>
                    <span className="mt-2 block truncate text-xs font-extrabold text-on-background">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <h2 className="text-sm font-extrabold text-on-background">Add layer</h2>
              <button type="button" onClick={addPhotoSlot} className="sticker-button flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold text-on-background">
                <span className="material-symbols-outlined text-primary">crop_original</span>
                Add photo slot
              </button>
              <button type="button" onClick={addText} className="sticker-button flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold text-on-background">
                <span className="material-symbols-outlined text-primary">title</span>
                Add text
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="sticker-button flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold text-on-background">
                <span className="material-symbols-outlined text-primary">upload</span>
                Upload PNG/WebP
              </button>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-extrabold text-on-background">Character assets</h2>
              <div className="grid grid-cols-3 gap-2">
                {stickerAssets.map((asset) => (
                  <button key={asset.name} type="button" onClick={() => addSticker(asset)} className="rounded-2xl border border-outline-variant bg-[linear-gradient(45deg,oklch(95.5%_0.008_330)_25%,transparent_25%),linear-gradient(-45deg,oklch(95.5%_0.008_330)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,oklch(95.5%_0.008_330)_75%),linear-gradient(-45deg,transparent_75%,oklch(95.5%_0.008_330)_75%)] bg-[length:14px_14px] bg-[position:0_0,0_7px,7px_-7px,-7px_0] p-2 transition hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.src} alt="" className="mx-auto h-14 w-14 object-contain" />
                    <span className="mt-1 block truncate text-[11px] font-bold text-on-surface-variant">{asset.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-on-surface-variant">Default asset adalah original/placeholder. Upload asset fandom hanya kalau kamu punya hak pakai.</p>
            </div>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-[2rem] border border-outline-variant bg-surface-container-low shadow-panel">
          <div className="flex flex-col gap-3 border-b border-outline-variant bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/community" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-outline-variant bg-white text-on-surface-variant shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="Back to community">
                <span className="material-symbols-outlined text-[21px]">arrow_back</span>
              </Link>
              <div className="min-w-0">
                <input value={frameName} onChange={(event) => setFrameName(event.target.value)} className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-xl font-extrabold tracking-tight text-on-background outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" />
                <p className="px-2 text-sm font-semibold text-on-surface-variant">Draft lokal · belum publish</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-full border border-outline-variant bg-white px-4 py-2 text-sm font-bold text-on-background shadow-sm transition hover:bg-surface-container-low">Save draft</button>
              <button type="button" className="rounded-full border border-outline-variant bg-secondary-container px-4 py-2 text-sm font-bold text-on-secondary-container shadow-sm transition hover:-translate-y-0.5">Preview</button>
              <button type="button" onClick={() => setPublishOpen(true)} className="rounded-full bg-primary px-5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker">Publish</button>
            </div>
          </div>

          <div className="relative min-h-[680px] overflow-auto p-5 sm:p-8" onPointerMove={handleCanvasPointerMove} onPointerUp={() => setDragState(null)} onPointerCancel={() => setDragState(null)}>
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(oklch(84% 0.014 330) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="relative mx-auto flex w-max min-w-full justify-center py-8">
              <div className="relative h-[540px] w-[360px] shrink-0 overflow-hidden rounded-[1.5rem] border border-outline-variant bg-white shadow-panel" style={{ background: 'radial-gradient(circle at 18% 10%, oklch(93% 0.045 350 / 0.7), transparent 9rem), linear-gradient(180deg, #fff, oklch(98.5% 0.006 330))' }} onPointerDown={() => setSelectedId('')}>
                <div className="absolute inset-3 rounded-[1.15rem] border border-dashed border-primary/20" />
                {elements.map((element) => {
                  const selected = element.id === selectedId
                  const commonStyle = {
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    transform: `rotate(${element.rotation}deg)`,
                  }

                  return (
                    <div
                      key={element.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${element.name}`}
                      onPointerDown={(event) => beginDrag(event, element, 'move')}
                      className={`absolute touch-none select-none ${selected ? 'z-30' : 'z-10'} ${element.kind === 'slot' ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'}`}
                      style={commonStyle}
                    >
                      {element.kind === 'slot' && (
                        <div className={`grid h-full w-full place-items-center border-2 border-dashed bg-white/72 text-primary/70 transition ${selected ? 'border-primary ring-4 ring-primary/15' : 'border-outline-variant hover:border-primary/60'}`} style={{ borderRadius: element.radius }}>
                          <span className="material-symbols-outlined text-3xl">crop_original</span>
                          <span className="absolute bottom-2 rounded-full bg-white/92 px-2 py-1 text-[11px] font-extrabold text-on-surface-variant shadow-sm">Photo</span>
                        </div>
                      )}

                      {element.kind === 'text' && (
                        <div className={`grid h-full w-full place-items-center rounded-xl px-2 text-center leading-none drop-shadow-[0_2px_0_rgba(255,255,255,0.95)] ${selected ? 'ring-4 ring-primary/20' : ''}`} style={{ color: element.color, fontSize: element.fontSize, fontWeight: element.weight }}>
                          {element.text}
                        </div>
                      )}

                      {element.kind === 'sticker' && (
                        <div className={`grid h-full w-full place-items-center rounded-xl ${selected ? 'ring-4 ring-primary/20' : ''}`}>
                          {element.src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={element.src} alt="" className="h-full w-full object-contain drop-shadow-[0_10px_18px_rgba(42,24,32,0.16)]" />
                          ) : (
                            <span className="text-5xl">{element.symbol}</span>
                          )}
                        </div>
                      )}

                      {selected && (
                        <>
                          <span className="pointer-events-none absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-white" />
                          <span className="pointer-events-none absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-white" />
                          <span className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-primary bg-white" />
                          <button type="button" aria-label="Resize selected layer" onPointerDown={(event) => beginDrag(event, element, 'resize')} className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full border-2 border-primary bg-white shadow-sm" />
                        </>
                      )}
                    </div>
                  )
                })}
                <div className="absolute bottom-5 left-8 right-8 rounded-full bg-white/88 px-4 py-2 text-center text-sm font-extrabold text-primary shadow-sm">Fotbarin</div>
              </div>
            </div>
          </div>
        </section>

        <aside className="app-panel overflow-hidden xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-4">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-on-background">Properties</h2>
              <p className="text-sm font-semibold text-on-surface-variant">{layerLabel}</p>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={duplicateSelected} disabled={!selectedElement} className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-low disabled:opacity-40" aria-label="Duplicate layer">
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </button>
              <button type="button" onClick={deleteSelected} disabled={!selectedElement} className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container disabled:opacity-40" aria-label="Delete layer">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>

          {selectedElement ? (
            <div className="grid gap-5 p-4">
              <div className="flex items-center gap-3 rounded-2xl bg-primary-container/65 p-3">
                <span className="material-symbols-outlined grid h-10 w-10 place-items-center rounded-xl bg-white text-primary">{selectedElement.kind === 'slot' ? 'crop_original' : selectedElement.kind === 'text' ? 'title' : 'mood'}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-on-background">{selectedElement.name}</p>
                  <p className="text-xs font-bold text-on-surface-variant">{selectedElement.kind}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                <h3 className="mb-3 text-sm font-extrabold text-on-background">Transform</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['x', 'y', 'width', 'height'] as const).map((field) => (
                    <label key={field} className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                      {field === 'width' ? 'W' : field === 'height' ? 'H' : field.toUpperCase()}
                      <input type="number" value={Math.round(selectedElement[field])} onChange={(event) => updateNumber(field, event.target.value)} className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                    </label>
                  ))}
                  <label className="col-span-2 grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                    Rotation
                    <input type="number" value={Math.round(selectedElement.rotation)} onChange={(event) => updateNumber('rotation', event.target.value)} className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                </div>
              </div>

              {selectedElement.kind === 'slot' && (
                <div className="grid gap-3">
                  <h3 className="text-sm font-extrabold text-on-background">Photo slot</h3>
                  <label className="grid gap-1 text-sm font-bold text-on-surface-variant">
                    Corner radius
                    <input type="range" min="0" max="40" value={selectedElement.radius} onChange={(event) => updateElement(selectedElement.id, { radius: Number(event.target.value) } as Partial<FrameElement>)} className="accent-primary" />
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-on-surface-variant">
                    Fit mode
                    <select value={selectedElement.fit} onChange={(event) => updateElement(selectedElement.id, { fit: event.target.value as PhotoSlotElement['fit'] } as Partial<FrameElement>)} className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="fill">Fill</option>
                    </select>
                  </label>
                </div>
              )}

              {selectedElement.kind === 'text' && (
                <div className="grid gap-3">
                  <h3 className="text-sm font-extrabold text-on-background">Text</h3>
                  <label className="grid gap-1 text-sm font-bold text-on-surface-variant">
                    Content
                    <input value={selectedElement.text} onChange={(event) => updateElement(selectedElement.id, { text: event.target.value } as Partial<FrameElement>)} className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-sm font-bold text-on-surface-variant">
                      Size
                      <input type="number" value={selectedElement.fontSize} onChange={(event) => updateElement(selectedElement.id, { fontSize: Number(event.target.value) || 16 } as Partial<FrameElement>)} className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                    </label>
                    <label className="grid gap-1 text-sm font-bold text-on-surface-variant">
                      Color
                      <input type="color" value={selectedElement.color} onChange={(event) => updateElement(selectedElement.id, { color: event.target.value } as Partial<FrameElement>)} className="h-10 rounded-xl border border-outline-variant bg-white p-1" />
                    </label>
                  </div>
                </div>
              )}

              {selectedElement.kind === 'sticker' && (
                <div className="rounded-2xl border border-tertiary/20 bg-tertiary-container/60 p-4 text-sm font-semibold leading-6 text-on-tertiary-container">
                  Transparent PNG/WebP/SVG assets keep their alpha on the canvas. Use original art or assets you are allowed to publish.
                </div>
              )}

              <div>
                <h3 className="mb-3 text-sm font-extrabold text-on-background">Layers</h3>
                <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
                  {[...elements].reverse().map((element) => (
                    <button key={element.id} type="button" onClick={() => setSelectedId(element.id)} className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm font-bold transition ${selectedId === element.id ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-white text-on-surface-variant hover:text-on-background'}`}>
                      <span className="material-symbols-outlined text-[19px]">{element.kind === 'slot' ? 'crop_original' : element.kind === 'text' ? 'title' : 'mood'}</span>
                      <span className="min-w-0 flex-1 truncate">{element.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-5 text-center">
                <span className="material-symbols-outlined text-3xl text-outline">ads_click</span>
                <p className="mt-2 text-sm font-bold text-on-background">Select a layer</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">Klik slot, teks, atau sticker di canvas untuk mengubah properties.</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {publishOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-on-background/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="publish-title">
          <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-outline-variant bg-white shadow-panel">
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant p-5">
              <div>
                <h2 id="publish-title" className="text-2xl font-extrabold tracking-tight text-on-background">Publish frame</h2>
                <p className="mt-1 text-sm font-semibold text-on-surface-variant">Masuk moderation queue sebelum tampil di Community.</p>
              </div>
              <button type="button" onClick={() => setPublishOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-low" aria-label="Close publish modal">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid gap-4 p-5">
              <label className="grid gap-1 text-sm font-extrabold text-on-background">
                Frame name
                <input value={frameName} onChange={(event) => setFrameName(event.target.value)} className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-bold text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </label>
              <label className="grid gap-1 text-sm font-extrabold text-on-background">
                Description
                <textarea rows={3} value={publishDescription} onChange={(event) => setPublishDescription(event.target.value)} placeholder="Ceritakan vibe frame ini..." className="resize-none rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-background outline-none placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </label>
              <label className="flex items-start gap-3 rounded-2xl bg-primary-container/70 p-4 text-sm font-semibold leading-6 text-on-primary-container">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" defaultChecked />
                Saya punya hak pakai untuk semua asset dan setuju frame ini dimoderasi sebelum publish.
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-outline-variant bg-surface-container-low p-5">
              <button type="button" onClick={() => setPublishOpen(false)} className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-on-background shadow-sm">Cancel</button>
              <button type="button" onClick={publishFrame} className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm">Confirm publish</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
