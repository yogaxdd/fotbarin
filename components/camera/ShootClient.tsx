'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import { useI18n } from '@/components/i18n/I18nProvider'
import { formatMessage } from '@/lib/i18n'
import { downloadCanvasAsPng, renderCommunityFrameStrip, renderFourCutStrip, starterThemes } from '@/lib/frame-renderer'
import { COMMUNITY_FRAME_SELECTION_KEY, frameSlotCount, type PublishedFrame } from '@/lib/community-frames'

const DEFAULT_SLOT_COUNT = 4

type CameraStatus = 'idle' | 'loading' | 'ready' | 'error'

export default function ShootClient() {
  const { copy } = useI18n()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [cameraError, setCameraError] = useState('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [mirrorPreview, setMirrorPreview] = useState(true)
  const [selectedCommunityFrame, setSelectedCommunityFrame] = useState<PublishedFrame | null>(null)
  const [photos, setPhotos] = useState<(string | null)[]>(Array(DEFAULT_SLOT_COUNT).fill(null))
  const [activeSlot, setActiveSlot] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState(starterThemes[0].id)
  const [stripPreviewUrl, setStripPreviewUrl] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)

  const selectedTheme = useMemo(
    () => starterThemes.find((theme) => theme.id === selectedThemeId) ?? starterThemes[0],
    [selectedThemeId],
  )
  const slotCount = selectedCommunityFrame ? frameSlotCount(selectedCommunityFrame) : DEFAULT_SLOT_COUNT

  const completedCount = photos.filter(Boolean).length
  const isComplete = completedCount === slotCount

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('error')
      setCameraError(copy.shoot.cameraGeneric)
      return
    }

    setCameraStatus('loading')
    setCameraError('')
    stopCamera()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraStatus('ready')
    } catch (error) {
      setCameraStatus('error')
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCameraError(copy.shoot.permissionDenied)
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        setCameraError(copy.shoot.noCamera)
      } else if (error instanceof DOMException && error.name === 'NotReadableError') {
        setCameraError(copy.shoot.cameraBusy)
      } else {
        setCameraError(copy.shoot.cameraGeneric)
      }
    }
  }, [copy.shoot, facingMode, stopCamera])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    try {
      const rawFrame = window.localStorage.getItem(COMMUNITY_FRAME_SELECTION_KEY)
      if (!rawFrame) return

      const frame = JSON.parse(rawFrame) as PublishedFrame
      const nextSlotCount = Math.max(1, frameSlotCount(frame))
      setSelectedCommunityFrame(frame)
      setPhotos(Array(nextSlotCount).fill(null))
      setActiveSlot(0)
      setStripPreviewUrl(null)
    } catch {
      window.localStorage.removeItem(COMMUNITY_FRAME_SELECTION_KEY)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function updatePreview() {
      if (!isComplete || photos.some((photo) => !photo)) {
        setStripPreviewUrl(null)
        return
      }

      setIsRendering(true)
      try {
        const canvas = selectedCommunityFrame
          ? await renderCommunityFrameStrip(photos as string[], selectedCommunityFrame)
          : await renderFourCutStrip(photos as string[], selectedTheme, copy.export.privacyFooter)
        if (!cancelled) {
          setStripPreviewUrl(canvas.toDataURL('image/png'))
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false)
        }
      }
    }

    updatePreview()

    return () => {
      cancelled = true
    }
  }, [copy.export.privacyFooter, isComplete, photos, selectedCommunityFrame, selectedTheme])

  function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  async function runCountdown() {
    for (let value = 3; value > 0; value -= 1) {
      setCountdown(value)
      await sleep(850)
    }
    setCountdown(null)
    await sleep(120)
  }

  function snapPhoto() {
    const video = videoRef.current
    const canvas = captureCanvasRef.current
    if (!video || !canvas) {
      throw new Error(copy.shoot.cameraNotReady)
    }

    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error(copy.shoot.canvasUnsupported)
    }

    ctx.drawImage(video, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  async function captureSlot(slotIndex: number) {
    if (cameraStatus !== 'ready' || isCapturing) return

    setIsCapturing(true)
    setActiveSlot(slotIndex)
    try {
      await runCountdown()
      const photo = snapPhoto()
      setPhotos((current) => current.map((item, index) => (index === slotIndex ? photo : item)))
      setActiveSlot(Math.min(slotIndex + 1, slotCount - 1))
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : copy.shoot.captureFailed)
    } finally {
      setCountdown(null)
      setIsCapturing(false)
    }
  }

  async function captureRemainingSlots() {
    if (cameraStatus !== 'ready' || isCapturing) return

    setIsCapturing(true)
    try {
      for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
        if (photos[slotIndex]) continue
        setActiveSlot(slotIndex)
        await runCountdown()
        const photo = snapPhoto()
        setPhotos((current) => current.map((item, index) => (index === slotIndex ? photo : item)))
        await sleep(350)
      }
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : copy.shoot.captureFailed)
    } finally {
      setCountdown(null)
      setIsCapturing(false)
    }
  }

  async function downloadStrip() {
    if (!isComplete || photos.some((photo) => !photo)) return

    setIsRendering(true)
    try {
      const canvas = selectedCommunityFrame
        ? await renderCommunityFrameStrip(photos as string[], selectedCommunityFrame)
        : await renderFourCutStrip(photos as string[], selectedTheme, copy.export.privacyFooter)
      downloadCanvasAsPng(canvas, `fotbarin-${selectedCommunityFrame?.id ?? selectedTheme.id}.png`)
    } finally {
      setIsRendering(false)
    }
  }

  function resetSession() {
    setPhotos(Array(slotCount).fill(null))
    setStripPreviewUrl(null)
    setActiveSlot(0)
    setCountdown(null)
    setCameraError('')
  }

  function switchCamera() {
    setFacingMode((current) => (current === 'user' ? 'environment' : 'user'))
  }

  function selectStarterTheme(themeId: string) {
    setSelectedCommunityFrame(null)
    window.localStorage.removeItem(COMMUNITY_FRAME_SELECTION_KEY)
    setSelectedThemeId(themeId)
    setPhotos(Array(DEFAULT_SLOT_COUNT).fill(null))
    setStripPreviewUrl(null)
    setActiveSlot(0)
  }

  function handleUploadFallback(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, slotCount)
    if (files.length === 0) return

    const readers = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(file)
        }),
    )

    Promise.all(readers)
      .then((uploadedPhotos) => {
        setPhotos((current) => {
          const next = [...current]
          let uploadIndex = 0
          for (let index = 0; index < slotCount && uploadIndex < uploadedPhotos.length; index += 1) {
            if (!next[index]) {
              next[index] = uploadedPhotos[uploadIndex]
              uploadIndex += 1
            }
          }
          return next
        })
      })
      .catch(() => setCameraError(copy.shoot.uploadFailed))
      .finally(() => {
        event.target.value = ''
      })
  }

  const cameraStatusLabel =
    cameraStatus === 'ready'
      ? copy.shoot.cameraReady
      : cameraStatus === 'loading'
        ? copy.shoot.openingCamera
        : cameraStatus === 'error'
          ? copy.shoot.cameraIssue
          : copy.shoot.cameraIdle

  return (
    <DashboardShell
      active="shoot"
      title="Foto"
      subtitle="Ambil foto strip langsung dari browser."
      sidebarLabel="Photo booth"
      rightAccessory={
        <button onClick={resetSession} className="rounded-full border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-background shadow-sm transition hover:bg-surface-container-low">
          {copy.shoot.resetSession}
        </button>
      }
    >
      <div className="pb-28 text-on-background lg:pb-0">
      <canvas ref={captureCanvasRef} className="hidden" aria-hidden="true" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleUploadFallback}
      />

      <section className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="app-panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
                <span className={`h-2 w-2 rounded-full ${cameraStatus === 'ready' ? 'bg-success' : cameraStatus === 'error' ? 'bg-on-error-container' : 'bg-outline'}`} />
                {cameraStatusLabel}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.shoot.title}</h1>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{copy.shoot.subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMirrorPreview((current) => !current)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${mirrorPreview ? 'border-primary/25 bg-primary-container text-on-primary-container' : 'border-outline-variant bg-white text-on-surface-variant hover:text-on-background'}`}
              >
                {mirrorPreview ? copy.shoot.mirrorOn : copy.shoot.mirrorOff}
              </button>
              <button onClick={switchCamera} className="rounded-full border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-background shadow-sm transition hover:bg-surface-container-low">
                {copy.shoot.switchCamera}
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-outline-variant bg-black shadow-sm">
              <div className="aspect-[4/3] w-full">
                {cameraStatus === 'loading' && (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-surface-container-low text-center">
                    <div>
                      <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-primary-container" />
                      <p className="font-semibold text-on-surface-variant">{copy.shoot.opening}</p>
                    </div>
                  </div>
                )}

                {cameraStatus === 'error' && (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-error-container p-6 text-center text-on-error-container">
                    <div className="max-w-md">
                      <h2 className="text-2xl font-extrabold tracking-tight">{copy.shoot.cameraUnavailable}</h2>
                      <p className="mt-3 text-sm leading-6">{cameraError}</p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <button onClick={startCamera} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-on-background shadow-sm">
                          {copy.common.tryAgain}
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm">
                          {copy.shoot.uploadPhotos}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${mirrorPreview ? '-scale-x-100' : ''}`}
                />
              </div>

              <div className="absolute left-3 top-3 rounded-full bg-white/88 px-3 py-1.5 text-sm font-bold text-on-background shadow-sm backdrop-blur">
                {formatMessage(copy.shoot.slotOf, { current: activeSlot + 1, total: slotCount })}
              </div>

              {countdown !== null && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-black/24 backdrop-blur-[2px]">
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-6xl font-extrabold text-primary shadow-panel sm:h-36 sm:w-36 sm:text-7xl">
                    {countdown}
                  </div>
                </div>
              )}

              {isCapturing && countdown === null && <div className="capture-flash absolute inset-0 z-10 bg-white/60" />}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => (photo ? captureSlot(index) : setActiveSlot(index))}
                  disabled={isCapturing || (photo ? cameraStatus !== 'ready' : false)}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border text-left transition ${activeSlot === index ? 'border-primary ring-2 ring-primary/15' : 'border-outline-variant hover:border-outline'}`}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={`Captured slot ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-surface-container-low text-on-surface-variant">
                      <span className="text-sm font-bold">{index + 1}</span>
                      <span className="mt-1 text-[11px] font-semibold">{copy.shoot.empty}</span>
                    </div>
                  )}
                  {photo && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-on-background opacity-0 shadow-sm transition group-hover:opacity-100">
                      {copy.shoot.retake}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <button
                onClick={captureRemainingSlots}
                disabled={cameraStatus !== 'ready' || isCapturing || isComplete}
                className="rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker disabled:pointer-events-none disabled:opacity-50"
              >
                {isCapturing
                  ? copy.shoot.capturing
                  : completedCount === 0
                    ? copy.shoot.startCountdown
                    : isComplete
                      ? copy.shoot.allCaptured
                      : formatMessage(copy.shoot.captureRemaining, { count: slotCount - completedCount })}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-outline-variant bg-white px-5 py-3.5 text-sm font-bold text-on-background shadow-sm transition hover:bg-surface-container-low">
                {copy.common.upload}
              </button>
              <button onClick={resetSession} className="rounded-full border border-outline-variant bg-white px-5 py-3.5 text-sm font-bold text-on-surface-variant shadow-sm transition hover:text-on-background sm:hidden">
                {copy.common.reset}
              </button>
            </div>
          </div>
        </div>

        <aside className="grid gap-5 lg:content-start">
          <div className="app-panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">{copy.shoot.frameTitle}</h2>
                <p className="text-sm text-on-surface-variant">{copy.shoot.frameSubtitle}</p>
              </div>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant">{selectedCommunityFrame ? 'Community' : selectedTheme.tag}</span>
            </div>

            <div className="grid gap-2 lg:max-h-[440px] lg:overflow-y-auto lg:pr-1">
              {selectedCommunityFrame && (
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-2xl border border-primary bg-primary-container p-3 text-left transition"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-white text-primary">
                    <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-on-background">{selectedCommunityFrame.name}</span>
                    <span className="block text-sm text-on-surface-variant">@{selectedCommunityFrame.creatorUsername} · {slotCount} slot</span>
                  </span>
                  <span className="text-sm font-bold text-primary">{copy.common.selected}</span>
                </button>
              )}
              {starterThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => selectStarterTheme(theme.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${!selectedCommunityFrame && selectedThemeId === theme.id ? 'border-primary bg-primary-container' : 'border-outline-variant bg-white hover:bg-surface-container-low'}`}
                >
                  <span className="h-10 w-10 rounded-xl border border-black/10" style={{ backgroundColor: theme.background }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-on-background">{theme.name}</span>
                    <span className="block text-sm text-on-surface-variant">{theme.tag} · 4-cut</span>
                  </span>
                  {!selectedCommunityFrame && selectedThemeId === theme.id && <span className="text-sm font-bold text-primary">{copy.common.selected}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="app-panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">{copy.shoot.exportTitle}</h2>
                <p className="text-sm text-on-surface-variant">{formatMessage(copy.shoot.photosReady, { current: completedCount, total: slotCount })}</p>
              </div>
              {isComplete && <span className="rounded-full bg-success-container px-3 py-1 text-xs font-bold text-success">{copy.shoot.ready}</span>}
            </div>

            <div className="rounded-[1.25rem] border border-outline-variant bg-surface-container-low p-3">
              <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[1.1rem] bg-white shadow-sm">
                {stripPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stripPreviewUrl} alt="Rendered Fotbarin photobooth strip" className="w-full" />
                ) : (
                  <div className="flex h-[420px] flex-col gap-2 p-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="flex-1 overflow-hidden rounded-xl border border-outline-variant bg-white">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo} alt={`Preview slot ${index + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-sm font-bold text-on-surface-variant">{index + 1}</div>
                        )}
                      </div>
                    ))}
                    <div className="rounded-full bg-surface-container-low py-2 text-center text-sm font-extrabold text-on-background">{copy.common.appName}</div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={downloadStrip}
              disabled={!isComplete || isRendering}
              className="mt-4 w-full rounded-full bg-on-background px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker disabled:pointer-events-none disabled:opacity-50"
            >
              {isRendering ? copy.shoot.rendering : isComplete ? copy.shoot.downloadPng : formatMessage(copy.shoot.needMore, { count: slotCount - completedCount })}
            </button>

            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{copy.shoot.exportMirrorNote}</p>
          </div>

          <div className="rounded-2xl border border-tertiary/20 bg-tertiary-container/70 p-4 text-on-tertiary-container">
            <p className="text-sm font-semibold leading-6">{copy.shoot.privacyNote}</p>
          </div>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] gap-3">
          <button
            onClick={isComplete ? downloadStrip : captureRemainingSlots}
            disabled={isComplete ? isRendering : cameraStatus !== 'ready' || isCapturing}
            className="rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-sm disabled:pointer-events-none disabled:opacity-50"
          >
            {isComplete
              ? isRendering
                ? copy.shoot.rendering
                : copy.shoot.downloadPng
              : isCapturing
                ? copy.shoot.capturing
                : completedCount === 0
                  ? copy.shoot.startCountdown
                  : formatMessage(copy.shoot.captureMore, { count: slotCount - completedCount })}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-outline-variant bg-white px-4 py-3.5 text-sm font-bold text-on-background shadow-sm"
          >
            {copy.common.upload}
          </button>
        </div>
      </div>
      </div>
    </DashboardShell>
  )
}
