"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/admin/policy";
import type { BrowserConfig } from "@/lib/supabase/config";
import { browserClient } from "@/lib/supabase/browser";
import { SignOut } from "./signout";
export function AdminShell({ children, userId, email, role, config }: { children: ReactNode; userId: string; email: string; role: AdminRole; config: BrowserConfig }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const sensitive = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    let stopped = false;
    const hideAndLeave = () => {
      if (sensitive.current) sensitive.current.hidden = true;
      setVisible(false); window.location.replace("/admin/login?state=denied");
    };
    const { data } = browserClient(config).auth.onAuthStateChange((event, session) => {
      // Browser session can only invalidate the rendered view; never grant authority.
      if (event === "SIGNED_OUT" || session && session.user.id !== userId) hideAndLeave();
    });
    const recheck = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/admin/api/security", { cache: "no-store", signal: AbortSignal.timeout(8000) });
        const state = await response.json();
        if (!response.ok || state.user_id !== userId || state.role !== role ||
          (state.role === "super_admin" || state.has_totp) && state.aal !== "aal2") hideAndLeave();
      } catch { hideAndLeave(); }
    };
    const interval = setInterval(() => void recheck(), 30000);
    const onVisibility = () => { if (document.visibilityState === "visible") void recheck(); };
    const onPageHide = () => { if (sensitive.current) sensitive.current.hidden = true; };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) { onPageHide(); window.location.reload(); } };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => { stopped = true; clearInterval(interval); data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", onPageHide); window.removeEventListener("pageshow", onPageShow); };
  }, [config, userId, role]);
  const links = [{ href: "/admin", label: "Home" }, { href: "/admin/campaigns", label: "Kempen" }, ...(role === "super_admin" ? [{ href: "/admin/users", label: "Users" }] : []), { href: "/admin/settings", label: "Settings" }];
  const nav = <nav aria-label="Admin navigation">{links.map(link => <Link key={link.href} href={link.href} prefetch={false} aria-current={pathname === link.href || link.href === "/admin/campaigns" && pathname.startsWith("/admin/campaigns/") ? "page" : undefined} onClick={() => { dialog.current?.close(); setOpen(false); }}>{link.label}</Link>)}</nav>;
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Link href="/admin" prefetch={false} className="admin-brand">MTU<span>Internal workspace</span></Link>{nav}<Link className="admin-public-link" href="/" prefetch={false} onClick={event => { event.preventDefault(); if (sensitive.current) sensitive.current.hidden = true; window.location.assign(new URL("/", window.location.origin).href); }}>Public website ↗</Link></aside>
    <div className="admin-body"><header className="admin-topbar"><button className="admin-menu" aria-label="Open admin navigation" aria-expanded={open} onClick={() => { dialog.current?.showModal(); setOpen(true); }}>Menu</button>
      <div className="admin-identity"><span>{email}</span><small>{role}</small></div><SignOut config={config} /></header>
      <div ref={sensitive} data-admin-sensitive hidden={!visible}><main className="admin-content">{children}</main></div>
    </div>
    <dialog ref={dialog} className="admin-drawer" onClose={() => setOpen(false)}><button className="admin-button admin-button-secondary" onClick={() => dialog.current?.close()}>Close navigation</button>{nav}</dialog>
  </div>;
}
