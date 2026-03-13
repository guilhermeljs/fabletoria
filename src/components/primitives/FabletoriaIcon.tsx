export const FabletoriaIcon = () => (
  <svg 
    viewBox="0 0 150 55" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMinYMid meet"
    style={{ width: '100%', height: '100%' }}
  >
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <g filter="url(#glow)">
      <text 
        x="0" 
        y="50%" 
        fill="currentColor" 
        textAnchor="start" 
        dominantBaseline="central"
        style={{ 
          font: 'italic 400 32px "Georgia", serif', 
          letterSpacing: '0.3px',
          userSelect: 'none' 
        }}
      >
        Fabletoria
      </text>

      <path 
        d="M0 46 C 30 50, 150 50, 100 46" 
        fill="currentColor" 
        opacity="0.4"
      />
      
      <path 
        d="M12 15C8 18 6 22 6 22" 
        stroke="currentColor" 
        strokeWidth="0.5" 
        opacity="0.3"
      />
    </g>
  </svg>
);