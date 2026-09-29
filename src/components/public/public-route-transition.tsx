"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const transitionDurationMs = 220;

/** Keeps the previous main content visible briefly while the next public route enters. */
export function PublicRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const previousPage = useRef({ pathname, children });
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [outgoing, setOutgoing] = useState<ReactNode | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useLayoutEffect(() => {
    if (previousPage.current.pathname !== pathname) {
      const previous = previousPage.current;
      previousPage.current = { pathname, children };
      setOutgoing(previous.children);
      setTransitioning(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setOutgoing(null);
        setTransitioning(false);
        timeout.current = null;
      }, transitionDurationMs);
      return;
    }

    previousPage.current.children = children;
  }, [children, pathname]);

  useLayoutEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  return (
    <div className="public-route-transition">
      <div className="public-route-transition__current" data-transitioning={transitioning ? "true" : undefined}>
        {children}
      </div>
      {outgoing !== null && (
        <div className="public-route-transition__outgoing" aria-hidden="true" inert>
          {outgoing}
        </div>
      )}
    </div>
  );
}
