import { useId } from "react";

type DecorativeProps = {
  className?: string;
};

type BrandPatternProps = DecorativeProps & {
  variant?: "refined" | "previous";
};

const petalAngles = Array.from({ length: 16 }, (_, index) => index * 22.5);

/** Lightweight vector study of the linked rosettes visible in the official banner SVG. */
export function BrandPattern({
  className = "",
  variant = "refined",
}: BrandPatternProps) {
  const patternId = `brand-pattern-${useId()}`;
  const isPrevious = variant === "previous";

  return (
    <svg
      className={`brand-pattern ${className}`.trim()}
      viewBox="0 0 480 480"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id={patternId}
          width={isPrevious ? "96" : "96"}
          height={isPrevious ? "96" : "96"}
          patternUnits="userSpaceOnUse"
        >
          {isPrevious ? (
            <g className="brand-pattern__previous">
              <path d="M48 4 57 27 81 14 69 38 92 48 69 58 81 82 57 69 48 92 39 69 15 82 27 58 4 48 27 38 15 14 39 27Z" />
              <path d="M0 0 24 24 0 48m96-48L72 24l24 24M0 96l24-24L0 48m96 48L72 72l24-24" />
            </g>
          ) : (
            <g className="brand-pattern__refined">
              {petalAngles.map((angle) => (
                <path
                  key={angle}
                  transform={`rotate(${angle} 0 0)`}
                  d="M0 0C-4-8-7-19 0-30 7-19 4-8 0 0Z"
                />
              ))}
              <path d="M28-5C37-15 59-15 68-5 59 5 37 5 28-5ZM28 91C37 81 59 81 68 91 59 101 37 101 28 91ZM-5 28C-15 37-15 59-5 68 5 59 5 37-5 28ZM91 28C81 37 81 59 91 68 101 59 101 37 91 28Z" />
              <path d="M48 28C58 37 58 59 48 68 38 59 38 37 48 28ZM-48 28C-38 37-38 59-48 68-58 59-58 37-48 28Z" />
            </g>
          )}
        </pattern>
      </defs>
      <rect width="480" height="480" fill={`url(#${patternId})`} />
    </svg>
  );
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
