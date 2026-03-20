interface YinYangProps {
  className?: string;
}

export function YinYang({ className = "w-5 h-5" }: YinYangProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Yin (black) half - left */}
      <path
        d="M 12 2 A 10 10 0 0 1 12 22 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 2 Z"
        fill="currentColor"
      />
      
      {/* Yang dot (white on black) */}
      <circle cx="12" cy="7" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Yin dot (black on white) */}
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}
