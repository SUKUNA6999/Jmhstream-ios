import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, Tv, Film, Bookmark, Bell, Menu, X, ChevronRight,
  Home, TrendingUp, Mail, Heart, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

export function Navbar() {
  const [location, navigate] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: suggestions } = useQuery<any>({
    queryKey: [`/api/search-suggest?keyword=${debouncedSearch}&perPage=6`],
    enabled: debouncedSearch.length > 1,
  });

  const { data: watchlist = [] } = useQuery<any[]>({ queryKey: ["/api/watchlist"] });
  const { data: notifications = [] } = useQuery<any[]>({ queryKey: ["/api/public/notifications"] });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchFocused(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/movies", label: "Movies", icon: Film },
    { href: "/shows", label: "TV Shows", icon: Tv },
    { href: "/trending", label: "Trending", icon: TrendingUp },
  ];

  const suggestList: any[] = suggestions?.list || suggestions?.data?.items || suggestions?.data || suggestions?.results || [];
  const showSuggestions = searchFocused && debouncedSearch.length > 1 && suggestList.length > 0;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
        data-testid="navbar"
      >
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex items-center gap-3">

          {/* Hamburger button — always visible */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 text-foreground/80 hover:text-foreground"
            data-testid="button-hamburger"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 shrink-0 mr-2" data-testid="link-logo">
              <div className="bg-primary rounded-md p-1.5">
                <Tv className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">
                JMH <span className="text-primary">STREAM</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 mr-2">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm font-medium ${
                    location === link.href
                      ? "text-primary"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Search bar — always visible, expands on focus */}
          <div ref={searchWrapRef} className="relative flex-1 max-w-xs md:max-w-md">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search movies, TV shows..."
                className="w-full pl-9 pr-9 h-9 bg-muted/60 border-border/60 text-sm rounded-full focus:bg-muted focus:border-primary/40 transition-all"
                data-testid="input-search"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                  data-testid="button-clear-search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                {suggestList.slice(0, 6).map((s: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      navigate(`/movie/${s.id || s.subjectId}${s.detailPath ? `?detailPath=${encodeURIComponent(s.detailPath)}` : ""}`);
                      setSearchQuery("");
                      setSearchFocused(false);
                    }}
                    data-testid={`suggestion-${i}`}
                  >
                    {(s.cover?.url || s.coverUrl) && (
                      <img
                        src={s.cover?.url || s.coverUrl}
                        alt={s.title}
                        className="w-8 h-11 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground line-clamp-1">{s.title || s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.releaseDate?.split("-")[0] || s.year || ""}
                        {s.subjectType === 2 ? " · TV Series" : s.subjectType === 1 ? " · Movie" : ""}
                      </p>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-primary border-t border-border hover:bg-accent transition-colors"
                  onClick={() => {
                    if (searchQuery.trim()) {
                      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchQuery("");
                      setSearchFocused(false);
                    }
                  }}
                  data-testid="suggestion-view-all"
                >
                  <span>See all results for "{searchQuery}"</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* Watchlist shortcut */}
            <Link href="/watchlist">
              <Button
                size="icon"
                variant="ghost"
                className="relative text-foreground/70 hover:text-foreground"
                data-testid="link-watchlist"
              >
                <Bookmark className="w-4 h-4" />
                {watchlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {watchlist.length > 9 ? "9+" : watchlist.length}
                  </span>
                )}
              </Button>
            </Link>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="relative" ref={notifRef}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative text-foreground/70 hover:text-foreground"
                  onClick={() => setNotifOpen(prev => !prev)}
                  data-testid="button-notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                </Button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-semibold">Notifications</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {(notifications as any[]).map((n: any, i: number) => (
                        <div key={i} className="px-3 py-2.5 border-b border-border last:border-0 hover:bg-accent/50 transition-colors" data-testid={`notification-${i}`}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                            </div>
                            {n.type && (
                              <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">{n.type}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar / Hamburger Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle asChild>
              <Link href="/" onClick={() => setDrawerOpen(false)}>
                <div className="flex items-center gap-2">
                  <div className="bg-primary rounded-md p-1.5">
                    <Tv className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">
                    JMH <span className="text-primary">STREAM</span>
                  </span>
                </div>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-3">
            {/* Navigation */}
            <div className="px-3 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Browse</p>
              {navLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <button
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location === link.href
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/80 hover:bg-accent hover:text-foreground"
                      }`}
                      onClick={() => setDrawerOpen(false)}
                      data-testid={`drawer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {link.label}
                    </button>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-border mx-3 my-1" />

            {/* Watchlist */}
            <div className="px-3 my-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">My Stuff</p>
              <Link href="/watchlist">
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location === "/watchlist"
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground"
                  }`}
                  onClick={() => setDrawerOpen(false)}
                  data-testid="drawer-link-watchlist"
                >
                  <Bookmark className="w-4 h-4 flex-shrink-0" />
                  My Watchlist
                  {watchlist.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {watchlist.length}
                    </Badge>
                  )}
                </button>
              </Link>
              <Link href="/downloads">
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location === "/downloads"
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground"
                  }`}
                  onClick={() => setDrawerOpen(false)}
                  data-testid="drawer-link-downloads"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  Downloads
                </button>
              </Link>
              <Link href="/contact">
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location === "/contact"
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground"
                  }`}
                  onClick={() => setDrawerOpen(false)}
                  data-testid="drawer-link-contact"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  Contact
                </button>
              </Link>
              <a
                href="https://www.buymeacoffee.com/Marc01"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                onClick={() => setDrawerOpen(false)}
                data-testid="drawer-link-support"
              >
                <Heart className="w-4 h-4 flex-shrink-0 text-amber-500" />
                Support Us
              </a>
            </div>

            <div className="border-t border-border mx-3 my-1" />

            {/* Watchlist preview */}
            {watchlist.length > 0 && (
              <div className="px-3 mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Recently Added
                </p>
                <div className="space-y-1">
                  {(watchlist as any[]).slice(0, 5).map((item: any) => (
                    <Link key={item.subjectId} href={`/movie/${item.subjectId}`}>
                      <button
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-accent transition-colors text-left"
                        onClick={() => setDrawerOpen(false)}
                        data-testid={`drawer-watchlist-${item.subjectId}`}
                      >
                        {item.posterUrl ? (
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="w-8 h-11 object-cover rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-muted rounded flex-shrink-0" />
                        )}
                        <span className="line-clamp-2 text-foreground/80 text-xs leading-snug">{item.title}</span>
                      </button>
                    </Link>
                  ))}
                </div>
                {watchlist.length > 5 && (
                  <Link href="/watchlist">
                    <button
                      className="w-full mt-1 text-xs text-primary text-center py-1 hover:underline"
                      onClick={() => setDrawerOpen(false)}
                    >
                      +{watchlist.length - 5} more
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Bottom section */}
          <div className="border-t border-border p-3" />
        </SheetContent>
      </Sheet>
    </>
  );
}
