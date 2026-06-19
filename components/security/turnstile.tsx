"use client";

/**
 * Cloudflare Turnstile widget (client).
 *
 * Renders the invisible/managed CAPTCHA and reports the resulting token via
 * `onToken`. When NEXT_PUBLIC_TURNSTILE_SITE_KEY is absent it renders nothing
 * and immediately reports the sentinel "skip" so the host form proceeds — the
 * server-side verifier also no-ops in that case, so the app works end-to-end
 * with Turnstile disabled.
 *
 * The token is single-use and short-lived; call `resetKey` (change its value)
 * to force a fresh challenge after a failed submit.
 */

import { useEffect, useLayoutEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      action?: string;
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "auto" | "light" | "dark";
      size?: "normal" | "flexible" | "compact";
    },
  ) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function ensureScript(onReady: () => void): void {
  if (window.turnstile) {
    onReady();
    return;
  }
  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    const poll = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(poll);
        onReady();
      }
    }, 150);
    return;
  }
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.src = SCRIPT_SRC;
  s.async = true;
  s.defer = true;
  s.onload = onReady;
  document.head.appendChild(s);
}

export interface TurnstileProps {
  onToken: (token: string) => void;
  /** Optional action label, shown in the Turnstile analytics dashboard. */
  action?: string;
  /** Change this value to force the widget to reset and re-challenge. */
  resetKey?: string | number;
}

export function Turnstile({ onToken, action, resetKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Keep the latest callback without re-running the mount effect.
  const onTokenRef = useRef(onToken);
  useLayoutEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) {
      // Not configured → let the form through; server-side verifier no-ops.
      onTokenRef.current("skip");
      return;
    }

    let cancelled = false;
    ensureScript(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action,
        theme: "auto",
        size: "flexible",
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(""),
        "expired-callback": () => onTokenRef.current(""),
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null;
      }
    };
  }, [action]);

  // Reset the widget when resetKey changes (e.g. after a failed submit).
  useEffect(() => {
    if (resetKey === undefined) return;
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* not ready yet */
      }
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="flex justify-center" />;
}
