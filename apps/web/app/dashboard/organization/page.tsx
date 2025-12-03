"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@pingtome/ui";
import { TagsManager } from "@/components/tags/TagsManager";
import { CampaignsManager } from "@/components/campaigns/CampaignsManager";

export default function OrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <p className="text-muted-foreground">
          Manage your tags and campaigns to organize your links.
        </p>
      </div>

      <Tabs defaultValue="tags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="tags" className="space-y-4">
          <TagsManager />
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
