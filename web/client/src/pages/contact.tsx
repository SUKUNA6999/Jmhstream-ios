import { Mail, ExternalLink, Download } from "lucide-react";
import { SiTelegram, SiWhatsapp, SiInstagram } from "react-icons/si";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const socialLinks = [
  {
    name: "Telegram Support",
    description: "Join our Telegram support group for help and updates",
    url: "https://t.me/jmhstreamsupport",
    icon: SiTelegram,
    color: "text-[#26A5E4]",
  },
  {
    name: "WhatsApp Channel",
    description: "Follow our WhatsApp channel for latest announcements",
    url: "https://whatsapp.com/channel/0029VbBhFYaDuMRacb47Kl2v",
    icon: SiWhatsapp,
    color: "text-[#25D366]",
  },
  {
    name: "Instagram",
    description: "Follow us on Instagram for exclusive content",
    url: "https://instagram.com/j.m.h.2024",
    icon: SiInstagram,
    color: "text-[#E4405F]",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-md mx-auto px-4 md:px-8 pt-24 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-contact-title">
            Get in Touch
          </h1>
          <p className="text-muted-foreground" data-testid="text-contact-subtitle">
            Reach out to us through any of the channels below
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Email</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3 ml-8">
            For general inquiries and support
          </p>
          <a
            href="mailto:contact@jmhstream.online"
            className="ml-8 text-primary hover:underline text-sm font-medium"
            data-testid="link-contact-email"
          >
            contact@jmhstream.online
          </a>
        </Card>

        <div className="space-y-4">
          {socialLinks.map((link) => (
            <Card key={link.name} className="p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <link.icon className={`w-6 h-6 ${link.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground" data-testid={`text-social-${link.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    {link.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {link.description}
                  </p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" data-testid={`link-social-${link.name.toLowerCase().replace(/\s+/g, "-")}`}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open {link.name.split(" ")[0]}
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Install App Card */}
        <Card className="p-6 mt-6 border-primary/40 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">
                Install the App
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Add JMH STREAM to your home screen for a faster, app-like experience with offline support.
              </p>
              <Link href="/install">
                <Button size="sm" data-testid="link-install-app">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Install App
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
