"use client";

import { useState, useEffect } from "react";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../../../lib/api";

export default function DeveloperSettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const orgId = "mock-org-id"; // In real app, get from context

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
      alert("Failed to create API Key");
    }
  };

  const revokeApiKey = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await apiRequest(`/developer/api-keys/${id}?orgId=${orgId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (err) {
      alert("Failed to revoke API Key");
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
      alert("Failed to create Webhook");
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequest(`/developer/webhooks/${id}?orgId=${orgId}`, {
        method: "DELETE",
      });
      loadData();
    } catch (err) {
      alert("Failed to delete Webhook");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-8">Developer Settings</h1>

        {/* API Keys Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">API Keys</h2>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-medium mb-4">Create New Key</h3>
            <form onSubmit={createApiKey} className="flex gap-4">
              <input
                type="text"
                placeholder="Key Name (e.g. Production App)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 p-2 border rounded"
                required
              />
              <Button>Generate Key</Button>
            </form>

            {createdKey && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
                <p className="font-bold mb-2">New API Key Generated:</p>
                <code className="block bg-white p-2 rounded border border-green-200 font-mono break-all">
                  {createdKey}
                </code>
                <p className="text-sm mt-2">
                  Copy this key now. You won&apos;t be able to see it again!
                </p>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="text-sm underline mt-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Name
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Created
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Last Used
                  </th>
                  <th className="text-right p-4 font-medium text-gray-500">
                    Actions
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
                        : "Never"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => revokeApiKey(key.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No API Keys found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Webhooks Section */}
        <section className="space-y-6 mt-12">
          <h2 className="text-xl font-semibold">Webhooks</h2>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-medium mb-4">Add Endpoint</h3>
            <form onSubmit={createWebhook} className="flex gap-4">
              <input
                type="url"
                placeholder="https://api.yourapp.com/webhooks"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 p-2 border rounded"
                required
              />
              <Button>Add Webhook</Button>
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
                    Events: {hook.events.join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => deleteWebhook(hook.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
            {webhooks.length === 0 && (
              <p className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">
                No webhooks configured.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
