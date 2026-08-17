/**
 * The mark in the manager's sidebar.
 *
 * The same LiDAR motif as the site's favicon — a sensor origin sweeping to
 * three returns — so the manager reads as part of the site rather than as a
 * separate tool. Keystatic hands the component the resolved colour scheme, so
 * the mark can carry its own ground in either theme instead of relying on a
 * fill that only works on one.
 */
export default function BrandMark({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const dark = colorScheme === 'dark'

  return (
    <svg
      viewBox="0 0 32 32"
      width={26}
      height={26}
      role="img"
      aria-label="Portfolio manager"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="8" fill={dark ? '#1a1f2b' : '#131720'} />
      <g
        stroke={dark ? '#60a5fa' : '#7cb2fb'}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      >
        <path d="M10 22 L22 10" />
        <path d="M10 22 L23 19" />
        <path d="M10 22 L14 8" />
      </g>
      <g fill={dark ? '#60a5fa' : '#7cb2fb'}>
        <circle cx="22" cy="10" r="2" />
        <circle cx="23" cy="19" r="2" />
        <circle cx="14" cy="8" r="2" />
        <circle cx="10" cy="22" r="3.2" />
      </g>
    </svg>
  )
}
