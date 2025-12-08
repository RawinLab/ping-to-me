# Email Verification - Quick Start

## 🚀 Protect an Endpoint (3 Steps)

```typescript
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EmailVerifiedGuard } from "./auth/guards/email-verified.guard";
import { RequireEmailVerification } from "./auth/decorators";

@Controller("api")
export class YourController {
  @Get("protected")
  @UseGuards(AuthGuard("jwt"), EmailVerifiedGuard)  // ← Step 1: Add guards
  @RequireEmailVerification()                       // ← Step 2: Add decorator
  async protectedRoute() {                          // ← Step 3: Your handler
    return { data: "protected" };
  }
}
```

## 📱 Add Banner to Frontend (1 Step)

```tsx
// app/dashboard/layout.tsx
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

export default function DashboardLayout({ children }) {
  return (
    <>
      <EmailVerificationBanner />  {/* ← Add this line */}
      {children}
    </>
  );
}
```

## 📡 API Endpoint

### POST /auth/resend-verification
- **Auth**: Required (JWT)
- **Rate Limit**: 1 request per 2 minutes
- **Returns**: `{ message: "Verification email sent successfully" }`

## ⚡ That's It!

You're done. The system will:
- ✅ Block unverified users from protected endpoints (403)
- ✅ Show banner to unverified users
- ✅ Let them resend verification emails
- ✅ Log all events for audit

## 📖 Full Documentation

- **Usage Guide**: `/apps/api/src/auth/EMAIL_VERIFICATION_USAGE.md`
- **Implementation Details**: `/TASK_1.1.8_EMAIL_VERIFICATION_IMPLEMENTATION.md`
- **Summary**: `/TASK_1.1.8_SUMMARY.md`
