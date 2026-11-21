type IconProps = {
  size?: 16 | 20 | 24;
  className?: string;
};

export function ArrowLeftIcon({ size = 20, className = "" }: IconProps) {
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
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l6 6m-6-6l6-6"/>
    </svg>
  );
}
