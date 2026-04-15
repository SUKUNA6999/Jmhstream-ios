import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LayoutDashboard, Bell, Megaphone, Radio, Star, Flag, Settings, BarChart3,
  Bookmark, Activity, Heart, Shield, Palette, Globe, Link2, AlignLeft,
  Server, Database, Download, RefreshCw, Eye, EyeOff, Trash2, Plus, Edit,
  Check, X, ChevronRight, TrendingUp, Film, Tv, LogOut, Pin, AlertTriangle,
  Wrench, FileText, Clock, Hash, Rss, Mail, Calendar, Zap, Info, Search,
  Key, Copy, ToggleLeft, ToggleRight, Send, Bot, Play, Smartphone
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAdminToken, isAdminAuthenticated, removeAdminToken } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const SECTIONS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "broadcast", label: "Broadcast Messages", icon: Radio },
  { id: "featured", label: "Featured Content", icon: Star },
  { id: "reports", label: "Content Reports", icon: Flag },
  { id: "watchlist", label: "Watchlist Overview", icon: Bookmark },
  { id: "site-settings", label: "Site Settings", icon: Settings },
  { id: "seo-settings", label: "SEO Settings", icon: Search },
  { id: "social-links", label: "Social Media Links", icon: Link2 },
  { id: "footer-settings", label: "Footer Settings", icon: AlignLeft },
  { id: "maintenance", label: "Maintenance Mode", icon: Wrench },
  { id: "api-health", label: "API Health Monitor", icon: Server },
  { id: "logs", label: "Admin Activity Logs", icon: Activity },
  { id: "popular-searches", label: "Popular Searches", icon: Hash },
  { id: "theme-settings", label: "Theme Settings", icon: Palette },
  { id: "homepage-layout", label: "Homepage Layout", icon: LayoutDashboard },
  { id: "content-categories", label: "Content Categories", icon: Film },
  { id: "cache-management", label: "Cache Management", icon: Database },
  { id: "export-data", label: "Export Data", icon: Download },
  { id: "scheduled-maintenance", label: "Scheduled Maintenance", icon: Calendar },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "content-rules", label: "Content Rules", icon: Shield },
  { id: "streaming-settings", label: "Streaming Settings", icon: Zap },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "api-config", label: "API Configuration", icon: ToggleLeft },
  { id: "app-keys", label: "App Keys (APK)", icon: Smartphone },
  { id: "telegram-bot", label: "Telegram Bot", icon: Bot },
];

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/jmh-admin");
    }
  }, []);

  const handleLogout = () => {
    removeAdminToken();
    navigate("/jmh-admin");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-14"}`}>
        <div className="flex items-center gap-2 p-4 border-b border-sidebar-border h-14">
          {sidebarOpen && (
            <>
              <div className="bg-primary rounded-md p-1">
                <Tv className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-sidebar-foreground">JMH Admin</span>
            </>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto h-7 w-7"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="button-toggle-sidebar"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors text-sm
                  ${activeSection === section.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                data-testid={`nav-${section.id}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{section.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
          {sidebarOpen && (
            <Link href="/">
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors mt-0.5">
                <Tv className="w-4 h-4 flex-shrink-0" />
                <span>View Site</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-14"}`}>
        <div className="h-14 border-b border-border bg-card/50 flex items-center px-6 gap-3">
          <div>
            <h1 className="text-sm font-semibold">{SECTIONS.find(s => s.id === activeSection)?.label || "Dashboard"}</h1>
            <p className="text-xs text-muted-foreground">JMH STREAM Admin Panel</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Admin</Badge>
            <Button size="sm" variant="secondary" onClick={() => navigate("/")} data-testid="button-view-site">
              <Eye className="w-3.5 h-3.5 mr-1" />
              View Site
            </Button>
          </div>
        </div>

        <div className="p-6">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "analytics" && <AnalyticsSection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "broadcast" && <BroadcastSection />}
          {activeSection === "featured" && <FeaturedSection />}
          {activeSection === "reports" && <ReportsSection />}
          {activeSection === "watchlist" && <WatchlistSection />}
          {activeSection === "site-settings" && <SiteSettingsSection />}
          {activeSection === "seo-settings" && <SeoSettingsSection />}
          {activeSection === "social-links" && <SocialLinksSection />}
          {activeSection === "footer-settings" && <FooterSettingsSection />}
          {activeSection === "maintenance" && <MaintenanceSection />}
          {activeSection === "api-health" && <ApiHealthSection />}
          {activeSection === "logs" && <LogsSection />}
          {activeSection === "popular-searches" && <PopularSearchesSection />}
          {activeSection === "theme-settings" && <ThemeSettingsSection />}
          {activeSection === "homepage-layout" && <HomepageLayoutSection />}
          {activeSection === "content-categories" && <ContentCategoriesSection />}
          {activeSection === "cache-management" && <CacheManagementSection />}
          {activeSection === "export-data" && <ExportDataSection />}
          {activeSection === "scheduled-maintenance" && <ScheduledMaintenanceSection />}
          {activeSection === "newsletter" && <NewsletterSection />}
          {activeSection === "content-rules" && <ContentRulesSection />}
          {activeSection === "streaming-settings" && <StreamingSettingsSection />}
          {activeSection === "api-keys" && <ApiKeysSection />}
          {activeSection === "api-config" && <ApiConfigSection />}
          {activeSection === "app-keys" && <AppKeysSection />}
          {activeSection === "telegram-bot" && <TelegramBotSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const { data: stats, isLoading } = useQuery<any>({ queryKey: ["/api/admin/stats"] });

  const cards = [
    { label: "Total Views", value: stats?.analytics?.totalViews || 0, icon: Eye, color: "text-blue-400" },
    { label: "Notifications", value: stats?.totalNotifications || 0, icon: Bell, color: "text-green-400" },
    { label: "Announcements", value: stats?.totalAnnouncements || 0, icon: Megaphone, color: "text-yellow-400" },
    { label: "Pending Reports", value: stats?.pendingReports || 0, icon: Flag, color: "text-red-400" },
    { label: "Watchlist Items", value: stats?.totalWatchlistItems || 0, icon: Bookmark, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">Welcome back to JMH STREAM admin panel.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} data-testid={`stat-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats?.analytics?.topContent?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Viewed Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.analytics.topContent.slice(0, 8).map((item: any) => ({ name: item.title.length > 15 ? item.title.slice(0, 15) + "..." : item.title, views: item.views }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                    {stats.analytics.topContent.slice(0, 8).map((_: any, i: number) => (
                      <Cell key={i} fill={`hsl(${35 + i * 15}, 80%, ${55 - i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalyticsSection() {
  const { data: analytics, isLoading } = useQuery<any>({ queryKey: ["/api/admin/analytics"] });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Views</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24" /> : (
              <p className="text-4xl font-bold text-primary">{(analytics?.totalViews || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">All-time page views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Unique Content Watched</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24" /> : (
              <p className="text-4xl font-bold">{(analytics?.topContent?.length || 0)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Different titles viewed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Top 10 Most Viewed</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : analytics?.topContent?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topContent.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <Progress value={(item.views / (analytics.topContent[0]?.views || 1)) * 100} className="h-1 mt-1" />
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">{item.views}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet. Views will appear as users watch content.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/notifications"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/notifications", { ...form, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      setDialogOpen(false);
      setForm({ title: "", message: "", type: "info" });
      toast({ title: "Notification created" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/notifications/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] }),
  });

  const typeColors: Record<string, string> = {
    info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    success: "bg-green-500/15 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    error: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Notifications</h2>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-notification">
          <Plus className="w-4 h-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <Card key={n.id} data-testid={`notification-${n.id}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{n.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[n.type] || typeColors.info}`}>{n.type}</span>
                    {!n.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.createdAt ? format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={n.isActive}
                    onCheckedChange={v => toggleMutation.mutate({ id: n.id, isActive: v })}
                    data-testid={`switch-notification-${n.id}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(n.id)}
                    data-testid={`button-delete-notification-${n.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title" data-testid="input-notification-title" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Notification message" data-testid="input-notification-message" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger data-testid="select-notification-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.message || createMutation.isPending} data-testid="button-save-notification">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnouncementsSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", isPinned: false });
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/announcements"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/announcements", { ...form, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setDialogOpen(false);
      setForm({ title: "", content: "", isPinned: false });
      toast({ title: "Announcement created" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => apiRequest("PATCH", `/api/admin/announcements/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/announcements/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Announcements</h2>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-announcement">
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                      <p className="font-medium text-sm">{a.title}</p>
                      {!a.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.createdAt ? format(new Date(a.createdAt), "MMM d, yyyy") : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={a.isActive} onCheckedChange={v => toggleMutation.mutate({ id: a.id, isActive: v })} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteMutation.mutate(a.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Announcement content..." className="min-h-24" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isPinned} onCheckedChange={v => setForm({ ...form, isPinned: v })} />
              <Label>Pin this announcement</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.content || createMutation.isPending}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BroadcastSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ message: "", type: "info", isActive: false });
  const { toast } = useToast();

  const { data: broadcasts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/broadcast"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/broadcast", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcast"] });
      setDialogOpen(false);
      setForm({ message: "", type: "info", isActive: false });
      toast({ title: "Broadcast created" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => apiRequest("PATCH", `/api/admin/broadcast/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcast"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/broadcast/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcast"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Broadcast Messages</h2>
          <p className="text-sm text-muted-foreground">Site-wide banner messages shown to all visitors</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-broadcast">
          <Plus className="w-4 h-4 mr-2" />
          New Broadcast
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No broadcast messages</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b: any) => (
            <Card key={b.id} className={b.isActive ? "border-primary/40" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {b.isActive && <Badge variant="default" className="text-xs bg-primary/20 text-primary">Live</Badge>}
                      <Badge variant="secondary" className="text-xs">{b.type}</Badge>
                    </div>
                    <p className="text-sm">{b.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={b.isActive} onCheckedChange={v => toggleMutation.mutate({ id: b.id, isActive: v })} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteMutation.mutate(b.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Broadcast Message</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Message to show to all visitors..." />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label>Activate immediately</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.message || createMutation.isPending}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeaturedSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ subjectId: "", title: "", posterUrl: "", bannerUrl: "", description: "", type: "movie", sortOrder: 0 });
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/featured"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/featured", { ...form, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured"] });
      setDialogOpen(false);
      setForm({ subjectId: "", title: "", posterUrl: "", bannerUrl: "", description: "", type: "movie", sortOrder: 0 });
      toast({ title: "Featured content added" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => apiRequest("PATCH", `/api/admin/featured/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/featured"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/featured/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/featured"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Featured Content</h2>
          <p className="text-sm text-muted-foreground">Content shown in the hero banner on the homepage</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Featured
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No featured content. The hero banner will use trending content.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center gap-4">
                {item.posterUrl && (
                  <img src={item.posterUrl} alt={item.title} className="w-12 h-16 object-cover rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">ID: {item.subjectId}</p>
                  <Badge variant="secondary" className="text-xs mt-1 capitalize">{item.type}</Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch checked={item.isActive} onCheckedChange={v => toggleMutation.mutate({ id: item.id, isActive: v })} />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Featured Content</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Subject ID (from API)</Label>
              <Input value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} placeholder="e.g. tt1234567" />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Movie/Show title" />
            </div>
            <div className="space-y-1.5">
              <Label>Poster URL</Label>
              <Input value={form.posterUrl} onChange={e => setForm({ ...form, posterUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Banner URL (for hero)</Label>
              <Input value={form.bannerUrl} onChange={e => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Movie</SelectItem>
                    <SelectItem value="tv">TV Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.subjectId || !form.title || createMutation.isPending}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportsSection() {
  const { data: reports = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/reports"] });
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiRequest("PATCH", `/api/admin/reports/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Report updated" });
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    resolved: "bg-green-500/15 text-green-400 border-green-500/30",
    dismissed: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Content Reports</h2>
        <Badge variant="secondary">{reports.filter((r: any) => r.status === "pending").length} pending</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No reports yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{r.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[r.status] || statusColors.pending}`}>{r.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : ""}</p>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => updateMutation.mutate({ id: r.id, status: "resolved" })}>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Resolve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: r.id, status: "dismissed" })}>
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistSection() {
  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/watchlist"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Watchlist Overview</h2>
        <Badge variant="secondary">{items.length} items total</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Total Saved</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.filter((i: any) => i.type === "movie").length}</p><p className="text-xs text-muted-foreground">Movies</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.filter((i: any) => i.type === "tv").length}</p><p className="text-xs text-muted-foreground">TV Shows</p></CardContent></Card>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {items.slice(0, 24).map((item: any) => (
            <div key={item.id} className="text-center">
              <div className="w-full aspect-[2/3] rounded bg-card border border-card-border overflow-hidden mb-1">
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Film className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium line-clamp-1">{item.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SiteSettingsSection() {
  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const [form, setForm] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/site-settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const fields = [
    { key: "site_name", label: "Site Name", placeholder: "JMH STREAM" },
    { key: "site_tagline", label: "Tagline", placeholder: "Watch Movies & TV Shows Free" },
    { key: "site_description", label: "Description", placeholder: "Site description..." },
  ];

  const handleSave = (key: string) => {
    const value = form[key] ?? settings[key] ?? "";
    saveMutation.mutate({ key, value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Site Settings</h2>
      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <div className="flex gap-2">
                <Input
                  value={form[f.key] ?? settings[f.key] ?? ""}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  data-testid={`input-setting-${f.key}`}
                />
                <Button onClick={() => handleSave(f.key)} size="sm" disabled={saveMutation.isPending} data-testid={`button-save-${f.key}`}>Save</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeoSettingsSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const [form, setForm] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({ title: "SEO settings saved" });
    },
  });

  const seoFields = [
    { key: "meta_title", label: "Meta Title", placeholder: "JMH STREAM - Free Movies & TV" },
    { key: "meta_description", label: "Meta Description", placeholder: "Watch thousands of free movies and TV shows..." },
    { key: "meta_keywords", label: "Keywords", placeholder: "free movies, watch online, streaming" },
    { key: "og_title", label: "OG Title", placeholder: "Open Graph Title" },
    { key: "og_description", label: "OG Description", placeholder: "Open Graph Description" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">SEO Settings</h2>
      <div className="space-y-4 max-w-2xl">
        {seoFields.map(f => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <div className="flex gap-2">
              <Input
                value={form[f.key] ?? settings[f.key] ?? ""}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
              <Button onClick={() => saveMutation.mutate({ key: f.key, value: form[f.key] ?? settings[f.key] ?? "" })} size="sm">Save</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialLinksSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const [form, setForm] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/site-settings"] });
      toast({ title: "Social links saved" });
    },
  });

  const socialFields = [
    { key: "twitter_url", label: "Twitter / X URL" },
    { key: "discord_url", label: "Discord Invite URL" },
    { key: "telegram_url", label: "Telegram URL" },
    { key: "instagram_url", label: "Instagram URL" },
    { key: "youtube_url", label: "YouTube URL" },
    { key: "facebook_url", label: "Facebook URL" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Social Media Links</h2>
      <div className="space-y-4 max-w-2xl">
        {socialFields.map(f => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <div className="flex gap-2">
              <Input
                value={form[f.key] ?? settings[f.key] ?? ""}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder="https://..."
              />
              <Button onClick={() => saveMutation.mutate({ key: f.key, value: form[f.key] ?? settings[f.key] ?? "" })} size="sm">Save</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterSettingsSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const [form, setForm] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/site-settings"] });
      toast({ title: "Footer settings saved" });
    },
  });

  const footerFields = [
    { key: "footer_text", label: "Footer Copyright Text" },
    { key: "footer_disclaimer", label: "Footer Disclaimer" },
    { key: "contact_email", label: "Contact Email" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Footer Settings</h2>
      <div className="space-y-4 max-w-2xl">
        {footerFields.map(f => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <div className="flex gap-2">
              <Input
                value={form[f.key] ?? settings[f.key] ?? ""}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              />
              <Button onClick={() => saveMutation.mutate({ key: f.key, value: form[f.key] ?? settings[f.key] ?? "" })} size="sm">Save</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaintenanceSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const { toast } = useToast();
  const isMaintenanceOn = settings.maintenance_mode === "true";

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/site-settings"] });
      toast({ title: "Settings updated" });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Maintenance Mode</h2>
      <Card className={isMaintenanceOn ? "border-destructive/50" : ""}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">When enabled, visitors will see a maintenance page</p>
            </div>
            <Switch
              checked={isMaintenanceOn}
              onCheckedChange={v => saveMutation.mutate({ key: "maintenance_mode", value: String(v) })}
              data-testid="switch-maintenance"
            />
          </div>
          {isMaintenanceOn && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-sm font-medium">Site is currently in maintenance mode</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="max-w-2xl space-y-2">
        <Label>Maintenance Message</Label>
        <div className="flex gap-2">
          <Input
            value={maintenanceMsg || settings.maintenance_message || ""}
            onChange={e => setMaintenanceMsg(e.target.value)}
            placeholder="We'll be back shortly..."
          />
          <Button onClick={() => saveMutation.mutate({ key: "maintenance_message", value: maintenanceMsg || settings.maintenance_message || "" })} size="sm">Save</Button>
        </div>
      </div>
    </div>
  );
}

function ApiHealthSection() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Array<{ endpoint: string; status: "ok" | "error" | "loading" }>>([]);

  const endpoints = ["/api/home", "/api/hot", "/api/trending?page=1&perPage=5", "/api/popular-search"];

  const testAll = async () => {
    setTesting(true);
    setResults(endpoints.map(e => ({ endpoint: e, status: "loading" })));
    for (let i = 0; i < endpoints.length; i++) {
      try {
        const res = await fetch(endpoints[i]);
        setResults(prev => prev.map((r, j) => j === i ? { ...r, status: res.ok ? "ok" : "error" } : r));
      } catch {
        setResults(prev => prev.map((r, j) => j === i ? { ...r, status: "error" } : r));
      }
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">API Health Monitor</h2>
        <Button onClick={testAll} disabled={testing} data-testid="button-test-api">
          <RefreshCw className={`w-4 h-4 mr-2 ${testing ? "animate-spin" : ""}`} />
          {testing ? "Testing..." : "Test All Endpoints"}
        </Button>
      </div>

      <div className="space-y-3">
        {endpoints.map((endpoint, i) => {
          const result = results.find(r => r.endpoint === endpoint);
          return (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-mono text-sm">{endpoint}</p>
                </div>
                {result ? (
                  result.status === "loading" ? (
                    <Badge variant="secondary">Testing...</Badge>
                  ) : result.status === "ok" ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>
                  )
                ) : (
                  <Badge variant="outline">Not Tested</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LogsSection() {
  const { data: logs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/logs"] });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Admin Activity Logs</h2>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No activity logged yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-center gap-3 p-3 rounded-md bg-card border border-card-border">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{log.action.replace(/_/g, " ")}</p>
                {log.details && <p className="text-xs text-muted-foreground truncate">{log.details}</p>}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {log.createdAt ? format(new Date(log.createdAt), "MMM d, h:mm a") : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PopularSearchesSection() {
  const { data } = useQuery<any>({ queryKey: ["/api/popular-search"] });
  const popular = data?.list || data?.data || data?.keywords || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Popular Searches</h2>
      <p className="text-sm text-muted-foreground">These are the current popular search terms from the API.</p>
      <div className="flex flex-wrap gap-2">
        {popular.map((p: any, i: number) => (
          <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
            {typeof p === "string" ? p : p.keyword || p.title || p.name}
          </Badge>
        ))}
        {popular.length === 0 && <p className="text-muted-foreground text-sm">No popular searches data available.</p>}
      </div>
    </div>
  );
}

function ThemeSettingsSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({ title: "Theme setting saved" });
    },
  });

  const themes = [
    { name: "Cinema Gold", primary: "#d97706", value: "cinema-gold" },
    { name: "Electric Blue", primary: "#3b82f6", value: "electric-blue" },
    { name: "Crimson Red", primary: "#ef4444", value: "crimson-red" },
    { name: "Emerald Green", primary: "#10b981", value: "emerald-green" },
    { name: "Purple Haze", primary: "#8b5cf6", value: "purple-haze" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Theme Settings</h2>
      <p className="text-sm text-muted-foreground">Select a color theme for the site. (Applied on next restart)</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {themes.map(t => (
          <button
            key={t.value}
            onClick={() => saveMutation.mutate({ key: "theme", value: t.value })}
            className={`p-4 rounded-lg border transition-all text-sm font-medium ${settings.theme === t.value ? "border-primary bg-primary/10" : "border-border hover-elevate"}`}
          >
            <div className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-background" style={{ background: t.primary }} />
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function HomepageLayoutSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({ title: "Layout setting saved" });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Homepage Layout</h2>
      <div className="max-w-2xl space-y-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show Hero Banner</p>
              <p className="text-xs text-muted-foreground">Display the large hero slider at the top</p>
            </div>
            <Switch
              checked={settings.show_hero !== "false"}
              onCheckedChange={v => saveMutation.mutate({ key: "show_hero", value: String(v) })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show Hot Section</p>
              <p className="text-xs text-muted-foreground">Display the "Hot Right Now" row</p>
            </div>
            <Switch
              checked={settings.show_hot !== "false"}
              onCheckedChange={v => saveMutation.mutate({ key: "show_hot", value: String(v) })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show Trending Section</p>
              <p className="text-xs text-muted-foreground">Display the "Trending" row</p>
            </div>
            <Switch
              checked={settings.show_trending !== "false"}
              onCheckedChange={v => saveMutation.mutate({ key: "show_trending", value: String(v) })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContentCategoriesSection() {
  const defaultCategories = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller", "Animation", "Documentary", "Fantasy"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Content Categories</h2>
      <p className="text-sm text-muted-foreground">Categories available for filtering content. Currently sourced from the API.</p>
      <div className="flex flex-wrap gap-2">
        {defaultCategories.map(cat => (
          <Badge key={cat} variant="secondary" className="text-sm px-3 py-1">{cat}</Badge>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Content categories are automatically determined by the movie API data. Genre filtering can be added to search pages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CacheManagementSection() {
  const { toast } = useToast();
  const [clearing, setClearing] = useState(false);

  const clearCache = async () => {
    setClearing(true);
    queryClient.clear();
    setTimeout(() => {
      setClearing(false);
      toast({ title: "Cache cleared", description: "All cached data has been cleared." });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Cache Management</h2>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="font-medium mb-1">Clear Frontend Cache</p>
            <p className="text-sm text-muted-foreground mb-3">Clears the in-memory query cache. Data will be re-fetched from the API on next request.</p>
            <Button onClick={clearCache} disabled={clearing} variant="secondary" data-testid="button-clear-cache">
              <RefreshCw className={`w-4 h-4 mr-2 ${clearing ? "animate-spin" : ""}`} />
              {clearing ? "Clearing..." : "Clear All Cache"}
            </Button>
          </div>
          <Separator />
          <div>
            <p className="font-medium mb-1">Cache Status</p>
            <p className="text-sm text-muted-foreground">API responses are cached for 3 minutes. Admin data has no cache.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExportDataSection() {
  const { data: notifications = [] } = useQuery<any[]>({ queryKey: ["/api/admin/notifications"] });
  const { data: announcements = [] } = useQuery<any[]>({ queryKey: ["/api/admin/announcements"] });
  const { data: reports = [] } = useQuery<any[]>({ queryKey: ["/api/admin/reports"] });
  const { toast } = useToast();

  const exportJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported successfully" });
  };

  const exports = [
    { label: "Notifications", data: notifications, filename: "jmh-notifications.json" },
    { label: "Announcements", data: announcements, filename: "jmh-announcements.json" },
    { label: "Content Reports", data: reports, filename: "jmh-reports.json" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Export Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exports.map(e => (
          <Card key={e.label}>
            <CardContent className="p-5">
              <p className="font-semibold mb-1">{e.label}</p>
              <p className="text-sm text-muted-foreground mb-3">{(e.data as any[]).length} records</p>
              <Button variant="secondary" size="sm" onClick={() => exportJson(e.data, e.filename)} data-testid={`button-export-${e.label.toLowerCase()}`}>
                <Download className="w-3.5 h-3.5 mr-2" />
                Export JSON
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScheduledMaintenanceSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const [form, setForm] = useState({ scheduled_maintenance_date: "", scheduled_maintenance_msg: "" });
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({ title: "Scheduled maintenance updated" });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Scheduled Maintenance</h2>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Maintenance Date & Time</Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={form.scheduled_maintenance_date || settings.scheduled_maintenance_date || ""}
                onChange={e => setForm({ ...form, scheduled_maintenance_date: e.target.value })}
                className="max-w-xs"
              />
              <Button size="sm" onClick={() => saveMutation.mutate({ key: "scheduled_maintenance_date", value: form.scheduled_maintenance_date })}>Save</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Maintenance Notice Message</Label>
            <div className="flex gap-2">
              <Input
                value={form.scheduled_maintenance_msg || settings.scheduled_maintenance_msg || ""}
                onChange={e => setForm({ ...form, scheduled_maintenance_msg: e.target.value })}
                placeholder="Scheduled maintenance on..."
              />
              <Button size="sm" onClick={() => saveMutation.mutate({ key: "scheduled_maintenance_msg", value: form.scheduled_maintenance_msg })}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewsletterSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({ title: "Newsletter settings saved" });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Newsletter</h2>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Newsletter Signup</p>
              <p className="text-sm text-muted-foreground">Show newsletter signup form on the site</p>
            </div>
            <Switch
              checked={settings.newsletter_enabled === "true"}
              onCheckedChange={v => saveMutation.mutate({ key: "newsletter_enabled", value: String(v) })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Newsletter Title</Label>
            <Input
              defaultValue={settings.newsletter_title || "Stay Updated"}
              onBlur={e => saveMutation.mutate({ key: "newsletter_title", value: e.target.value })}
              placeholder="Stay Updated with JMH STREAM"
            />
          </div>
          <div className="space-y-2">
            <Label>Newsletter Description</Label>
            <Input
              defaultValue={settings.newsletter_desc || ""}
              onBlur={e => saveMutation.mutate({ key: "newsletter_desc", value: e.target.value })}
              placeholder="Get notified about new movies and shows"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentRulesSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({ title: "Content rules updated" });
    },
  });

  const rules = [
    { key: "allow_adult_content", label: "Allow Adult Content", desc: "Show 18+ rated content in search results" },
    { key: "allow_user_reports", label: "Allow User Reports", desc: "Users can report broken streams or wrong info" },
    { key: "show_ratings", label: "Show Ratings", desc: "Display rating scores on movie cards" },
    { key: "show_year", label: "Show Release Year", desc: "Display release year on movie cards" },
    { key: "show_cast", label: "Show Cast Info", desc: "Display cast information on movie detail pages" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Content Rules</h2>
      <div className="space-y-3 max-w-2xl">
        {rules.map(rule => (
          <Card key={rule.key}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{rule.label}</p>
                <p className="text-xs text-muted-foreground">{rule.desc}</p>
              </div>
              <Switch
                checked={settings[rule.key] !== "false"}
                onCheckedChange={v => saveMutation.mutate({ key: rule.key, value: String(v) })}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StreamingSettingsSection() {
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/admin/site-settings"] });
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => apiRequest("POST", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({ title: "Streaming settings saved" });
    },
  });

  const streamSettings = [
    { key: "autoplay", label: "Autoplay", desc: "Automatically start playing when page loads" },
    { key: "show_subtitles", label: "Show Subtitles by Default", desc: "Enable subtitles by default if available" },
    { key: "allow_external_player", label: "Allow External Player Link", desc: "Show button to open stream in new tab" },
    { key: "show_quality_selector", label: "Show Quality Selector", desc: "Let users choose stream quality" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Streaming Settings</h2>
      <div className="space-y-3 max-w-2xl">
        {streamSettings.map(s => (
          <Card key={s.key}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <Switch
                checked={settings[s.key] !== "false"}
                onCheckedChange={v => saveMutation.mutate({ key: s.key, value: String(v) })}
              />
            </CardContent>
          </Card>
        ))}
        <div className="space-y-2">
          <Label>Default Video Quality</Label>
          <Select
            value={settings.default_quality || "auto"}
            onValueChange={v => saveMutation.mutate({ key: "default_quality", value: v })}
          >
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="480p">480p</SelectItem>
              <SelectItem value="360p">360p</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newRateLimit, setNewRateLimit] = useState("1000");

  const { data: keys = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/api-keys"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/api-keys", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "API key created" });
      setNewName(""); setNewDomain(""); setNewRateLimit("1000");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/api-keys/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "API key deleted" });
    },
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "API key copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">API Keys</h2>
        <p className="text-sm text-muted-foreground">Manage API keys for external access to your movie data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Create New API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My App" data-testid="input-api-key-name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Allowed Domain</Label>
              <Input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="example.com or *" data-testid="input-api-key-domain" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rate Limit</Label>
              <Input type="number" value={newRateLimit} onChange={e => setNewRateLimit(e.target.value)} placeholder="1000" data-testid="input-api-key-ratelimit" />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => createMutation.mutate({ name: newName, domain: newDomain, rateLimit: Number(newRateLimit) })}
                disabled={!newName || !newDomain || createMutation.isPending}
                className="w-full"
                data-testid="button-create-api-key"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active API Keys ({keys.length})</CardTitle>
          <CardDescription>Each key is tied to a specific domain. Use <code className="text-xs bg-muted px-1 py-0.5 rounded">?api_key=YOUR_KEY</code> in requests to <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/v1/*</code></CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No API keys created yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((k: any) => (
                <div key={k.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border" data-testid={`api-key-${k.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{k.name}</p>
                      <Badge variant={k.isActive ? "default" : "secondary"} className="text-[10px] h-4">
                        {k.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px] max-w-[200px] truncate">{k.key}</code>
                      <button onClick={() => copyKey(k.key)} className="hover:text-foreground" data-testid={`copy-key-${k.id}`}>
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Domain: <span className="font-medium">{k.domain}</span> · Requests: {k.requestCount}/{k.rateLimit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => toggleMutation.mutate({ id: k.id, isActive: !k.isActive })}
                    >
                      {k.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(k.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Available endpoints (all require <code className="bg-muted px-1 py-0.5 rounded text-xs">api_key</code>):</p>
          <div className="space-y-1.5 font-mono text-xs">
            <p><Badge variant="secondary" className="text-[10px] mr-2">GET</Badge>/api/v1/search?q=avengers&api_key=KEY</p>
            <p><Badge variant="secondary" className="text-[10px] mr-2">GET</Badge>/api/v1/info/:movieId?api_key=KEY</p>
            <p><Badge variant="secondary" className="text-[10px] mr-2">GET</Badge>/api/v1/sources/:movieId?api_key=KEY</p>
            <p><Badge variant="secondary" className="text-[10px] mr-2">GET</Badge>/api/v1/trending?api_key=KEY</p>
            <p><Badge variant="secondary" className="text-[10px] mr-2">GET</Badge>/api/v1/homepage?api_key=KEY</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiConfigSection() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<any>({ queryKey: ["/api/admin/api-config"] });

  const switchMutation = useMutation({
    mutationFn: (active: string) => apiRequest("POST", "/api/admin/api-config", { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-config"] });
      toast({ title: "API source switched" });
    },
  });

  const [primaryHealth, setPrimaryHealth] = useState<"checking" | "up" | "down">("checking");
  const [backupHealth, setBackupHealth] = useState<"checking" | "up" | "down">("checking");

  useEffect(() => {
    fetch("/api/home").then(r => setPrimaryHealth(r.ok || config?.active === "primary" ? "up" : "down")).catch(() => setPrimaryHealth("down"));
    setBackupHealth(config?.backupConfigured ? "up" : "down");
  }, [config]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">API Configuration</h2>
        <p className="text-sm text-muted-foreground">Switch between primary and backup API sources. Both APIs are compatible.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={config?.active === "primary" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Primary API</CardTitle>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config?.primaryConfigured ? (primaryHealth === "up" ? "bg-green-500" : "bg-red-500") : "bg-gray-500"}`} />
                <span className="text-xs text-muted-foreground">{config?.primaryConfigured ? (primaryHealth === "up" ? "Online" : "Offline") : "Not configured"}</span>
              </div>
            </div>
            <CardDescription className="text-xs">Configured via environment variable</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant={config?.active === "primary" ? "default" : "outline"}
              className="w-full"
              onClick={() => switchMutation.mutate("primary")}
              disabled={config?.active === "primary" || switchMutation.isPending || !config?.primaryConfigured}
              data-testid="button-switch-primary"
            >
              {config?.active === "primary" ? (
                <><Check className="w-3.5 h-3.5 mr-2" />Active</>
              ) : (
                "Switch to Primary"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className={config?.active === "backup" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Backup API</CardTitle>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config?.backupConfigured ? "bg-green-500" : "bg-gray-500"}`} />
                <span className="text-xs text-muted-foreground">{config?.backupConfigured ? "Configured" : "Not configured"}</span>
              </div>
            </div>
            <CardDescription className="text-xs">Configured via environment variable</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant={config?.active === "backup" ? "default" : "outline"}
              className="w-full"
              onClick={() => switchMutation.mutate("backup")}
              disabled={config?.active === "backup" || switchMutation.isPending || !config?.backupConfigured}
              data-testid="button-switch-backup"
            >
              {config?.active === "backup" ? (
                <><Check className="w-3.5 h-3.5 mr-2" />Active</>
              ) : (
                "Switch to Backup"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-16 w-full" /> : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Active API</span>
                <Badge variant="default">{config?.active || "primary"}</Badge>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">{config?.primaryConfigured || config?.backupConfigured ? "APIs configured in .env" : "No APIs configured"}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AppKeysSection() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", packageName: "", signatureHash: "", rateLimit: "5000" });

  const { data: appKeys = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/app-keys"],
    queryFn: async () => {
      const res = await fetch("/api/admin/app-keys", { headers: { "x-admin-token": getAdminToken() || "" } });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/app-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": getAdminToken() || "" },
        body: JSON.stringify({ ...form, rateLimit: parseInt(form.rateLimit) || 5000 }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-keys"] });
      setDialogOpen(false);
      setForm({ name: "", packageName: "", signatureHash: "", rateLimit: "5000" });
      toast({ title: "App key created", description: `Key: ${data.key?.slice(0, 20)}...` });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/app-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": getAdminToken() || "" },
        body: JSON.stringify({ isActive }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/app-keys"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/app-keys/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": getAdminToken() || "" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-keys"] });
      toast({ title: "App key deleted" });
    },
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Key copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">App Keys (APK)</h2>
          <p className="text-sm text-muted-foreground">Create secure API keys for your mobile app. Each key is locked to a specific app package and build signature.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-app-key">
          <Plus className="w-4 h-4 mr-2" />
          Create App Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How App Key Security Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>Each key is bound to a <strong>package name</strong> (e.g. <code className="bg-muted px-1 rounded">com.jmhstream.app</code>) — only your app can use it</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Each key requires your app's <strong>SHA-256 signing certificate hash</strong> — even if someone copies your APK code, they can't sign it with your keystore</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Your app must send 3 headers with every request: <code className="bg-muted px-1 rounded">X-App-Key</code>, <code className="bg-muted px-1 rounded">X-App-Package</code>, <code className="bg-muted px-1 rounded">X-App-Signature</code></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>API endpoints: <code className="bg-muted px-1 rounded">/api/app/home</code>, <code className="bg-muted px-1 rounded">/api/app/search</code>, <code className="bg-muted px-1 rounded">/api/app/info/:id</code>, <code className="bg-muted px-1 rounded">/api/app/sources/:id</code>, <code className="bg-muted px-1 rounded">/api/app/trending</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Get Your Signing Hash</CardTitle>
          <CardDescription className="text-xs">Run this command to get your APK signing certificate SHA-256 hash:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-3 font-mono text-xs break-all">
            keytool -list -v -keystore your-keystore.jks -alias your-alias | grep SHA256
          </div>
          <p className="text-xs text-muted-foreground mt-2">Or for a debug keystore: <code className="bg-muted px-1 rounded">keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android</code></p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : appKeys.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No app keys created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appKeys.map((ak: any) => (
            <Card key={ak.id} data-testid={`app-key-${ak.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{ak.name}</p>
                      {!ak.isActive && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Package:</span>{" "}
                        <code className="bg-muted px-1 rounded">{ak.packageName}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Signature:</span>{" "}
                        <code className="bg-muted px-1 rounded">{ak.signatureHash.slice(0, 16)}...</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Requests:</span> {ak.requestCount.toLocaleString()} / {ak.rateLimit.toLocaleString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last used:</span> {ak.lastUsed ? new Date(ak.lastUsed).toLocaleDateString() : "Never"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">{ak.key}</code>
                      <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => copyKey(ak.key)} data-testid={`button-copy-app-key-${ak.id}`}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={ak.isActive}
                      onCheckedChange={v => toggleMutation.mutate({ id: ak.id, isActive: v })}
                      data-testid={`switch-app-key-${ak.id}`}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteMutation.mutate(ak.id)} data-testid={`button-delete-app-key-${ak.id}`}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create App Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>App Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. JMH Stream Android" data-testid="input-app-key-name" />
            </div>
            <div className="space-y-2">
              <Label>Package Name</Label>
              <Input value={form.packageName} onChange={e => setForm({ ...form, packageName: e.target.value })} placeholder="e.g. com.jmhstream.app" data-testid="input-app-key-package" />
              <p className="text-xs text-muted-foreground">The exact Android package name from your AndroidManifest.xml</p>
            </div>
            <div className="space-y-2">
              <Label>SHA-256 Signing Hash</Label>
              <Input value={form.signatureHash} onChange={e => setForm({ ...form, signatureHash: e.target.value })} placeholder="e.g. AB:CD:12:34:..." data-testid="input-app-key-signature" />
              <p className="text-xs text-muted-foreground">Your APK signing certificate SHA-256 fingerprint</p>
            </div>
            <div className="space-y-2">
              <Label>Rate Limit (requests)</Label>
              <Input type="number" value={form.rateLimit} onChange={e => setForm({ ...form, rateLimit: e.target.value })} data-testid="input-app-key-rate-limit" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.name || !form.packageName || !form.signatureHash || createMutation.isPending}
                data-testid="button-save-app-key"
              >
                Create Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TelegramBotSection() {
  const { toast } = useToast();
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [postsPerDay, setPostsPerDay] = useState("20");
  const [showToken, setShowToken] = useState(false);

  const { data: config, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/telegram-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/telegram-config", {
        headers: { "x-admin-token": getAdminToken() || "" },
      });
      return res.json();
    },
  });

  useEffect(() => {
    if (config) {
      setChannelId(config.channelId || "");
      setPostsPerDay(String(config.postsPerDay || 20));
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: any = { channelId, postsPerDay: parseInt(postsPerDay) };
      if (botToken) body.botToken = botToken;
      const res = await fetch("/api/admin/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": getAdminToken() || "" },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram-config"] });
      setBotToken("");
      toast({ title: "Telegram configuration saved" });
    },
  });

  const toggleAutoPost = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": getAdminToken() || "" },
        body: JSON.stringify({ autoPost: !config?.autoPost }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram-config"] });
      toast({ title: config?.autoPost ? "Auto-posting disabled" : "Auto-posting enabled" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/telegram-test", {
        method: "POST",
        headers: { "x-admin-token": getAdminToken() || "" },
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.ok) {
        toast({ title: "Test post sent successfully" });
      } else {
        toast({ title: "Test post failed", description: data.error, variant: "destructive" });
      }
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/telegram-trigger", {
        method: "POST",
        headers: { "x-admin-token": getAdminToken() || "" },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Daily posts triggered", description: "Posts are being sent in the background" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Telegram Bot</h2>
        <p className="text-sm text-muted-foreground">Configure the Telegram bot to automatically post movie and series content to your channel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Bot Status</p>
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            {isLoading ? <Skeleton className="h-7 w-24" /> : (
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config?.hasToken ? "bg-green-500" : "bg-red-500"}`} />
                <p className="text-lg font-bold">{config?.hasToken ? "Configured" : "Not Set"}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Auto-Post</p>
              <Rss className="w-4 h-4 text-green-400" />
            </div>
            {isLoading ? <Skeleton className="h-7 w-24" /> : (
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config?.autoPost ? "bg-green-500" : "bg-yellow-500"}`} />
                <p className="text-lg font-bold">{config?.autoPost ? "Active" : "Paused"}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Last Run</p>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            {isLoading ? <Skeleton className="h-7 w-24" /> : (
              <p className="text-sm font-medium">{config?.lastRun ? format(new Date(config.lastRun), "MMM d, yyyy h:mm a") : "Never"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bot Configuration</CardTitle>
          <CardDescription className="text-xs">Set your Telegram Bot Token and Channel ID. Create a bot via @BotFather on Telegram.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Bot Token</Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder={config?.hasToken ? `Current: ${config.tokenPreview}` : "Enter bot token from @BotFather"}
                data-testid="input-telegram-token"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Leave empty to keep current token</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Channel/Group ID</Label>
            <Input
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="e.g. @yourchannel or -1001234567890"
              data-testid="input-telegram-channel"
            />
            <p className="text-xs text-muted-foreground">Use @username for public channels or the numeric ID for private groups</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Posts Per Day</Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={postsPerDay}
              onChange={e => setPostsPerDay(e.target.value)}
              data-testid="input-telegram-posts-per-day"
            />
            <p className="text-xs text-muted-foreground">Number of movie posts to send each day (spread evenly)</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || (!botToken && !channelId)} data-testid="button-save-telegram">
              {saveMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-2" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Controls</CardTitle>
          <CardDescription className="text-xs">Test the bot, trigger posts manually, or toggle automatic daily posting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={!config?.hasToken || testMutation.isPending}
              data-testid="button-telegram-test"
            >
              {testMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
              Send Test Post
            </Button>
            <Button
              variant="outline"
              onClick={() => triggerMutation.mutate()}
              disabled={!config?.hasToken || triggerMutation.isPending}
              data-testid="button-telegram-trigger"
            >
              {triggerMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-2" />}
              Trigger Daily Posts
            </Button>
            <Button
              variant={config?.autoPost ? "destructive" : "default"}
              onClick={() => toggleAutoPost.mutate()}
              disabled={!config?.hasToken || toggleAutoPost.isPending}
              data-testid="button-telegram-toggle-auto"
            >
              {toggleAutoPost.isPending ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : config?.autoPost ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
              {config?.autoPost ? "Disable Auto-Post" : "Enable Auto-Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>Create a Telegram bot via <strong>@BotFather</strong> and get the bot token</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Add the bot as an admin to your channel or group</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Enter the bot token and channel ID above, then save</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>The bot will automatically post {config?.postsPerDay || 20} movies/series per day with posters, info, and watch links</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
