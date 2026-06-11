"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_REASONS } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: "post" | "comment" | "user";
}

export function ReportDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
}: ReportDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = React.useState<string>("");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.post("/api/reports", { targetId, targetType, reason, details });
      toast({ title: "Report submitted", description: "Our team will review it." });
      onOpenChange(false);
      setReason("");
      setDetails("");
    } catch (err) {
      toast({
        title: "Could not submit report",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>
            Tell us why you&apos;re reporting this {targetType}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!reason || submitting}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
