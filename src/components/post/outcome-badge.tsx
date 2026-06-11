import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === "Selected") {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" /> Selected
      </Badge>
    );
  }
  if (outcome === "Rejected") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className="gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}
