# Billing Components

## UpgradePrompt

A modal dialog that prompts users to upgrade their plan when they hit quota limits.

### Usage

```tsx
import { UpgradePrompt } from '@/components/billing';
import { useQuotaError } from '@/hooks/useQuotaError';

function MyComponent() {
  const { isQuotaError, quotaData, resourceType, clearError } = useQuotaError();

  const handleCreateLink = async () => {
    try {
      await createLink(data);
    } catch (error) {
      // Check if it's a quota error
      if (!handleError(error, 'links')) {
        // Handle other errors
        toast.error('Failed to create link');
      }
    }
  };

  return (
    <>
      <Button onClick={handleCreateLink}>Create Link</Button>
      
      <UpgradePrompt
        open={isQuotaError}
        onOpenChange={clearError}
        resourceType={resourceType as any}
        currentUsage={quotaData?.currentUsage || 0}
        limit={quotaData?.limit || 0}
        currentPlan="free"
      />
    </>
  );
}
```

### Props

- `open` (boolean): Controls dialog visibility
- `onOpenChange` (function): Callback when dialog state changes
- `resourceType` ("links" | "domains" | "members" | "api_calls"): Type of resource that hit the limit
- `currentUsage` (number): Current usage count
- `limit` (number): Maximum allowed by current plan
- `currentPlan` (string, optional): Current plan name (default: "free")

## useQuotaError Hook

A React hook for handling quota exceeded errors from the API.

### Returns

- `isQuotaError` (boolean): True if a quota error has occurred
- `quotaData` (QuotaError | null): Details about the quota error
- `resourceType` (string): Type of resource that hit the limit
- `handleError` (function): Check if an error is a quota error
- `clearError` (function): Clear the current quota error state

### Example

```tsx
const { isQuotaError, quotaData, handleError, clearError } = useQuotaError();

try {
  await apiCall();
} catch (error) {
  if (handleError(error, 'domains')) {
    // Quota error handled, show upgrade prompt
  } else {
    // Handle other errors
  }
}
```
