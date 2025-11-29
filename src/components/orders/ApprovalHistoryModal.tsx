import { useQuery } from "@tanstack/react-query";
import { approvalsApi } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ApprovalHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  poNumber: string;
}

export function ApprovalHistoryModal({ open, onOpenChange, orderId, poNumber }: ApprovalHistoryModalProps) {
  const { data: history = [] } = useQuery({
    queryKey: ["approvalHistory", orderId],
    queryFn: () => approvalsApi.getApprovalHistory(orderId),
    enabled: open,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      pending_approval: "secondary",
      approved: "default",
      rejected: "destructive",
      sent_to_vendor: "default",
      delivered: "default",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Approval History - {poNumber}</DialogTitle>
          <DialogDescription>Timeline of all status changes and approvals</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No history available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>From Status</TableHead>
                  <TableHead>To Status</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{h.username}</TableCell>
                    <TableCell>{getStatusBadge(h.from_status)}</TableCell>
                    <TableCell>{getStatusBadge(h.to_status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{h.comments || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
