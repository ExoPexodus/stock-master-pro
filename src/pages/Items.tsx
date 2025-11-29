import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, warehousesApi, suppliersApi, categoriesApi } from '@/lib/api';
import { Item, PaginatedResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const Items = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    warehouse_id: '',
    supplier_id: '',
    unit_price: '',
    reorder_level: '10'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehousesApi.getAll,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchItems();
  }, [search]);

  const fetchItems = async () => {
    try {
      const data = await api.get<PaginatedResponse<Item>>(
        `/items?search=${search}`
      );
      setItems(data.items || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/items/${id}`);
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
      fetchItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description || '',
      category_id: item.category_id?.toString() || '',
      warehouse_id: item.warehouse_id?.toString() || '',
      supplier_id: item.supplier_id?.toString() || '',
      unit_price: item.unit_price.toString(),
      reorder_level: item.reorder_level.toString()
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = {
      sku: formData.sku,
      name: formData.name,
      description: formData.description || undefined,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
      warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : undefined,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : undefined,
      unit_price: parseFloat(formData.unit_price),
      reorder_level: parseInt(formData.reorder_level),
    };

    try {
      if (editingItem) {
        await api.put(`/items/${editingItem.id}`, data);
        toast({
          title: 'Success',
          description: 'Item updated successfully',
        });
      } else {
        await api.post('/items', data);
        toast({
          title: 'Success',
          description: 'Item created successfully',
        });
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        sku: '',
        name: '',
        description: '',
        category_id: '',
        warehouse_id: '',
        supplier_id: '',
        unit_price: '',
        reorder_level: '10'
      });
      fetchItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Items</h2>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingItem(null);
                setFormData({
                  sku: '',
                  name: '',
                  description: '',
                  category_id: '',
                  warehouse_id: '',
                  supplier_id: '',
                  unit_price: '',
                  reorder_level: '10'
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Item' : 'Add New Item'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                      disabled={!!editingItem}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select value={formData.warehouse_id} onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {warehouses.map((wh: any) => (
                          <SelectItem key={wh.id} value={wh.id.toString()}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {suppliers.map((sup: any) => (
                          <SelectItem key={sup.id} value={sup.id.toString()}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price (₹) *</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorder_level">Reorder Level *</Label>
                    <Input
                      id="reorder_level"
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingItem ? 'Update' : 'Create'} Item
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Price</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category?.name || '-'}</TableCell>
                      <TableCell>{item.warehouse?.name || '-'}</TableCell>
                      <TableCell>{item.supplier?.name || '-'}</TableCell>
                      <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {user?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Items;
