"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { BioPageBuilder } from "@/components/bio/BioPageBuilder";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@pingtome/ui";
import { Plus, Edit, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BioPagesDashboard() {
  const [pages, setPages] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      // TODO: Handle orgId properly
      const res = await apiRequest("/biopages?orgId=default");
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

  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Link-in-Bio Pages
            </h1>
            <p className="text-muted-foreground">
              Create and manage your personal landing pages.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedPage(null);
              setView("create");
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Page
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {page.title}
                </CardTitle>
                <Link href={`/bio/${page.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">/{page.slug}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {page.content?.links?.length || 0} links
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleEdit(page)}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pages.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
              No pages found. Create your first Link-in-Bio page!
            </div>
          )}
        </div>
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
