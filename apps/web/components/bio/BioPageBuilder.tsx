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
} from "@pingtome/ui";
import { Plus, Trash, GripVertical, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentOrgId) {
      alert("No organization found. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        content: { links: selectedLinks },
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
    <div className="grid gap-6 md:grid-cols-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Manage Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                No links added yet. Select links above to add them to your page.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
