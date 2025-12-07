"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import { Plus, Trash2, Building, Users } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  _count: {
    members: number;
  };
}

interface Member {
  userId: string;
  role: string;
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

export default function OrganizationSettingsPage() {
  const { loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Create org dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");

  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  useEffect(() => {
    // Wait for auth to finish loading before fetching data
    if (authLoading) return;
    fetchOrganizations();
  }, [authLoading]);

  const fetchOrganizations = async () => {
    try {
      const res = await apiRequest("/organizations");
      setOrganizations(res);
      if (res.length > 0) {
        setSelectedOrg(res[0]);
        fetchMembers(res[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    try {
      const res = await apiRequest(`/organizations/${orgId}/members`);
      setMembers(res);
    } catch (error) {
      console.error("Failed to fetch members");
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;

    try {
      const slug = newOrgSlug || newOrgName.toLowerCase().replace(/\s+/g, "-");
      await apiRequest("/organizations", {
        method: "POST",
        body: JSON.stringify({ name: newOrgName, slug }),
      });
      setNewOrgName("");
      setNewOrgSlug("");
      setCreateDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      alert("Failed to create organization");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedOrg) return;

    try {
      await apiRequest(`/organizations/${selectedOrg.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInviteDialogOpen(false);
      fetchMembers(selectedOrg.id);
    } catch (error) {
      alert("Failed to invite member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrg || !confirm("Remove this member?")) return;

    try {
      await apiRequest(`/organizations/${selectedOrg.id}/members/${userId}`, {
        method: "DELETE",
      });
      fetchMembers(selectedOrg.id);
    } catch (error) {
      alert("Failed to remove member");
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!selectedOrg) return;

    try {
      await apiRequest(`/organizations/${selectedOrg.id}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      fetchMembers(selectedOrg.id);
    } catch (error) {
      alert("Failed to update role");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and team members.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="My Company"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug (optional)</Label>
                <Input
                  id="slug"
                  placeholder="my-company"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOrg}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization Selector */}
      {organizations.length > 0 && (
        <div className="flex gap-4">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className={`cursor-pointer transition-all ${selectedOrg?.id === org.id ? "border-primary ring-2 ring-primary" : ""}`}
              onClick={() => {
                setSelectedOrg(org);
                fetchMembers(org.id);
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {org.name}
                </CardTitle>
                <CardDescription>
                  {org._count.members} member(s)
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Team Members */}
      {selectedOrg && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage members of {selectedOrg.name}
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Invite a user to join {selectedOrg.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite}>Send Invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {member.user.name?.[0] || member.user.email[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.name || "No name"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.userId, value)
                        }
                        disabled={member.role === "OWNER"}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "OWNER" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {organizations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No organizations yet</h3>
            <p className="text-muted-foreground mb-4">
              Create an organization to start collaborating with your team.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
