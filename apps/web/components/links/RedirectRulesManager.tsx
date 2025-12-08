"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Checkbox,
  Skeleton,
  Alert,
} from "@pingtome/ui";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface DateRange {
  start?: string;
  end?: string;
}

interface TimeRange {
  start?: string;
  end?: string;
}

interface RedirectRule {
  id: string;
  priority: number;
  countries?: string[];
  devices?: string[];
  browsers?: string[];
  os?: string[];
  languages?: string[];
  dateRange?: DateRange;
  timeRange?: TimeRange;
  targetUrl: string;
  redirectType: number;
  isActive: boolean;
}

interface RedirectRulesManagerProps {
  linkId: string;
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "UK", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "MX", name: "Mexico" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
];

const DEVICES = ["mobile", "tablet", "desktop"];
const BROWSERS = ["chrome", "safari", "firefox", "edge", "opera"];
const OS_OPTIONS = ["windows", "macos", "ios", "android", "linux"];
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
];

const REDIRECT_TYPES = [
  { value: 301, label: "301 - Permanent" },
  { value: 302, label: "302 - Temporary" },
];

export function RedirectRulesManager({ linkId }: RedirectRulesManagerProps) {
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);

  useEffect(() => {
    fetchRules();
  }, [linkId]);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/links/${linkId}/rules`);
      setRules(response || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load redirect rules");
      toast.error("Failed to load redirect rules");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleEditRule = (rule: RedirectRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this redirect rule?")) {
      return;
    }

    try {
      await apiRequest(`/links/${linkId}/rules/${ruleId}`, {
        method: "DELETE",
      });
      toast.success("Redirect rule deleted");
      fetchRules();
    } catch (err) {
      toast.error("Failed to delete redirect rule");
    }
  };

  const handleToggleActive = async (rule: RedirectRule) => {
    try {
      await apiRequest(`/links/${linkId}/rules/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...rule, isActive: !rule.isActive }),
      });
      toast.success(
        rule.isActive
          ? "Redirect rule deactivated"
          : "Redirect rule activated"
      );
      fetchRules();
    } catch (err) {
      toast.error("Failed to update redirect rule");
    }
  };

  const handleMoveRule = async (ruleId: string, direction: "up" | "down") => {
    const currentIndex = rules.findIndex((r) => r.id === ruleId);
    if (currentIndex === -1) return;

    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === rules.length - 1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const reorderedRules = [...rules];
    [reorderedRules[currentIndex], reorderedRules[newIndex]] = [
      reorderedRules[newIndex],
      reorderedRules[currentIndex],
    ];

    const ruleOrder = reorderedRules.map((r) => r.id);

    try {
      await apiRequest(`/links/${linkId}/rules/reorder`, {
        method: "POST",
        body: JSON.stringify({ ruleOrder }),
      });
      setRules(reorderedRules);
      toast.success("Rules reordered");
    } catch (err) {
      toast.error("Failed to reorder rules");
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    fetchRules();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Redirect Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Smart Redirect Rules</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Redirect users to different URLs based on conditions
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddRule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <RuleDialog
              linkId={linkId}
              rule={editingRule}
              onSuccess={handleDialogSuccess}
            />
          </Dialog>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <p className="ml-2">{error}</p>
            </Alert>
          )}

          {rules.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No redirect rules configured</p>
              <p className="text-sm mt-1">
                Add rules to redirect users based on their location, device, or
                other conditions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  index={index}
                  totalRules={rules.length}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                  onToggleActive={handleToggleActive}
                  onMove={handleMoveRule}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface RuleCardProps {
  rule: RedirectRule;
  index: number;
  totalRules: number;
  onEdit: (rule: RedirectRule) => void;
  onDelete: (ruleId: string) => void;
  onToggleActive: (rule: RedirectRule) => void;
  onMove: (ruleId: string, direction: "up" | "down") => void;
}

function RuleCard({
  rule,
  index,
  totalRules,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
}: RuleCardProps) {
  const hasConditions =
    rule.countries ||
    rule.devices ||
    rule.browsers ||
    rule.os ||
    rule.languages ||
    rule.dateRange ||
    rule.timeRange;

  return (
    <Card
      className={`${!rule.isActive ? "opacity-60 bg-slate-50" : ""} transition-all`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Priority and Move Controls */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMove(rule.id, "up")}
              disabled={index === 0}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <div className="flex items-center justify-center h-6 w-6 rounded bg-slate-100 text-xs font-medium">
              {index + 1}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMove(rule.id, "down")}
              disabled={index === totalRules - 1}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Rule Details */}
          <div className="flex-1 space-y-2">
            {/* Target URL */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Redirect to:</span>
              <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                {rule.targetUrl}
              </code>
              <Badge variant="outline" className="ml-auto">
                {rule.redirectType === 301 ? "301 Permanent" : "302 Temporary"}
              </Badge>
            </div>

            {/* Conditions */}
            {hasConditions && (
              <div className="flex flex-wrap gap-2 text-sm">
                {rule.countries && rule.countries.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600">Countries:</span>
                    <span className="font-medium">
                      {rule.countries.join(", ")}
                    </span>
                  </div>
                )}

                {rule.devices && rule.devices.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600">Devices:</span>
                    <span className="font-medium">
                      {rule.devices.join(", ")}
                    </span>
                  </div>
                )}

                {rule.browsers && rule.browsers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Chrome className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600">Browsers:</span>
                    <span className="font-medium">
                      {rule.browsers.join(", ")}
                    </span>
                  </div>
                )}

                {rule.os && rule.os.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600">OS:</span>
                    <span className="font-medium">{rule.os.join(", ")}</span>
                  </div>
                )}

                {rule.languages && rule.languages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600">Languages:</span>
                    <span className="font-medium">
                      {rule.languages.join(", ")}
                    </span>
                  </div>
                )}

                {rule.dateRange && (rule.dateRange.start || rule.dateRange.end) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600">Date:</span>
                    <span className="font-medium">
                      {rule.dateRange.start || "..."} to{" "}
                      {rule.dateRange.end || "..."}
                    </span>
                  </div>
                )}

                {rule.timeRange && (rule.timeRange.start || rule.timeRange.end) && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-600">Time:</span>
                    <span className="font-medium">
                      {rule.timeRange.start || "..."} to{" "}
                      {rule.timeRange.end || "..."}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.isActive}
              onCheckedChange={() => onToggleActive(rule)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(rule)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(rule.id)}
              className="h-8 w-8 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RuleDialogProps {
  linkId: string;
  rule: RedirectRule | null;
  onSuccess: () => void;
}

