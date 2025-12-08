# Email Verification Enforcement - Usage Guide

## Quick Start

### 1. Protecting a Single Endpoint

```typescript
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EmailVerifiedGuard } from "./auth/guards/email-verified.guard";
import { RequireEmailVerification } from "./auth/decorators";

@Controller("api")
export class ApiController {
  @Get("premium-feature")
  @UseGuards(AuthGuard("jwt"), EmailVerifiedGuard)
  @RequireEmailVerification() // This makes verification mandatory
  async getPremiumFeature() {
    return { data: "premium content" };
  }

  @Get("public-feature")
  @UseGuards(AuthGuard("jwt"))
  // No @RequireEmailVerification() - verification not required
  async getPublicFeature() {
    return { data: "public content" };
  }
}
```

### 2. Protecting All Endpoints in a Controller

```typescript
import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EmailVerifiedGuard } from "./auth/guards/email-verified.guard";
import { RequireEmailVerification } from "./auth/decorators";

@Controller("sensitive")
@UseGuards(AuthGuard("jwt"), EmailVerifiedGuard)
@RequireEmailVerification() // Applies to all routes in this controller
export class SensitiveController {
  @Get("data")
  async getData() {
    // Automatically protected
    return { data: "sensitive" };
  }

  @Post("update")
  async updateData() {
    // Also protected
    return { updated: true };
  }
}
```

### 3. Making Global with Exceptions

You can make email verification required globally and then opt-out specific routes:

```typescript
// app.module.ts
import { APP_GUARD } from "@nestjs/core";
import { EmailVerifiedGuard } from "./auth/guards/email-verified.guard";

@Module({
  providers: [
    // If you add this, ALL routes with @RequireEmailVerification() will enforce
    // But this is optional - not enabled by default
    {
      provide: APP_GUARD,
      useClass: EmailVerifiedGuard,
    },
  ],
})
export class AppModule {}
```

## Response Formats

### Success Response
When email is verified or verification not required, the endpoint returns normally.

### Error Response (403 Forbidden)
When email is not verified on a protected route:

```json
{
  "statusCode": 403,
  "message": "Email verification required",
  "error": "Forbidden"
}
```

## Frontend Integration

### Using the Banner Component

```tsx
// app/dashboard/layout.tsx
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

export default function DashboardLayout({ children }) {
  return (
    <div>
      <EmailVerificationBanner />
      <main>{children}</main>
    </div>
  );
}
```

### Handling 403 Errors

```typescript
// In your API client
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const message = error.response?.data?.message;
      if (message === "Email verification required") {
        // Show verification banner or redirect to verification page
        showVerificationPrompt();
      }
    }
    return Promise.reject(error);
  }
);
```

## Best Practices

### 1. Use on Sensitive Features
Apply email verification to:
- Payment/billing endpoints
- Data export features
- Account deletion
- Team invitations
- API key generation
- Custom domain setup

### 2. Don't Use on Public Features
Don't require verification for:
- Profile viewing
- Dashboard access
- Link creation (basic features)
- Settings viewing

### 3. Clear User Communication
Always provide clear feedback:
```typescript
@Get("export")
@UseGuards(AuthGuard("jwt"), EmailVerifiedGuard)
@RequireEmailVerification()
async exportData(@Req() req) {
  // This will automatically return 403 if not verified
  // The banner on frontend will guide the user
  return this.dataService.export(req.user.id);
}
```

## Complete Example

```typescript
// payment.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EmailVerifiedGuard } from "../auth/guards/email-verified.guard";
import { RequireEmailVerification } from "../auth/decorators";
import { PaymentService } from "./payment.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Controller("payments")
@UseGuards(AuthGuard("jwt"))
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard)
  @RequireEmailVerification() // Payment requires verified email
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Req() req,
  ) {
    return this.paymentService.create(req.user.id, dto);
  }

  @Get("history")
  // No verification required to view payment history
  async getHistory(@Req() req) {
    return this.paymentService.getHistory(req.user.id);
  }
}
```

## Testing Your Protected Endpoints

### 1. Test Without Verification

```bash
# Login as unverified user
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}' \
  | jq -r '.accessToken')

# Try to access protected route (should fail)
curl -X GET http://localhost:3001/api/premium-feature \
  -H "Authorization: Bearer $TOKEN"

# Expected: 403 Forbidden
```

### 2. Test With Verification

```bash
# Verify email first
curl -X POST http://localhost:3001/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_VERIFICATION_TOKEN"}'

# Now access protected route (should succeed)
curl -X GET http://localhost:3001/api/premium-feature \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with data
```

## Troubleshooting

### Issue: Guard not working
**Solution**: Make sure you're using both the guard AND the decorator:
```typescript
@UseGuards(AuthGuard("jwt"), EmailVerifiedGuard) // Guard
@RequireEmailVerification() // Decorator - DON'T FORGET THIS!
```

### Issue: All routes are blocked
**Solution**: The decorator is applied at controller level. Remove it if you only want specific routes protected.

### Issue: Banner not showing
**Solution**: Check that:
1. User is authenticated
2. User's `emailVerified` field is null/false
3. Banner component is rendered in layout
4. AuthContext is properly set up

## Migration Checklist

If adding to existing endpoints:

- [ ] Identify sensitive endpoints that need verification
- [ ] Add `@UseGuards(EmailVerifiedGuard)` to those endpoints
- [ ] Add `@RequireEmailVerification()` decorator
- [ ] Test with unverified account (should get 403)
- [ ] Test with verified account (should work normally)
- [ ] Add EmailVerificationBanner to relevant pages
- [ ] Update API documentation
- [ ] Communicate change to users

## Related Files

- Guard: `/apps/api/src/auth/guards/email-verified.guard.ts`
- Decorator: `/apps/api/src/auth/decorators/require-email-verification.decorator.ts`
- Banner: `/apps/web/components/EmailVerificationBanner.tsx`
- Resend Endpoint: `/apps/api/src/auth/auth.controller.ts` (line 250)
