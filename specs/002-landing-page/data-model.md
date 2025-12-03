# Data Model: Landing Page

**Feature**: Landing Page
**Status**: Draft

## Entities

### PricingPlan (Frontend Only)

Represents a subscription tier displayed on the pricing page.

| Field         | Type       | Description                               |
| ------------- | ---------- | ----------------------------------------- |
| `id`          | `string`   | Unique identifier (e.g., 'free', 'pro')   |
| `name`        | `string`   | Display name (e.g., 'Free', 'Pro')        |
| `price`       | `string`   | Display price (e.g., '$0', '$12')         |
| `period`      | `string`   | Billing period (e.g., '/month')           |
| `description` | `string`   | Short description of the plan             |
| `features`    | `string[]` | List of features included                 |
| `cta`         | `string`   | Call to action text (e.g., 'Get Started') |
| `popular`     | `boolean`  | Whether to highlight as popular           |

## TypeScript Interfaces

```typescript
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}
```
