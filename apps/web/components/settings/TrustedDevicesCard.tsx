"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@pingtome/ui";
import { api } from "@/lib/api";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import {
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Globe,
  MapPin,
  Clock,
  Trash2,
  Edit,
  AlertTriangle,
} from "lucide-react";

interface TrustedDevice {
  id: string;
  name: string | null;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  location: string | null;
  trustScore: number;
  lastSeenAt: string;
  createdAt: string;
}

export function TrustedDevicesCard() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceToDelete, setDeviceToDelete] = useState<TrustedDevice | null>(
    null
  );
  const [deviceToRename, setDeviceToRename] = useState<TrustedDevice | null>(
    null
  );
  const [newName, setNewName] = useState("");
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);

      // Get current device fingerprint
      const fingerprint = await getOrCreateFingerprint();

      // Fetch all trusted devices
      const response = await api.get("/auth/devices");
      const allDevices = response.data;

      // Fetch current device to mark it
      const currentResponse = await api.get("/auth/devices/current", {
        params: { fingerprint },
      });
      const currentDevice = currentResponse.data.device;

      setDevices(allDevices);
      setCurrentDeviceId(currentDevice?.id || null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to load trusted devices"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (device: TrustedDevice) => {
    try {
      await api.delete(`/auth/devices/${device.id}`);
      toast.success("Device removed successfully");
      loadDevices();
      setDeviceToDelete(null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to remove device"
      );
    }
  };

  const handleRenameDevice = async () => {
    if (!deviceToRename || !newName.trim()) return;

    try {
      await api.patch(`/auth/devices/${deviceToRename.id}/name`, {
        name: newName.trim(),
      });
      toast.success("Device name updated successfully");
      loadDevices();
      setDeviceToRename(null);
      setNewName("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update device name"
      );
    }
  };

  const handleRevokeAllDevices = async () => {
    try {
      const fingerprint = await getOrCreateFingerprint();
      await api.post("/auth/devices/revoke-all", {
        exceptFingerprint: fingerprint,
      });
      toast.success("All other devices have been revoked");
      loadDevices();
      setShowRevokeAllDialog(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to revoke devices"
      );
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      case "desktop":
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceName = (device: TrustedDevice) => {
    if (device.name) return device.name;
    const parts: string[] = [];
    if (device.browser) parts.push(device.browser);
    if (device.os) parts.push(`on ${device.os}`);
    if (device.deviceType) parts.push(`(${device.deviceType})`);
    return parts.length > 0 ? parts.join(" ") : "Unknown Device";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trusted Devices</CardTitle>
            <CardDescription>
              Manage devices that have access to your account
            </CardDescription>
          </div>
          {devices.length > 1 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRevokeAllDialog(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Revoke All Other Devices
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trusted devices yet</p>
            <p className="text-sm mt-1">
              Devices will appear here after successful logins
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => {
              const isCurrentDevice = device.id === currentDeviceId;
              return (
                <div
                  key={device.id}
                  className={`p-4 border rounded-lg ${
                    isCurrentDevice
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1 text-muted-foreground">
                        {getDeviceIcon(device.deviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {getDeviceName(device)}
                          </h4>
                          {isCurrentDevice && (
                            <Badge variant="secondary">This device</Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {device.browser && (
                            <div className="flex items-center gap-2">
                              <Chrome className="h-3 w-3" />
                              <span>
                                {device.browser}
                                {device.os && ` on ${device.os}`}
                              </span>
                            </div>
                          )}
                          {device.ipAddress && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              <span>{device.ipAddress}</span>
                            </div>
                          )}
                          {device.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>{device.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              Last seen: {formatDate(device.lastSeenAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeviceToRename(device);
                          setNewName(device.name || "");
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeviceToDelete(device)}
                        disabled={isCurrentDevice}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Delete Device Dialog */}
      <AlertDialog
        open={!!deviceToDelete}
        onOpenChange={() => setDeviceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Trusted Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this device? You will need to
              verify this device again on your next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deviceToDelete && handleRemoveDevice(deviceToDelete)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Device Dialog */}
      <Dialog
        open={!!deviceToRename}
        onOpenChange={() => {
          setDeviceToRename(null);
          setNewName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
            <DialogDescription>
              Give this device a memorable name to easily identify it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My MacBook Pro"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeviceToRename(null);
                setNewName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameDevice} disabled={!newName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke All Devices Dialog */}
      <AlertDialog
        open={showRevokeAllDialog}
        onOpenChange={setShowRevokeAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Devices</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all trusted devices except your current one. You
              will need to verify those devices again on your next login from
              them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllDevices}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
