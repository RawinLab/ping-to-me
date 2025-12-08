# Real-time Analytics WebSocket Implementation

## Overview

This module provides real-time analytics updates via WebSocket connections. It allows clients to subscribe to live click events for specific links or all links in their dashboard.

## Architecture

### Backend Components

1. **AnalyticsGateway** (`analytics.gateway.ts`)
   - WebSocket server handling connections on `/analytics` namespace
   - JWT-based authentication
   - Room-based subscriptions (link-specific or dashboard-wide)
   - Event emission for click events

2. **RealtimeModule** (`realtime.module.ts`)
   - NestJS module bundling the gateway and dependencies
   - JWT configuration for token verification

3. **AnalyticsService** (updated)
   - Emits WebSocket events when new clicks are tracked
   - Non-blocking event emission (doesn't fail the request if WebSocket fails)

### Frontend Components

1. **useAnalyticsSocket** (`hooks/useAnalyticsSocket.ts`)
   - React hook for managing WebSocket connections
   - Auto-reconnection support
   - Subscription management
   - Live click tracking

2. **LiveClickCounter** (`components/dashboard/LiveClickCounter.tsx`)
   - Full-featured live activity feed
   - Shows recent clicks with country, device, browser info
   - Pulse animation for new clicks

3. **LiveClickIndicator** (`components/dashboard/LiveClickCounter.tsx`)
   - Compact live status indicator
   - Shows connection status and live click count
   - Suitable for headers/toolbars

## WebSocket Protocol

### Connection

**Endpoint:** `ws://localhost:3001/analytics`

**Authentication:**
- Pass JWT token in query parameters: `?token=<jwt_token>`
- Token is verified on connection
- Connection is rejected if token is invalid

**Events on Connection:**
```typescript
// Server -> Client
{
  "event": "connected",
  "data": {
    "message": "Connected to analytics stream",
    "userId": "user-id"
  }
}
```

### Subscriptions

#### Subscribe to Specific Link

```typescript
// Client -> Server
socket.emit('subscribe:link', linkId)

// Server -> Client (confirmation)
{
  "event": "subscribed",
  "data": {
    "type": "link",
    "linkId": "link-id",
    "message": "Subscribed to link {linkId}"
  }
}
```

#### Subscribe to Dashboard (All User Links)

```typescript
// Client -> Server
socket.emit('subscribe:dashboard', 'me')

// Server -> Client (confirmation)
{
  "event": "subscribed",
  "data": {
    "type": "dashboard",
    "message": "Subscribed to dashboard analytics"
  }
}
```

#### Unsubscribe

```typescript
// Unsubscribe from link
socket.emit('unsubscribe:link', linkId)

// Unsubscribe from dashboard
socket.emit('unsubscribe:dashboard')
```

### Live Events

#### Click Event

```typescript
// Server -> Client
{
  "event": "click",
  "data": {
    "linkId": "link-id",
    "timestamp": "2025-12-08T12:00:00.000Z",
    "country": "United States",
    "city": "New York",
    "device": "Mobile",
    "browser": "Chrome",
    "os": "iOS",
    "referrer": "https://twitter.com",
    "source": "DIRECT"
  }
}
```

#### Dashboard Update (Optional)

```typescript
// Server -> Client
{
  "event": "dashboard:update",
  "data": {
    // Dashboard metrics
  }
}
```

## Usage Examples

### Backend: Emit Click Event

```typescript
// In analytics.service.ts
const clickEvent = await this.prisma.clickEvent.create({ ... });

if (this.analyticsGateway) {
  this.analyticsGateway.emitClickEvent(link.id, link.userId, {
    linkId: link.id,
    timestamp: clickTimestamp,
    country: data.country,
    device,
    browser,
    os,
    referrer: data.referrer,
    source: data.source,
  });
}
```

### Frontend: Use WebSocket Hook

```typescript
import { useAnalyticsSocket } from '@/hooks/useAnalyticsSocket';

// For specific link
const { isConnected, liveClicks, clickCount } = useAnalyticsSocket({
  linkId: 'link-id',
  enabled: true
});

// For dashboard (all links)
const { isConnected, liveClicks, clickCount } = useAnalyticsSocket({
  dashboard: true,
  enabled: true
});
```

### Frontend: Display Live Counter

```tsx
import { LiveClickCounter } from '@/components/dashboard/LiveClickCounter';

// Full activity feed
<LiveClickCounter dashboard={true} showFeed={true} />

// Compact indicator
import { LiveClickIndicator } from '@/components/dashboard/LiveClickCounter';

<LiveClickIndicator linkId={linkId} />
```

## Security Considerations

1. **Authentication**
   - All connections require valid JWT token
   - Token is verified on connection and invalid tokens are rejected
   - User ID is extracted from token and stored in socket data

2. **Authorization**
   - Users can only subscribe to their own links
   - Link ownership is enforced by room naming convention
   - No cross-user data leakage

3. **Rate Limiting**
   - Socket.IO built-in reconnection backoff
   - Consider adding custom rate limiting if needed

## Performance Considerations

1. **Non-blocking Emission**
   - Click tracking doesn't wait for WebSocket emission
   - Failed WebSocket events don't fail the tracking request

2. **Room-based Broadcasting**
   - Events are only sent to subscribed clients
   - Efficient room-based filtering by Socket.IO

3. **Connection Management**
   - Automatic cleanup on disconnect
   - Graceful handling of connection failures

## Configuration

### CORS Settings

Update CORS configuration in `analytics.gateway.ts`:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/analytics',
})
```

### Environment Variables

No additional environment variables required. Uses existing JWT configuration:
- `JWT_SECRET`: For token verification

## Testing

### Manual Testing

1. **Connect to WebSocket:**
   ```javascript
   const io = require('socket.io-client');
   const socket = io('http://localhost:3001/analytics', {
     query: { token: 'YOUR_JWT_TOKEN' }
   });

   socket.on('connect', () => {
     console.log('Connected!');
     socket.emit('subscribe:dashboard', 'me');
   });

   socket.on('click', (data) => {
     console.log('New click:', data);
   });
   ```

2. **Test with Browser:**
   - Open dashboard at `/dashboard`
   - Open link analytics at `/dashboard/links/[id]/analytics`
   - Click a short link in another tab
   - Observe live updates in the dashboard

### Automated Testing

```typescript
// Example test (using @nestjs/testing)
describe('AnalyticsGateway', () => {
  it('should emit click events to subscribers', async () => {
    const socket = io('http://localhost:3001/analytics', {
      query: { token: validToken }
    });

    await new Promise(resolve => socket.on('connect', resolve));

    socket.emit('subscribe:link', 'test-link-id');

    // Trigger click event
    await analyticsService.trackClick({ ... });

    // Verify event received
    await new Promise(resolve => {
      socket.on('click', (data) => {
        expect(data.linkId).toBe('test-link-id');
        resolve();
      });
    });
  });
});
```

## Monitoring

### Active Connections

```typescript
// Get active connection count
const activeConnections = analyticsGateway.getActiveConnections();

