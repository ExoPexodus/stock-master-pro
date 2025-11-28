import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types';
import { Package, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemsModal } from '@/components/dashboard/ItemsModal';
import { LowStockModal } from '@/components/dashboard/LowStockModal';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await api.get<DashboardStats>('/reports/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold">Dashboard</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="hover-scale cursor-pointer transition-all hover:shadow-lg"
            onClick={() => setItemsModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_items || 0}</div>
              <p className="text-xs text-muted-foreground">
                Click to view all items
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_stock || 0}</div>
              <p className="text-xs text-muted-foreground">
                Units across all warehouses
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover-scale cursor-pointer transition-all hover:shadow-lg border-orange-200 dark:border-orange-900"
            onClick={() => setLowStockModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats?.low_stock_items || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Click to view details
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.recent_activities.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Actions in last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_activities.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ItemsModal isOpen={itemsModalOpen} onClose={() => setItemsModalOpen(false)} />
      <LowStockModal isOpen={lowStockModalOpen} onClose={() => setLowStockModalOpen(false)} />
    </Layout>
  );
};

export default Dashboard;