function RuleDialog({ linkId, rule, onSuccess }: RuleDialogProps) {
  const [saving, setSaving] = useState(false);

  // Form state
  const [targetUrl, setTargetUrl] = useState(rule?.targetUrl || "");
  const [redirectType, setRedirectType] = useState<number>(
    rule?.redirectType || 302
  );
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);

  // Conditions
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    rule?.countries || []
  );
  const [selectedDevices, setSelectedDevices] = useState<string[]>(
    rule?.devices || []
  );
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>(
    rule?.browsers || []
  );
  const [selectedOs, setSelectedOs] = useState<string[]>(rule?.os || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    rule?.languages || []
  );

  // Date and time ranges
  const [dateStart, setDateStart] = useState(rule?.dateRange?.start || "");
  const [dateEnd, setDateEnd] = useState(rule?.dateRange?.end || "");
  const [timeStart, setTimeStart] = useState(rule?.timeRange?.start || "");
  const [timeEnd, setTimeEnd] = useState(rule?.timeRange?.end || "");

  // Country input for adding
  const [countrySearch, setCountrySearch] = useState("");

  // Reset form when rule changes
  useEffect(() => {
    setTargetUrl(rule?.targetUrl || "");
    setRedirectType(rule?.redirectType || 302);
    setIsActive(rule?.isActive ?? true);
    setSelectedCountries(rule?.countries || []);
    setSelectedDevices(rule?.devices || []);
    setSelectedBrowsers(rule?.browsers || []);
    setSelectedOs(rule?.os || []);
    setSelectedLanguages(rule?.languages || []);
    setDateStart(rule?.dateRange?.start || "");
    setDateEnd(rule?.dateRange?.end || "");
    setTimeStart(rule?.timeRange?.start || "");
    setTimeEnd(rule?.timeRange?.end || "");
  }, [rule]);

  const toggleSelection = (
    value: string,
    selected: string[],
    setter: (value: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setter(selected.filter((v) => v !== value));
    } else {
      setter([...selected, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetUrl) {
      toast.error("Target URL is required");
      return;
    }

    setSaving(true);

    const payload: Partial<RedirectRule> = {
      targetUrl,
      redirectType,
      isActive,
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
      devices: selectedDevices.length > 0 ? selectedDevices : undefined,
      browsers: selectedBrowsers.length > 0 ? selectedBrowsers : undefined,
      os: selectedOs.length > 0 ? selectedOs : undefined,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      dateRange:
        dateStart || dateEnd
          ? { start: dateStart || undefined, end: dateEnd || undefined }
          : undefined,
      timeRange:
        timeStart || timeEnd
          ? { start: timeStart || undefined, end: timeEnd || undefined }
          : undefined,
    };

    try {
      if (rule) {
        // Update existing rule
        await apiRequest(`/links/${linkId}/rules/${rule.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Redirect rule updated");
      } else {
        // Create new rule
        await apiRequest(`/links/${linkId}/rules`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Redirect rule created");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save redirect rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {rule ? "Edit Redirect Rule" : "Add Redirect Rule"}
        </DialogTitle>
        <DialogDescription>
          Configure conditions to redirect users to different URLs
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target URL */}
        <div className="space-y-2">
          <Label htmlFor="targetUrl">
            Target URL <span className="text-red-500">*</span>
          </Label>
          <Input
            id="targetUrl"
            type="url"
            placeholder="https://example.com/target"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            required
          />
        </div>

        {/* Redirect Type */}
        <div className="space-y-2">
          <Label htmlFor="redirectType">Redirect Type</Label>
          <Select
            value={redirectType.toString()}
            onValueChange={(value) => setRedirectType(Number(value))}
          >
            <SelectTrigger id="redirectType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REDIRECT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value.toString()}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="isActive">Active</Label>
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">
            Conditions (leave empty to match all)
          </h3>

          {/* Countries */}
          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Countries
            </Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !selectedCountries.includes(value)) {
                  setSelectedCountries([...selectedCountries, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select countries" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.filter(
                  (c) => !selectedCountries.includes(c.code)
                ).map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCountries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCountries.map((code) => (
                  <Badge key={code} variant="secondary" className="gap-1">
                    {code}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCountries(
                          selectedCountries.filter((c) => c !== code)
                        )
                      }
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Devices */}
          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Devices
            </Label>
            <div className="flex flex-wrap gap-3">
              {DEVICES.map((device) => (
                <div key={device} className="flex items-center space-x-2">
                  <Checkbox
                    id={`device-${device}`}
                    checked={selectedDevices.includes(device)}
                    onCheckedChange={() =>
                      toggleSelection(device, selectedDevices, setSelectedDevices)
                    }
                  />
                  <label
                    htmlFor={`device-${device}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {device}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Browsers */}
          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2">
              <Chrome className="h-4 w-4" />
              Browsers
            </Label>
            <div className="flex flex-wrap gap-3">
              {BROWSERS.map((browser) => (
                <div key={browser} className="flex items-center space-x-2">
                  <Checkbox
                    id={`browser-${browser}`}
                    checked={selectedBrowsers.includes(browser)}
                    onCheckedChange={() =>
                      toggleSelection(
                        browser,
                        selectedBrowsers,
                        setSelectedBrowsers
                      )
                    }
                  />
                  <label
                    htmlFor={`browser-${browser}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {browser}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Systems */}
          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Operating Systems
            </Label>
            <div className="flex flex-wrap gap-3">
              {OS_OPTIONS.map((os) => (
                <div key={os} className="flex items-center space-x-2">
                  <Checkbox
                    id={`os-${os}`}
                    checked={selectedOs.includes(os)}
                    onCheckedChange={() =>
                      toggleSelection(os, selectedOs, setSelectedOs)
                    }
                  />
                  <label
                    htmlFor={`os-${os}`}
                    className="text-sm capitalize cursor-pointer"
                  >
                    {os}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Languages
            </Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !selectedLanguages.includes(value)) {
                  setSelectedLanguages([...selectedLanguages, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select languages" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter(
                  (l) => !selectedLanguages.includes(l.code)
                ).map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLanguages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedLanguages.map((code) => (
                  <Badge key={code} variant="secondary" className="gap-1">
                    {code}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLanguages(
                          selectedLanguages.filter((l) => l !== code)
                        )
                      }
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range (optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="date"
                  placeholder="Start date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="date"
                  placeholder="End date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Range (optional, HH:mm format)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="time"
                  placeholder="Start time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="time"
                  placeholder="End time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
