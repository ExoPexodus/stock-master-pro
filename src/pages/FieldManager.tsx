import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';
import { api } from '@/lib/api';

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

export default function FieldManager() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    field_key: '',
    field_label: '',
    field_type: 'text',
    field_group: '',
    visible_in_form: true,
    visible_in_table: false,
    default_value: ''
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await api.get<CustomField[]>('/custom-fields');
      setFields(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch custom fields',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingField) {
        await api.put(`/custom-fields/${editingField.id}`, formData);
        toast({ title: 'Success', description: 'Field updated successfully' });
      } else {
        await api.post('/custom-fields', formData);
        toast({ title: 'Success', description: 'Field created successfully' });
      }
      
      setDialogOpen(false);
      setEditingField(null);
      resetForm();
      fetchFields();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save field',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this field? Data in items will be preserved.')) return;

    try {
      await api.delete(`/custom-fields/${id}`);
      toast({ title: 'Success', description: 'Field deleted successfully' });
      fetchFields();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete field',
        variant: 'destructive'
      });
    }
  };

  const handleToggleVisibility = async (field: CustomField, type: 'form' | 'table') => {
    try {
      const updates = type === 'form'
        ? { visible_in_form: !field.visible_in_form }
        : { visible_in_table: !field.visible_in_table };
      
      await api.put(`/custom-fields/${field.id}`, updates);
      fetchFields();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      field_key: '',
      field_label: '',
      field_type: 'text',
      field_group: '',
      visible_in_form: true,
      visible_in_table: false,
      default_value: ''
    });
  };

  const openEditDialog = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      field_group: field.field_group || '',
      visible_in_form: field.visible_in_form,
      visible_in_table: field.visible_in_table,
      default_value: field.default_value || ''
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingField(null);
    resetForm();
    setDialogOpen(true);
  };

  const groupedFields = fields.reduce((acc, field) => {
    const group = field.field_group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Field Manager</h1>
            <p className="text-muted-foreground">Manage custom fields for inventory items</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Field
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="field_key">Field Key *</Label>
                  <Input
                    id="field_key"
                    value={formData.field_key}
                    onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                    placeholder="e.g., weight, color"
                    required
                    disabled={!!editingField}
                  />
                  <p className="text-sm text-muted-foreground">Unique identifier (cannot be changed)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field_label">Field Label *</Label>
                  <Input
                    id="field_label"
                    value={formData.field_label}
                    onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                    placeholder="e.g., Weight, Color"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field_type">Field Type</Label>
                  <Select value={formData.field_type} onValueChange={(value) => setFormData({ ...formData, field_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field_group">Field Group</Label>
                  <Input
                    id="field_group"
                    value={formData.field_group}
                    onChange={(e) => setFormData({ ...formData, field_group: e.target.value })}
                    placeholder="e.g., Specifications, Packaging"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_value">Default Value</Label>
                  <Input
                    id="default_value"
                    value={formData.default_value}
                    onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                    placeholder="Optional default value"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="visible_in_form"
                    checked={formData.visible_in_form}
                    onCheckedChange={(checked) => setFormData({ ...formData, visible_in_form: checked })}
                  />
                  <Label htmlFor="visible_in_form">Show in Add/Edit forms</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="visible_in_table"
                    checked={formData.visible_in_table}
                    onCheckedChange={(checked) => setFormData({ ...formData, visible_in_table: checked })}
                  />
                  <Label htmlFor="visible_in_table">Show in table view</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingField ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading fields...</p>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No custom fields yet. Create one to get started!
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedFields).map(([group, groupFields]) => (
                  <div key={group}>
                    <h3 className="text-lg font-semibold mb-4">{group}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Label</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead className="text-center">Form</TableHead>
                          <TableHead className="text-center">Table</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupFields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.field_label}</TableCell>
                            <TableCell className="font-mono text-sm">{field.field_key}</TableCell>
                            <TableCell className="capitalize">{field.field_type}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {field.default_value || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleVisibility(field, 'form')}
                              >
                                {field.visible_in_form ? (
                                  <Eye className="h-4 w-4 text-primary" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleVisibility(field, 'table')}
                              >
                                {field.visible_in_table ? (
                                  <Eye className="h-4 w-4 text-primary" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(field)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(field.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
