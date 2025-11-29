import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, Package, Send, Truck } from "lucide-react";
import { format } from "date-fns";

interface OrderTimelineModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTimelineModal({ order, isOpen, onClose }: OrderTimelineModalProps) {
  if (!order) return null;

  const timelineEvents = [
    {
      icon: Package,
      label: "Order Created",
      date: order.order_date,
      status: "completed",
      color: "text-blue-500",
    },
    {
      icon: Clock,
      label: "Pending Approval",
      date: order.status === 'pending_approval' ? new Date() : order.approved_date,
      status: order.approved_date ? "completed" : order.status === 'pending_approval' ? "in-progress" : "pending",
      color: order.approved_date ? "text-green-500" : "text-yellow-500",
      days: order.lead_time_metrics?.approval_days,
    },
    {
      icon: order.status === 'rejected' ? XCircle : CheckCircle2,
      label: order.status === 'rejected' ? "Order Rejected" : "Order Approved",
      date: order.rejected_date || order.approved_date,
      status: order.approved_date ? "completed" : order.rejected_date ? "rejected" : "pending",
      color: order.approved_date ? "text-green-500" : order.rejected_date ? "text-red-500" : "text-muted-foreground",
    },
    {
      icon: Send,
      label: "Sent to Vendor",
      date: order.sent_date,
      status: order.sent_date ? "completed" : "pending",
      color: order.sent_date ? "text-blue-500" : "text-muted-foreground",
      days: order.lead_time_metrics?.send_days,
    },
    {
      icon: Truck,
      label: "Delivered",
      date: order.delivered_date,
      status: order.delivered_date ? "completed" : "pending",
      color: order.delivered_date ? "text-green-500" : "text-muted-foreground",
      days: order.lead_time_metrics?.delivery_days,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✓";
      case "in-progress":
        return "●";
      case "rejected":
        return "✗";
      default:
        return "○";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Timeline - {order.po_number}</DialogTitle>
          <DialogDescription>
            Track the complete lifecycle and lead times for this purchase order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Time Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Approval Time</CardDescription>
                <CardTitle className="text-2xl">
                  {order.lead_time_metrics?.approval_days !== null
                    ? `${order.lead_time_metrics.approval_days}d`
                    : "-"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Send Time</CardDescription>
                <CardTitle className="text-2xl">
                  {order.lead_time_metrics?.send_days !== null
                    ? `${order.lead_time_metrics.send_days}d`
                    : "-"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Delivery Time</CardDescription>
                <CardTitle className="text-2xl">
                  {order.lead_time_metrics?.delivery_days !== null
                    ? `${order.lead_time_metrics.delivery_days}d`
                    : "-"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Lead Time</CardDescription>
                <CardTitle className="text-2xl">
                  {order.lead_time_metrics?.total_days !== null
                    ? `${order.lead_time_metrics.total_days}d`
                    : "-"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Expected vs Actual Delivery */}
          {(order.expected_delivery_date || order.actual_delivery_date) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.expected_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Delivery:</span>
                    <span className="font-medium">
                      {format(new Date(order.expected_delivery_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                {order.actual_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Delivery:</span>
                    <span className="font-medium">
                      {format(new Date(order.actual_delivery_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                {order.lead_time_metrics?.variance_days !== null && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Variance:</span>
                    <Badge
                      variant={
                        order.lead_time_metrics.variance_days <= 0 ? "default" : "destructive"
                      }
                    >
                      {order.lead_time_metrics.variance_days > 0 ? "+" : ""}
                      {order.lead_time_metrics.variance_days} days
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Lifecycle</CardTitle>
              <CardDescription>Complete timeline of order progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineEvents.map((event, index) => {
                  const Icon = event.icon;
                  return (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                            event.status === "completed"
                              ? "border-green-500 bg-green-50"
                              : event.status === "in-progress"
                              ? "border-yellow-500 bg-yellow-50"
                              : event.status === "rejected"
                              ? "border-red-500 bg-red-50"
                              : "border-muted bg-background"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${event.color}`} />
                        </div>
                        {index < timelineEvents.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.label}</p>
                          <span className="text-xl">{getStatusIcon(event.status)}</span>
                        </div>
                        {event.date && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.date), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        )}
                        {event.days !== null && event.days !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {event.days} days
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
