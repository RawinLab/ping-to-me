"use client";

import { useState } from "react";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../lib/api";
import Image from "next/image";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkUrl: string;
  slug: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  linkUrl,
  slug,
}: QrCodeModalProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateQr = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/qr/generate", {
        method: "POST",
        body: JSON.stringify({ url: linkUrl, slug }),
      });
      setQrUrl(res.qrCodeUrl);
    } catch (err) {
      console.error("Failed to generate QR");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 py-4">
          {!qrUrl ? (
            <div className="text-center">
              <p className="mb-4 text-gray-600">
                Generate a QR code for /{slug}
              </p>
              <Button onClick={generateQr} disabled={loading}>
                {loading ? "Generating..." : "Generate QR Code"}
              </Button>
            </div>
          ) : (
            <>
              <Image
                src={qrUrl}
                alt="QR Code"
                width={192}
                height={192}
                className="border rounded"
                unoptimized
              />
              <a
                href={qrUrl}
                download={`qr-${slug}.png`}
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                Download Image
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
