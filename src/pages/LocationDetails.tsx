import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api';
import { StockLocation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package, ArrowRightLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function LocationDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const locationId = parseInt(id || '0');
  
  const [search, setSearch] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [page, setPage] = useState(1);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    item_id: 0,
    to_location_id: 0,
    quantity: '',
    notes: '',
  });

  const { data: location } = useQuery({
    queryKey: ['location', locationId],
    queryFn: () => locationsApi.getById(locationId),
  });

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['location-stock', locationId, search, minQty, maxQty, page],
    queryFn: () => locationsApi.getLocationStock(locationId, {
      search,
      min_qty: minQty ? parseInt(minQty) : undefined,
      max_qty: maxQty ? parseInt(maxQty) : undefined,
      page,
    }),
  });

  const { data: allLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getAll,
  });

  const transferMutation = useMutation({
    mutationFn: locationsApi.transferStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-stock'] });
      toast.success('Stock transferred successfully');
      setIsTransferOpen(false);
      setTransferForm({ item_id: 0, to_location_id: 0, quantity: '', notes: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to transfer stock');
    },
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transferMutation.mutate({
      item_id: transferForm.item_id,
      from_location_id: locationId,
      to_location_id: transferForm.to_location_id,
      quantity: parseInt(transferForm.quantity),
      notes: transferForm.notes || undefined,
    });
  };

  const handleExport = () => {
    if (!stockData?.items) return;
    
    const csv = [
      ['Item Name', 'SKU', 'Quantity', 'Min Threshold', 'Last Updated'],
      ...stockData.items.map((stock: StockLocation) => [
        stock.item?.name || '',
        stock.item?.sku || '',
        stock.quantity,
        stock.min_threshold,
        new Date(stock.last_updated).toLocaleDateString(),
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${location?.name}_stock_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Locations
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{location?.name}</h1>
          {location?.address && (
            <p className="text-muted-foreground mt-1">{location.address}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Search Item</Label>
            <Input
              placeholder="Name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label>Min Quantity</Label>
            <Input
              type="number"
              placeholder="Min..."
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
            />
          </div>
          <div>
            <Label>Max Quantity</Label>
            <Input
              type="number"
              placeholder="Max..."
              value={maxQty}
              onChange={(e) => setMaxQty(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch('');
                setMinQty('');
                setMaxQty('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Stock Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Min Threshold</TableHead>
              <TableHead>Last Updated</TableHead>
              {canManage && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : stockData?.items?.length > 0 ? (
              stockData.items.map((stock: StockLocation) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">{stock.item?.name}</TableCell>
                  <TableCell>{stock.item?.sku}</TableCell>
                  <TableCell>
                    <span className={stock.quantity <= stock.min_threshold ? 'text-destructive font-semibold' : ''}>
                      {stock.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{stock.min_threshold}</TableCell>
                  <TableCell>{new Date(stock.last_updated).toLocaleDateString()}</TableCell>
                  {canManage && (
                    <TableCell>
                      <Dialog open={isTransferOpen && transferForm.item_id === stock.item_id} onOpenChange={(open) => {
                        setIsTransferOpen(open);
                        if (open) {
                          setTransferForm({ ...transferForm, item_id: stock.item_id });
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Transfer Stock</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                              <Label>Item</Label>
                              <Input value={stock.item?.name} disabled />
                            </div>
                            <div>
                              <Label>From Location</Label>
                              <Input value={location?.name} disabled />
                            </div>
                            <div>
                              <Label>To Location *</Label>
                              <Select
                                value={transferForm.to_location_id.toString()}
                                onValueChange={(value) => setTransferForm({ ...transferForm, to_location_id: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select destination..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {allLocations
                                    .filter((loc: any) => loc.id !== locationId)
                                    .map((loc: any) => (
                                      <SelectItem key={loc.id} value={loc.id.toString()}>
                                        {loc.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Quantity * (Available: {stock.quantity})</Label>
                              <Input
                                type="number"
                                max={stock.quantity}
                                value={transferForm.quantity}
                                onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label>Notes</Label>
                              <Textarea
                                value={transferForm.notes}
                                onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={transferMutation.isPending}>
                                Transfer
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No stock items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {stockData?.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {stockData.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(stockData.pages, p + 1))}
            disabled={page === stockData.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
