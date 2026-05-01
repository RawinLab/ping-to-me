'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { startRegistration } from '@simplewebauthn/browser';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@pingtome/ui';
import {
  Key,
  MoreVertical,
  Trash2,
  Edit2,
  Usb,
  Bluetooth,
  Smartphone,
  Shield,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface SecurityKey {
  id: string;
  name: string;
  authenticatorType: 'platform' | 'cross-platform';
  transports: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export function SecurityKeyManager() {
  const [securityKeys, setSecurityKeys] = useState<SecurityKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<SecurityKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [keyType, setKeyType] = useState<'platform' | 'cross-platform'>('cross-platform');

  useEffect(() => {
    loadSecurityKeys();
  }, []);

  const loadSecurityKeys = async () => {
    try {
      const response = await apiRequest('/auth/passkey/list');

      // Filter to show only cross-platform authenticators (hardware security keys)
      const keys = response.passkeys.filter(
        (key: SecurityKey) => key.authenticatorType === 'cross-platform'
      );
      setSecurityKeys(keys);
    } catch (error) {
      console.error('Failed to load security keys:', error);
      toast.error('Failed to load security keys');
    }
  };

  const handleAddSecurityKey = async () => {
    setLoading(true);
    try {
      // Get registration options from server
      const optionsResponse = await apiRequest(
        '/auth/passkey/register/options',
        {
          method: 'POST',
          body: JSON.stringify({
            authenticatorType: 'cross-platform', // Always request cross-platform for security keys
            name: newKeyName || undefined,
          }),
        }
      );

      const options = optionsResponse.options;

      // Start WebAuthn registration
      const credential = await startRegistration({ optionsJSON: options });

      // Verify registration with server
      await apiRequest(
        '/auth/passkey/register/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            registrationResponse: credential,
            name: newKeyName || undefined,
          }),
        }
      );

      toast.success('Security key added successfully');
      setAddDialogOpen(false);
      setNewKeyName('');
      loadSecurityKeys();
    } catch (error: any) {
      console.error('Failed to add security key:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Security key registration was cancelled');
      } else {
        toast.error(error.response?.data?.message || 'Failed to add security key');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenameSecurityKey = async () => {
    if (!selectedKey) return;

    setLoading(true);
    try {
      await apiRequest(
        `/auth/passkey/${selectedKey.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: newKeyName }),
        }
      );

      toast.success('Security key renamed successfully');
      setRenameDialogOpen(false);
      setNewKeyName('');
      setSelectedKey(null);
      loadSecurityKeys();
    } catch (error: any) {
      console.error('Failed to rename security key:', error);
      toast.error(error.response?.data?.message || 'Failed to rename security key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSecurityKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to remove this security key?')) {
      return;
    }

    try {
      await apiRequest(`/auth/passkey/${keyId}`, { method: 'DELETE' });

      toast.success('Security key removed successfully');
      loadSecurityKeys();
    } catch (error: any) {
      console.error('Failed to delete security key:', error);
      toast.error(error.response?.data?.message || 'Failed to remove security key');
    }
  };

  const getKeyIcon = (transports: string[]) => {
    if (transports.includes('usb')) {
      return <Usb className="h-4 w-4" />;
    } else if (transports.includes('ble')) {
      return <Bluetooth className="h-4 w-4" />;
    } else if (transports.includes('nfc')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Key className="h-4 w-4" />;
  };

  const getTransportLabel = (transports: string[]) => {
    if (transports.includes('usb')) return 'USB';
    if (transports.includes('ble')) return 'Bluetooth';
    if (transports.includes('nfc')) return 'NFC';
    return 'Unknown';
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Hardware Security Keys
              </CardTitle>
              <CardDescription>
                Add YubiKey, FIDO2, or other hardware security keys for enhanced account protection
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              <Key className="h-4 w-4 mr-2" />
              Add Security Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {securityKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No hardware security keys added yet</p>
              <p className="text-xs mt-2">
                Security keys provide the strongest protection against phishing and account takeover
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-md">
                      {getKeyIcon(key.transports)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{key.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {getTransportLabel(key.transports)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Added {formatDate(key.createdAt)}</span>
                        {key.lastUsedAt && (
                          <>
                            <span>•</span>
                            <span>Last used {formatDate(key.lastUsedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedKey(key);
                          setNewKeyName(key.name);
                          setRenameDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteSecurityKey(key.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Security Key Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hardware Security Key</DialogTitle>
            <DialogDescription>
              Insert your security key (YubiKey, FIDO2 key, etc.) and follow the prompts.
              You may need to touch your key or enter a PIN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">Key Name (Optional)</Label>
              <Input
                id="keyName"
                placeholder="e.g., YubiKey 5C, Backup Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Give your security key a recognizable name
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setNewKeyName('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSecurityKey} disabled={loading}>
              {loading ? 'Registering...' : 'Add Security Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Security Key Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Security Key</DialogTitle>
            <DialogDescription>
              Give your security key a new name
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="newKeyName">New Name</Label>
            <Input
              id="newKeyName"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter new name"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setNewKeyName('');
                setSelectedKey(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSecurityKey}
              disabled={loading || !newKeyName.trim()}
            >
              {loading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
