"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from "@pingtome/ui";
import {
  Book,
  Code2,
  Terminal,
  Key,
  Link2,
  BarChart2,
  Globe,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <Badge className="mb-4">API v1.0</Badge>
          <h1 className="text-4xl font-bold mb-4">Developer Documentation</h1>
          <p className="text-xl text-muted-foreground">
            Build powerful integrations with the PingToMe API
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get started with the API in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Get your API Key</h3>
              <p className="text-muted-foreground mb-2">
                Create an API key from the{" "}
                <a
                  href="/dashboard/developer/api-keys"
                  className="text-primary hover:underline"
                >
                  API Keys page
                </a>
                .
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Make your first request</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {`curl -X GET "https://api.pingto.me/links" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bio">Bio Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Links API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge> /links
                  </h3>
                  <p className="text-muted-foreground mt-1">List all links</p>
                  <pre className="bg-muted p-3 rounded mt-2 text-sm">
                    {`// Response
{
  "data": [
    {
      "id": "abc123",
      "slug": "my-link",
      "originalUrl": "https://example.com",
      "clicks": 42,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1 }
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>POST</Badge> /links
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Create a new short link
                  </p>
                  <pre className="bg-muted p-3 rounded mt-2 text-sm">
                    {`// Request
{
  "originalUrl": "https://example.com/long-url",
  "slug": "custom-slug",  // optional
  "expiresAt": "2024-12-31"  // optional
}

// Response
{
  "id": "abc123",
  "shortUrl": "https://pingto.me/custom-slug",
  "originalUrl": "https://example.com/long-url"
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="destructive">DELETE</Badge> /links/:id
                  </h3>
                  <p className="text-muted-foreground mt-1">Delete a link</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Domains API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge> /domains
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    List all custom domains
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>POST</Badge> /domains
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Add a new custom domain
                  </p>
                  <pre className="bg-muted p-3 rounded mt-2 text-sm">
                    {`// Request
{
  "domain": "links.yoursite.com"
}

// Response
{
  "id": "abc123",
  "domain": "links.yoursite.com",
  "verified": false,
  "txtRecord": "pingto-verify=abc123..."
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">POST</Badge> /domains/:id/verify
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Verify domain ownership
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  Analytics API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge>{" "}
                    /analytics/link/:linkId
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Get analytics for a specific link
                  </p>
                  <pre className="bg-muted p-3 rounded mt-2 text-sm">
                    {`// Response
{
  "totalClicks": 1234,
  "uniqueVisitors": 890,
  "clicksByCountry": {
    "US": 450,
    "UK": 200,
    "DE": 150
  },
  "clicksByDevice": {
    "desktop": 600,
    "mobile": 500,
    "tablet": 134
  },
  "clicksOverTime": [
    { "date": "2024-01-01", "clicks": 42 },
    { "date": "2024-01-02", "clicks": 56 }
  ]
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Bio Pages API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge> /biopages
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    List all bio pages
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>POST</Badge> /biopages
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Create a new bio page
                  </p>
                  <pre className="bg-muted p-3 rounded mt-2 text-sm">
                    {`// Request
{
  "slug": "mypage",
  "title": "My Bio",
  "bio": "Welcome to my links!",
  "theme": "default"
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>POST</Badge> /biopages/:id/links
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Add a link to a bio page
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>All API requests must include your API key in the header:</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              {`x-api-key: YOUR_API_KEY`}
            </pre>
            <p className="text-sm text-muted-foreground">
              You can also use Bearer token authentication with your JWT access
              token for browser-based applications.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Free</h4>
                <p className="text-2xl font-bold">100</p>
                <p className="text-sm text-muted-foreground">requests/minute</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Pro</h4>
                <p className="text-2xl font-bold">1,000</p>
                <p className="text-sm text-muted-foreground">requests/minute</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Business</h4>
                <p className="text-2xl font-bold">10,000</p>
                <p className="text-sm text-muted-foreground">requests/minute</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-muted-foreground">
          <p>
            View the full interactive documentation at{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/docs`}
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              /api/docs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
