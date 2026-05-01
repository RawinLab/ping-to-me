"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@pingtome/ui";
import { Loader2, Key, Trash2, Edit2, Check, X, Fingerprint, Shield } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Passkey {
  id: string;
  name: string;
  authenticatorType: string;
  transports: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export function PasskeyManager() {
  const t = useTranslations("settings.passkeys");
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/passkey/list`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setPasskeys(response.data.passkeys || []);
    } catch (error) {
      console.error("Failed to load passkeys:", error);
      toast.error(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const checkWebAuthnSupport = () => {
    if (!window.PublicKeyCredential) {
      toast.error(t("webauthnNotSupported"));
      return false;
    }
    return true;
  };

  const handleAddPasskey = async () => {
    if (!checkWebAuthnSupport()) return;

    try {
      setRegistering(true);

      const optionsResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/passkey/register/options`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const { options } = optionsResponse.data;

      const registrationResponse = await startRegistration({ optionsJSON: options });

      const verifyResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/passkey/register/verify`,
        {
          registrationResponse,
          name: passkeyName || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      toast.success(t("addedSuccess"));

      setShowAddDialog(false);
      setPasskeyName("");
      loadPasskeys();
    } catch (error: any) {
      console.error("Passkey registration failed:", error);
      toast.error(error.response?.data?.message || t("addFailed"));
    } finally {
      setRegistering(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/passkey/${passkeyId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      toast.success(t("deletedSuccess"));
      loadPasskeys();
    } catch (error) {
      console.error("Failed to delete passkey:", error);
      toast.error(t("deleteFailed"));
    }
  };

  const handleRenamePasskey = async (passkeyId: string) => {
    if (!editingName.trim()) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/passkey/${passkeyId}`,
        { name: editingName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      toast.success(t("renamedSuccess"));
      setEditingId(null);
      setEditingName("");
      loadPasskeys();
    } catch (error) {
      console.error("Failed to rename passkey:", error);
      toast.error(t("renameFailed"));
    }
  };

  const getAuthenticatorIcon = (type: string) => {
    return type === "platform" ? (
      <Fingerprint className="h-5 w-5 text-blue-500" />
    ) : (
      <Shield className="h-5 w-5 text-green-500" />
    );
  };

  const getAuthenticatorLabel = (type: string) => {
    return type === "platform" ? t("thisDevice") : t("securityKey");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>
              {t("subtitle")}
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Key className="h-4 w-4 mr-2" />
            {t("addPasskey")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("noPasskeys")}</p>
            <p className="text-sm mt-2">
              {t("noPasskeysDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getAuthenticatorIcon(passkey.authenticatorType)}
                  <div>
                    {editingId === passkey.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 w-64"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRenamePasskey(passkey.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="font-medium">{passkey.name}</div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {getAuthenticatorLabel(passkey.authenticatorType)} • {t("added")}{" "}
                      {formatDate(passkey.createdAt)}
                      {passkey.lastUsedAt && (
                        <> • {t("lastUsed")} {formatDate(passkey.lastUsedAt)}</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId !== passkey.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(passkey.id);
                        setEditingName(passkey.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeletePasskey(passkey.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("addDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passkey-name">
                {t("nameOptional")}
              </Label>
              <Input
                id="passkey-name"
                placeholder={t("namePlaceholder")}
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {t("nameHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setPasskeyName("");
              }}
              disabled={registering}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPasskey} disabled={registering}>
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("registering")}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {t("addPasskey")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
