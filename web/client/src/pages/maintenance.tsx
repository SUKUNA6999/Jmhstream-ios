import { Wrench } from "lucide-react";

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="maintenance-page">
      <div className="text-center max-w-lg">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Wrench className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold mb-3" data-testid="text-maintenance-title">We'll Be Right Back</h1>
        <p className="text-muted-foreground text-lg mb-6" data-testid="text-maintenance-message">
          {message || "JMH STREAM is currently undergoing maintenance. We're working hard to improve your experience."}
        </p>
        <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2.5 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Maintenance in progress
        </div>
        <p className="text-xs text-muted-foreground mt-8">Please check back shortly. Thank you for your patience.</p>
      </div>
    </div>
  );
}
