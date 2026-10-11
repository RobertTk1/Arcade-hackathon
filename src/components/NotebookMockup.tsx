export function NotebookMockup({ cover }: { cover?: string }) {
  return (
    <svg viewBox="0 0 320 420" role="img" aria-label="Notebook with your cover" className="h-auto w-full max-w-72">
      <defs>
        <clipPath id="cover-clip">
          <rect x="30" y="20" width="248" height="360" rx="14" />
        </clipPath>
      </defs>
      <ellipse cx="164" cy="402" rx="120" ry="10" fill="#1a1a18" opacity=".1" />
      <rect x="38" y="28" width="248" height="360" rx="14" fill="#e8e4dc" />
      <rect x="30" y="20" width="248" height="360" rx="14" fill="#2f543b" />
      {cover && (
        <image
          href={cover}
          x="30"
          y="20"
          width="248"
          height="360"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#cover-clip)"
        />
      )}
      <rect x="30" y="20" width="26" height="360" rx="14" fill="#1a2e20" opacity=".85" />
      <g fill="#fffdf9">
        {[60, 110, 160, 210, 260, 310].map((y) => (
          <circle key={y} cx="43" cy={y} r="4" />
        ))}
      </g>
      <rect x="86" y="70" width="150" height="70" rx="20" fill="#fdf4ec" opacity=".94" />
      <text x="161" y="114" textAnchor="middle" fontFamily="Nunito, Outfit, sans-serif" fontWeight="800" fontSize="34" letterSpacing="2" fill="#2f543b">
        como
      </text>
    </svg>
  );
}
