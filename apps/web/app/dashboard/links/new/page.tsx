"use client";

import { useState } from "react";
import { CreateLinkForm } from "@/components/links/CreateLinkForm";
import { LinkResponse } from "@pingtome/types";
import { Card, CardContent, CardHeader, CardTitle } from "@pingtome/ui";
import { Button } from "@pingtome/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateLinkPage() {
  const [createdLink, setCreatedLink] = useState<LinkResponse | null>(null);

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Link href="/dashboard/links">
          <Button variant="ghost" className="pl-0 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Links
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Link</CardTitle>
        </CardHeader>
        <CardContent>
          {createdLink ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
                <p className="font-medium">Link Created Successfully!</p>
                <div className="mt-2">
                  <p className="text-sm text-green-700">Short URL:</p>
                  <a
                    href={createdLink.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold hover:underline"
                  >
                    {createdLink.shortUrl}
                  </a>
                </div>
              </div>
              <Button
                onClick={() => setCreatedLink(null)}
                variant="outline"
                className="w-full"
              >
                Create Another
              </Button>
            </div>
          ) : (
            <CreateLinkForm onSuccess={setCreatedLink} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
