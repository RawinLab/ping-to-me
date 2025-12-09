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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@pingtome/ui";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  FileText,
  Link as LinkIcon,
  Palette,
  Settings,
  Smartphone,
  Save,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSelector } from "@/components/bio/ThemeSelector";
import { ColorPicker } from "@/components/bio/ColorPicker";
import { BackgroundPicker } from "@/components/bio/BackgroundPicker";
import { ButtonStyleSelector } from "@/components/bio/ButtonStyleSelector";
import { SortableLinkList } from "@/components/bio/SortableLinkList";
import {
  LinkStyleEditor,
  type BioPageLink,
} from "@/components/bio/LinkStyleEditor";
import { SocialLinksEditor } from "@/components/bio/SocialLinksEditor";
import { LayoutSelector } from "@/components/bio/LayoutSelector";
import { FontSelector } from "@/components/bio/FontSelector";
import { BioPagePreview } from "@/components/bio/BioPagePreview";
import { BioAnalyticsDashboard } from "@/components/bio/BioAnalyticsDashboard";
import { useLinkReorder } from "@/hooks/useLinkReorder";
import type { SocialLink } from "@pingtome/types";
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
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableLinks, setAvailableLinks] = useState<any[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Bio links state (using new BioPageLink model)
  const [bioLinks, setBioLinks] = useState<BioPageLink[]>(
    existingPage?.bioLinks || [],
  );

  // Link editor state
  const [editingLink, setEditingLink] = useState<BioPageLink | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<string>(
    existingPage?.theme?.name || "minimal",
  );
  const [customTheme, setCustomTheme] = useState<BioPageTheme>(
    existingPage?.theme || DEFAULT_THEME,
  );
  const [layout, setLayout] = useState<"stacked" | "grid">(
    existingPage?.layout || "stacked",
  );
  const [showBranding, setShowBranding] = useState<boolean>(
    existingPage?.showBranding ?? true,
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    existingPage?.socialLinks || [],
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
      toast.error("No organization found. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        theme: customTheme,
        layout,
        showBranding,
        socialLinks,
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
      toast.success("Bio Page saved successfully!");
    } catch (error) {
      console.error("Failed to save bio page", error);
      toast.error("Failed to save bio page");
    } finally {
      setLoading(false);
    }
  };

  // Add a new link to the bio page
  const addLink = async (linkId: string) => {
    if (!existingPage?.id) {
      toast.warning("Please save the bio page first before adding links.");
      return;
    }

    // Check if link already exists
    if (bioLinks.some((bl) => bl.link?.slug === linkId || bl.id === linkId)) {
      return;
    }

    const link = availableLinks.find((l) => l.id === linkId);
    if (!link) return;

    try {
      const newBioLink = await apiRequest(
        `/biopages/${existingPage.id}/links`,
        {
          method: "POST",
          body: JSON.stringify({
            linkId: link.id,
            title: link.title || link.slug,
            description: null,
            order: bioLinks.length,
          }),
        },
      );
      setBioLinks([...bioLinks, newBioLink]);
    } catch (error) {
      console.error("Failed to add link:", error);
      toast.error("Failed to add link");
    }
  };

  // Show delete confirmation dialog
  const handleDeleteLink = (linkId: string) => {
    setLinkToDelete(linkId);
    setDeleteDialogOpen(true);
  };

  // Actually delete the link after confirmation
  const confirmDeleteLink = async () => {
    if (!existingPage?.id || !linkToDelete) return;

    try {
      await apiRequest(`/biopages/${existingPage.id}/links/${linkToDelete}`, {
        method: "DELETE",
      });
      setBioLinks(bioLinks.filter((l) => l.id !== linkToDelete));
      toast.success("Link deleted successfully");
    } catch (error) {
      console.error("Failed to delete link:", error);
      toast.error("Failed to delete link");
    } finally {
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  // Handle reorder with optimistic update
  const handleReorder = async (orderings: { id: string; order: number }[]) => {
    // Optimistic update
    const reorderedLinks = bioLinks.map((link) => {
      const newOrder =
        orderings.find((o) => o.id === link.id)?.order ?? link.order;
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
        },
      );
      setBioLinks(bioLinks.map((l) => (l.id === editingLink.id ? updated : l)));
    } catch (error) {
      console.error("Failed to update link:", error);
      toast.error("Failed to update link");
    }
  };

  // Toggle link visibility
  const handleToggleVisibility = async (linkId: string) => {
    const link = bioLinks.find((l) => l.id === linkId);
    if (!link || !existingPage?.id) return;

    const newVisibility = !link.isVisible;

    // Optimistic update
    setBioLinks(
      bioLinks.map((l) =>
        l.id === linkId ? { ...l, isVisible: newVisibility } : l,
      ),
    );

    try {
      await apiRequest(`/biopages/${existingPage.id}/links/${linkId}`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible: newVisibility }),
      });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      // Revert on error
      setBioLinks(
        bioLinks.map((l) =>
          l.id === linkId ? { ...l, isVisible: !newVisibility } : l,
        ),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header with Save Button */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4 -mx-6 px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Bio Page Editor
            </h2>
            <p className="text-sm text-muted-foreground">
              Customize your link-in-bio page with live preview
            </p>
          </div>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading}
            size="lg"
            className="shadow-md"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Layout: Side by Side on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Editor Forms */}
        <div className="space-y-6">
          {/* Page Details Form */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Page Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    Slug
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      pingto.me/bio/
                    </span>
                    <Input
                      id="slug"
                      {...form.register("slug")}
                      placeholder="my-page"
                      disabled={!!existingPage}
                      className="flex-1"
                    />
                  </div>
                  {form.formState.errors.slug && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Page Title
                  </Label>
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
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Check out my latest content..."
                    rows={3}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tabbed Interface for Links, Theme, and Settings */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <Tabs defaultValue="links" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted p-1">
                  <TabsTrigger
                    value="links"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Links</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="theme"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Theme</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    disabled={!existingPage?.id}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                </TabsList>

                {/* Links Tab */}
                <TabsContent value="links" className="space-y-4 mt-0">
                  {existingPage?.id ? (
                    <>
                      <div className="flex gap-2">
                        <Select onValueChange={addLink}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Add a link..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLinks
                              .filter(
                                (link) =>
                                  !bioLinks.some(
                                    (bl) => bl.link?.slug === link.slug,
                                  ),
                              )
                              .map((link) => (
                                <SelectItem key={link.id} value={link.id}>
                                  {link.title || link.slug} ({link.originalUrl})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {isReordering && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
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
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Save the bio page first</p>
                      <p className="text-sm mt-1">
                        Then you can add and manage links
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Theme Tab */}
                <TabsContent value="theme" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Choose a Preset Theme
                      </Label>
                      <ThemeSelector
                        value={selectedTheme}
                        onChange={handleThemeChange}
                      />
                    </div>

                    {selectedTheme === "custom" && (
                      <div className="space-y-6 pt-6 border-t">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <Settings className="h-4 w-4" />
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
                          <Label className="text-sm font-medium">
                            Background
                          </Label>
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

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Font Family
                          </Label>
                          <FontSelector
                            value={customTheme.fontFamily}
                            onChange={(fontFamily) =>
                              handleCustomThemeUpdate({ fontFamily })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    {/* Layout Selector */}
                    <div>
                      <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Layout Options
                      </Label>
                      <LayoutSelector value={layout} onChange={setLayout} />
                    </div>

                    {/* Social Links Editor */}
                    <div className="pt-6 border-t">
                      <SocialLinksEditor
                        socialLinks={socialLinks}
                        onChange={setSocialLinks}
                      />
                    </div>

                    {/* Branding Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="show-branding"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Show PingTO.Me Branding
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Display &quot;Powered by PingTO.Me&quot; at the bottom
                          of your page
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

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4 mt-0">
                  {existingPage?.id ? (
                    <BioAnalyticsDashboard bioPageId={existingPage.id} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Save the bio page first</p>
                      <p className="text-sm mt-1">
                        Analytics will be available after saving
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Preview (Sticky on Desktop) */}
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <CardTitle>Live Preview</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                See your changes in real-time
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <BioPagePreview
                title={form.watch("title") || "Your Name"}
                description={form.watch("description")}
                avatarUrl={existingPage?.avatarUrl}
                theme={customTheme}
                layout={layout}
                bioLinks={bioLinks
                  .filter((link) => link.isVisible !== false)
                  .map((link) => ({
                    id: link.id,
                    title: link.title,
                    description: link.description || undefined,
                    icon: link.icon || undefined,
                    externalUrl: link.link?.originalUrl || undefined,
                  }))}
                socialLinks={socialLinks}
                showBranding={showBranding}
              />
            </CardContent>
          </Card>
        </div>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this link? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLinkToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
