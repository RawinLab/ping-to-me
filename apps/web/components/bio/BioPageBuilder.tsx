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
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ThemeSelector } from "@/components/bio/ThemeSelector";
import { ColorPicker } from "@/components/bio/ColorPicker";
import { BackgroundPicker } from "@/components/bio/BackgroundPicker";
import { ButtonStyleSelector } from "@/components/bio/ButtonStyleSelector";
import { SortableLinkList } from "@/components/bio/SortableLinkList";
import { LinkStyleEditor, type BioPageLink } from "@/components/bio/LinkStyleEditor";
import { useLinkReorder } from "@/hooks/useLinkReorder";
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

export function BioPageBuilder({
  existingPage,
  onSuccess,
}: {
  existingPage?: any;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableLinks, setAvailableLinks] = useState<any[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Bio links state (using new BioPageLink model)
  const [bioLinks, setBioLinks] = useState<BioPageLink[]>(
    existingPage?.bioLinks || []
  );

  // Link editor state
  const [editingLink, setEditingLink] = useState<BioPageLink | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<string>(
    existingPage?.theme?.name || "minimal"
  );
  const [customTheme, setCustomTheme] = useState<BioPageTheme>(
    existingPage?.theme || DEFAULT_THEME
  );
  const [layout, setLayout] = useState<"stacked" | "grid">(
    existingPage?.layout || "stacked"
  );
  const [showBranding, setShowBranding] = useState<boolean>(
    existingPage?.showBranding ?? true
  );

  // Reorder hook
  const { reorderLinks, isReordering } = useLinkReorder({
    bioPageId: existingPage?.id || "",
    onSuccess: () => {
      // Silently succeed
    },
    onError: (error) => {
      // Revert to previous order on error
      console.error("Reorder failed:", error);
    },
  });

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
        theme: customTheme,
        layout,
        showBranding,
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

  // Add a new link to the bio page
  const addLink = async (linkId: string) => {
    if (!existingPage?.id) {
      alert("Please save the bio page first before adding links.");
      return;
    }

    // Check if link already exists
    if (bioLinks.some((bl) => bl.link?.slug === linkId || bl.id === linkId)) {
      return;
    }

    const link = availableLinks.find((l) => l.id === linkId);
    if (!link) return;

    try {
      const newBioLink = await apiRequest(`/biopages/${existingPage.id}/links`, {
        method: "POST",
        body: JSON.stringify({
          linkId: link.id,
          title: link.title || link.slug,
          description: null,
          order: bioLinks.length,
        }),
      });
      setBioLinks([...bioLinks, newBioLink]);
    } catch (error) {
      console.error("Failed to add link:", error);
      alert("Failed to add link");
    }
  };

  // Remove a link from the bio page
  const handleDeleteLink = async (linkId: string) => {
    if (!existingPage?.id) return;

    try {
      await apiRequest(`/biopages/${existingPage.id}/links/${linkId}`, {
        method: "DELETE",
      });
      setBioLinks(bioLinks.filter((l) => l.id !== linkId));
    } catch (error) {
      console.error("Failed to delete link:", error);
      alert("Failed to delete link");
    }
  };

  // Handle reorder with optimistic update
  const handleReorder = async (orderings: { id: string; order: number }[]) => {
    // Optimistic update
    const reorderedLinks = bioLinks.map((link) => {
      const newOrder = orderings.find((o) => o.id === link.id)?.order ?? link.order;
      return { ...link, order: newOrder };
    });
    setBioLinks(reorderedLinks);

    // Call API in background
    if (existingPage?.id) {
      try {
        await reorderLinks(orderings);
      } catch {
        // Error already logged in hook, revert on failure
        setBioLinks(bioLinks);
      }
    }
  };

  // Open link editor
  const handleEditLink = (link: BioPageLink) => {
    setEditingLink(link);
    setIsEditorOpen(true);
  };

  // Save link edits
  const handleSaveLink = async (updates: Partial<BioPageLink>) => {
    if (!existingPage?.id || !editingLink) return;

    try {
      const updated = await apiRequest(
        `/biopages/${existingPage.id}/links/${editingLink.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates),
        }
      );
      setBioLinks(bioLinks.map((l) => (l.id === editingLink.id ? updated : l)));
    } catch (error) {
      console.error("Failed to update link:", error);
      alert("Failed to update link");
    }
  };

  // Toggle link visibility
  const handleToggleVisibility = async (linkId: string) => {
    const link = bioLinks.find((l) => l.id === linkId);
    if (!link || !existingPage?.id) return;

    const newVisibility = !link.isVisible;

    // Optimistic update
    setBioLinks(bioLinks.map((l) =>
      l.id === linkId ? { ...l, isVisible: newVisibility } : l
    ));

    try {
      await apiRequest(`/biopages/${existingPage.id}/links/${linkId}`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible: newVisibility }),
      });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      // Revert on error
      setBioLinks(bioLinks.map((l) =>
        l.id === linkId ? { ...l, isVisible: !newVisibility } : l
      ));
    }
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
              {existingPage?.id ? (
                <>
                  <div className="flex gap-2">
                    <Select onValueChange={addLink}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add a link..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLinks
                          .filter((link) => !bioLinks.some((bl) => bl.link?.slug === link.slug))
                          .map((link) => (
                            <SelectItem key={link.id} value={link.id}>
                              {link.title || link.slug} ({link.originalUrl})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isReordering && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving order...
                    </div>
                  )}

                  <SortableLinkList
                    links={bioLinks}
                    onReorder={handleReorder}
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                    onToggleVisibility={handleToggleVisibility}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                  Save the bio page first to add and manage links.
                </div>
              )}
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

      {/* Link Style Editor Modal */}
      <LinkStyleEditor
        link={editingLink}
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
      />
    </div>
  );
}
