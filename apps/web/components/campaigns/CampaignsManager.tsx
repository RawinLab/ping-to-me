"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@pingtome/ui";
import { Trash2, Plus } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  _count?: {
    links: number;
  };
}

export function CampaignsManager() {
  const t = useTranslations("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await apiRequest("/campaigns");
      setCampaigns(response);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await apiRequest("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          orgId: "default",
        }),
      });
      setNewName("");
      setNewDesc("");
      fetchCampaigns();
    } catch (error) {
      alert(t("failedToCreateCampaign"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteThisCampaign"))) return;
    try {
      await apiRequest(`/campaigns/${id}`, { method: "DELETE" });
      fetchCampaigns();
    } catch (error) {
      alert(t("failedToDeleteCampaign"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">{t("campaignName")}</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Summer Sale"
          />
        </div>
        <div className="grid gap-2 flex-1">
          <label className="text-sm font-medium">{t("description")}</label>
          <Input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("createCampaign")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("campaignName")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("links")}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  {t("noCampaignsYet")}.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.description}</TableCell>
                  <TableCell>{campaign._count?.links || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
