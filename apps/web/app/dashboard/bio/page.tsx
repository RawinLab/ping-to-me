"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { BioPageBuilder } from "@/components/bio/BioPageBuilder";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Skeleton,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@pingtome/ui";
import {
  Plus,
  Edit,
  ExternalLink,
  ArrowLeft,
  Eye,
  Link2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function BioPagesDashboard() {
  const { user } = useAuth();
  const [pages, setPages] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

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
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  useEffect(() => {
    if (currentOrgId) {
      fetchPages();
    }
  }, [currentOrgId]);

  const fetchPages = async () => {
    if (!currentOrgId) return;

    try {
      const res = await apiRequest(`/biopages?orgId=${currentOrgId}`);
      setPages(res);
    } catch (error) {
      console.error("Failed to fetch bio pages", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page: any) => {
    setSelectedPage(page);
    setView("edit");
  };

  const handleSuccess = () => {
    setView("list");
    fetchPages();
  };

  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full p-8">
          <Sparkles className="h-16 w-16 text-blue-500" />
        </div>
      </div>
      <h3 className="text-2xl font-semibold mb-2">Create Your First Bio Page</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Build a beautiful link-in-bio page to share all your important links in
        one place.
      </p>
      <Button
        size="lg"
        onClick={() => {
          setSelectedPage(null);
          setView("create");
        }}
        className="gap-2"
      >
        <Plus className="h-5 w-5" />
        Create Your First Page
      </Button>
    </div>
  );

  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Link-in-Bio Pages
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your personal landing pages.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedPage(null);
              setView("create");
            }}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Create Page
          </Button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : pages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <TooltipProvider key={page.id}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] border-2">
                  <CardHeader className="space-y-0 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage
                            src={page.content?.avatar}
                            alt={page.title}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {page.title?.charAt(0)?.toUpperCase() || "B"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold truncate">
                            {page.title}
                          </CardTitle>
                          <CardDescription className="text-xs truncate mt-0.5">
                            /{page.slug}
                          </CardDescription>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/bio/${page.slug}`} target="_blank">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View live page</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Link2 className="h-4 w-4" />
                        <span>
                          {page.content?.links?.length || 0}{" "}
                          {page.content?.links?.length === 1 ? "link" : "links"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{page.viewCount || 0} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={page.isPublished ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {page.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {page.content?.theme && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {page.content.theme}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={() => handleEdit(page)}
                    >
                      <Edit className="h-4 w-4" /> Edit Page
                    </Button>
                  </CardContent>
                </Card>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView("list")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {view === "create" ? "Create Bio Page" : "Edit Bio Page"}
        </h1>
      </div>
      <BioPageBuilder existingPage={selectedPage} onSuccess={handleSuccess} />
    </div>
  );
}
