"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  Alert,
  AlertDescription,
} from "@pingtome/ui";
import {
  ArrowLeft,
  Settings,
  Globe,
  SplitSquareVertical,
  Link2,
  Calendar,
  Lock,
  Tag,
  Folder,
  Save,
  AlertCircle,
  Sparkles,
  FolderIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { RedirectRulesManager } from "@/components/links/RedirectRulesManager";
import { LinkVariantsManager } from "@/components/links/LinkVariantsManager";
import { toast } from "sonner";

interface Link {
  id: string;
  slug: string;
  originalUrl: string;
  shortUrl: string;
  title?: string;
  description?: string;
  status: string;
  redirectType: number;
  expirationDate?: string;
  password?: string;
  tags?: string[];
  folderId?: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

interface FolderItem {
  id: string;
  name: string;
  color: string;
}

export default function LinkSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Form state for general settings
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    originalUrl: "",
    redirectType: 302,
    expirationDate: "",
    password: "",
    status: "ACTIVE",
    campaignId: "",
    folderId: "",
  });

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (currentOrgId) {
      fetchCampaigns();
      fetchFolders();
    }
  }, [currentOrgId]);

  useEffect(() => {
    if (id) {
      fetchLink();
    }
  }, [id]);

  const fetchLink = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest(`/links/${id}`);
      setLink(res);
      setFormData({
        title: res.title || "",
        description: res.description || "",
        originalUrl: res.originalUrl,
        redirectType: res.redirectType,
        expirationDate: res.expirationDate
          ? new Date(res.expirationDate).toISOString().split("T")[0]
          : "",
        password: res.password || "",
        status: res.status,
        campaignId: res.campaignId || "",
        folderId: res.folderId || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load link");
      toast.error("Failed to load link");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!currentOrgId) return;
    try {
      const res = await apiRequest(`/campaigns?orgId=${currentOrgId}`);
      setCampaigns(res || []);
    } catch (err) {
      console.error("Failed to fetch campaigns");
    }
  };

  const fetchFolders = async () => {
    if (!currentOrgId) return;
    try {
      const res = await apiRequest(`/folders?orgId=${currentOrgId}`);
      setFolders(res || []);
    } catch (err) {
      console.error("Failed to fetch folders");
    }
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      setError(null);

      await apiRequest(`/links/${id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Link settings updated successfully");
      await fetchLink();
    } catch (err: any) {
      setError(err.message || "Failed to update link");
      toast.error("Failed to update link");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">
          Loading link settings...
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Link not found</p>
        <Button onClick={() => router.push("/dashboard/links")}>
          Back to Links
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/dashboard/links/${id}/analytics`)}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analytics
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Link Settings
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <code className="text-sm bg-slate-100 px-2 py-1 rounded">
              {link.shortUrl || link.slug}
            </code>
            <Badge variant={link.status === "ACTIVE" ? "default" : "secondary"}>
              {link.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {link.originalUrl}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="redirects" className="gap-2">
            <Globe className="h-4 w-4" />
            Smart Redirects
          </TabsTrigger>
          <TabsTrigger value="variants" className="gap-2">
            <SplitSquareVertical className="h-4 w-4" />
            A/B Testing
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Link Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="My Awesome Link"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name for your link
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about this link..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Original URL */}
              <div className="space-y-2">
                <Label htmlFor="originalUrl">
                  Destination URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="originalUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.originalUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, originalUrl: e.target.value })
                  }
                  required
                />
              </div>

              {/* Redirect Type */}
              <div className="space-y-2">
                <Label htmlFor="redirectType">Redirect Type</Label>
                <Select
                  value={formData.redirectType.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      redirectType: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="redirectType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="302">302 - Temporary Redirect</SelectItem>
                    <SelectItem value="301">301 - Permanent Redirect</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  301 redirects are cached by browsers and search engines
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Link Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DISABLED">Disabled</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Organization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign */}
              <div className="space-y-2">
                <Label htmlFor="campaign">
                  Campaign <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Select
                  value={formData.campaignId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, campaignId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span>None</span>
                      </div>
                    </SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{campaign.name}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                              campaign.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : campaign.status === "DRAFT"
                                ? "bg-gray-100 text-gray-700"
                                : campaign.status === "PAUSED"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Organize your link under a campaign for better tracking
                </p>
              </div>

              {/* Folder */}
              <div className="space-y-2">
                <Label htmlFor="folder">
                  Folder <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Select
                  value={formData.folderId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, folderId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="folder">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span>None</span>
                      </div>
                    </SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <FolderIcon
                            className="h-3.5 w-3.5"
                            style={{ color: folder.color }}
                          />
                          <span>{folder.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Group your link in a folder for better organization
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security & Expiration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Protection */}
              <div className="space-y-2">
                <Label htmlFor="password">Password Protection (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Require a password to access this link
                </p>
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration Date (Optional)
                </Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDate: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  The link will stop working after this date
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Redirects Tab */}
        <TabsContent value="redirects">
          <RedirectRulesManager linkId={id} />
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="variants">
          <LinkVariantsManager linkId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
