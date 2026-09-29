import type { SVGProps } from 'react'

/** Open pages distinguish reading duration from the publication clock. */
export const ReadingTimeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5.75c-2.4-1.4-5.6-1.65-8.5-.55v12.6c2.9-1.1 6.1-.85 8.5.55 2.4-1.4 5.6-1.65 8.5-.55V5.2c-2.9-1.1-6.1-.85-8.5.55Z" />
    <path d="M12 5.75v12.6M6.5 9h2.5M15 9h2.5" />
  </svg>
)
