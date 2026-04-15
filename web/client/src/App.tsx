import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePopunderAds, SocialBarAd } from "@/components/ad-manager";
import { isAdminAuthenticated } from "@/lib/session";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import MovieDetail from "@/pages/movie-detail";
import WatchPage from "@/pages/watch";
import MoviesPage from "@/pages/movies";
import ShowsPage from "@/pages/shows";
import TrendingPage from "@/pages/trending";
import WatchlistPage from "@/pages/watchlist";
import AnnouncementsPage from "@/pages/announcements";
import ContactPage from "@/pages/contact";
import InstallPage from "@/pages/install";
import DownloadsPage from "@/pages/downloads";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import MaintenancePage from "@/pages/maintenance";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/movies" component={MoviesPage} />
      <Route path="/shows" component={ShowsPage} />
      <Route path="/trending" component={TrendingPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/watch/:id" component={WatchPage} />
      <Route path="/watchlist" component={WatchlistPage} />
      <Route path="/downloads" component={DownloadsPage} />
      <Route path="/announcements" component={AnnouncementsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/install" component={InstallPage} />
      <Route path="/jmh-admin" component={AdminLogin} />
      <Route path="/jmh-admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdLayer() {
  usePopunderAds();
  return <SocialBarAd />;
}

function MaintenanceGate() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/jmh-admin");
  const isAuthenticated = isAdminAuthenticated();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/site-settings"],
    staleTime: 30000,
  });

  const maintenanceOn = settings?.maintenance_mode === "true";

  if (maintenanceOn && !isAdmin && !isAuthenticated) {
    return <MaintenancePage message={settings?.maintenance_message} />;
  }

  return (
    <>
      <AdLayer />
      <Router />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MaintenanceGate />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
