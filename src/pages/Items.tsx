import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
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
import { Switch } from '@/components/ui/switch';

interface CustomField {
  id: number;
  field_key: string;
  field_label: string;
  field_type: string;
  field_group: string;
  visible_in_form: boolean;
  visible_in_table: boolean;
  default_value?: string;
  sort_order: number;
}

const Items = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchCustomFields();
  }, []);

  useEffect(() => {
    if (customFields.length > 0) {
      fetchItems();
    }
  }, [search, customFields]);

  const fetchCustomFields = async () => {
    try {
      const fields = await api.get<CustomField[]>('/custom-fields');
      setCustomFields(fields);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch custom fields',
        variant: 'destructive',
      });
    }
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      description: formData.get('description'),
      unit_price: parseFloat(formData.get('unit_price') as string),
      reorder_level: parseInt(formData.get('reorder_level') as string),
      custom_data: customFieldsData,
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
      setCustomFieldsData({});
      fetchItems();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save item',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (item: Item) => {
    setEditingItem(item);
    setCustomFieldsData(item.custom_data || {});
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    // Set default values from custom fields
    const defaults: Record<string, any> = {};
    customFields
      .filter(f => f.visible_in_form && f.default_value)
      .forEach(f => {
        defaults[f.field_key] = f.default_value;
      });
    setCustomFieldsData(defaults);
    setIsDialogOpen(true);
  };

  const handleCustomFieldChange = (fieldKey: string, value: any) => {
    setCustomFieldsData(prev => ({ ...prev, [fieldKey]: value }));
  };

  const renderCustomFieldInput = (field: CustomField) => {
    const value = customFieldsData[field.field_key] || '';

    switch (field.field_type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={value === 'true' || value === true}
            onCheckedChange={(checked) => handleCustomFieldChange(field.field_key, checked.toString())}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
          />
        );
    }
  };

  const visibleFormFields = customFields.filter(f => f.visible_in_form);
  const visibleTableFields = customFields.filter(f => f.visible_in_table);
  
  // Group form fields by group
  const groupedFormFields = visibleFormFields.reduce((acc, field) => {
    const group = field.field_group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Items</h1>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Item' : 'Add New Item'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Core Fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          name="sku"
                          defaultValue={editingItem?.sku}
                          required
                          disabled={!!editingItem}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={editingItem?.name}
                          required
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          name="description"
                          defaultValue={editingItem?.description}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit_price">Unit Price *</Label>
                        <Input
                          id="unit_price"
                          name="unit_price"
                          type="number"
                          step="0.01"
                          defaultValue={editingItem?.unit_price}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reorder_level">Reorder Level</Label>
                        <Input
                          id="reorder_level"
                          name="reorder_level"
                          type="number"
                          defaultValue={editingItem?.reorder_level || 10}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Fields */}
                  {Object.entries(groupedFormFields).map(([group, fields]) => (
                    <div key={group} className="space-y-4">
                      <h3 className="text-lg font-semibold">{group}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {fields.map(field => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.field_key}>
                              {field.field_label}
                            </Label>
                            {renderCustomFieldInput(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingItem(null);
                        setCustomFieldsData({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  {visibleTableFields.map(field => (
                    <TableHead key={field.id}>{field.field_label}</TableHead>
                  ))}
                  {canEdit && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      {visibleTableFields.map((_, idx) => (
                        <TableCell key={idx}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                      {canEdit && (
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      )}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={5 + visibleTableFields.length + (canEdit ? 1 : 0)} 
                      className="text-center text-muted-foreground"
                    >
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>${item.unit_price}</TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      {visibleTableFields.map(field => (
                        <TableCell key={field.id}>
                          {item.custom_data?.[field.field_key] || '-'}
                        </TableCell>
                      ))}
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Items;
