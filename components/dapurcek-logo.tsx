export function DapurCekLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 220 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-auto"
      >
        {/* Kitchen/building icon with checkmark */}
        <rect x="2" y="8" width="32" height="32" rx="6" fill="#071E49" />
        {/* Simplified kitchen/house shape */}
        <path d="M10 28V20L18 14L26 20V28H22V22H14V28H10Z" fill="#92D05D" />
        {/* Checkmark inside */}
        <path
          d="M14.5 24.5L17 27L23 21"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Text: DapurCek */}
        <text
          x="42"
          y="33"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="26"
          letterSpacing="-0.5"
        >
          <tspan fill="#071E49">Dapur</tspan>
          <tspan fill="#92D05D">Cek</tspan>
        </text>
      </svg>
    </div>
  )
}
