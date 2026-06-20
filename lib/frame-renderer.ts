export type PhotoStripTheme = {
  id: string
  name: string
  tag: string
  background: string
  accent: string
  text: string
  slotFill: string
  border: string
  pattern: 'dots' | 'grid' | 'stars' | 'minimal'
  marks: string[]
}

export const starterThemes: PhotoStripTheme[] = [
  {
    id: 'rose-studio',
    name: 'Rose Studio',
    tag: 'Soft',
    background: '#f7e7ee',
    accent: '#8b3d5d',
    text: '#2a1820',
    slotFill: '#fff9fb',
    border: 'rgba(42, 24, 32, 0.84)',
    pattern: 'dots',
    marks: ['♡', '✦', '♡', '✦'],
  },
  {
    id: 'sky-receipt',
    name: 'Sky Receipt',
    tag: 'Clean',
    background: '#dceff3',
    accent: '#326671',
    text: '#102b31',
    slotFill: '#f7fcfd',
    border: 'rgba(16, 43, 49, 0.78)',
    pattern: 'minimal',
    marks: ['·', '✧', '·', '✧'],
  },
  {
    id: 'matcha-frame',
    name: 'Matcha Frame',
    tag: 'Minimal',
    background: '#e6f2df',
    accent: '#4f6f3d',
    text: '#172412',
    slotFill: '#fbfef8',
    border: 'rgba(23, 36, 18, 0.78)',
    pattern: 'grid',
    marks: ['+', '○', '+', '○'],
  },
  {
    id: 'classic-white',
    name: 'Classic White',
    tag: 'Studio',
    background: '#f8f7f8',
    accent: '#4b3f46',
    text: '#171316',
    slotFill: '#ffffff',
    border: 'rgba(23, 19, 22, 0.84)',
    pattern: 'minimal',
    marks: ['01', '02', '03', '04'],
  },
  {
    id: 'ink-film',
    name: 'Ink Film',
    tag: 'Film',
    background: '#1e1b1f',
    accent: '#f6d7df',
    text: '#fff7fa',
    slotFill: '#fbfafb',
    border: 'rgba(255, 247, 250, 0.68)',
    pattern: 'stars',
    marks: ['✦', '✧', '✦', '✧'],
  },
  {
    id: 'lavender-note',
    name: 'Lavender Note',
    tag: 'Cute',
    background: '#ebe5f7',
    accent: '#6d5793',
    text: '#241c33',
    slotFill: '#fbf9ff',
    border: 'rgba(36, 28, 51, 0.78)',
    pattern: 'dots',
    marks: ['✿', '♡', '✿', '♡'],
  },
]

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight
  const targetRatio = width / height
  let sx = 0
  let sy = 0
  let sw = image.naturalWidth
  let sh = image.naturalHeight

  if (imageRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio
    sx = (image.naturalWidth - sw) / 2
  } else {
    sh = image.naturalWidth / targetRatio
    sy = (image.naturalHeight - sh) / 2
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawBackgroundPattern(ctx: CanvasRenderingContext2D, theme: PhotoStripTheme, width: number, height: number) {
  ctx.save()

  if (theme.pattern === 'dots') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)'
    for (let i = 0; i < 22; i += 1) {
      const x = 38 + ((i * 127) % (width - 76))
      const y = 42 + ((i * 191) % (height - 190))
      ctx.beginPath()
      ctx.arc(x, y, 3 + (i % 3) * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (theme.pattern === 'grid') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)'
    ctx.lineWidth = 1
    for (let x = 48; x < width; x += 48) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 48; y < height; y += 48) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  if (theme.pattern === 'stars') {
    ctx.fillStyle = 'rgba(255, 247, 250, 0.26)'
    ctx.font = '700 26px Nunito Sans, sans-serif'
    for (let i = 0; i < 16; i += 1) {
      const x = 32 + ((i * 113) % (width - 84))
      const y = 52 + ((i * 167) % (height - 180))
      ctx.fillText(i % 2 === 0 ? '✦' : '·', x, y)
    }
  }

  ctx.restore()
}

export async function renderFourCutStrip(photoDataUrls: string[], theme: PhotoStripTheme, privacyFooter = 'processed locally · no photo upload') {
  const canvas = document.createElement('canvas')
  canvas.width = 760
  canvas.height = 1900

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.')
  }

  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawBackgroundPattern(ctx, theme, canvas.width, canvas.height)

  const marginX = 56
  const marginTop = 64
  const gap = 28
  const footerHeight = 250
  const slotWidth = canvas.width - marginX * 2
  const slotHeight = (canvas.height - marginTop - footerHeight - gap * 3) / 4

  const loadedImages = await Promise.all(photoDataUrls.map((src) => loadImage(src)))

  loadedImages.forEach((image, index) => {
    const x = marginX
    const y = marginTop + index * (slotHeight + gap)

    ctx.save()
    drawRoundedRect(ctx, x, y, slotWidth, slotHeight, 24)
    ctx.fillStyle = theme.slotFill
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = theme.border
    ctx.stroke()
    ctx.clip()
    drawImageCover(ctx, image, x, y, slotWidth, slotHeight)
    ctx.restore()

    ctx.save()
    ctx.font = theme.marks[index]?.length > 1 ? '800 22px Nunito Sans, sans-serif' : '800 34px Nunito Sans, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillStyle = theme.accent
    ctx.fillText(theme.marks[index] ?? '♡', x + slotWidth - 28, y + 46)
    ctx.restore()
  })

  const brandY = canvas.height - 182
  ctx.fillStyle = theme.pattern === 'stars' ? 'rgba(255, 247, 250, 0.94)' : '#ffffff'
  drawRoundedRect(ctx, marginX, brandY, slotWidth, 90, 45)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = theme.border
  ctx.stroke()

  ctx.fillStyle = theme.pattern === 'stars' ? '#1e1b1f' : theme.text
  ctx.textAlign = 'center'
  ctx.font = '800 50px Nunito Sans, sans-serif'
  ctx.fillText('Fotbarin', canvas.width / 2, brandY + 58)

  ctx.textAlign = 'center'
  ctx.font = '700 22px Nunito Sans, sans-serif'
  ctx.fillStyle = theme.pattern === 'stars' ? 'rgba(255, 247, 250, 0.78)' : theme.accent
  ctx.fillText(privacyFooter, canvas.width / 2, canvas.height - 42)

  return canvas
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = 'fotbarin-strip.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
