"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@pingtome/ui";
import {
  ChevronUp,
  ChevronDown,
  Link2,
  QrCode,
  FileText,
  Settings2,
  Upload,
  Check,
  Copy,
  ExternalLink,
  Download,
  Image as ImageIcon,
  X,
  Lock,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { LinkResponse, CreateLinkDto } from "@pingtome/types";
import { QrCodeCustomizer } from "@/components/qrcode/QrCodeCustomizer";

// QR Code color presets
const QR_COLOR_PRESETS = [
  { name: "Black", color: "#000000" },
  { name: "Red", color: "#DC2626" },
  { name: "Orange", color: "#EA580C" },
  { name: "Green", color: "#16A34A" },
  { name: "Teal", color: "#0D9488" },
  { name: "Blue", color: "#2563EB" },
  { name: "Indigo", color: "#4F46E5" },
  { name: "Pink", color: "#DB2777" },
];

const createLinkSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  expirationDate: z.string().optional(),
  password: z.string().optional(),
  deepLinkFallback: z.string().optional(),
});

type CreateLinkFormData = z.infer<typeof createLinkSchema>;

interface Domain {
  id: string;
  hostname: string;
  isVerified: boolean;
  isDefault: boolean;
}

interface BioPage {
  id: string;
  slug: string;
  title: string;
}

