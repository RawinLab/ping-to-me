"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest } from "@/lib/api";
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
import { Copy } from "lucide-react";

const formSchema = z.object({
  hostname: z
    .string()
    .min(3, "Hostname is too short")
    .regex(/^[a-z0-9.-]+$/, "Invalid hostname format"),
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
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "instruction">("input");
  const [domainData, setDomainData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await apiRequest("/domains", {
        method: "POST",
        body: JSON.stringify({ ...values, orgId }),
      });
      setDomainData(res);
      setStep("instruction");
      onSuccess();
    } catch (error) {
      alert("Failed to add domain");
    }
  };

  const copyToken = () => {
    if (domainData?.verificationToken) {
      navigator.clipboard.writeText(domainData.verificationToken);
      alert("Copied to clipboard!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Domain</DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Enter the domain you want to connect."
              : "Verify ownership of your domain."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hostname">Domain Name</Label>
              <Input
                id="hostname"
                placeholder="links.example.com"
                {...form.register("hostname")}
              />
              {form.formState.errors.hostname && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.hostname.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Add Domain
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md space-y-2">
              <p className="text-sm font-medium">
                Add this TXT record to your DNS:
              </p>
              <div className="flex items-center justify-between bg-background p-2 rounded border">
                <code className="text-xs break-all">
                  {domainData?.verificationToken}
                </code>
                <Button variant="ghost" size="sm" onClick={copyToken}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Host: @ or {domainData?.hostname}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
