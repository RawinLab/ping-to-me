"use client";

import { useState, useEffect } from "react";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../../lib/api";
import { InviteMemberModal } from "../../../components/InviteMemberModal";

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const orgId = "mock-org-id"; // In real app, get from context/params

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await apiRequest(`/organizations/${orgId}/members`);
      setMembers(res);
    } catch (err) {
      console.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await apiRequest(`/organizations/${orgId}/members/${userId}`, {
        method: "DELETE",
      });
      loadMembers();
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiRequest(`/organizations/${orgId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      loadMembers();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Team Settings</h1>
        <Button onClick={() => setInviteModalOpen(true)}>Invite Member</Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-500">User</th>
              <th className="text-left p-4 font-medium text-gray-500">Role</th>
              <th className="text-right p-4 font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.userId}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {member.user.name?.[0] ||
                        member.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.userId, e.target.value)
                    }
                    className="p-1 border rounded text-sm"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={loadMembers}
        orgId={orgId}
      />
    </div>
  );
}
