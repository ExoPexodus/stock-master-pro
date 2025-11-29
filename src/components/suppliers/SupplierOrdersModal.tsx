import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { suppliersApi } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Package, DollarSign, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SupplierOrdersModalProps {
  supplierId: number | null;
  supplierName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierOrdersModal({ supplierId, supplierName, isOpen, onClose }: SupplierOrdersModalProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-orders", supplierId],
    queryFn: () => suppliersApi.getOrders(supplierId!),
    enabled: !!supplierId && isOpen,
  });

  const handleExport = async () => {
    if (!supplierId) return;
    
    setIsExporting(true);
    try {
      const blob = await suppliersApi.exportOrders(supplierId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier_${supplierName.replace(/\s+/g, '_')}_orders_${format(new Date(), 'yyyyMMdd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Export successful", description: "Order history downloaded" });
    } catch (error: any) {
      toast({ 
        title: "Export failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      pending_approval: "outline",
      approved: "default",
      rejected: "destructive",
      sent_to_vendor: "default",
      delivered: "default",
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order History - {supplierName}</DialogTitle>
          <DialogDescription>
            Complete purchase order history and statistics for this supplier
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading order history...</div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.statistics?.total_orders || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${data?.statistics?.total_amount?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.statistics?.pending_orders || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.statistics?.completed_orders || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button onClick={handleExport} disabled={isExporting || !data?.orders?.length}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export to CSV"}
              </Button>
            </div>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>All purchase orders placed with this supplier</CardDescription>
              </CardHeader>
              <CardContent>
                {!data?.orders || data.orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found for this supplier
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Delivered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.po_number}</TableCell>
                          <TableCell>
                            {order.order_date ? format(new Date(order.order_date), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{order.warehouse?.name || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${parseFloat(order.total_amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {order.delivered_date ? format(new Date(order.delivered_date), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
