import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Download, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LowStockItem {
  id: number;
  sku: string;
  name: string;
  current_stock: number;
  reorder_level: number;
  warehouse_id: number;
}

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LowStockModal = ({ isOpen, onClose }: LowStockModalProps) => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLowStockItems();
    }
  }, [isOpen]);

  const fetchLowStockItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<LowStockItem[]>('/reports/low-stock');
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch low stock items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['SKU', 'Name', 'Current Stock', 'Reorder Level', 'Warehouse ID'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => 
        [item.sku, item.name, item.current_stock, item.reorder_level, item.warehouse_id].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'low-stock-items.csv';
    a.click();
  };

  const getStockLevel = (current: number, reorder: number) => {
    const percentage = (current / reorder) * 100;
    if (percentage === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (percentage < 50) return { label: 'Critical', variant: 'destructive' as const };
    if (percentage < 100) return { label: 'Low', variant: 'secondary' as const };
    return { label: 'Normal', variant: 'default' as const };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Items
          </DialogTitle>
          <DialogDescription>Items that are below their reorder threshold</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No low stock items found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const status = getStockLevel(item.current_stock, item.reorder_level);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="font-semibold">{item.current_stock}</TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
