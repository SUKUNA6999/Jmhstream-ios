import { useState } from "react";
import { X, Info, AlertTriangle, CheckCircle, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const typeConfig = {
  info: { icon: Info, className: "bg-blue-500/15 border-blue-500/30 text-blue-300" },
  warning: { icon: AlertTriangle, className: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300" },
  success: { icon: CheckCircle, className: "bg-green-500/15 border-green-500/30 text-green-300" },
  announcement: { icon: Megaphone, className: "bg-primary/15 border-primary/30 text-primary" },
};

export function BroadcastBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: broadcast } = useQuery<any>({
    queryKey: ["/api/public/broadcast"],
  });

  if (!broadcast || dismissed) return null;

  const config = typeConfig[broadcast.type as keyof typeof typeConfig] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`border rounded-md px-4 py-2.5 flex items-center gap-3 mb-4 ${config.className}`} data-testid="broadcast-banner">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm flex-1">{broadcast.message}</p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        data-testid="button-dismiss-broadcast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
