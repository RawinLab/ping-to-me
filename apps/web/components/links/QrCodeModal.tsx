"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
} from "@pingtome/ui";
import { Download, Loader2 } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    shortUrl: string;
    slug: string;
  };
}

export function QrCodeModal({ isOpen, onClose, link }: QrCodeModalProps) {
  const t = useTranslations("qr");
  const [color, setColor] = useState("#000000");
  const [bgcolor, setBgcolor] = useState("#ffffff");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateQr();
    }
  }, [isOpen, color, bgcolor]);

  const generateQr = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/qr/custom", {
        method: "POST",
        body: JSON.stringify({
          url: link.shortUrl,
          color,
          bgcolor,
        }),
      });
      setQrDataUrl(res.dataUrl);
    } catch (error) {
      console.error("Failed to generate QR", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const linkEl = document.createElement("a");
    linkEl.href = qrDataUrl;
    linkEl.download = `qr-${link.slug}.png`;
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("customizeQrCode")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg border min-h-[200px] items-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
            ) : (
              <p className="text-sm text-muted-foreground">{t("generating")}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">{t("foregroundColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bgcolor">{t("backgroundColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="bgcolor"
                  type="color"
                  value={bgcolor}
                  onChange={(e) => setBgcolor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={bgcolor}
                  onChange={(e) => setBgcolor(e.target.value)}
                  className="uppercase"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={!qrDataUrl || loading}>
            <Download className="mr-2 h-4 w-4" /> {t("downloadPng")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
