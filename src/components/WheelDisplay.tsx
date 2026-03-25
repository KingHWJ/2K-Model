import type { CSSProperties } from 'react'

interface WheelDisplayProps {
  title: string
  subtitle: string
  items: string[]
  accent: 'gold' | 'red'
  rotation: number
  highlightText?: string
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
  highlightText,
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

      <div className="wheel-scene">
        <div className="wheel-pointer" aria-hidden="true" />
        <div
          className="wheel-disc"
          style={{
            backgroundImage: gradient,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {safeItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="wheel-label"
              style={
                {
                  '--label-index': index,
                  '--label-count': safeItems.length,
                } as CSSProperties
              }
            >
              {item}
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
