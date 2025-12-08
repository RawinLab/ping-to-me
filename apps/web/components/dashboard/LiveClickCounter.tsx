"use client";

import React, { useEffect, useState } from "react";
import { Activity, MousePointerClick, Globe, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@pingtome/ui";
import { useAnalyticsSocket, LiveClickEvent } from "@/hooks/useAnalyticsSocket";
import { formatDistanceToNow } from "date-fns";

interface LiveClickCounterProps {
  linkId?: string;
  dashboard?: boolean;
  showFeed?: boolean;
}

export function LiveClickCounter({ linkId, dashboard = false, showFeed = true }: LiveClickCounterProps) {
  const { isConnected, liveClicks, clickCount } = useAnalyticsSocket({
    linkId,
    dashboard,
    enabled: true,
  });

  const [pulse, setPulse] = useState(false);

  // Trigger pulse animation when new click arrives
  useEffect(() => {
    if (clickCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  return (
    <div className="space-y-4">
      {/* Live Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            {isConnected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            )}
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {isConnected ? "Live updates active" : "Connecting..."}
        </span>

        {/* Live click count badge */}
        {clickCount > 0 && (
          <Badge
            variant="secondary"
            className={`ml-auto transition-transform ${
              pulse ? "scale-110" : "scale-100"
            }`}
          >
            <Activity className="mr-1 h-3 w-3" />
            +{clickCount} live clicks
          </Badge>
        )}
      </div>

      {/* Live Activity Feed */}
      {showFeed && liveClicks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5" />
              Live Activity
            </CardTitle>
            <CardDescription>
              Recent clicks in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveClicks.map((click, index) => (
                <LiveClickItem key={`${click.linkId}-${index}`} click={click} isNew={index === 0 && pulse} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface LiveClickItemProps {
  click: LiveClickEvent;
  isNew: boolean;
}

function LiveClickItem({ click, isNew }: LiveClickItemProps) {
  const timeAgo = formatDistanceToNow(new Date(click.timestamp), { addSuffix: true });

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
        isNew ? "border-primary bg-primary/5 shadow-sm" : "border-border"
      }`}
    >
      <div className="mt-1">
        <div className={`h-2 w-2 rounded-full ${isNew ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}></div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {click.country && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {click.country}
            </Badge>
          )}
          {click.device && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              {click.device}
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {click.browser && <span>{click.browser}</span>}
          {click.browser && click.os && <span> on </span>}
          {click.os && <span>{click.os}</span>}
          {click.referrer && click.referrer !== "direct" && (
            <>
              {" • "}
              <span>from {new URL(click.referrer).hostname}</span>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {timeAgo}
        </div>
      </div>
    </div>
  );
}

/* Compact version for header/toolbar */
export function LiveClickIndicator({ linkId, dashboard = false }: Omit<LiveClickCounterProps, "showFeed">) {
  const { isConnected, clickCount } = useAnalyticsSocket({
    linkId,
    dashboard,
    enabled: true,
  });

  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (clickCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm">
      <div className="relative flex items-center">
        <div
          className={`h-2 w-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          {isConnected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          )}
        </div>
      </div>

      <span className="text-muted-foreground">Live</span>

      {clickCount > 0 && (
        <Badge
          variant="default"
          className={`transition-transform ${
            pulse ? "scale-110" : "scale-100"
          }`}
        >
          +{clickCount}
        </Badge>
      )}
    </div>
  );
}
