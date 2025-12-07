# SSL Service Documentation

## Overview

The SSL Service provides automated SSL/TLS certificate management for custom domains in the PingTO.Me platform. This is a **MOCK IMPLEMENTATION** designed for development and testing. In production, this would integrate with Let's Encrypt via the ACME protocol.

## Architecture

### Components

- **SslService** - Core service handling certificate provisioning and renewal
- **SSL Endpoints** - REST API endpoints for SSL management
- **Cron Jobs** - Automated certificate renewal and expiration checks
- **Audit Logging** - Complete audit trail for all SSL operations

### Database Schema

The `Domain` model includes the following SSL-related fields:

```prisma
model Domain {
  // SSL fields
  sslStatus            SslStatus    @default(PENDING)
  sslProvider          String?      // e.g., 'letsencrypt'
  sslCertificateId     String?
  sslIssuedAt          DateTime?
  sslExpiresAt         DateTime?
  sslAutoRenew         Boolean      @default(true)
}

enum SslStatus {
  PENDING       // No certificate yet
  PROVISIONING  // Certificate being provisioned
  ACTIVE        // Certificate active and valid
  EXPIRED       // Certificate has expired
  FAILED        // Provisioning/renewal failed
}
```

## API Endpoints

### POST /domains/:id/ssl

Provision an SSL certificate for a domain.

**Requirements:**
- Domain must be verified (`status = VERIFIED`)
- User must have `domain:update` permission

**Request:**
```http
POST /domains/abc-123/ssl
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "status": "ACTIVE",
  "certificateId": "cert_uuid",
  "issuedAt": "2025-12-08T10:00:00Z",
  "expiresAt": "2026-03-08T10:00:00Z"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Domain must be verified before SSL can be provisioned"
}
```

### GET /domains/:id/ssl

Get SSL certificate status for a domain.

**Request:**
```http
GET /domains/abc-123/ssl
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "ACTIVE",
  "provider": "letsencrypt-mock",
  "certificateId": "cert_uuid",
  "issuedAt": "2025-12-08T10:00:00Z",
  "expiresAt": "2026-03-08T10:00:00Z",
  "autoRenew": true,
  "daysUntilExpiry": 75
}
```

### PATCH /domains/:id/ssl

Update SSL settings (e.g., toggle auto-renewal).

**Request:**
```http
PATCH /domains/abc-123/ssl
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoRenew": false
}
```

**Response:**
```json
{
  "status": "ACTIVE",
  "provider": "letsencrypt-mock",
  "certificateId": "cert_uuid",
  "issuedAt": "2025-12-08T10:00:00Z",
  "expiresAt": "2026-03-08T10:00:00Z",
  "autoRenew": false,
  "daysUntilExpiry": 75
}
```

## Service Methods

### provisionCertificate(domainId: string, userId: string)

Provisions a new SSL certificate for a domain.

**Current (Mock) Implementation:**
- Generates a mock certificate ID
- Sets expiry to 90 days from issuance
- Updates domain with certificate metadata

**Production Implementation Requirements:**
- Use ACME client (e.g., `acme-client` npm package)
- Implement HTTP-01 or DNS-01 challenge
- Store private key securely (e.g., AWS Secrets Manager, HashiCorp Vault)
- Install certificate on edge servers/CDN
- Validate certificate chain

### getCertificateStatus(domainId: string)

Returns the current SSL certificate status and metadata.

### setAutoRenew(domainId: string, autoRenew: boolean, userId: string)

Enables or disables automatic certificate renewal.

### renewExpiringCertificates()

Checks for certificates expiring within 30 days and renews them.

**Triggered by:** Daily cron job at 2:00 AM

**Process:**
1. Query domains with `sslExpiresAt < now + 30 days`
2. Filter for `sslAutoRenew = true`
3. Provision new certificate for each domain
4. Update domain with new certificate metadata
5. Log renewal in audit log

### markExpiredCertificates()

Marks certificates that have passed their expiration date as EXPIRED.

**Triggered by:** Daily cron job at 2:00 AM

## Automated Jobs

### Daily Certificate Renewal

**Schedule:** Every day at 2:00 AM (configurable via `CronExpression`)

**Actions:**
1. Mark expired certificates (`markExpiredCertificates()`)
2. Renew expiring certificates (`renewExpiringCertificates()`)

**Logging:** All operations logged to console and audit log

## Audit Logging

All SSL operations are logged with the action `domain.ssl_updated`:

**Provisioning:**
```json
{
  "action": "domain.ssl_updated",
  "resource": "Domain",
  "resourceId": "domain-id",
  "details": {
    "hostname": "example.com",
    "action": "provision",
    "provider": "letsencrypt-mock",
    "certificateId": "cert_uuid",
    "expiresAt": "2026-03-08T10:00:00Z"
  }
}
```

**Auto-Renewal:**
```json
{
  "userId": "system",
  "action": "domain.ssl_updated",
  "details": {
    "action": "auto_renew",
    "provider": "letsencrypt-mock",
    "certificateId": "cert_new",
    "previousCertificateId": "cert_old"
  }
}
```

**Auto-Renew Toggle:**
```json
{
  "action": "domain.ssl_updated",
  "details": {
    "action": "auto_renew_changed",
    "autoRenew": true
  }
}
```

