import { cn } from "@/lib/utils";

interface SidebarLogoProps {
  className?: string;
}

export function SidebarLogo({ className }: SidebarLogoProps) {
  return (
    <svg
      viewBox="0 0 340 220"
      role="img"
      aria-label="Telugu Cinema Updates logo"
      className={cn("w-full", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-teal" x1="18" y1="60" x2="245" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B5C76" />
          <stop offset="0.45" stopColor="#0F8DAA" />
          <stop offset="1" stopColor="#18B3D1" />
        </linearGradient>
        <linearGradient id="logo-gold" x1="165" y1="86" x2="318" y2="174" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7C44D" />
          <stop offset="1" stopColor="#E59600" />
        </linearGradient>
        <linearGradient id="logo-cream" x1="36" y1="15" x2="129" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFDF6" />
          <stop offset="1" stopColor="#F5E1B8" />
        </linearGradient>
      </defs>

      <path
        d="M34 52 102 14c4-2 9 0 10 4l3 13-61 36-20-15c-5-4-4-12 0-14Z"
        fill="url(#logo-cream)"
      />
      <path
        d="M51 49c5-7 16-10 25-6l16 8-33 20-13-10 5-12Z"
        fill="url(#logo-teal)"
      />
      <path d="M65 60v61" stroke="#0B5C76" strokeWidth="7" strokeLinecap="round" />
      <path d="M51 122h30" stroke="#0B5C76" strokeWidth="7" strokeLinecap="round" />
      <path d="M43 144h46" stroke="#0B5C76" strokeWidth="7" strokeLinecap="round" />

      <path
        d="M93 61h25c7 0 12 5 12 12v57h-19V82h-18V61Zm45 11c0-6 5-11 11-11h47v21h-35v27h29v20h-29c-13 0-23-10-23-23V72Zm65 0c0-6 5-11 11-11h18v69h-18c-6 0-11-5-11-11V72Z"
        fill="url(#logo-teal)"
      />

      <circle cx="193" cy="95" r="34" fill="url(#logo-gold)" stroke="#0B5C76" strokeWidth="8" />
      <circle cx="193" cy="95" r="6" fill="#0B5C76" />
      <circle cx="193" cy="77" r="4.5" fill="#0B5C76" />
      <circle cx="209" cy="86" r="4.5" fill="#0B5C76" />
      <circle cx="209" cy="104" r="4.5" fill="#0B5C76" />
      <circle cx="193" cy="113" r="4.5" fill="#0B5C76" />
      <circle cx="177" cy="104" r="4.5" fill="#0B5C76" />
      <circle cx="177" cy="86" r="4.5" fill="#0B5C76" />

      <path
        d="M242 78c17 0 31 13 31 31v17l18-18 28 28v-7c0-5 4-9 9-9 4 0 7 2 8 6v35c0 5-4 9-9 9h-34c-5 0-9-4-9-9 0-4 3-8 7-8h9l-30-30-21 21h-37v-20h29v-14c0-7-6-13-13-13h-6V78h20Z"
        fill="url(#logo-gold)"
      />
      <path
        d="M237 71c21 0 39 17 39 39v9l18-18 22 22"
        stroke="#0B5C76"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text
        x="170"
        y="176"
        textAnchor="middle"
        fill="url(#logo-teal)"
        fontSize="27"
        fontWeight="800"
        letterSpacing="1.5"
      >
        TELUGU CINEMA
      </text>
      <text
        x="170"
        y="205"
        textAnchor="middle"
        fill="url(#logo-teal)"
        fontSize="28"
        fontWeight="800"
        letterSpacing="1.8"
      >
        UPDATES
      </text>
    </svg>
  );
}

