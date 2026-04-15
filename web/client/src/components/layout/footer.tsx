import { Link } from "wouter";
import { Tv, Mail } from "lucide-react";
import { SiX, SiDiscord, SiTelegram, SiWhatsapp, SiInstagram } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { BannerAd } from "@/components/ad-manager";

export function Footer() {
  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/site-settings"],
  });

  const footerText = settings.footer_text || "© 2025 JMH STREAM. All rights reserved.";
  const twitterUrl = settings.twitter_url;
  const discordUrl = settings.discord_url;
  const telegramUrl = settings.telegram_url;

  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link href="/">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-primary rounded-md p-1.5">
                  <Tv className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold text-foreground">
                  JMH <span className="text-primary">STREAM</span>
                </span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {settings.site_description || "Your free movie & TV streaming destination."}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://t.me/jmhstreamsupport" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-telegram">
                <SiTelegram className="w-4 h-4" />
              </a>
              <a href="https://whatsapp.com/channel/0029VbBhFYaDuMRacb47Kl2v" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-whatsapp">
                <SiWhatsapp className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/j.m.h.2024" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-instagram">
                <SiInstagram className="w-4 h-4" />
              </a>
              {twitterUrl && (
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-twitter">
                  <SiX className="w-4 h-4" />
                </a>
              )}
              {discordUrl && (
                <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-discord">
                  <SiDiscord className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              <a href="mailto:contact@jmhstream.online" className="hover:text-foreground transition-colors" data-testid="link-footer-email">
                contact@jmhstream.online
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Browse</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/movies", label: "Movies" },
                { href: "/shows", label: "TV Shows" },
                { href: "/trending", label: "Trending" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Account</h4>
            <ul className="space-y-2">
              {[
                { href: "/watchlist", label: "My Watchlist" },
                { href: "/downloads", label: "Downloads" },
                { href: "/announcements", label: "Announcements" },
                { href: "/contact", label: "Contact" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Information</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  JMH STREAM does not host any files. All content is provided by third-party services. We are not responsible for any content issues.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <BannerAd className="py-4" />

        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center" data-testid="text-footer">
            {footerText}
          </p>
        </div>
      </div>
    </footer>
  );
}