## Security Considerations

### Current Implementation (Mock)

- No actual certificates or private keys are generated
- No external API calls to certificate authorities
- Certificate IDs are UUIDs (not real certificate identifiers)

### Production Implementation Requirements

1. **Private Key Storage:**
   - Never store private keys in the database
   - Use secure key management (AWS KMS, HashiCorp Vault)
   - Encrypt keys at rest and in transit

2. **Certificate Storage:**
   - Store certificates in secure, encrypted storage
   - Implement access controls
   - Maintain certificate chain

3. **ACME Protocol:**
   - Implement proper ACME challenge handling
   - Validate domain ownership before issuance
   - Handle rate limits from Let's Encrypt

4. **Monitoring:**
   - Alert on failed renewals
   - Monitor certificate expiration dates
   - Track renewal success rates

## Production Migration Guide

### Required Changes

1. **Install Dependencies:**
```bash
pnpm add acme-client @aws-sdk/client-secrets-manager
```

2. **Update SslService:**

```typescript
import * as acme from 'acme-client';

@Injectable()
export class SslService {
  private acmeClient: acme.Client;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private secretsManager: SecretsManagerClient, // AWS Secrets Manager
  ) {
    // Initialize ACME client
    this.acmeClient = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production,
      accountKey: await this.getAccountKey(),
    });
  }

  async provisionCertificate(domainId: string, userId: string) {
    // 1. Create CSR (Certificate Signing Request)
    const [key, csr] = await acme.crypto.createCsr({
      commonName: domain.hostname,
    });

    // 2. Get authorization and challenges
    const order = await this.acmeClient.createOrder({
      identifiers: [{ type: 'dns', value: domain.hostname }],
    });

    // 3. Complete HTTP-01 or DNS-01 challenge
    // (Implementation depends on your infrastructure)

    // 4. Finalize order and get certificate
    const cert = await this.acmeClient.finalizeOrder(order, csr);

    // 5. Store certificate and private key securely
    await this.storeSecurely(domain.hostname, cert, key);

    // 6. Deploy certificate to edge servers/CDN
    await this.deployCertificate(domain.hostname, cert);

    // 7. Update database
    // ...
  }
}
```

3. **Environment Variables:**

```env
# Let's Encrypt
ACME_DIRECTORY_URL=https://acme-v02.api.letsencrypt.org/directory
ACME_ACCOUNT_EMAIL=admin@pingtome.com

# Certificate Storage
AWS_SECRETS_MANAGER_REGION=us-east-1
CERTIFICATE_BUCKET=pingtome-ssl-certs
```

4. **Infrastructure:**
   - Set up HTTP-01 challenge endpoint (e.g., `/.well-known/acme-challenge/`)
   - Or configure DNS provider API for DNS-01 challenge
   - Deploy certificates to edge servers (Cloudflare, CloudFront, etc.)

## Testing

### Unit Tests

```bash
pnpm --filter api test ssl.service.spec.ts
```

### E2E Tests

```bash
pnpm --filter api test:e2e ssl.e2e.spec.ts
```

### Manual Testing

1. **Create and verify a domain:**
```bash
curl -X POST http://localhost:3001/domains \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hostname": "test.example.com", "orgId": "org-123"}'

curl -X POST http://localhost:3001/domains/{id}/verify \
  -H "Authorization: Bearer $TOKEN"
```

2. **Provision SSL:**
```bash
curl -X POST http://localhost:3001/domains/{id}/ssl \
  -H "Authorization: Bearer $TOKEN"
```

3. **Check SSL status:**
```bash
curl -X GET http://localhost:3001/domains/{id}/ssl \
  -H "Authorization: Bearer $TOKEN"
```

4. **Toggle auto-renewal:**
```bash
curl -X PATCH http://localhost:3001/domains/{id}/ssl \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"autoRenew": false}'
```

## Troubleshooting

### Certificate Provisioning Fails

**Symptom:** Domain status changes to `FAILED`

**Possible Causes:**
- Domain not verified
- DNS not pointing to correct servers
- ACME challenge failed
- Rate limit exceeded (production)

**Solution:**
1. Check domain verification status
2. Verify DNS records
3. Check audit logs for error details

### Auto-Renewal Not Working

**Symptom:** Certificates expire without being renewed

**Possible Causes:**
- `sslAutoRenew` set to `false`
- Cron job not running
- Renewal threshold not met (< 30 days)

**Solution:**
1. Verify `sslAutoRenew = true`
2. Check cron job logs
3. Manually trigger renewal if needed

## Future Enhancements

- [ ] Support for wildcard certificates
- [ ] Multiple certificate authorities (ZeroSSL, Buypass)
- [ ] Certificate transparency monitoring
- [ ] OCSP stapling
- [ ] Certificate pinning
- [ ] Custom certificate upload (Enterprise plan)
- [ ] Email notifications for expiring certificates
- [ ] Slack/Discord webhook notifications
- [ ] Certificate health dashboard

## References

- [ACME Protocol (RFC 8555)](https://datatracker.ietf.org/doc/html/rfc8555)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [acme-client NPM Package](https://www.npmjs.com/package/acme-client)
- [SSL/TLS Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
