import type { CSSProperties } from 'react'

interface WheelDisplayProps {
  title: string
  subtitle: string
  items: string[]
  accent: 'gold' | 'red'
  rotation: number
  isSpinning?: boolean
  highlightText?: string
  selectedItem?: string
}

const paletteMap = {
  gold: ['#ffba08', '#ff7b00', '#ffd166', '#d00000', '#f48c06', '#9d0208'],
  red: ['#ef233c', '#8d99ae', '#2b2d42', '#ff595e', '#ffca3a', '#1982c4'],
}

export function WheelDisplay({
  title,
  subtitle,
  items,
  accent,
  rotation,
  isSpinning = false,
  highlightText,
  selectedItem,
}: WheelDisplayProps) {
  const safeItems = items.length > 0 ? items : ['等待数据']
  const gradient = createConicGradient(safeItems.length, paletteMap[accent])

  return (
    <article className="wheel-card">
      <div className="wheel-copy">
        <p className="eyebrow">{title}</p>
        <h3>{subtitle}</h3>
        <p className="muted">
          {highlightText ? `当前结果：${highlightText}` : '点击按钮开始抽取'}
        </p>
      </div>

      <div className={isSpinning ? 'wheel-scene spinning' : 'wheel-scene'}>
        <div className="wheel-pointer" aria-hidden="true" />
        <div
          className={isSpinning ? 'wheel-disc spinning' : 'wheel-disc'}
          style={{
            '--wheel-rotation': `${rotation}deg`,
            backgroundImage: gradient,
            transform: `rotate(${rotation}deg)`,
          } as CSSProperties}
        >
          {safeItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="wheel-label-anchor"
              style={
                {
                  '--item-angle': `${(360 / safeItems.length) * index}deg`,
                } as CSSProperties
              }
            >
              <span
                className={item === selectedItem ? 'wheel-label active' : 'wheel-label'}
              >
                {item}
              </span>
            </span>
          ))}
          <div className="wheel-core">2K</div>
        </div>
      </div>
    </article>
  )
}

function createConicGradient(segmentCount: number, colors: string[]) {
  const step = 360 / segmentCount
  const slices = Array.from({ length: segmentCount }, (_, index) => {
    const start = step * index
    const end = step * (index + 1)
    const color = colors[index % colors.length]

    return `${color} ${start}deg ${end}deg`
  })

  return `conic-gradient(${slices.join(', ')})`
}