export default function CreateLinkPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [bioPages, setBioPages] = useState<BioPage[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("pingto.me");
  const [selectedBioPage, setSelectedBioPage] = useState<string>("");
  const [linkDetailsOpen, setLinkDetailsOpen] = useState(true);
  const [sharingOptionsOpen, setSharingOptionsOpen] = useState(true);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkResponse | null>(null);
  const [addToBioPage, setAddToBioPage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redirectType, setRedirectType] = useState<"301" | "302">("301");
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // QR Code customization state
  const [generateQrCode, setGenerateQrCode] = useState(true);
  const [qrColor, setQrColor] = useState("#000000");
  const [qrLogo, setQrLogo] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrPreviewLoading, setQrPreviewLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
  });

  // Watch the original URL for QR preview
  const watchedUrl = useWatch({ control, name: "originalUrl" });

  // Helper function to check plan access
  const canAccess = (feature: string): boolean => {
    // Default to true for now - this can be enhanced later based on user plan
    // Features: custom_domains, bio_pages
    return true;
  };

  // Check if user has access to custom domains and bio pages
  const hasCustomDomains = canAccess("custom_domains");
  const hasBioPages = canAccess("bio_pages");

  // Generate QR preview when URL, color, or logo changes
  const updateQrPreview = useCallback(async () => {
    if (!watchedUrl || !generateQrCode) {
      setQrPreview(null);
      return;
    }

    // Validate URL
    try {
      new URL(watchedUrl);
    } catch {
      setQrPreview(null);
      return;
    }

    setQrPreviewLoading(true);
    try {
      // Use advanced endpoint to support logo
      const response = await apiRequest("/qr/advanced", {
        method: "POST",
        body: JSON.stringify({
          url: watchedUrl,
          foregroundColor: qrColor,
          backgroundColor: "#FFFFFF",
          logo: qrLogo || undefined,
          logoSize: 20,
          size: 200,
        }),
      });
      setQrPreview(response.dataUrl);
    } catch (err) {
      console.error("Failed to generate QR preview:", err);
    } finally {
      setQrPreviewLoading(false);
    }
  }, [watchedUrl, qrColor, qrLogo, generateQrCode]);

  // Debounced QR preview update
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQrPreview();
    }, 500);
    return () => clearTimeout(timer);
  }, [updateQrPreview]);

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

  // Handle logo upload
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Check file size and compress if needed
        if (file.size > 500 * 1024) {
          const compressed = await compressImage(file, 500);
          setQrLogo(compressed);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setQrLogo(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        console.error("Failed to process logo:", err);
      }
    }
  };

  const removeLogo = () => {
    setQrLogo(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Fetch user's organization after auth is ready
  useEffect(() => {
    // Wait for auth to finish loading before fetching data
    if (authLoading) return;

    const fetchOrg = async () => {
      try {
        const orgs = await apiRequest("/organizations");
        if (orgs && orgs.length > 0) {
          setCurrentOrgId(orgs[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch organizations");
      }
    };
    fetchOrg();
  }, [authLoading]);

  useEffect(() => {
    if (currentOrgId) {
      fetchDomains();
      if (hasBioPages) {
        fetchBioPages();
      }
    }
  }, [currentOrgId, hasBioPages]);

  const fetchDomains = async () => {
    if (!currentOrgId) return;
    try {
      const res = await apiRequest(`/domains?orgId=${currentOrgId}`);
      const verifiedDomains = (res || []).filter((d: any) => d.isVerified);
      setDomains(verifiedDomains);

      // Set default domain if available
      const defaultDomain = verifiedDomains.find((d: any) => d.isDefault);
      if (defaultDomain) {
        setSelectedDomain(defaultDomain.hostname);
      }
    } catch (err) {
      console.error("Failed to fetch domains");
    }
  };

  const fetchBioPages = async () => {
    if (!currentOrgId) return;
    try {
      const res = await apiRequest(`/biopages?orgId=${currentOrgId}`);
      setBioPages(res || []);
    } catch (err) {
      console.error("Failed to fetch bio pages");
    }
  };

  const onSubmit = async (data: CreateLinkFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Build the original URL with UTM parameters if provided
      let finalUrl = data.originalUrl;
      if (data.utmSource || data.utmMedium || data.utmCampaign) {
        const url = new URL(data.originalUrl);
        if (data.utmSource) url.searchParams.set("utm_source", data.utmSource);
        if (data.utmMedium) url.searchParams.set("utm_medium", data.utmMedium);
        if (data.utmCampaign)
          url.searchParams.set("utm_campaign", data.utmCampaign);
        finalUrl = url.toString();
      }

      const payload: CreateLinkDto = {
        originalUrl: finalUrl,
        slug: data.slug || undefined,
        title: data.title || undefined,
        description: data.description || undefined,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        expirationDate: data.expirationDate || undefined,
        password: data.password || undefined,
        deepLinkFallback: data.deepLinkFallback || undefined,
        redirectType: parseInt(redirectType) as 301 | 302,
        // QR Code customization
        generateQrCode,
        qrColor: qrColor !== "#000000" ? qrColor : undefined,
        qrLogo: qrLogo || undefined,
      };

      const link = await apiRequest("/links", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // If user wants to add to bio page, update the bio page
      if (addToBioPage && selectedBioPage && link.id) {
        try {
          const bioPage = await apiRequest(`/biopages/${selectedBioPage}`);
          const currentLinks = (bioPage.content as any)?.links || [];
          await apiRequest(`/biopages/${selectedBioPage}`, {
            method: "PATCH",
            body: JSON.stringify({
              content: {
                ...bioPage.content,
                links: [...currentLinks, link.id],
              },
            }),
          });
        } catch (bioErr) {
          console.error("Failed to add link to bio page", bioErr);
        }
      }

      setCreatedLink(link as LinkResponse);
    } catch (err: any) {
      setError(err.message || "Failed to create link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = () => {
    if (!createdLink?.qrCode) return;
    const link = document.createElement("a");
    link.href = createdLink.qrCode;
    link.download = `qr-${createdLink.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (createdLink) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Link Created!</h2>
              <p className="text-muted-foreground">
                Your short link is ready to use
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Link2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <a
                      href={createdLink.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold hover:underline block truncate"
                    >
                      {createdLink.shortUrl.replace("https://", "")}
                    </a>
                    <p className="text-sm text-muted-foreground truncate">
                      {createdLink.originalUrl}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdLink.shortUrl)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={createdLink.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* QR Code Preview */}
              {createdLink.qrCode && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-white rounded-lg border p-1">
                        <img
                          src={createdLink.qrCode}
                          alt="QR Code"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">QR Code</p>
                        <p className="text-sm text-muted-foreground">
                          Scan to open your link
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <QrCodeCustomizer
                        url={createdLink.shortUrl}
                        initialQrCode={createdLink.qrCode}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadQrCode}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreatedLink(null)}
              >
                Create Another
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={() =>
                  router.push(`/dashboard/links/${createdLink.id}/analytics`)
                }
              >
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Create a new link</h1>
              <Link
                href="/dashboard/links"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Bulk upload
              </Link>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4 pb-32">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Link Details Section */}
          <Card className="overflow-hidden">
            <Collapsible
              open={linkDetailsOpen}
              onOpenChange={setLinkDetailsOpen}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Link2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Link details</h2>
                  </div>
                  {linkDetailsOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 space-y-5 border-t pt-5">
                  <p className="text-sm text-muted-foreground">
                    You can create unlimited links.{" "}
                    <Link
                      href="/pricing"
                      className="text-primary hover:underline"
                    >
                      Upgrade for more features
                    </Link>
                    .
                  </p>

                  {/* Destination URL */}
                  <div className="space-y-2">
                    <Label htmlFor="originalUrl">Destination URL</Label>
                    <Input
                      id="originalUrl"
                      placeholder="https://example.com/my-long-url"
                      className="h-12"
                      {...register("originalUrl")}
                    />
                    {errors.originalUrl && (
                      <p className="text-sm text-red-500">
                        {errors.originalUrl.message}
                      </p>
                    )}
                  </div>

                  {/* Short Link */}
                  <div className="space-y-2">
                    <Label>Short link</Label>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={selectedDomain}
                        onValueChange={setSelectedDomain}
                      >
                        <SelectTrigger className="w-[200px] h-12">
                          <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pingto.me">
                            <div className="flex items-center gap-2">
                              <span>pingto.me</span>
                            </div>
                          </SelectItem>
                          {domains.map((d) => (
                            <SelectItem key={d.id} value={d.hostname}>
                              <div className="flex items-center gap-2">
                                <span>{d.hostname}</span>
                                {d.isDefault && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-lg">/</span>
                      <Input
                        placeholder="custom-slug (optional)"
                        className="flex-1 h-12"
                        {...register("slug")}
                      />
                    </div>
                    {domains.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        <Link
                          href="/dashboard/domains"
                          className="text-primary hover:underline"
                        >
                          Add a custom domain
                        </Link>{" "}
                        to brand your short links
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Manage domains in{" "}
                        <Link
                          href="/dashboard/domains"
                          className="text-primary hover:underline"
                        >
                          Domain Settings
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter a title for your link"
                      className="h-12"
                      {...register("title")}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">
                      Tags{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="tags"
                      placeholder="marketing, social, campaign"
                      className="h-12"
                      {...register("tags")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple tags with commas
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Sharing Options Section */}
          <Card className="overflow-hidden">
            <Collapsible
              open={sharingOptionsOpen}
              onOpenChange={setSharingOptionsOpen}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <QrCode className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Sharing options</h2>
                  </div>
                  {sharingOptionsOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 space-y-4 border-t pt-5">
                  {/* Generate QR Code Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <QrCode className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Generate a QR Code</p>
                        <p className="text-sm text-muted-foreground">
                          Create and customize a QR Code to connect with your
                          audience offline.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={generateQrCode}
                      onCheckedChange={setGenerateQrCode}
                    />
                  </div>

                  {/* QR Code Customizer */}
                  {generateQrCode && (
                    <div className="bg-slate-50 rounded-xl p-5 space-y-5">
                      <div className="flex gap-6">
                        {/* Left: Color and Logo options */}
                        <div className="flex-1 space-y-4">
                          {/* Code color */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              Code color
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {QR_COLOR_PRESETS.map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => setQrColor(preset.color)}
                                  className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                                    qrColor === preset.color
                                      ? "border-blue-500 ring-2 ring-blue-500/20"
                                      : "border-gray-200"
                                  }`}
                                  style={{ backgroundColor: preset.color }}
                                  title={preset.name}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Logo */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Logo</Label>
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <div className="flex items-center gap-3">
                              {qrLogo ? (
                                <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border">
                                  <img
                                    src={qrLogo}
                                    alt="Logo preview"
                                    className="w-10 h-10 object-contain rounded"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={removeLogo}
                                    className="h-8 w-8"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="w-14 h-14 bg-white rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-300" />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      logoInputRef.current?.click()
                                    }
                                    className="gap-2"
                                  >
                                    Add logo
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              File type: PNG. 1:1 aspect ratio. Max size: 5MB,
                              2500x2500px
                            </p>
                          </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="w-40 space-y-2">
                          <Label className="text-sm font-medium">Preview</Label>
                          <div className="w-36 h-36 bg-white rounded-xl border flex items-center justify-center p-2">
                            {qrPreviewLoading ? (
                              <div className="animate-pulse bg-gray-200 w-full h-full rounded-lg" />
                            ) : qrPreview ? (
                              <img
                                src={qrPreview}
                                alt="QR Code Preview"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <QrCode className="h-10 w-10 mx-auto text-gray-200" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Enter URL to preview
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            More customizations are available after creating.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add to Bio Page */}
                  {hasBioPages && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium">Add to a Bio Page</p>
                            <p className="text-sm text-muted-foreground">
                              Display this link on your bio page
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={addToBioPage}
                          onCheckedChange={setAddToBioPage}
                        />
                      </div>

                      {addToBioPage && (
                        <div className="pl-11">
                          <Select
                            value={selectedBioPage}
                            onValueChange={setSelectedBioPage}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a bio page" />
                            </SelectTrigger>
                            <SelectContent>
                              {bioPages.map((page) => (
                                <SelectItem key={page.id} value={page.id}>
                                  {page.title} ({page.slug})
                                </SelectItem>
                              ))}
                              {bioPages.length === 0 && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  No bio pages found
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          {bioPages.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <Link
                                href="/dashboard/bio"
                                className="text-primary hover:underline"
                              >
                                Create a bio page
                              </Link>{" "}
                              first to add links to it
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!hasBioPages && (
                    <div className="flex items-center justify-between py-2 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium">Add to a Bio Page</p>
                          <p className="text-sm text-muted-foreground">
                            <Link
                              href="/pricing"
                              className="text-primary hover:underline"
                            >
                              Upgrade to Pro
                            </Link>{" "}
                            to create bio pages
                          </p>
                        </div>
                      </div>
                      <Switch disabled />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Advanced Settings Section */}
          <Card className="overflow-hidden">
            <Collapsible
              open={advancedSettingsOpen}
              onOpenChange={setAdvancedSettingsOpen}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Settings2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Advanced settings</h2>
                  </div>
                  {advancedSettingsOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 space-y-5 border-t pt-5">
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="description"
                      placeholder="A brief description of your link"
                      {...register("description")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for internal reference and SEO metadata
                    </p>
                  </div>

                  {/* UTM Parameters */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">UTM Parameters</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Track campaigns
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="utmSource">Source</Label>
                        <Input
                          id="utmSource"
                          placeholder="google, facebook"
                          {...register("utmSource")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="utmMedium">Medium</Label>
                        <Input
                          id="utmMedium"
                          placeholder="cpc, email"
                          {...register("utmMedium")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="utmCampaign">Campaign</Label>
                        <Input
                          id="utmCampaign"
                          placeholder="summer_sale"
                          {...register("utmCampaign")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expiration & Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expirationDate">
                        Expiration Date{" "}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        type="datetime-local"
                        id="expirationDate"
                        {...register("expirationDate")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password Protection{" "}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        type="password"
                        id="password"
                        placeholder="Enter password"
                        {...register("password")}
                      />
                    </div>
                  </div>

                  {/* Redirect Type */}
                  <div className="space-y-2">
                    <Label>Redirect Type</Label>
                    <Select
                      value={redirectType}
                      onValueChange={(value: "301" | "302") =>
                        setRedirectType(value)
                      }
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select redirect type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="301">301 - Permanent</SelectItem>
                        <SelectItem value="302">302 - Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      301 is better for SEO, 302 is useful for A/B testing
                    </p>
                  </div>

                  {/* Deep Link Fallback */}
                  <div className="space-y-2">
                    <Label htmlFor="deepLinkFallback">
                      Deep Link Fallback{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="deepLinkFallback"
                      placeholder="https://app.example.com/path"
                      {...register("deepLinkFallback")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Fallback URL when the primary deep link cannot be opened
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/links")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 px-8"
            >
              {loading ? "Creating..." : "Create your link"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
