interface TableTennisProps {
  className?: string;
}

export function TableTennis({ className = "w-5 h-5" }: TableTennisProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Paddle blade (круглая/овальная основа ракетки) */}
      <ellipse
        cx="12"
        cy="8"
        rx="7"
        ry="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Paddle handle (ручка под углом) */}
      <path
        d="M 7 13 L 3 20 C 2.5 21 2.5 22 3.5 22.5 C 4.5 23 5.5 22.5 6 21.5 L 10 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Ball (мячик справа) */}
      <circle
        cx="19"
        cy="17"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}