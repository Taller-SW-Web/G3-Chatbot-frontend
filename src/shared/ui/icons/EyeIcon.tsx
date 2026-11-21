type IconProps = {
  size?: 16 | 20 | 24;
  className?: string;
  crossed?: boolean;
};

export function EyeIcon({ size = 20, className = "", crossed = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {crossed && <path d="M3 21 21 3" />}
      </g>
    </svg>
  );
}
