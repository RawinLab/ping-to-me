"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Switch,
  Badge,
  Progress,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Slider,
  Skeleton,
} from "@pingtome/ui";
import {
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  Target,
  TrendingUp,
  AlertCircle,
  Percent,
  ExternalLink,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface LinkVariant {
  id: string;
  name: string;
  targetUrl: string;
  weight: number;
  clicks: number;
  isActive: boolean;
  createdAt: string;
}

interface VariantStats {
  totalClicks: number;
  variants: {
    id: string;
    clicks: number;
    percentage: number;
    expectedPercentage: number;
  }[];
}

interface LinkVariantsManagerProps {
  linkId: string;
}

export function LinkVariantsManager({ linkId }: LinkVariantsManagerProps) {
  const t = useTranslations("links.variants");
  const [variants, setVariants] = useState<LinkVariant[]>([]);
  const [stats, setStats] = useState<VariantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<LinkVariant | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [weight, setWeight] = useState([50]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchVariants();
    fetchStats();
  }, [linkId]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/links/${linkId}/variants`);
      setVariants(data);
    } catch (error: any) {
      toast.error(error?.message || t("failedToFetchVariants"));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest(`/links/${linkId}/variants/stats`);
      setStats(data);
    } catch (error: any) {
      console.error("Failed to fetch stats", error);
    }
  };

  const calculateRemainingWeight = (): number => {
    const totalWeight = variants
      .filter((v) => !editingVariant || v.id !== editingVariant.id)
      .reduce((sum, v) => sum + v.weight, 0);
    return 100 - totalWeight;
  };

  const openCreateDialog = () => {
    setEditingVariant(null);
    setName("");
    setTargetUrl("");
    const remaining = calculateRemainingWeight();
    setWeight([Math.min(remaining, 50)]);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (variant: LinkVariant) => {
    setEditingVariant(variant);
    setName(variant.name);
    setTargetUrl(variant.targetUrl);
    setWeight([variant.weight]);
    setIsActive(variant.isActive);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("variantNameRequired"));
      return;
    }
    if (!targetUrl.trim()) {
      toast.error(t("targetUrlRequired"));
      return;
    }

    try {
      new URL(targetUrl);
    } catch {
      toast.error(t("enterValidUrl"));
      return;
    }

    const totalWeight = variants
      .filter((v) => !editingVariant || v.id !== editingVariant.id)
      .reduce((sum, v) => sum + v.weight, 0);

    if (totalWeight + weight[0] > 100) {
      toast.error(
        t("weightExceeds100", { weight: 100 - totalWeight }),
      );
      return;
    }

    setSubmitting(true);
    try {
      if (editingVariant) {
        await apiRequest(`/links/${linkId}/variants/${editingVariant.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            targetUrl: targetUrl.trim(),
            weight: weight[0],
            isActive,
          }),
        });
        toast.success(t("variantUpdated"));
      } else {
        await apiRequest(`/links/${linkId}/variants`, {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            targetUrl: targetUrl.trim(),
            weight: weight[0],
            isActive,
          }),
        });
        toast.success(t("variantCreated"));
      }
      setDialogOpen(false);
      await fetchVariants();
      await fetchStats();
    } catch (error: any) {
      toast.error(error?.message || t("failedToSave"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (variantId: string) => {
    if (
      !confirm(t("confirmDeleteVariant"))
    ) {
      return;
    }

    try {
      await apiRequest(`/links/${linkId}/variants/${variantId}`, {
        method: "DELETE",
      });
      toast.success(t("variantDeleted"));
      await fetchVariants();
      await fetchStats();
    } catch (error: any) {
      toast.error(error?.message || t("failedToDelete"));
    }
  };

  const toggleActive = async (variant: LinkVariant) => {
    try {
      await apiRequest(`/links/${linkId}/variants/${variant.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: variant.name,
          targetUrl: variant.targetUrl,
          weight: variant.weight,
          isActive: !variant.isActive,
        }),
      });
      toast.success(
        !variant.isActive ? t("variantActivated") : t("variantDeactivated"),
      );
      await fetchVariants();
    } catch (error: any) {
      toast.error(error?.message || t("failedToUpdateVariant"));
    }
  };

  const getTotalWeight = () => {
    return variants.reduce((sum, v) => sum + v.weight, 0);
  };

  const remainingWeight = calculateRemainingWeight();
  const totalWeight = getTotalWeight();
  const weightWarning = totalWeight !== 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t("abTestingVariants")}
              </CardTitle>
              <CardDescription className="mt-1.5">
                {t("abTestingDesc")}
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} disabled={remainingWeight <= 0}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addVariant")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weight Distribution Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t("totalWeightDistribution")}</span>
              <span
                className={`font-bold ${weightWarning ? "text-amber-600" : "text-green-600"}`}
              >
                {totalWeight}%
              </span>
            </div>
            <Progress value={totalWeight} className="h-3" />
            {weightWarning && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  {totalWeight < 100 ? (
                    <>
                      {t("weightIncomplete", { weight: totalWeight, remaining: 100 - totalWeight })}
                    </>
                  ) : totalWeight > 100 ? (
                    <>
                      {t("weightExceeds", { weight: totalWeight })}
                    </>
                  ) : null}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      {stats && stats.totalClicks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              {t("performanceOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("totalClicks")}</span>
                <span className="font-bold">{stats.totalClicks}</span>
              </div>
              <div className="space-y-2">
                {stats.variants.map((variantStat) => {
                  const variant = variants.find(
                    (v) => v.id === variantStat.id,
                  );
                  if (!variant) return null;

                  const performance =
                    variantStat.percentage - variantStat.expectedPercentage;
                  const isOutperforming = performance > 2; // More than 2% above expected
                  const isUnderperforming = performance < -2;

                  return (
                    <div
                      key={variantStat.id}
                      className="flex items-center justify-between text-sm p-2 rounded-md bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{variant.name}</span>
                        {isOutperforming && (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{performance.toFixed(1)}%
                          </Badge>
                        )}
                        {isUnderperforming && (
                          <Badge
                            variant="default"
                            className="bg-red-100 text-red-700 hover:bg-red-100"
                          >
                            {performance.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          {t("expected")} {variantStat.expectedPercentage.toFixed(1)}%
                        </span>
                        <span className="font-bold">
                          {t("actual")} {variantStat.percentage.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">
                          {t("clicksCount", { count: variantStat.clicks })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Target className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">{t("noVariantsYet")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("noVariantsDesc")}
                </p>
              </div>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                {t("createFirstVariant")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg">
                          {variant.name}
                        </span>
                        <Badge
                          variant={variant.isActive ? "default" : "secondary"}
                        >
                           {variant.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        <a
                          href={variant.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground hover:underline truncate"
                        >
                          {variant.targetUrl}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-2xl font-bold">
                            {variant.weight}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("clicks", { count: variant.clicks })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 mr-2">
                          <Label
                            htmlFor={`active-${variant.id}`}
                            className="text-xs cursor-pointer"
                          >
                             {variant.isActive ? t("active") : t("inactive")}
                          </Label>
                          <Switch
                            id={`active-${variant.id}`}
                            checked={variant.isActive}
                            onCheckedChange={() => toggleActive(variant)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(variant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(variant.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={variant.weight} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {t("trafficToVariant", { weight: variant.weight })}
                      </span>
                      <span>
                        {t("created", { date: new Date(variant.createdAt).toLocaleDateString() })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? t("editVariant") : t("createNewVariant")}
            </DialogTitle>
            <DialogDescription>
              {editingVariant
                ? t("editVariantDesc")
                : t("createVariantDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Variant Name */}
            <div className="space-y-2">
              <Label htmlFor="variant-name">
                {t("variantName")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="variant-name"
                placeholder={t("variantNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="variant-url">
                {t("targetUrl")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="variant-url"
                type="url"
                placeholder="https://example.com/landing-page"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("targetUrlHelp")}
              </p>
            </div>

            {/* Weight Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="variant-weight">{t("trafficWeight")}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{weight[0]}%</span>
                  {!editingVariant && (
                    <span className="text-sm text-muted-foreground">
                      {t("availableWeight", { weight: remainingWeight })}
                    </span>
                  )}
                </div>
              </div>
              <Slider
                id="variant-weight"
                min={0}
                max={editingVariant ? 100 : remainingWeight}
                step={1}
                value={weight}
                onValueChange={setWeight}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                {t("weightHelp")}
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="space-y-0.5">
                <Label htmlFor="variant-active" className="cursor-pointer">
                  {t("activeToggle")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("activeToggleDesc")}
                </p>
              </div>
              <Switch
                id="variant-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? editingVariant
                  ? t("updating")
                  : t("creating")
                : editingVariant
                  ? t("updateVariant")
                  : t("createVariant")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
