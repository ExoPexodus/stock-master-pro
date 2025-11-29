import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehousesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Warehouse, Package } from "lucide-react";

export default function Warehouses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [viewingStock, setViewingStock] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", location: "", capacity: "" });

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehousesApi.getAll,
  });

  const { data: warehouseStock } = useQuery({
    queryKey: ["warehouse-stock", viewingStock?.id],
    queryFn: () => warehousesApi.getById(viewingStock.id),
    enabled: !!viewingStock,
  });

  const createMutation = useMutation({
    mutationFn: warehousesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({ title: "Warehouse created successfully" });
      setIsCreateOpen(false);
      setFormData({ name: "", location: "", capacity: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating warehouse", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => warehousesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({ title: "Warehouse updated successfully" });
      setEditingWarehouse(null);
      setFormData({ name: "", location: "", capacity: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating warehouse", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: warehousesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({ title: "Warehouse deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting warehouse", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      location: formData.location || undefined,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
    };

    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      location: warehouse.location || "",
      capacity: warehouse.capacity?.toString() || "",
    });
  };

  const canModify = user?.role === "admin" || user?.role === "manager";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Warehouses</h1>
            <p className="text-muted-foreground">Manage warehouse locations and inventory</p>
          </div>
          {canModify && (
            <Dialog open={isCreateOpen || !!editingWarehouse} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setEditingWarehouse(null);
                setFormData({ name: "", location: "", capacity: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Warehouse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Create Warehouse"}</DialogTitle>
                    <DialogDescription>
                      {editingWarehouse ? "Update the warehouse details" : "Add a new warehouse location"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Address/Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., 123 Main St, Building A, Floor 2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacity (units)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="Maximum storage capacity"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingWarehouse ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Warehouses</CardTitle>
            <CardDescription>View and manage your warehouse locations and stock</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No warehouses yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Stock Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse: any) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>{warehouse.location || "-"}</TableCell>
                      <TableCell>{warehouse.capacity ? warehouse.capacity.toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingStock(warehouse)}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          View Stock
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canModify && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(warehouse)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {user?.role === "admin" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this warehouse?")) {
                                      deleteMutation.mutate(warehouse.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Stock View Dialog */}
        <Dialog open={!!viewingStock} onOpenChange={(open) => !open && setViewingStock(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Stock in {viewingStock?.name}</DialogTitle>
              <DialogDescription>
                {viewingStock?.location || "View all items stored in this warehouse"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {!warehouseStock ? (
                <div className="text-center py-8">Loading stock...</div>
              ) : warehouseStock.stock_records?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-2" />
                  <p>No stock items in this warehouse</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseStock.stock_records?.map((stock: any) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.item?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stock.item?.sku || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stock.quantity < 10 ? "destructive" : "default"}>
                            {stock.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {stock.last_updated
                            ? new Date(stock.last_updated).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
