import { api } from "../api";

export interface SAMLConfig {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  spEntityId?: string;
  spAcsUrl?: string;
  signRequests: boolean;
  signatureAlgorithm: string;
  nameIdFormat: string;
  emailAttribute: string;
  nameAttribute?: string;
  isEnabled: boolean;
  hasCertificate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigureSAMLDto {
  name?: string;
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  signRequests?: boolean;
  signatureAlgorithm?: string;
  nameIdFormat?: string;
  emailAttribute?: string;
  nameAttribute?: string;
}

export interface SAMLMetadata {
  spEntityId: string;
  spAcsUrl: string;
  metadataXml: string;
}

export interface ParsedIdPMetadata {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
}

export async function configureSAML(
  organizationId: string,
  data: ConfigureSAMLDto,
): Promise<SAMLConfig> {
  const response = await api.post(
    `/auth/sso/saml/configure/${organizationId}`,
    data,
  );
  return response.data;
}

export async function getSAMLConfig(
  organizationId: string,
): Promise<SAMLConfig> {
  const response = await api.get(`/auth/sso/saml/config/${organizationId}`);
  return response.data;
}

export async function updateSAMLStatus(
  organizationId: string,
  isEnabled: boolean,
): Promise<SAMLConfig> {
  const response = await api.post(`/auth/sso/saml/status/${organizationId}`, {
    isEnabled,
  });
  return response.data;
}

export async function deleteSAMLConfig(
  organizationId: string,
): Promise<{ message: string }> {
  const response = await api.delete(
    `/auth/sso/saml/config/${organizationId}`,
  );
  return response.data;
}

export async function getSPMetadata(
  organizationId: string,
): Promise<SAMLMetadata> {
  const response = await api.get(
    `/auth/sso/saml/metadata-info/${organizationId}`,
  );
  return response.data;
}

export async function parseIdPMetadata(
  metadataXml: string,
): Promise<ParsedIdPMetadata> {
  const response = await api.post(`/auth/sso/saml/parse-metadata`, {
    metadataXml,
  });
  return response.data;
}

export function getSAMLLoginUrl(organizationId: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return `${apiUrl}/auth/sso/saml/login/${organizationId}`;
}
