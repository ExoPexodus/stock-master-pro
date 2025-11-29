import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ChevronLeft, ChevronRight, Download, Filter, X } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const perPage = 20;
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    entity_type: "",
    entity_id: "",
    start_date: "",
    end_date: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["auditLogs", page, filters],
    queryFn: () => reportsApi.getAuditLogs({ 
      page, 
      per_page: perPage,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      )
    }),
  });

  const logs = data?.logs || [];
  const totalPages = data?.pages || 1;
  
  const handleExport = async () => {
    try {
      const blob = await reportsApi.exportAuditLogs(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        )
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audit logs exported successfully");
    } catch (error) {
      toast.error("Failed to export audit logs");
    }
  };
  
  const clearFilters = () => {
    setFilters({
      user_id: "",
      action: "",
      entity_type: "",
      entity_id: "",
      start_date: "",
      end_date: "",
    });
    setPage(1);
  };
  
  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      CREATE: "default",
      UPDATE: "secondary",
      DELETE: "destructive",
      LOGIN: "default",
      LOGOUT: "secondary",
    };
    return <Badge variant={variants[action] || "secondary"}>{action}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">Track all user activities and system changes</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Filters</CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User ID</label>
                  <Input
                    type="number"
                    placeholder="Filter by user ID"
                    value={filters.user_id}
                    onChange={(e) => {
                      setFilters({ ...filters, user_id: e.target.value });
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Action</label>
                  <Select
                    value={filters.action}
                    onValueChange={(value) => {
                      setFilters({ ...filters, action: value });
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entity Type</label>
                  <Select
                    value={filters.entity_type}
                    onValueChange={(value) => {
                      setFilters({ ...filters, entity_type: value });
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="Item">Item</SelectItem>
                      <SelectItem value="PurchaseOrder">Purchase Order</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Category">Category</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                      <SelectItem value="Location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entity ID</label>
                  <Input
                    type="number"
                    placeholder="Filter by entity ID"
                    value={filters.entity_id}
                    onChange={(e) => {
                      setFilters({ ...filters, entity_id: e.target.value });
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => {
                      setFilters({ ...filters, start_date: e.target.value });
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => {
                      setFilters({ ...filters, end_date: e.target.value });
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
              {hasActiveFilters ? `Filtered results (${data?.total || 0} records)` : "Complete audit trail of system operations"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No audit logs yet</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{log.username || `User #${log.user_id}`}</span>
                              {log.user_email && (
                                <span className="text-xs text-muted-foreground">{log.user_email}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell>{log.entity_type || "-"}</TableCell>
                          <TableCell>{log.entity_id || "-"}</TableCell>
                          <TableCell className="max-w-md truncate">{log.details || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
