"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@pingtome/ui";
import { Input } from "@pingtome/ui";
import { Label } from "@pingtome/ui";
import { Alert, AlertDescription } from "@pingtome/ui";
import { apiRequest } from "@/lib/api";
import { CreateLinkDto, LinkResponse } from "@pingtome/types";

const createLinkSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  slug: z.string().optional(),
  title: z.string().optional(),
  tags: z.string().optional(), // Comma separated
  expirationDate: z.string().optional(),
  password: z.string().optional(),
});

type CreateLinkFormData = z.infer<typeof createLinkSchema>;

export function CreateLinkForm({
  onSuccess,
}: {
  onSuccess?: (link: LinkResponse) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
  });

  const onSubmit = async (data: CreateLinkFormData) => {
    setLoading(true);
    setError(null);

    try {
      const payload: CreateLinkDto = {
        originalUrl: data.originalUrl,
        slug: data.slug || undefined,
        title: data.title || undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : undefined,
        expirationDate: data.expirationDate || undefined,
        password: data.password || undefined,
      };

      const link = await apiRequest<LinkResponse>("POST", "/links", payload);
      reset();
      if (onSuccess) onSuccess(link);
    } catch (err: any) {
      setError(err.message || "Failed to create link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="originalUrl">Destination URL</Label>
        <Input
          id="originalUrl"
          placeholder="https://example.com/long-url"
          {...register("originalUrl")}
        />
        {errors.originalUrl && (
          <p className="text-sm text-red-500">{errors.originalUrl.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slug">Custom Slug (Optional)</Label>
          <Input id="slug" placeholder="my-link" {...register("slug")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title (Optional)</Label>
          <Input
            id="title"
            placeholder="My Awesome Link"
            {...register("title")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Comma separated)</Label>
        <Input
          id="tags"
          placeholder="marketing, social"
          {...register("tags")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Expiration Date</Label>
          <Input
            type="datetime-local"
            id="expirationDate"
            {...register("expirationDate")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password (Optional)</Label>
          <Input type="password" id="password" {...register("password")} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Short Link"}
      </Button>
    </form>
  );
}