// Get active user count
const activeUsers = analyticsGateway.getActiveUsers();
```

### Logging

All connection/disconnection events are logged via NestJS Logger:
- Client connections
- Authentication failures
- Subscription changes

## Troubleshooting

### Connection Fails

1. **Check JWT token**
   - Ensure token is valid and not expired
   - Verify `JWT_SECRET` is correct

2. **CORS issues**
   - Update CORS configuration in gateway
   - Check browser console for CORS errors

3. **Network issues**
   - Verify WebSocket port is not blocked
   - Check firewall settings

### Events Not Received

1. **Check subscription**
   - Ensure client has subscribed to correct room
   - Verify `subscribe:link` or `subscribe:dashboard` was called

2. **Check link ownership**
   - Verify link belongs to authenticated user
   - Check userId in socket data

3. **Check event emission**
   - Verify `analyticsGateway` is injected correctly
   - Check for errors in analytics service logs

## Future Enhancements

1. **Aggregated Metrics**
   - Emit periodic dashboard metrics updates
   - Real-time totals and trends

2. **Historical Replay**
   - Send recent clicks on subscription
   - Configurable history depth

3. **Advanced Filtering**
   - Subscribe to specific countries/devices
   - Custom event filters

4. **Performance Metrics**
   - Track WebSocket latency
   - Monitor connection health

5. **Horizontal Scaling**
   - Redis adapter for multi-server deployments
   - Shared state across instances
