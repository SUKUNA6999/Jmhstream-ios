import { useEffect, useRef, useState, useCallback } from "react";

let clickCount = 0;
let cooldownUntil = 0;
let popunderLoaded = false;

function loadPopunderScript() {
  if (popunderLoaded) return;
  popunderLoaded = true;
  const script = document.createElement("script");
  script.src = "https://pl28839963.effectivegatecpm.com/2a/9c/e9/2a9ce92a5bb7aecad9f16cc3717321c3.js";
  script.async = true;
  document.body.appendChild(script);
}

export function usePopunderAds() {
  useEffect(() => {
    const handleClick = () => {
      const now = Date.now();
      if (now < cooldownUntil) return;

      clickCount++;

      if (clickCount <= 2) {
        loadPopunderScript();
      } else if (clickCount === 3) {
        cooldownUntil = now + 5000;
        clickCount = 0;
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
}

export function SocialBarAd() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const script = document.createElement("script");
    script.src = "https://pl28869840.effectivegatecpm.com/67/34/9e/67349e44e64311c2f738180ddbfb9e22.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}

export function BannerAd({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const atScript = document.createElement("script");
    atScript.textContent = `
      atOptions = {
        'key' : '7b89fe7affab890d77d4f1fd620bc9d7',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(atScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/7b89fe7affab890d77d4f1fd620bc9d7/invoke.js";
    invokeScript.async = true;
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex justify-center items-center overflow-hidden ${className}`}
      data-testid="banner-ad"
    />
  );
}

export function NativeBannerAd({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const atScript = document.createElement("script");
    atScript.textContent = `
      atOptions = {
        'key' : '7b89fe7affab890d77d4f1fd620bc9d7',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(atScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/7b89fe7affab890d77d4f1fd620bc9d7/invoke.js";
    invokeScript.async = true;
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex justify-center items-center overflow-hidden max-w-full ${className}`}
      data-testid="native-banner-ad"
    />
  );
}

export function SupportButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <a
      href="https://www.buymeacoffee.com/Marc01"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 group"
      data-testid="button-support"
    >
      <div className="flex items-center gap-2 bg-[#FFDD00] hover:bg-[#ffce00] text-black px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
        <span className="text-lg">🧡</span>
        <span className="text-sm font-bold font-sans">Support Us</span>
      </div>
    </a>
  );
}
