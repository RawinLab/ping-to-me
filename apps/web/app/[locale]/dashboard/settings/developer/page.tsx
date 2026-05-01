"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@pingtome/ui";
import { apiRequest } from "@/lib/api";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function DeveloperSettingsPage() {
  const t = useTranslations("settings.developer");
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id || "";

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  const loadData = async () => {
    if (!orgId) return;
    try {
      const [keysRes, hooksRes] = await Promise.all([
        apiRequest(`/developer/api-keys?orgId=${orgId}`),
        apiRequest(`/developer/webhooks?orgId=${orgId}`),
      ]);
      setApiKeys(keysRes);
      setWebhooks(hooksRes);
    } catch (err) {
      console.error("Failed to load developer settings");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest("/developer/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName, orgId }),
      });
      setCreatedKey(res.key);
      setNewKeyName("");
      loadData();
    } catch (err) {
      alert(t("createFailed"));
    }
  };

  const revokeApiKey = async (id: string) => {
    if (!confirm(t("revokeConfirm"))) return;
    try {
      await apiRequest(`/developer/api-keys/${id}?orgId=${orgId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (err) {
      alert(t("revokeFailed"));
    }
  };

  const createWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/developer/webhooks", {
        method: "POST",
        body: JSON.stringify({
          url: webhookUrl,
          events: ["link.created", "link.clicked"],
          orgId,
        }),
      });
      setWebhookUrl("");
      loadData();
    } catch (err) {
      alert(t("createWebhookFailed"));
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await apiRequest(`/developer/webhooks/${id}?orgId=${orgId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (err) {
      alert(t("deleteWebhookFailed"));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold">{t("apiKeys")}</h2>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-medium mb-4">{t("createNewKey")}</h3>
            <form onSubmit={createApiKey} className="flex gap-4">
              <input
                type="text"
                placeholder={t("keyNamePlaceholder")}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 p-2 border rounded"
                required
              />
              <Button>{t("generateKey")}</Button>
            </form>

            {createdKey && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
                <p className="font-bold mb-2">{t("newKeyGenerated")}</p>
                <code className="block bg-white p-2 rounded border border-green-200 font-mono break-all">
                  {createdKey}
                </code>
                <p className="text-sm mt-2">
                  {t("copyWarning")}
                </p>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="text-sm underline mt-2"
                >
                  {t("close")}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">
                    {t("name")}
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    {t("created")}
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    {t("lastUsed")}
                  </th>
                  <th className="text-right p-4 font-medium text-gray-500">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="p-4 font-medium">{key.name}</td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : t("never")}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => revokeApiKey(key.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {t("revoke")}
                      </button>
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      {t("noApiKeys")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6 mt-12">
          <h2 className="text-xl font-semibold">{t("webhooks")}</h2>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-medium mb-4">{t("addEndpoint")}</h3>
            <form onSubmit={createWebhook} className="flex gap-4">
              <input
                type="url"
                placeholder={t("webhookPlaceholder")}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 p-2 border rounded"
                required
              />
              <Button>{t("addWebhook")}</Button>
            </form>
          </div>

          <div className="space-y-4">
            {webhooks.map((hook) => (
              <div
                key={hook.id}
                className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center"
              >
                <div>
                  <p className="font-medium font-mono text-sm">{hook.url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("events")} {hook.events.join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => deleteWebhook(hook.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  {t("deleteWebhook")}
                </button>
              </div>
            ))}
            {webhooks.length === 0 && (
              <p className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">
                {t("noWebhooks")}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
