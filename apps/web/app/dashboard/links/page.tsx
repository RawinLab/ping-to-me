"use client";

import { LinksTable } from "@/components/links/LinksTable";
import { Button } from "@pingtome/ui";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function LinksPage() {
  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Links</h1>
          <p className="text-muted-foreground">Manage your shortened URLs.</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Link
          </Button>
        </Link>
      </div>

      <LinksTable />
    </div>
  );
}
