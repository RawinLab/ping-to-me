"use client";

import { useEffect, useState, useCallback } from "react";
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
      toast.error("Failed to load campaigns");
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
      toast.error("Campaign name is required");
      return;
    }

    if (!currentOrg) {
      toast.error("No organization selected");
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
        toast.success("Campaign updated successfully");
      } else {
        await apiRequest("/campaigns", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Campaign created successfully");
      }

      handleCloseDialog();
      fetchCampaigns();
    } catch (error: any) {
      console.error("Failed to save campaign:", error);
      toast.error(error.message || "Failed to save campaign");
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
      toast.success("Campaign deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingCampaign(null);
      fetchCampaigns();
    } catch (error: any) {
      console.error("Failed to delete campaign:", error);
      toast.error(error.message || "Failed to delete campaign");
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
        <div className="container py-8 space-y-6 max-w-6xl">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <div className="container py-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Campaigns
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Organize and track your marketing campaigns
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Total Campaigns
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
                    Active Campaigns
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
                    Total Links
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
                    Total Clicks
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
                    No campaigns yet
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Get started by creating your first campaign
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Campaign
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
                            : "No start"}{" "}
                          →{" "}
                          {campaign.endDate
                            ? format(new Date(campaign.endDate), "MMM d, yyyy")
                            : "No end"}
                        </span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-slate-500" />
                          <span className="text-xs text-slate-500">Links</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                          {campaign._count?.links || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4 text-slate-500" />
                          <span className="text-xs text-slate-500">Clicks</span>
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
                            Goal: {campaign.goalTarget.toLocaleString()}{" "}
                            {campaign.goalType}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(campaign)}
                        className="flex-1 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(campaign)}
                        className="flex-1 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Edit Campaign" : "Create Campaign"}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign
                ? "Update your campaign details"
                : "Set up a new marketing campaign"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Campaign Name <span className="text-red-500">*</span>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description of your campaign"
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
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
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
                        : "Pick a date"}
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
                <Label>End Date</Label>
                <Popover>
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
                        : "Pick a date"}
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
                Campaign Goal (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalType">Goal Type</Label>
                  <Input
                    id="goalType"
                    placeholder="e.g. clicks, conversions"
                    value={formData.goalType}
                    onChange={(e) =>
                      setFormData({ ...formData, goalType: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalTarget">Target</Label>
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
                      UTM Parameters (Optional)
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
                  <Label htmlFor="utmSource">UTM Source</Label>
                  <Input
                    id="utmSource"
                    placeholder="e.g. newsletter"
                    value={formData.utmSource}
                    onChange={(e) =>
                      setFormData({ ...formData, utmSource: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmMedium">UTM Medium</Label>
                  <Input
                    id="utmMedium"
                    placeholder="e.g. email"
                    value={formData.utmMedium}
                    onChange={(e) =>
                      setFormData({ ...formData, utmMedium: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmCampaign">UTM Campaign</Label>
                  <Input
                    id="utmCampaign"
                    placeholder="e.g. summer_sale"
                    value={formData.utmCampaign}
                    onChange={(e) =>
                      setFormData({ ...formData, utmCampaign: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmTerm">UTM Term</Label>
                  <Input
                    id="utmTerm"
                    placeholder="e.g. running shoes"
                    value={formData.utmTerm}
                    onChange={(e) =>
                      setFormData({ ...formData, utmTerm: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmContent">UTM Content</Label>
                  <Input
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
                ? "Saving..."
                : editingCampaign
                  ? "Update Campaign"
                  : "Create Campaign"}
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
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingCampaign?.name}&rdquo;?
              {deletingCampaign?._count?.links ? (
                <span className="block mt-2 text-amber-600 font-medium">
                  Warning: This campaign has {deletingCampaign._count.links}{" "}
                  link(s) that will be unassigned.
                </span>
              ) : null}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
