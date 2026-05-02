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
import { useTranslations } from "next-intl";

export default function DocsPage() {
  const t = useTranslations("docs");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <Badge className="mb-4">{t("apiVersion")}</Badge>
          <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
          <p className="text-xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              {t("quickStart")}
            </CardTitle>
            <CardDescription>
              {t("quickStartDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{t("getApiKey")}</h3>
              <p className="text-muted-foreground mb-2">
                {t("getApiKeyDescription")}{" "}
                <a
                  href="/dashboard/developer/api-keys"
                  className="text-primary hover:underline"
                >
                  {t("apiKeysPage")}
                </a>
                .
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t("firstRequest")}</h3>
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
            <TabsTrigger value="links">{t("linksApi")}</TabsTrigger>
            <TabsTrigger value="domains">{t("domainsApi")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("analyticsApi")}</TabsTrigger>
            <TabsTrigger value="bio">{t("bioPagesApi")}</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {t("linksApi")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge> /links
                  </h3>
                  <p className="text-muted-foreground mt-1">{t("listAllLinks")}</p>
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
                    {t("createNewShortLink")}
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
  "shortUrl": "https://pingto.me/s/custom-slug",
  "originalUrl": "https://example.com/long-url"
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="destructive">DELETE</Badge> /links/:id
                  </h3>
                  <p className="text-muted-foreground mt-1">{t("deleteLink")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t("domainsApi")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge> /domains
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {t("listAllDomains")}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>POST</Badge> /domains
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {t("addNewDomain")}
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
                    {t("verifyDomain")}
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
                  {t("analyticsApi")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge>{" "}
                    /analytics/link/:linkId
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {t("getAnalytics")}
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
                  {t("bioPagesApi")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="secondary">GET</Badge> /biopages
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {t("listAllBioPages")}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge>POST</Badge> /biopages
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {t("createNewBioPage")}
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
                    {t("addLinkToBioPage")}
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
              {t("authentication")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{t("authDescription")}</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              {`x-api-key: YOUR_API_KEY`}
            </pre>
            <p className="text-sm text-muted-foreground">
              {t("bearerDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("rateLimits")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">{t("free")}</h4>
                <p className="text-2xl font-bold">100</p>
                <p className="text-sm text-muted-foreground">{t("requestsPerMinute")}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">{t("pro")}</h4>
                <p className="text-2xl font-bold">1,000</p>
                <p className="text-sm text-muted-foreground">{t("requestsPerMinute")}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">{t("business")}</h4>
                <p className="text-2xl font-bold">10,000</p>
                <p className="text-sm text-muted-foreground">{t("requestsPerMinute")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-muted-foreground">
          <p>
            {t("viewFullDocs")}{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/docs`}
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              {t("apiDocs")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
