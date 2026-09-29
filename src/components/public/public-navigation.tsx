"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

const profileLinks = [
  { label: "Pengenalan", href: "/profil" },
  { label: "Carta Organisasi", href: "/profil/organisasi" },
  { label: "Surau Kariah", href: "/profil/surau-kariah" },
] as const;

const mainLinks = [
  { label: "Galeri", href: "/galeri" },
  { label: "Hubungi", href: "/hubungi" },
] as const;

function Chevron() {
  return (
    <svg className="public-nav__chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileDropdown({
  pathname,
  prefix,
  onNavigate,
}: {
  pathname: string;
  prefix: string;
  onNavigate?: () => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const isActive = pathname === "/profil" || pathname.startsWith("/profil/");

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
    setExpanded(false);
  }

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !detailsRef.current?.contains(event.target)) {
        if (detailsRef.current) detailsRef.current.open = false;
        setExpanded(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key === "Escape" && detailsRef.current?.open) {
      event.preventDefault();
      event.stopPropagation();
      close();
      triggerRef.current?.focus();
    }
  }

  return (
    <details
      className="profile-navigation"
      ref={detailsRef}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <summary
        ref={triggerRef}
        className="public-nav__link profile-navigation__trigger"
        aria-expanded={expanded}
        aria-controls={`${prefix}-profile-links`}
        data-active={isActive ? "true" : undefined}
      >
        Profil <Chevron />
      </summary>
      <div className="profile-navigation__panel" id={`${prefix}-profile-links`}>
        {profileLinks.map(({ label, href }) => (
          <Link
            key={href}
            className="profile-navigation__link"
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            onClick={() => {
              close();
              onNavigate?.();
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </details>
  );
}

function NavigationLinks({
  pathname,
  prefix,
  onNavigate,
}: {
  pathname: string;
  prefix: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <ProfileDropdown pathname={pathname} prefix={prefix} onNavigate={onNavigate} />
      {mainLinks.map(({ label, href }) => (
        <Link
          key={href}
          className="public-nav__link"
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          onClick={onNavigate}
        >
          {label}
        </Link>
      ))}
      <Link
        className="button button--primary button--sm public-nav__donation"
        href="/#donations"
        onClick={onNavigate}
      >
        Sumbangan
      </Link>
    </>
  );
}

/** Native disclosures keep navigation usable before hydration or without JS. */
export function PublicNavigation() {
  const pathname = usePathname() ?? "/";
  const menuRef = useRef<HTMLDetailsElement>(null);
  const menuTriggerRef = useRef<HTMLElement>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
      menuRef.current.querySelectorAll("details").forEach((details) => {
        details.open = false;
      });
    }
    setMenuExpanded(false);
  }

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        if (menuRef.current) {
          menuRef.current.open = false;
          menuRef.current.querySelectorAll("details").forEach((details) => {
            details.open = false;
          });
        }
        setMenuExpanded(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, []);

  return (
    <>
      <nav className="public-desktop-nav" aria-label="Navigasi utama">
        <NavigationLinks pathname={pathname} prefix="desktop" />
      </nav>
      <details
        className="public-mobile-menu"
        ref={menuRef}
        onToggle={(event) => setMenuExpanded(event.currentTarget.open)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuRef.current?.open) {
            event.preventDefault();
            closeMenu();
            menuTriggerRef.current?.focus();
          }
        }}
      >
        <summary
          ref={menuTriggerRef}
          className="public-mobile-menu__trigger"
          aria-label="Menu navigasi"
          aria-expanded={menuExpanded}
          aria-controls="mobile-navigation-links"
        >
          <span>Menu</span>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {menuExpanded ? (
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </summary>
        <nav className="public-mobile-nav" id="mobile-navigation-links" aria-label="Navigasi utama">
          <NavigationLinks pathname={pathname} prefix="mobile" onNavigate={closeMenu} />
        </nav>
      </details>
    </>
  );
}
