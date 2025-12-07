"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest } from "@/lib/api";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
} from "@pingtome/ui";
import { Plus, Trash, GripVertical, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ThemeSelector } from "@/components/bio/ThemeSelector";
import { ColorPicker } from "@/components/bio/ColorPicker";
import { BackgroundPicker } from "@/components/bio/BackgroundPicker";
import { ButtonStyleSelector } from "@/components/bio/ButtonStyleSelector";
import {
  THEME_PRESETS,
  DEFAULT_THEME,
  type BioPageTheme,
  type ThemeName,
} from "@/lib/biopage-themes";

const formSchema = z.object({
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().optional(),
});

interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export function BioPageBuilder({
  existingPage,
  onSuccess,
}: {
  existingPage?: any;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<string[]>(
    existingPage?.content?.links || []
  );
  const [loading, setLoading] = useState(false);
  const [availableLinks, setAvailableLinks] = useState<any[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<string>(
    existingPage?.content?.theme?.name || "minimal"
  );
  const [customTheme, setCustomTheme] = useState<BioPageTheme>(
    existingPage?.content?.theme || DEFAULT_THEME
  );
  const [layout, setLayout] = useState<"stacked" | "grid">(
    existingPage?.content?.layout || "stacked"
  );
  const [showBranding, setShowBranding] = useState<boolean>(
    existingPage?.content?.showBranding ?? true
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: existingPage?.slug || "",
      title: existingPage?.title || "",
      description: existingPage?.description || "",
    },
  });

  // Fetch user's organization on mount
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
      fetchLinks();
    }
  }, [currentOrgId]);

  const fetchLinks = async () => {
    try {
      const res = await apiRequest("/links");
      setAvailableLinks(res.data);
    } catch (error) {
      console.error("Failed to fetch links", error);
    }
  };

  // Handle theme selection
  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);
    if (themeName !== "custom") {
      const preset = THEME_PRESETS[themeName as ThemeName];
      setCustomTheme(preset);
    }
  };

  // Handle custom theme property updates
  const handleCustomThemeUpdate = (updates: Partial<BioPageTheme>) => {
    setSelectedTheme("custom");
    setCustomTheme((prev) => ({ ...prev, ...updates }));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentOrgId) {
      alert("No organization found. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        content: {
          links: selectedLinks,
          theme: customTheme,
          layout,
          showBranding,
        },
        orgId: currentOrgId,
      };

      if (existingPage) {
        await apiRequest(`/biopages/${existingPage.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/biopages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      if (onSuccess) onSuccess();
      alert("Bio Page saved successfully!");
    } catch (error) {
      console.error("Failed to save bio page", error);
      alert("Failed to save bio page");
    } finally {
      setLoading(false);
    }
  };

  const addLink = (linkId: string) => {
    if (!selectedLinks.includes(linkId)) {
      setSelectedLinks([...selectedLinks, linkId]);
    }
  };

  const removeLink = (linkId: string) => {
    setSelectedLinks(selectedLinks.filter((id) => id !== linkId));
  };

  return (
    <div className="space-y-6">
      {/* Page Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground text-sm mr-2">
                  pingto.me/bio/
                </span>
                <Input
                  id="slug"
                  {...form.register("slug")}
                  placeholder="my-page"
                  disabled={!!existingPage}
                />
              </div>
              {form.formState.errors.slug && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="My Awesome Links"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Check out my latest content..."
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Bio Page
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabbed Interface for Links, Theme, and Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Customize Your Bio Page</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="links" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-4 mt-6">
              <div className="flex gap-2">
                <Select onValueChange={addLink}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a link..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLinks.map((link) => (
                      <SelectItem key={link.id} value={link.id}>
                        {link.title || link.slug} ({link.originalUrl})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {selectedLinks.map((linkId, index) => {
                  const link = availableLinks.find((l) => l.id === linkId);
                  if (!link) return null;
                  return (
                    <div
                      key={linkId}
                      className="flex items-center justify-between p-3 border rounded-md bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div>
                          <div className="font-medium">
                            {link.title || link.slug}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {link.originalUrl}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(linkId)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
                {selectedLinks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                    No links added yet. Select links above to add them to your
                    page.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Theme Tab */}
            <TabsContent value="theme" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Choose a Preset Theme
                  </Label>
                  <ThemeSelector
                    value={selectedTheme}
                    onChange={handleThemeChange}
                  />
                </div>

                {selectedTheme === "custom" && (
                  <div className="space-y-6 pt-6 border-t">
                    <h3 className="text-base font-semibold">
                      Custom Theme Settings
                    </h3>

                    <ColorPicker
                      label="Primary Color"
                      value={customTheme.primaryColor}
                      onChange={(color) =>
                        handleCustomThemeUpdate({ primaryColor: color })
                      }
                    />

                    <ColorPicker
                      label="Button Color"
                      value={customTheme.buttonColor}
                      onChange={(color) =>
                        handleCustomThemeUpdate({ buttonColor: color })
                      }
                    />

                    <ColorPicker
                      label="Text Color"
                      value={customTheme.textColor}
                      onChange={(color) =>
                        handleCustomThemeUpdate({ textColor: color })
                      }
                    />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Background</Label>
                      <BackgroundPicker
                        backgroundType={customTheme.backgroundType}
                        backgroundColor={customTheme.backgroundColor}
                        backgroundGradient={customTheme.backgroundGradient}
                        backgroundImage={customTheme.backgroundImage}
                        onChange={(updates) =>
                          handleCustomThemeUpdate(updates)
                        }
                      />
                    </div>

                    <ButtonStyleSelector
                      buttonStyle={customTheme.buttonStyle}
                      buttonShadow={customTheme.buttonShadow}
                      onChange={(updates) =>
                        handleCustomThemeUpdate(updates)
                      }
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="layout">Layout Style</Label>
                  <Select
                    value={layout}
                    onValueChange={(value: "stacked" | "grid") =>
                      setLayout(value)
                    }
                  >
                    <SelectTrigger id="layout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stacked">
                        Stacked (Single Column)
                      </SelectItem>
                      <SelectItem value="grid">Grid (Two Columns)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose how your links are displayed on the page
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="show-branding"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Show PingTO.Me Branding
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display &quot;Powered by PingTO.Me&quot; at the bottom of your page
                    </p>
                  </div>
                  <Switch
                    id="show-branding"
                    checked={showBranding}
                    onCheckedChange={setShowBranding}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
