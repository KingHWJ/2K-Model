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
  variant?: 'players' | 'numbers'
  size?: 'default' | 'large'
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
  variant = 'players',
  size = 'default',
}: WheelDisplayProps) {
  const safeItems = items.length > 0 ? items : ['等待数据']
  const gradient = createConicGradient(safeItems.length, paletteMap[accent])
  const step = 360 / safeItems.length
  const sceneClassName = [
    'wheel-scene',
    isSpinning ? 'spinning' : '',
    size === 'large' ? 'large' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const discClassName = [
    'wheel-disc',
    isSpinning ? 'spinning' : '',
    variant === 'numbers' ? 'numbers' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className="wheel-card">
      <div className="wheel-copy">
        <p className="eyebrow">{title}</p>
        <h3>{subtitle}</h3>
        <p className="muted">
          {highlightText ? `当前结果：${highlightText}` : '点击按钮开始抽取'}
        </p>
      </div>

      <div className={sceneClassName}>
        <div className="wheel-pointer" aria-hidden="true" />
        <div
          className={discClassName}
          style={{
            '--wheel-rotation': `${rotation}deg`,
            '--segment-step': `${step}deg`,
            backgroundImage: gradient,
            transform: `rotate(${rotation}deg)`,
          } as CSSProperties}
        >
          {safeItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className={variant === 'numbers' ? 'wheel-label-anchor numbers' : 'wheel-label-anchor'}
              style={
                {
                  '--item-angle': `${step * index + step / 2}deg`,
                } as CSSProperties
              }
            >
              <span
                className={
                  [
                    'wheel-label',
                    item === selectedItem ? 'active' : '',
                    variant === 'numbers' ? 'numeric' : '',
                    safeItems.length > 40 ? 'dense' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
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
