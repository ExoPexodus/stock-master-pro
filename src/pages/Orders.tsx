import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi, suppliersApi, warehousesApi, approvalsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShoppingCart, TruckIcon, CheckCircle, XCircle, Send, Package, Clock, History, Calendar } from "lucide-react";
import { ApprovalHistoryModal } from "@/components/orders/ApprovalHistoryModal";
import { ApprovalActionDialog } from "@/components/orders/ApprovalActionDialog";
import { OrderTimelineModal } from "@/components/orders/OrderTimelineModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isCreateSOOpen, setIsCreateSOOpen] = useState(false);
  const [poFormData, setPoFormData] = useState({ po_number: "", supplier_id: "", warehouse_id: "", total_amount: "", expected_date: "", expected_delivery_date: "" });
  const [soFormData, setSoFormData] = useState({ so_number: "", customer_name: "", warehouse_id: "", total_amount: "" });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; orderId: number; poNumber: string } | null>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; orderId: number } | null>(null);
  const [timelineModal, setTimelineModal] = useState<{ open: boolean; order: any } | null>(null);

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: ordersApi.getPurchaseOrders,
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: ordersApi.getSalesOrders,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: suppliersApi.getAll,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getAll,
  });

  const createPOMutation = useMutation({
    mutationFn: ordersApi.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast({ title: "Purchase order created successfully" });
      setIsCreatePOOpen(false);
      setPoFormData({ po_number: "", supplier_id: "", warehouse_id: "", total_amount: "", expected_date: "", expected_delivery_date: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating purchase order", description: error.message, variant: "destructive" });
    },
  });

  const createSOMutation = useMutation({
    mutationFn: ordersApi.createSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      toast({ title: "Sales order created successfully" });
      setIsCreateSOOpen(false);
      setSoFormData({ so_number: "", customer_name: "", warehouse_id: "", total_amount: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating sales order", description: error.message, variant: "destructive" });
    },
  });

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPOMutation.mutate({
      po_number: poFormData.po_number,
      supplier_id: parseInt(poFormData.supplier_id),
      warehouse_id: parseInt(poFormData.warehouse_id),
      total_amount: parseFloat(poFormData.total_amount),
      expected_date: poFormData.expected_date || undefined,
      expected_delivery_date: poFormData.expected_delivery_date || undefined,
    });
  };

  const handleSOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSOMutation.mutate({
      so_number: soFormData.so_number,
      customer_name: soFormData.customer_name,
      warehouse_id: parseInt(soFormData.warehouse_id),
      total_amount: parseFloat(soFormData.total_amount),
    });
  };

  const workflowMutations = {
    submit: useMutation({
      mutationFn: ({ orderId, comments }: { orderId: number; comments: string }) =>
        approvalsApi.submitForApproval(orderId, comments),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
        toast({ title: "Submitted for approval" });
        setActionDialog(null);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    }),
    approve: useMutation({
      mutationFn: ({ orderId, comments }: { orderId: number; comments: string }) =>
        approvalsApi.approveOrder(orderId, comments),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
        toast({ title: "Purchase order approved" });
        setActionDialog(null);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    }),
    reject: useMutation({
      mutationFn: ({ orderId, comments }: { orderId: number; comments: string }) =>
        approvalsApi.rejectOrder(orderId, comments),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
        toast({ title: "Purchase order rejected" });
        setActionDialog(null);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    }),
    send: useMutation({
      mutationFn: ({ orderId, comments }: { orderId: number; comments: string }) =>
        approvalsApi.sendToVendor(orderId, comments),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
        toast({ title: "Sent to vendor" });
        setActionDialog(null);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    }),
    deliver: useMutation({
      mutationFn: ({ orderId, comments }: { orderId: number; comments: string }) =>
        approvalsApi.markDelivered(orderId, comments),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
        toast({ title: "Marked as delivered" });
        setActionDialog(null);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    }),
  };

  const handleWorkflowAction = (comments: string) => {
    if (!actionDialog) return;
    const mutation = workflowMutations[actionDialog.type as keyof typeof workflowMutations];
    mutation.mutate({ orderId: actionDialog.orderId, comments });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      pending_approval: "secondary",
      approved: "default",
      rejected: "destructive",
      sent_to_vendor: "default",
      delivered: "default",
      processing: "secondary",
      shipped: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  const canCreate = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  const getAvailableActions = (status: string) => {
    const actions: { label: string; type: string; icon: any; variant?: any }[] = [];
    
    if (status === "draft" && canCreate) {
      actions.push({ label: "Submit for Approval", type: "submit", icon: Send });
    }
    if (status === "pending_approval" && isAdmin) {
      actions.push({ label: "Approve", type: "approve", icon: CheckCircle, variant: "default" });
      actions.push({ label: "Reject", type: "reject", icon: XCircle, variant: "destructive" });
    }
    if (status === "approved" && canCreate) {
      actions.push({ label: "Send to Vendor", type: "send", icon: Send });
    }
    if (status === "sent_to_vendor" && canCreate) {
      actions.push({ label: "Mark Delivered", type: "deliver", icon: Package });
    }
    
    return actions;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage purchase and sales orders</p>
        </div>

        <Tabs defaultValue="purchase" className="space-y-4">
          <TabsList>
            <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
            <TabsTrigger value="sales">Sales Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="purchase">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>Orders from suppliers</CardDescription>
                </div>
                {canCreate && (
                  <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New PO
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handlePOSubmit}>
                        <DialogHeader>
                          <DialogTitle>Create Purchase Order</DialogTitle>
                          <DialogDescription>Add a new purchase order from a supplier</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="po_number">PO Number *</Label>
                            <Input
                              id="po_number"
                              value={poFormData.po_number}
                              onChange={(e) => setPoFormData({ ...poFormData, po_number: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="supplier">Supplier *</Label>
                            <Select value={poFormData.supplier_id} onValueChange={(value) => setPoFormData({ ...poFormData, supplier_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                              <SelectContent>
                                {suppliers.map((sup: any) => (
                                  <SelectItem key={sup.id} value={sup.id.toString()}>{sup.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="warehouse">Warehouse *</Label>
                            <Select value={poFormData.warehouse_id} onValueChange={(value) => setPoFormData({ ...poFormData, warehouse_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((wh: any) => (
                                  <SelectItem key={wh.id} value={wh.id.toString()}>{wh.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="total_amount">Total Amount *</Label>
                            <Input
                              id="total_amount"
                              type="number"
                              step="0.01"
                              value={poFormData.total_amount}
                              onChange={(e) => setPoFormData({ ...poFormData, total_amount: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="expected_date">Expected Date</Label>
                            <Input
                              id="expected_date"
                              type="date"
                              value={poFormData.expected_date}
                              onChange={(e) => setPoFormData({ ...poFormData, expected_date: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                            <Input
                              id="expected_delivery_date"
                              type="date"
                              value={poFormData.expected_delivery_date}
                              onChange={(e) => setPoFormData({ ...poFormData, expected_delivery_date: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {purchaseOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No purchase orders yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.map((po: any) => {
                        const actions = getAvailableActions(po.status);
                        return (
                          <TableRow key={po.id}>
                            <TableCell className="font-medium">{po.po_number}</TableCell>
                            <TableCell>{suppliers.find((s: any) => s.id === po.supplier_id)?.name || "-"}</TableCell>
                            <TableCell>{warehouses.find((w: any) => w.id === po.warehouse_id)?.name || "-"}</TableCell>
                            <TableCell>{getStatusBadge(po.status)}</TableCell>
                            <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                            <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTimelineModal({ open: true, order: po })}
                                  title="View timeline"
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setHistoryModal({ open: true, orderId: po.id, poNumber: po.po_number })}
                                  title="View approval history"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                {actions.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Actions
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {actions.map((action) => (
                                        <DropdownMenuItem
                                          key={action.type}
                                          onClick={() => setActionDialog({ open: true, type: action.type, orderId: po.id })}
                                        >
                                          <action.icon className="h-4 w-4 mr-2" />
                                          {action.label}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sales Orders</CardTitle>
                  <CardDescription>Orders to customers</CardDescription>
                </div>
                {canCreate && (
                  <Dialog open={isCreateSOOpen} onOpenChange={setIsCreateSOOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New SO
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleSOSubmit}>
                        <DialogHeader>
                          <DialogTitle>Create Sales Order</DialogTitle>
                          <DialogDescription>Add a new sales order to a customer</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="so_number">SO Number *</Label>
                            <Input
                              id="so_number"
                              value={soFormData.so_number}
                              onChange={(e) => setSoFormData({ ...soFormData, so_number: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="customer_name">Customer Name *</Label>
                            <Input
                              id="customer_name"
                              value={soFormData.customer_name}
                              onChange={(e) => setSoFormData({ ...soFormData, customer_name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="so_warehouse">Warehouse *</Label>
                            <Select value={soFormData.warehouse_id} onValueChange={(value) => setSoFormData({ ...soFormData, warehouse_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((wh: any) => (
                                  <SelectItem key={wh.id} value={wh.id.toString()}>{wh.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="so_total_amount">Total Amount *</Label>
                            <Input
                              id="so_total_amount"
                              type="number"
                              step="0.01"
                              value={soFormData.total_amount}
                              onChange={(e) => setSoFormData({ ...soFormData, total_amount: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {salesOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <TruckIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No sales orders yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SO Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Order Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesOrders.map((so: any) => (
                        <TableRow key={so.id}>
                          <TableCell className="font-medium">{so.so_number}</TableCell>
                          <TableCell>{so.customer_name}</TableCell>
                          <TableCell>{warehouses.find((w: any) => w.id === so.warehouse_id)?.name || "-"}</TableCell>
                          <TableCell>{getStatusBadge(so.status)}</TableCell>
                          <TableCell>${so.total_amount.toFixed(2)}</TableCell>
                          <TableCell>{new Date(so.order_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {historyModal && (
          <ApprovalHistoryModal
            open={historyModal.open}
            onOpenChange={(open) => !open && setHistoryModal(null)}
            orderId={historyModal.orderId}
            poNumber={historyModal.poNumber}
          />
        )}

        {actionDialog && (
          <ApprovalActionDialog
            open={actionDialog.open}
            onOpenChange={(open) => !open && setActionDialog(null)}
            title={`${actionDialog.type.charAt(0).toUpperCase() + actionDialog.type.slice(1)} Purchase Order`}
            description="Add any comments or notes for this action"
            onConfirm={handleWorkflowAction}
            isLoading={
              workflowMutations[actionDialog.type as keyof typeof workflowMutations]?.isPending
            }
          />
        )}

        {timelineModal && (
          <OrderTimelineModal
            order={timelineModal.order}
            isOpen={timelineModal.open}
            onClose={() => setTimelineModal(null)}
          />
        )}
      </div>
    </Layout>
  );
}
