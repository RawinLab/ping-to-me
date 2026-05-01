"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Separator,
} from "@pingtome/ui";
import {
  Copy,
  Check,
  Download,
  Twitter,
  Facebook,
  MessageCircle,
  Mail,
  Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bioPageId: string;
  bioPageUrl: string;
  bioPageTitle: string;
}

export function ShareModal({
  open,
  onOpenChange,
  bioPageId,
  bioPageUrl,
  bioPageTitle,
}: ShareModalProps) {
  const t = useTranslations("bio");
  const [copied, setCopied] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const qrCodeUrl = `${apiUrl}/qr/preview?url=${encodeURIComponent(bioPageUrl)}&size=200`;

  useEffect(() => {
    if (open) {
      setCopied(false);
      setQrLoading(true);
      setQrError(false);
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bioPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bioPageTitle.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download QR code:", error);
    }
  };

  const shareText = t("checkOut", { title: bioPageTitle });

  const socialShareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(bioPageUrl)}&text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bioPageUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} - ${bioPageUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(bioPageTitle)}&body=${encodeURIComponent(`${shareText}\n\n${bioPageUrl}`)}`,
  };

  const handleSocialShare = (platform: keyof typeof socialShareLinks) => {
    window.open(socialShareLinks[platform], "_blank", "width=600,height=400");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t("shareBioPage")}
          </DialogTitle>
          <DialogDescription>
            {t("shareDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL Section */}
          <div className="space-y-2">
            <Label htmlFor="bio-url">{t("bioPageUrl")}</Label>
            <div className="flex gap-2">
              <Input
                id="bio-url"
                value={bioPageUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600">{t("copiedToClipboard")}</p>
            )}
          </div>

          <Separator />

          {/* QR Code Section */}
          <div className="space-y-3">
            <Label>{t("qrCode")}</Label>
            <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-lg">
              {qrLoading && !qrError && (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-white rounded border-2 border-dashed border-slate-300">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600">{t("loadingQrCode")}</p>
                  </div>
                </div>
              )}
              {qrError && (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-white rounded border-2 border-dashed border-red-300">
                    <p className="text-sm text-red-600 text-center px-4">
                      {t("failedToLoadQrCode")}
                    </p>
                </div>
              )}
              <img
                src={qrCodeUrl}
                alt={t("qrCode")}
                width={200}
                height={200}
                className={`rounded border-2 border-white shadow-sm ${qrLoading && !qrError ? "hidden" : ""}`}
                onLoad={() => setQrLoading(false)}
                onError={() => {
                  setQrLoading(false);
                  setQrError(true);
                }}
              />
              {!qrError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQr}
                  disabled={qrLoading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("downloadQrCode")}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Social Share Section */}
          <div className="space-y-3">
            <Label>{t("shareOnSocialMedia")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialShare("twitter")}
                className="gap-2 justify-start"
              >
                <Twitter className="h-4 w-4 text-sky-500" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare("facebook")}
                className="gap-2 justify-start"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare("whatsapp")}
                className="gap-2 justify-start"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare("email")}
                className="gap-2 justify-start"
              >
                <Mail className="h-4 w-4 text-slate-600" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
