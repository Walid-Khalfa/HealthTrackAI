import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="shieldGrad" x1="100" y1="50" x2="400" y2="450" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2dd4bf" /> {/* teal-400 */}
        <stop offset="100%" stopColor="#0284c7" /> {/* sky-600 */}
      </linearGradient>
      <filter id="dropshadow" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="10"/> 
        <feOffset dx="0" dy="5" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#dropshadow)">
      {/* Shield Body */}
      <path 
        d="M256 32 C130 32 64 120 64 200 C64 330 256 480 256 480 C256 480 448 330 448 200 C448 120 382 32 256 32 Z" 
        fill="url(#shieldGrad)" 
      />
      
      {/* Highlight/Gloss Top */}
      <path
         d="M256 42 C150 42 90 120 85 200 C83 180 100 60 256 60 C400 60 420 180 427 200 C420 110 360 42 256 42 Z"
         fill="white"
         fillOpacity="0.2"
      />
      
      {/* White Heart Background */}
      <path 
        d="M256 160 
           C220 110 120 130 130 230 
           C130 290 256 380 256 380 
           C256 380 382 290 382 230 
           C392 130 292 110 256 160 Z" 
        fill="white"
      />
      
      {/* Pulse Line */}
      <path 
        d="M160 230 H 210 L 230 190 L 270 270 L 290 230 H 350" 
        stroke="#0284c7" 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Shine Dot */}
      <circle cx="390" cy="110" r="20" fill="white" fillOpacity="0.6" />
    </g>
  </svg>
);