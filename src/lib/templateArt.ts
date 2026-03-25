interface PosterOptions {
  title: string
  subtitle: string
  featuredPlayers: string[]
  accentA: string
  accentB: string
  badgeText: string
}

export function createTemplatePosterDataUrl({
  title,
  subtitle,
  featuredPlayers,
  accentA,
  accentB,
  badgeText,
}: PosterOptions) {
  const featuredMarkup = featuredPlayers
    .slice(0, 3)
    .map(
      (player, index) => `
        <text x="52" y="${178 + index * 34}" fill="rgba(255,255,255,0.84)" font-size="24" font-family="Arial, sans-serif">${escapeXml(player)}</text>
      `,
    )
    .join('')

  const svg = `
    <svg width="960" height="1180" viewBox="0 0 960 1180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="posterGradient" x1="0" y1="0" x2="960" y2="1180" gradientUnits="userSpaceOnUse">
          <stop stop-color="${accentA}" />
          <stop offset="1" stop-color="${accentB}" />
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(720 240) rotate(129) scale(480 640)">
          <stop stop-color="rgba(255,255,255,0.34)" />
          <stop offset="1" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="960" height="1180" rx="56" fill="url(#posterGradient)"/>
      <rect x="24" y="24" width="912" height="1132" rx="36" stroke="rgba(255,255,255,0.16)" />
      <circle cx="760" cy="200" r="260" fill="url(#glow)" />
      <path d="M110 980C238 756 410 588 648 390" stroke="rgba(255,255,255,0.14)" stroke-width="6" stroke-linecap="round"/>
      <path d="M72 858C240 650 436 494 744 256" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-linecap="round"/>
      <text x="52" y="92" fill="rgba(255,255,255,0.68)" font-size="26" letter-spacing="6" font-family="Arial, sans-serif">NBA 2K26 TEMPLATE</text>
      <text x="52" y="344" fill="#FFFFFF" font-size="92" font-weight="700" font-family="Arial, sans-serif">${escapeXml(title)}</text>
      <text x="56" y="406" fill="rgba(255,255,255,0.78)" font-size="30" font-family="Arial, sans-serif">${escapeXml(subtitle)}</text>
      <rect x="52" y="448" width="180" height="56" rx="28" fill="rgba(255,255,255,0.14)" />
      <text x="82" y="486" fill="#FFFFFF" font-size="28" font-weight="700" font-family="Arial, sans-serif">${escapeXml(badgeText)}</text>
      <text x="52" y="146" fill="rgba(255,255,255,0.52)" font-size="18" font-family="Arial, sans-serif">FEATURED PLAYERS</text>
      ${featuredMarkup}
      <text x="56" y="1058" fill="rgba(255,255,255,0.92)" font-size="148" font-weight="700" font-family="Arial, sans-serif">${escapeXml(featuredPlayers[0] ?? title)}</text>
      <text x="56" y="1116" fill="rgba(255,255,255,0.44)" font-size="22" font-family="Arial, sans-serif">UPLOAD YOUR OWN REAL COVER ANYTIME</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
