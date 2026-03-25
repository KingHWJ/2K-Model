export function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360
}

export function getTargetWheelRotation(
  itemCount: number,
  selectedIndex: number,
  currentRotation: number,
  extraSpins = 5,
) {
  if (itemCount <= 0) {
    return currentRotation
  }

  const step = 360 / itemCount
  const normalizedCurrent = normalizeRotation(currentRotation)
  // 让顶部向下的固定指针对齐到目标扇区的中心，而不是扇区边界。
  const targetRotation = normalizeRotation(-(selectedIndex * step + step / 2))
  let delta = targetRotation - normalizedCurrent

  if (delta < 0) {
    delta += 360
  }

  return currentRotation + extraSpins * 360 + delta
}

export function createSpinSequence(
  items: string[],
  selectedIndex: number,
  cycles = 3,
) {
  if (items.length === 0) {
    return ['等待抽取']
  }

  const total = Math.max(cycles, 1) * items.length + selectedIndex + 1

  return Array.from({ length: total }, (_, index) => items[index % items.length])
}
