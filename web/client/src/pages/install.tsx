import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Apple, Chrome, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    setIsAndroid(/android/i.test(ua));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const steps = {
    ios: [
      { icon: Share, text: 'Tap the Share button at the bottom of Safari (the square with an arrow pointing up)' },
      { icon: Download, text: 'Scroll down and tap "Add to Home Screen"' },
      { icon: Smartphone, text: 'Tap "Add" in the top right corner to confirm' },
    ],
    android: [
      { icon: Chrome, text: 'Open JMH STREAM in Chrome browser' },
      { icon: Monitor, text: 'Tap the three-dot menu (⋮) in the top right corner' },
      { icon: Download, text: 'Tap "Add to Home screen" or "Install app"' },
      { icon: Smartphone, text: 'Tap "Install" to confirm' },
    ],
    desktop: [
      { icon: Chrome, text: 'Open JMH STREAM in Chrome or Edge browser' },
      { icon: Download, text: 'Click the install icon (⊕) in the address bar' },
      { icon: Monitor, text: 'Click "Install" in the prompt that appears' },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-md mx-auto px-4 md:px-8 pt-24 pb-12">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-2xl p-4">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Install JMH STREAM
          </h1>
          <p className="text-muted-foreground">
            Add JMH STREAM to your home screen for the best experience — fast, offline-ready, and app-like.
          </p>
        </div>

        {/* Already installed / just installed */}
        {(isInstalled || installed) && (
          <Card className="p-6 mb-6 border-green-500/50 bg-green-500/10">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-400">App Installed!</p>
                <p className="text-sm text-muted-foreground">JMH STREAM is already installed on your device.</p>
              </div>
            </div>
          </Card>
        )}

        {/* One-click install for Android/Desktop */}
        {deferredPrompt && !installed && (
          <Card className="p-6 mb-6 border-primary/50">
            <div className="flex flex-col items-center gap-4 text-center">
              <Download className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-lg">Install Now</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Your browser supports one-click installation.
                </p>
              </div>
              <Button size="lg" onClick={handleInstall} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Install JMH STREAM
              </Button>
            </div>
          </Card>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Apple className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Install on iPhone / iPad</h2>
            </div>
            <ol className="space-y-4">
              {steps.ios.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground pt-1">{step.text}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Android Instructions */}
        {isAndroid && !deferredPrompt && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Install on Android</h2>
            </div>
            <ol className="space-y-4">
              {steps.android.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground pt-1">{step.text}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Install on Desktop</h2>
            </div>
            <ol className="space-y-4">
              {steps.desktop.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground pt-1">{step.text}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Benefits */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Why install the app?</h2>
          <ul className="space-y-3">
            {[
              "Faster loading — app-like performance",
              "Works offline — cached content always available",
              "Fullscreen experience — no browser bars",
              "Home screen shortcut — launch instantly",
              "Push notifications for new content",
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
