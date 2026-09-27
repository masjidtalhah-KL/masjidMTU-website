type DecorativeProps = {
  className?: string;
};

/** Subtle, reusable rosette lattice derived from the official banner geometry. */
export function IslamicPattern({ className = "" }: DecorativeProps) {
  return <div className={`islamic-pattern ${className}`.trim()} aria-hidden="true" />;
}

/** Pointed mihrab outline with a finial and diamond band inspired by the mosque logo. */
export function MihrabMark({ className = "" }: DecorativeProps) {
  return (
    <svg
      className={`mihrab-mark ${className}`.trim()}
      viewBox="0 0 240 300"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="mihrab-mark__outer" d="M22 286V111c0-41 45-65 98-96 53 31 98 55 98 96v175" />
      <path className="mihrab-mark__inner" d="M42 286V116c0-31 37-52 78-76 41 24 78 45 78 76v170" />
      <path className="mihrab-mark__base" d="M14 286h212M34 270h172" />
      <path className="mihrab-mark__finial" d="m120 4 7 7-7 7-7-7 7-7Z" />
      <path className="mihrab-mark__diamonds" d="m63 229 10-10 10 10-10 10-10-10Zm27 0 10-10 10 10-10 10-10-10Zm27 0 10-10 10 10-10 10-10-10Zm27 0 10-10 10 10-10 10-10-10Zm27 0 10-10 10 10-10 10-10-10Z" />
      <path className="mihrab-mark__stem" d="M120 34v29" />
    </svg>
  );
}
