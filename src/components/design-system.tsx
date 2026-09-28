import Image from "next/image";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  href,
  ...props
}: ButtonProps) {
  const classes = `button button--${variant} button--${size} ${className}`.trim();

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

type ContainerProps = {
  children: ReactNode;
  className?: string;
  width?: "narrow" | "default" | "wide";
};

export function Container({
  children,
  className = "",
  width = "default",
}: ContainerProps) {
  return (
    <div className={`container container--${width} ${className}`.trim()}>
      {children}
    </div>
  );
}

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "ivory" | "white" | "navy";
};

export function Section({
  children,
  className = "",
  id,
  tone = "white",
}: SectionProps) {
  return (
    <section id={id} className={`section section--${tone} ${className}`.trim()}>
      {children}
    </section>
  );
}

type HeadingProps = {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export function Heading({
  children,
  as: Tag = "h2",
  className = "",
}: HeadingProps) {
  return <Tag className={`heading ${className}`.trim()}>{children}</Tag>;
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: "dark" | "light";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
}: SectionHeadingProps) {
  return (
    <div className={`section-heading section-heading--${tone}`}>
      <p className="eyebrow">{eyebrow}</p>
      <Heading>{title}</Heading>
      {description ? <p className="section-heading__description">{description}</p> : null}
    </div>
  );
}

type BadgeProps = {
  children: ReactNode;
  variant?: "neutral" | "blue" | "gold" | "dark";
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

type CardProps = {
  children: ReactNode;
  variant?: "light" | "navy" | "highlighted";
  className?: string;
};

export function Card({
  children,
  variant = "light",
  className = "",
}: CardProps) {
  return (
    <article className={`card card--${variant} ${className}`.trim()}>
      {children}
    </article>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ id, label, hint, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  const hintId = hint && inputId ? `${inputId}-hint` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        className={`field__control ${className}`.trim()}
        id={inputId}
        aria-describedby={hintId}
        {...props}
      />
      {hint ? (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function Textarea({
  id,
  label,
  hint,
  className = "",
  ...props
}: TextareaProps) {
  const inputId = id ?? props.name;
  const hintId = hint && inputId ? `${inputId}-hint` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        className={`field__control field__control--textarea ${className}`.trim()}
        id={inputId}
        aria-describedby={hintId}
        {...props}
      />
      {hint ? (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

const navItems = [
  ["Warna", "#colors"],
  ["Tipografi", "#typography"],
  ["Komponen", "#components"],
  ["Borang", "#forms"],
] as const;

const publicNavItems = [
  ["Utama", "#home"],
  ["Waktu solat", "#prayer-times"],
  ["Program", "#programs"],
  ["Kuliah", "#lectures"],
  ["Tentang", "#about"],
] as const;

type NavbarProps = {
  variant?: "design-system" | "public";
};

export function Navbar({ variant = "design-system" }: NavbarProps) {
  const isPublic = variant === "public";
  const items = isPublic ? publicNavItems : navItems;

  return (
    <header className="site-header">
      <Container className="site-header__inner" width="wide">
        <Link className="brand" href={isPublic ? "/#home" : "/design-system"} aria-label="Masjid Talhah Bin Ubaidillah">
          <Image
            src="/brand/logo-masjid.png"
            alt=""
            width={56}
            height={56}
            className="brand__logo"
            priority
          />
          <span className="brand__text">
            <strong>Masjid Talhah Bin Ubaidillah</strong>
            <small>BUKIT JALIL · KUALA LUMPUR</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label={isPublic ? "Navigasi utama" : "Navigasi sistem reka bentuk"}>
          {items.map(([label, href]) => (
            <Link className="site-nav__link" href={href} key={href}>
              {label}
            </Link>
          ))}
          <Button href={isPublic ? "#donations" : "#components"} size="sm">
            {isPublic ? "Sumbangan" : "Lihat komponen"}
          </Button>
        </nav>
      </Container>
    </header>
  );
}

type FooterProps = {
  variant?: "design-system" | "public";
};

export function Footer({ variant = "design-system" }: FooterProps) {
  const isPublic = variant === "public";

  return (
    <footer className="site-footer">
      <Container className="site-footer__inner" width="wide">
        <div className="site-footer__brand">
          <Image
            src="/brand/logo-masjid.png"
            alt=""
            width={48}
            height={48}
            className="brand__logo"
          />
          <div>
            <strong>Masjid Talhah Bin Ubaidillah</strong>
            <p>Bukit Jalil, Kuala Lumpur</p>
          </div>
        </div>
        <p className="site-footer__note">
          {isPublic ? "Website rasmi · Bukit Jalil, Kuala Lumpur" : "Sistem reka bentuk · Fasa 1"}
        </p>
      </Container>
    </footer>
  );
}
