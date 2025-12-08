"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
  Switch,
  Alert,
  Tabs,
  Badge,
  Separator,
} from "@pingtome/ui";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  configureSAML,
  getSAMLConfig,
  updateSAMLStatus,
  deleteSAMLConfig,
  getSPMetadata,
  parseIdPMetadata,
  getSAMLLoginUrl,
  type SAMLConfig,
  type ConfigureSAMLDto,
} from "@/lib/api/sso";

interface SSOConfigCardProps {
  organizationId: string;
  organizationPlan: "FREE" | "PRO" | "ENTERPRISE";
  hasVerifiedDomain: boolean;
}

export function SSOConfigCard({
  organizationId,
  organizationPlan,
  hasVerifiedDomain,
}: SSOConfigCardProps) {
  const [config, setConfig] = useState<SAMLConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [activeTab, setActiveTab] = useState("configure");

  // Form state
  const [formData, setFormData] = useState<ConfigureSAMLDto>({
    name: "SAML SSO",
    entityId: "",
    ssoUrl: "",
    sloUrl: "",
    certificate: "",
    signRequests: false,
    signatureAlgorithm: "sha256",
    nameIdFormat: "emailAddress",
    emailAttribute: "email",
    nameAttribute: "displayName",
  });

  const [spMetadata, setSpMetadata] = useState<{
    spEntityId: string;
    spAcsUrl: string;
    metadataXml: string;
  } | null>(null);

  // Check if user can use SSO
  const canUseSO = organizationPlan === "ENTERPRISE";
  const canEnableSO = canUseSO && hasVerifiedDomain;

  useEffect(() => {
    loadConfig();
  }, [organizationId]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getSAMLConfig(organizationId);
      setConfig(data);
      setFormData({
        name: data.name,
        entityId: data.entityId,
        ssoUrl: data.ssoUrl,
        sloUrl: data.sloUrl || "",
        certificate: "", // Don't load certificate for security
        signRequests: data.signRequests,
        signatureAlgorithm: data.signatureAlgorithm,
        nameIdFormat: data.nameIdFormat,
        emailAttribute: data.emailAttribute,
        nameAttribute: data.nameAttribute || "",
      });
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Failed to load SSO config:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSPMetadata = async () => {
    try {
      const data = await getSPMetadata(organizationId);
      setSpMetadata(data);
    } catch (error: any) {
      toast.error("Failed to load SP metadata");
    }
  };

  const handleSave = async () => {
    if (!formData.entityId || !formData.ssoUrl || !formData.certificate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const data = await configureSAML(organizationId, formData);
      setConfig(data);
      toast.success("SAML SSO configured successfully");
      setActiveTab("metadata");
      await loadSPMetadata();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to configure SAML SSO. Please check your configuration.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!config) return;

    try {
      const newStatus = !config.isEnabled;
      await updateSAMLStatus(organizationId, newStatus);
      setConfig({ ...config, isEnabled: newStatus });
      toast.success(`SSO ${newStatus ? "enabled" : "disabled"} successfully`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update SSO status",
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the SSO configuration?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSAMLConfig(organizationId);
      setConfig(null);
      setFormData({
        name: "SAML SSO",
        entityId: "",
        ssoUrl: "",
        sloUrl: "",
        certificate: "",
        signRequests: false,
        signatureAlgorithm: "sha256",
        nameIdFormat: "emailAddress",
        emailAttribute: "email",
        nameAttribute: "displayName",
      });
      toast.success("SSO configuration deleted successfully");
      setActiveTab("configure");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete SSO configuration");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMetadataUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = await parseIdPMetadata(text);

      setFormData({
        ...formData,
        entityId: parsed.entityId,
        ssoUrl: parsed.ssoUrl,
        sloUrl: parsed.sloUrl || "",
        certificate: parsed.certificate,
      });

      toast.success("IdP metadata parsed successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to parse IdP metadata",
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadMetadataXml = () => {
    if (!spMetadata) return;

    const blob = new Blob([spMetadata.metadataXml], {
      type: "application/xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sp-metadata.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!canUseSO) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">SAML Single Sign-On (SSO)</h2>
          <Badge variant="secondary">Enterprise</Badge>
        </div>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <p className="font-medium">Enterprise Feature</p>
            <p className="text-sm text-gray-600">
              SAML SSO is only available for Enterprise tier. Upgrade your plan
              to enable this feature.
            </p>
          </div>
        </Alert>

        <Button variant="default">Upgrade to Enterprise</Button>
      </Card>
    );
  }

  if (!hasVerifiedDomain) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">SAML Single Sign-On (SSO)</h2>
          <Badge variant="secondary">Enterprise</Badge>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <p className="font-medium">Domain Verification Required</p>
            <p className="text-sm">
              You must verify at least one domain before enabling SSO. Please
              add and verify a domain in your domain settings.
            </p>
          </div>
        </Alert>

        <Button variant="default">Go to Domain Settings</Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">
            SAML Single Sign-On (SSO)
          </h2>
          {config && (
            <Badge
              variant={config.isEnabled ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {config.isEnabled ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Enabled
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Disabled
                </>
              )}
            </Badge>
          )}
        </div>

        {config && (
          <div className="flex items-center gap-2">
            <Label htmlFor="sso-enabled" className="text-sm font-medium">
              Enable SSO
            </Label>
            <Switch
              id="sso-enabled"
              checked={config.isEnabled}
              onCheckedChange={handleToggleStatus}
            />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "configure"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("configure")}
          >
            Configure
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "metadata"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("metadata");
              loadSPMetadata();
            }}
            disabled={!config}
          >
            SP Metadata
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "test"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("test")}
            disabled={!config || !config.isEnabled}
          >
            Test Connection
          </button>
        </div>

        {activeTab === "configure" && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium text-sm">
                  Configure your Identity Provider (IdP)
                </p>
                <p className="text-sm text-gray-600">
                  You can upload your IdP metadata XML file or manually enter
                  the configuration details.
                </p>
              </div>
            </Alert>

            <div>
              <Label htmlFor="metadata-upload" className="mb-2 block">
                Upload IdP Metadata (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="metadata-upload"
                  type="file"
                  accept=".xml,application/xml"
                  onChange={handleMetadataUpload}
                  className="flex-1"
                />
                <Upload className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Upload metadata XML file from your IdP to auto-fill fields
                below
              </p>
            </div>

            <Separator />

            <div>
              <Label htmlFor="sso-name">
                Display Name <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="sso-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="SAML SSO"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="entity-id">
                IdP Entity ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="entity-id"
                value={formData.entityId}
                onChange={(e) =>
                  setFormData({ ...formData, entityId: e.target.value })
                }
                placeholder="https://idp.example.com/metadata"
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                The unique identifier for your IdP (also called Issuer)
              </p>
            </div>

            <div>
              <Label htmlFor="sso-url">
                IdP SSO URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sso-url"
                value={formData.ssoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, ssoUrl: e.target.value })
                }
                placeholder="https://idp.example.com/sso"
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                The URL where users will be redirected for authentication
              </p>
            </div>

            <div>
              <Label htmlFor="slo-url">
                IdP SLO URL <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="slo-url"
                value={formData.sloUrl}
                onChange={(e) =>
                  setFormData({ ...formData, sloUrl: e.target.value })
                }
                placeholder="https://idp.example.com/slo"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Single Logout URL for logging out from IdP
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="certificate">
                  IdP X.509 Certificate <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowCertificate(!showCertificate)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  {showCertificate ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show
                    </>
                  )}
                </button>
              </div>
              <Textarea
                id="certificate"
                value={formData.certificate}
                onChange={(e) =>
                  setFormData({ ...formData, certificate: e.target.value })
                }
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                rows={showCertificate ? 8 : 3}
                required
                className={`mt-1 font-mono text-sm ${!showCertificate ? 'blur-sm select-none' : ''}`}
              />
              <p className="text-sm text-gray-500 mt-1">
                The public certificate from your IdP in PEM format
              </p>
            </div>

            <div>
              <Label htmlFor="email-attr">Email Attribute</Label>
              <Input
                id="email-attr"
                value={formData.emailAttribute}
                onChange={(e) =>
                  setFormData({ ...formData, emailAttribute: e.target.value })
                }
                placeholder="email"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                SAML attribute name containing the user&apos;s email
              </p>
            </div>

            <div>
              <Label htmlFor="name-attr">Name Attribute</Label>
              <Input
                id="name-attr"
                value={formData.nameAttribute}
                onChange={(e) =>
                  setFormData({ ...formData, nameAttribute: e.target.value })
                }
                placeholder="displayName"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                SAML attribute name containing the user&apos;s display name
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="default"
                >
                  {isSaving && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {config ? "Update Configuration" : "Save Configuration"}
                </Button>

                {config && (
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="destructive"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "metadata" && spMetadata && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium text-sm">
                  Service Provider Metadata
                </p>
                <p className="text-sm text-gray-600">
                  Provide this information to your IdP administrator to
                  complete the SSO setup.
                </p>
              </div>
            </Alert>

            <div>
              <Label>SP Entity ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={spMetadata.spEntityId}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(spMetadata.spEntityId)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>SP Assertion Consumer Service (ACS) URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={spMetadata.spAcsUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(spMetadata.spAcsUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>SP Metadata XML</Label>
              <div className="flex items-center gap-2 mt-1">
                <Textarea
                  value={spMetadata.metadataXml}
                  readOnly
                  rows={8}
                  className="flex-1 font-mono text-sm"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(spMetadata.metadataXml)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy XML
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadMetadataXml}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download XML
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "test" && config && config.isEnabled && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium text-sm">Test SSO Connection</p>
                <p className="text-sm text-gray-600">
                  Click the button below to test your SSO configuration. You
                  will be redirected to your IdP for authentication.
                </p>
              </div>
            </Alert>

            <div>
              <Label>SSO Login URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={getSAMLLoginUrl(organizationId)}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(getSAMLLoginUrl(organizationId))
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Users can use this URL to initiate SSO login
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() =>
                  window.open(getSAMLLoginUrl(organizationId), "_blank")
                }
                variant="default"
              >
                Test SSO Login
              </Button>
            </div>
          </div>
        )}
      </Tabs>
    </Card>
  );
}
