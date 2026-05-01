"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
} from "@pingtome/ui";
import { Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { domainsApi, VerificationType } from "@/lib/api/domains";
import { useTranslations } from "next-intl";

const formSchema = z.object({
  hostname: z
    .string()
    .min(3, "Hostname is too short")
    .regex(/^[a-z0-9.-]+$/, "Invalid hostname format. Use lowercase letters, numbers, dots, and hyphens only"),
});

interface AddDomainModalProps {
  children: React.ReactNode;
  onSuccess: () => void;
  orgId: string;
}

export function AddDomainModal({
  children,
  onSuccess,
  orgId,
}: AddDomainModalProps) {
  const t = useTranslations("domains");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "instruction">("input");
  const [domainData, setDomainData] = useState<any>(null);
  const [verificationType, setVerificationType] = useState<VerificationType>("txt");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await domainsApi.create({
        hostname: values.hostname.toLowerCase(),
        orgId,
        verificationType,
      });
      setDomainData(res);
      setStep("instruction");
      onSuccess();
    } catch (err: any) {
      setError(err?.message || t("failedToAddDomain"));
      console.error("Failed to add domain:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form after animation completes
    setTimeout(() => {
      setStep("input");
      setDomainData(null);
      setVerificationType("txt");
      setError(null);
      form.reset();
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {step === "input" ? t("addCustomDomain") : t("verifyDomainOwnership")}
          </DialogTitle>
          <DialogDescription>
            {step === "input"
              ? t("enterDomainDescription")
              : t("verifyDescription")}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Hostname Input */}
            <div className="space-y-2">
              <Label htmlFor="hostname">{t("domainName")}</Label>
              <Input
                id="hostname"
                placeholder="links.example.com"
                className="h-11"
                {...form.register("hostname")}
              />
              {form.formState.errors.hostname && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.hostname.message}
                </p>
              )}
              <p className="text-xs text-slate-500">
                {t("domainNameHint")}
              </p>
            </div>

            {/* Verification Method Selector */}
            <div className="space-y-3">
              <Label>{t("verificationMethod")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerificationType("txt")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    verificationType === "txt"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        verificationType === "txt"
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300"
                      }`}
                    >
                      {verificationType === "txt" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">
                        {t("txtRecord")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {t("txtRecordDescription")}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationType("cname")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    verificationType === "cname"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        verificationType === "cname"
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300"
                      }`}
                    >
                      {verificationType === "cname" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">
                        {t("cnameRecordOption")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {t("cnameRecordDescription")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3 border border-red-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("addingDomain")}
                  </>
                ) : (
                  t("addDomain")
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Success Message */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">{t("domainAdded")}</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    {t("dnsRecordInstruction")}
                  </p>
                </div>
              </div>
            </div>

            {/* DNS Instructions */}
            <div className="space-y-3">
              {verificationType === "txt" && domainData?.verificationToken ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      {t("addTxtRecord")}
                    </p>
                    <div className="bg-slate-50 rounded-lg border p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                        <span>{t("dnsType")}</span>
                        <span>{t("dnsName")}</span>
                        <span>{t("dnsValue")}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                        <span className="text-slate-700">TXT</span>
                        <span className="text-slate-900">_pingto-verify</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <code className="text-blue-600 text-xs break-all flex-1">
                            {domainData.verificationToken}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(domainData.verificationToken)
                            }
                            className="flex-shrink-0 h-7 px-2"
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      {t("addCnameRecord")}
                    </p>
                    <div className="bg-slate-50 rounded-lg border p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                        <span>{t("dnsType")}</span>
                        <span>{t("dnsName")}</span>
                        <span>{t("dnsValue")}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                        <span className="text-slate-700">CNAME</span>
                        <span className="text-slate-900 break-all">
                          {domainData?.hostname}
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-blue-600">redirect.pingto.me</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard("redirect.pingto.me")}
                            className="flex-shrink-0 h-7 px-2"
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                {t("importantNotes")}
              </p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>{t("dnsPropagationNote")}</li>
                <li>
                  {t("verifyReturnNote")}
                </li>
                <li>
                  {t("verifyAnytimeNote")}
                </li>
              </ul>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                {t("done")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
