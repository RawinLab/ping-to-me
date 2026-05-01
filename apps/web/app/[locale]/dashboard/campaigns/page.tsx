"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Skeleton,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@pingtome/ui";
import { Calendar } from "@pingtome/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@pingtome/ui";
import { format } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Target,
  Link2,
  MousePointerClick,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@pingtome/ui";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  startDate?: string;
  endDate?: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  goalType?: string;
  goalTarget?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    links: number;
  };
}

interface CampaignAnalytics {
  clicks: number;
  uniqueClicks: number;
  conversionRate?: number;
}

interface CampaignFormData {
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  goalType: string;
  goalTarget: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
}

const initialFormData: CampaignFormData = {
  name: "",
  description: "",
  startDate: undefined,
  endDate: undefined,
  status: "DRAFT",
  goalType: "",
  goalTarget: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
};

const statusColors = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-300",
  PAUSED: "bg-amber-100 text-amber-700 border-amber-300",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-300",
};

const statusIcons = {
  DRAFT: Activity,
  ACTIVE: TrendingUp,
  PAUSED: BarChart3,
  COMPLETED: Target,
};

export default function CampaignsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const router = useRouter();
  const t = useTranslations("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<
    Map<string, CampaignAnalytics>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(
    null
  );
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUtmExpanded, setIsUtmExpanded] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!currentOrg) return;

    try {
      setLoading(true);
      const response = await apiRequest(
        `/campaigns?orgId=${currentOrg.id}`
      );
      setCampaigns(response);

      // Fetch analytics for each campaign
      const analyticsPromises = response.map((campaign: Campaign) =>
        apiRequest(`/campaigns/${campaign.id}/analytics`)
          .then((data) => ({ id: campaign.id, data }))
          .catch(() => ({ id: campaign.id, data: { clicks: 0, uniqueClicks: 0 } }))
      );

      const analyticsResults = await Promise.all(analyticsPromises);
      const analyticsMap = new Map<string, CampaignAnalytics>();
      analyticsResults.forEach(({ id, data }) => {
        analyticsMap.set(id, data);
      });
      setCampaignAnalytics(analyticsMap);
    } catch (error: any) {
      console.error("Failed to fetch campaigns:", error);
      toast.error(t("failedToLoadCampaigns"));
    } finally {
      setLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (!orgLoading && currentOrg) {
      fetchCampaigns();
    }
  }, [fetchCampaigns, orgLoading, currentOrg]);

  const handleOpenDialog = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        description: campaign.description || "",
        startDate: campaign.startDate ? new Date(campaign.startDate) : undefined,
        endDate: campaign.endDate ? new Date(campaign.endDate) : undefined,
        status: campaign.status,
        goalType: campaign.goalType || "",
        goalTarget: campaign.goalTarget?.toString() || "",
        utmSource: campaign.utmSource || "",
        utmMedium: campaign.utmMedium || "",
        utmCampaign: campaign.utmCampaign || "",
        utmTerm: campaign.utmTerm || "",
        utmContent: campaign.utmContent || "",
      });
      setIsUtmExpanded(
        !!(
          campaign.utmSource ||
          campaign.utmMedium ||
          campaign.utmCampaign ||
          campaign.utmTerm ||
          campaign.utmContent
        )
      );
    } else {
      setEditingCampaign(null);
      setFormData(initialFormData);
      setIsUtmExpanded(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCampaign(null);
    setFormData(initialFormData);
    setIsUtmExpanded(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(t("campaignNameRequired"));
      return;
    }

    if (!currentOrg) {
      toast.error(t("noOrganization"));
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        organizationId: currentOrg.id,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        status: formData.status,
        goalType: formData.goalType.trim() || undefined,
        goalTarget: formData.goalTarget ? parseInt(formData.goalTarget) : undefined,
        utmSource: formData.utmSource.trim() || undefined,
        utmMedium: formData.utmMedium.trim() || undefined,
        utmCampaign: formData.utmCampaign.trim() || undefined,
        utmTerm: formData.utmTerm.trim() || undefined,
        utmContent: formData.utmContent.trim() || undefined,
      };

      if (editingCampaign) {
        await apiRequest(`/campaigns/${editingCampaign.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success(t("campaignUpdated"));
      } else {
        await apiRequest("/campaigns", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(t("campaignCreated"));
      }

      handleCloseDialog();
      fetchCampaigns();
    } catch (error: any) {
      console.error("Failed to save campaign:", error);
      toast.error(error.message || t("failedToSaveCampaign"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCampaign) return;

    try {
      await apiRequest(`/campaigns/${deletingCampaign.id}`, {
        method: "DELETE",
      });
      toast.success(t("campaignDeleted"));
      setIsDeleteDialogOpen(false);
      setDeletingCampaign(null);
      fetchCampaigns();
    } catch (error: any) {
      console.error("Failed to delete campaign:", error);
      toast.error(error.message || t("failedToDeleteCampaign"));
    }
  };

  const openDeleteDialog = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  // Calculate stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalLinks = campaigns.reduce((sum, c) => sum + (c._count?.links || 0), 0);
  const totalClicks = Array.from(campaignAnalytics.values()).reduce(
    (sum, analytics) => sum + (analytics.clicks || 0),
    0
  );

  if (loading && !campaigns.length) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-11 w-40" />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> {t("newCampaign")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    {t("totalCampaigns")}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {totalCampaigns}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    {t("activeCampaigns")}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {activeCampaigns}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    {t("totalLinks")}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {totalLinks}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Link2 className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    {t("totalClicks")}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {totalClicks.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <MousePointerClick className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-slate-100 rounded-full">
                  <Target className="h-10 w-10 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t("noCampaignsYet")}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("getStartedCampaign")}
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg"
                >
                  <Plus className="mr-2 h-4 w-4" /> {t("createCampaign")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const analytics = campaignAnalytics.get(campaign.id);
              const StatusIcon = statusIcons[campaign.status];

              return (
                <Card
                  key={campaign.id}
                  className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-200 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-slate-900 truncate">
                          {campaign.name}
                        </CardTitle>
                        {campaign.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {campaign.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        className={cn(
                          "ml-2 border",
                          statusColors[campaign.status]
                        )}
                      >
                        {campaign.status.charAt(0) +
                          campaign.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date Range */}
                    {(campaign.startDate || campaign.endDate) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        <span>
                          {campaign.startDate
                            ? format(new Date(campaign.startDate), "MMM d, yyyy")
                            : t("noStart")}{" "}
                          →{" "}
                          {campaign.endDate
                            ? format(new Date(campaign.endDate), "MMM d, yyyy")
                            : t("noEnd")}
                        </span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-slate-500" />
                          <span className="text-xs text-slate-500">{t("links")}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                          {campaign._count?.links || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4 text-slate-500" />
                          <span className="text-xs text-slate-500">{t("clicks")}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                          {analytics?.clicks?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>

                    {/* Goal */}
                    {campaign.goalType && campaign.goalTarget && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">
                            {t("goal")}: {campaign.goalTarget.toLocaleString()}{" "}
                            {campaign.goalType}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/analytics`)}
                        className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 hover:text-blue-700"
                      >
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                        {t("viewAnalytics")}
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(campaign)}
                          className="flex-1 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          {t("editCampaign")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(campaign)}
                          className="flex-1 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          {t("deleteCampaign")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? t("editCampaign") : t("createCampaignTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign
                ? t("updateCampaignDetails")
                : t("setupNewCampaign")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("campaignName")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Summer Sale 2024"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                placeholder={t("optionalDescription")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="PAUSED">{t("paused")}</SelectItem>
                  <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("startDate")}</Label>                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate
                        ? format(formData.startDate, "MMM d, yyyy")
                        : t("pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, startDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t("endDate")}</Label>                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate
                        ? format(formData.endDate, "MMM d, yyyy")
                        : t("pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, endDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Goal Section */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-medium text-sm text-slate-900">
                {t("campaignGoal")}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalType">{t("goalType")}</Label>
                  <Input
                    id="goalType"
                    placeholder={t("goalTypePlaceholder")}
                    value={formData.goalType}
                    onChange={(e) =>
                      setFormData({ ...formData, goalType: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalTarget">{t("target")}</Label>
                  <Input
                    id="goalTarget"
                    type="number"
                    placeholder="e.g. 1000"
                    value={formData.goalTarget}
                    onChange={(e) =>
                      setFormData({ ...formData, goalTarget: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* UTM Parameters */}
            <Collapsible open={isUtmExpanded} onOpenChange={setIsUtmExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto bg-slate-50 hover:bg-slate-100 border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-sm text-slate-900">
                      {t("utmParameters")}
                    </span>
                  </div>
                  {isUtmExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="utmSource">{t("utmSource")}</Label>                  <Input
                    id="utmSource"
                    placeholder="e.g. newsletter"
                    value={formData.utmSource}
                    onChange={(e) =>
                      setFormData({ ...formData, utmSource: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmMedium">{t("utmMedium")}</Label>                  <Input
                    id="utmMedium"
                    placeholder="e.g. email"
                    value={formData.utmMedium}
                    onChange={(e) =>
                      setFormData({ ...formData, utmMedium: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmCampaign">{t("utmCampaign")}</Label>                  <Input
                    id="utmCampaign"
                    placeholder="e.g. summer_sale"
                    value={formData.utmCampaign}
                    onChange={(e) =>
                      setFormData({ ...formData, utmCampaign: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmTerm">{t("utmTerm")}</Label>                  <Input
                    id="utmTerm"
                    placeholder="e.g. running shoes"
                    value={formData.utmTerm}
                    onChange={(e) =>
                      setFormData({ ...formData, utmTerm: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmContent">{t("utmContent")}</Label>                  <Input
                    id="utmContent"
                    placeholder="e.g. banner_ad"
                    value={formData.utmContent}
                    onChange={(e) =>
                      setFormData({ ...formData, utmContent: e.target.value })
                    }
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting
                ? t("saving")
                : editingCampaign
                  ? t("updateCampaign")
                  : t("createCampaignTitle")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCampaignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCampaignDescription", { name: deletingCampaign?.name || "" })}
              {deletingCampaign?._count?.links ? (
                <span className="block mt-2 text-amber-600 font-medium">
                  {t("deleteCampaignWarning", { count: deletingCampaign._count.links })}
                </span>
              ) : null}
              {t("cannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("deleteCampaign")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
