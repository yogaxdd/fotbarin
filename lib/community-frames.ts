export type SavedFrameElementKind = 'slot' | 'text' | 'sticker'

export type SavedFrameElement = {
  id: string
  kind: SavedFrameElementKind
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  radius?: number
  fit?: 'cover' | 'contain' | 'fill'
  text?: string
  color?: string
  fontSize?: number
  weight?: 700 | 800
  src?: string
  symbol?: string
}

export type PublishedFrame = {
  id: string
  name: string
  description: string
  creatorName: string
  creatorUsername: string
  createdAt: number
  status: 'published' | 'review'
  elements: SavedFrameElement[]
  canvas: {
    width: number
    height: number
  }
}

export const COMMUNITY_FRAMES_STORAGE_KEY = 'fotbarin:community-frames:v1'
export const COMMUNITY_FRAMES_UPDATED_EVENT = 'fotbarin:community-frames-updated'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function readPublishedFrames() {
  if (!isBrowser()) return [] as PublishedFrame[]

  try {
    const raw = window.localStorage.getItem(COMMUNITY_FRAMES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PublishedFrame[]) : []
  } catch {
    return []
  }
}

export function writePublishedFrames(frames: PublishedFrame[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(COMMUNITY_FRAMES_STORAGE_KEY, JSON.stringify(frames))
  window.dispatchEvent(new Event(COMMUNITY_FRAMES_UPDATED_EVENT))
}

export function savePublishedFrame(frame: PublishedFrame) {
  const frames = readPublishedFrames().filter((item) => item.id !== frame.id)
  writePublishedFrames([frame, ...frames])
}

export function getPublishedFramesForUsername(username: string) {
  return readPublishedFrames().filter((frame) => frame.creatorUsername === username)
}

export function frameSlotCount(frame: PublishedFrame) {
  return frame.elements.filter((element) => element.kind === 'slot').length
}
