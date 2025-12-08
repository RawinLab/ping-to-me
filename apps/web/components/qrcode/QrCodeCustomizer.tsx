"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import {
  QrCode,
  Download,
  Upload,
  X,
  Palette,
  Image as ImageIcon,
  RefreshCw,
  FileText,
  Shield,
  Save,
  Check,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface QrCodeCustomizerProps {
  url: string;
  linkId?: string; // For saving/loading config
  initialQrCode?: string;
  trigger?: React.ReactNode;
  onConfigSaved?: () => void;
  open?: boolean; // Controlled mode
  onOpenChange?: (open: boolean) => void; // Controlled mode
}

const ERROR_CORRECTIONS = [
  { value: "L", label: "Low (7%)", description: "Fastest scan" },
  { value: "M", label: "Medium (15%)", description: "Recommended" },
  { value: "Q", label: "Quartile (25%)", description: "Good recovery" },
  { value: "H", label: "High (30%)", description: "Best for logos" },
];

const PRESET_COLORS = [
  { name: "Black", fg: "#000000", bg: "#FFFFFF" },
  { name: "Blue", fg: "#2563EB", bg: "#FFFFFF" },
  { name: "Indigo", fg: "#4F46E5", bg: "#FFFFFF" },
  { name: "Purple", fg: "#7C3AED", bg: "#FFFFFF" },
  { name: "Pink", fg: "#DB2777", bg: "#FFFFFF" },
  { name: "Red", fg: "#DC2626", bg: "#FFFFFF" },
  { name: "Orange", fg: "#EA580C", bg: "#FFFFFF" },
  { name: "Green", fg: "#16A34A", bg: "#FFFFFF" },
  { name: "Teal", fg: "#0D9488", bg: "#FFFFFF" },
  { name: "Dark", fg: "#FFFFFF", bg: "#1F2937" },
];

