type DecorativeProps = {
  className?: string;
};

/** Minimal pointed mihrab outlines for subtle decoration. */
export function MihrabMark({ className = "" }: DecorativeProps) {
  return (
    <svg
      className={`mihrab-mark ${className}`.trim()}
      viewBox="0 0 240 300"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="mihrab-mark__outline" d="M22 286V111c0-41 45-65 98-96 53 31 98 55 98 96v175" />
      <path className="mihrab-mark__inset" d="M42 286V116c0-31 37-52 78-76 41 24 78 45 78 76v170" />
    </svg>
  );
}
