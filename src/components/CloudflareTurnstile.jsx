'use client';
import { useEffect, useRef, useState } from 'react';

export default function CloudflareTurnstile({ onVerify, onError, onExpire, resetSignal }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onVerify, onError, onExpire });

  const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState(() => (
    siteKey ? '' : 'Cloudflare Turnstile belum dikonfigurasi.'
  ));

  useEffect(() => {
    callbacksRef.current = { onVerify, onError, onExpire };
  }, [onVerify, onError, onExpire]);

  useEffect(() => {
    if (!siteKey) {
      callbacksRef.current.onError?.('missing-site-key');
      return undefined;
    }

    // Define global onload callback if not present
    window.onloadTurnstileCallback = () => {
      setScriptLoaded(true);
    };

    if (window.turnstile) {
      window.setTimeout(() => setScriptLoaded(true), 0);
      return undefined;
    }

    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId);

    const handleLoad = () => setScriptLoaded(true);
    const handleError = () => {
      setLoadError('Gagal mengunduh script Cloudflare Turnstile.');
      callbacksRef.current.onError?.();
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [siteKey]);

  useEffect(() => {
    if (!scriptLoaded || !siteKey || !containerRef.current || !window.turnstile) return undefined;

    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Widget may already be removed
      }
      widgetIdRef.current = null;
    }

    // Clean container innerHTML before rendering to prevent duplicate/conflict
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        size: 'normal',
        callback: (token) => {
          setLoadError('');
          callbacksRef.current.onVerify?.(token);
        },
        'error-callback': (errorCode) => {
          console.warn('Turnstile Widget error:', errorCode);
          callbacksRef.current.onError?.(errorCode);
          return true;
        },
        'expired-callback': () => {
          callbacksRef.current.onExpire?.();
        },
      });
    } catch (error) {
      console.warn('Turnstile render exception:', error.message);
      callbacksRef.current.onError?.();
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be removed
        }
      }
      widgetIdRef.current = null;
    };
  }, [scriptLoaded, siteKey, resetSignal]);

  return (
    <div className="flex flex-col items-center justify-center my-3 min-h-[75px]">
      {loadError ? (
        <div className="w-full rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-xs font-semibold text-red-300">
          {loadError}
        </div>
      ) : (
        /* Note: DO NOT add className "cf-turnstile" here when using explicit render to avoid double-render conflict! */
        <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      )}

      <p className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
        <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Dilindungi oleh Cloudflare Turnstile CAPTCHA
      </p>
    </div>
  );
}