export function QrCodeCustomizer({
  url,
  linkId,
  initialQrCode,
  trigger,
  onConfigSaved,
  open: controlledOpen,
  onOpenChange,
}: QrCodeCustomizerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [qrCode, setQrCode] = useState(initialQrCode || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20);
  const [size, setSize] = useState(300);
  const [errorCorrection, setErrorCorrection] = useState("M");
  const [borderSize, setBorderSize] = useState(2);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved config when dialog opens
  useEffect(() => {
    if (open && linkId && !configLoaded) {
      loadSavedConfig();
    }
  }, [open, linkId, configLoaded]);

  const loadSavedConfig = async () => {
    if (!linkId) return;
    try {
      const config = await apiRequest(`/links/${linkId}/qr`);
      if (config) {
        setForegroundColor(config.foregroundColor || "#000000");
        setBackgroundColor(config.backgroundColor || "#FFFFFF");
        setErrorCorrection(config.errorCorrection || "M");
        setBorderSize(config.borderSize ?? 2);
        setSize(config.size || 300);
        setLogoSize(config.logoSizePercent || 20);
        setConfigLoaded(true);
      }
    } catch {
      // No saved config, use defaults
      setConfigLoaded(true);
    }
  };

  // Track changes
  useEffect(() => {
    if (configLoaded) {
      setHasChanges(true);
    }
  }, [foregroundColor, backgroundColor, errorCorrection, borderSize, size, logoSize]);

  // Debounced auto-save
  useEffect(() => {
    if (!linkId || !hasChanges || !configLoaded) return;

    const timeoutId = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await apiRequest(`/links/${linkId}/qr`, {
          method: "POST",
          body: JSON.stringify({
            foregroundColor,
            backgroundColor,
            errorCorrection,
            borderSize,
            size,
            logoSizePercent: logoSize,
          }),
        });
        setAutoSaveStatus('saved');
        setHasChanges(false);
        // Reset to idle after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setAutoSaveStatus('idle');
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timeoutId);
  }, [linkId, hasChanges, foregroundColor, backgroundColor, errorCorrection, borderSize, size, logoSize, configLoaded]);

  const saveConfig = async () => {
    if (!linkId) return;
    setSaving(true);
    try {
      await apiRequest(`/links/${linkId}/qr`, {
        method: "POST",
        body: JSON.stringify({
          foregroundColor,
          backgroundColor,
          errorCorrection,
          borderSize,
          size,
          logoSizePercent: logoSize,
          logo: logo || undefined,
        }),
      });
      onConfigSaved?.();
    } catch (error) {
      console.error("Failed to save QR config:", error);
    } finally {
      setSaving(false);
    }
  };

  const generateQrCode = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/qr/advanced", {
        method: "POST",
        body: JSON.stringify({
          url,
          foregroundColor,
          backgroundColor,
          logo: logo || undefined,
          logoSize,
          size,
          margin: borderSize,
          errorCorrection,
        }),
      });
      setQrCode(response.dataUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    } finally {
      setLoading(false);
    }
  }, [
    url,
    foregroundColor,
    backgroundColor,
    logo,
    logoSize,
    size,
    borderSize,
    errorCorrection,
  ]);

  // Compress image if needed (max 500KB)
  const compressImage = (
    file: File,
    maxSizeKB: number = 500,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Calculate new dimensions (max 500px for QR logo)
          const maxDim = 500;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels to get under maxSizeKB
          let quality = 0.9;
          let dataUrl = canvas.toDataURL("image/png");

          // If PNG is too large, try JPEG with decreasing quality
          while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
            quality -= 0.1;
          }

          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Check file size and compress if needed
        if (file.size > 500 * 1024) {
          const compressed = await compressImage(file, 500);
          setLogo(compressed);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setLogo(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        console.error("Failed to process logo:", err);
      }
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const applyPreset = (fg: string, bg: string) => {
    setForegroundColor(fg);
    setBackgroundColor(bg);
  };

  const downloadQrCode = (format: "png" | "svg" | "pdf") => {
    if (!qrCode && format === "png") return;

    if (format === "png") {
      const link = document.createElement("a");
      link.href = qrCode;
      link.download = "qrcode.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For SVG and PDF, we need to call the API
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL}/qr/download?url=${encodeURIComponent(url)}&fg=${encodeURIComponent(foregroundColor)}&bg=${encodeURIComponent(backgroundColor)}&size=${size}&format=${format}`,
        "_blank",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            Customize QR
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Customize QR Code
            </span>
            {linkId && autoSaveStatus !== 'idle' && (
              <span className={`text-xs font-normal px-2 py-1 rounded-full ${
                autoSaveStatus === 'saving'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {autoSaveStatus === 'saving' ? 'Saving...' : '✓ Saved'}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Preview */}
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-6 flex items-center justify-center min-h-[280px]">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code Preview"
                  className="max-w-full h-auto"
                  style={{ maxHeight: "250px" }}
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <QrCode className="h-16 w-16 mx-auto mb-2 opacity-30" />
                  <p>Click &quot;Generate&quot; to preview</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={generateQrCode}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Generate
              </Button>
              {linkId && (
                <Button
                  variant="outline"
                  onClick={saveConfig}
                  disabled={saving || autoSaveStatus === 'saving'}
                  title="Save configuration"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : autoSaveStatus === 'saved' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQrCode("png")}
                disabled={!qrCode}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQrCode("svg")}
                disabled={!qrCode || !!logo}
                title={logo ? "SVG not available with logo" : "Download SVG"}
                className="flex-1"
              >
                SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQrCode("pdf")}
                disabled={!qrCode}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-5">
            {/* Color Presets */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Presets
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.fg, preset.bg)}
                    className="w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: preset.bg,
                      borderColor:
                        foregroundColor === preset.fg &&
                        backgroundColor === preset.bg
                          ? "#3B82F6"
                          : "#E5E7EB",
                    }}
                    title={preset.name}
                  >
                    <div
                      className="w-4 h-4 mx-auto rounded"
                      style={{ backgroundColor: preset.fg }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fg-color">Foreground</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="fg-color"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bg-color">Background</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="bg-color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logo (optional)
              </Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logo ? (
                  <div className="flex items-center gap-2 flex-1 bg-slate-50 rounded-lg px-3 py-2">
                    <img
                      src={logo}
                      alt="Logo preview"
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-sm text-muted-foreground flex-1">
                      Logo uploaded
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeLogo}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                )}
              </div>
              {logo && (
                <div className="space-y-2">
                  <Label htmlFor="logo-size" className="text-sm">
                    Logo Size: {logoSize}%
                  </Label>
                  <input
                    type="range"
                    id="logo-size"
                    min="10"
                    max="30"
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Error Correction */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Error Correction
              </Label>
              <Select
                value={errorCorrection}
                onValueChange={setErrorCorrection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select error correction" />
                </SelectTrigger>
                <SelectContent>
                  {ERROR_CORRECTIONS.map((ec) => (
                    <SelectItem key={ec.value} value={ec.value}>
                      <div className="flex flex-col">
                        <span>{ec.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {ec.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Border Size */}
            <div className="space-y-2">
              <Label htmlFor="border-size">Border Size: {borderSize}</Label>
              <input
                type="range"
                id="border-size"
                min="0"
                max="10"
                value={borderSize}
                onChange={(e) => setBorderSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="qr-size">Size: {size}px</Label>
              <input
                type="range"
                id="qr-size"
                min="150"
                max="600"
                step="50"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
