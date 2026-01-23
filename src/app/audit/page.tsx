'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import {
  FileText, RefreshCw, Search, Filter,
  Plus, Minus, Pencil, Trash2, LogIn, UserPlus,
} from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

const actionIcons: Record<string, any> = {
  create: Plus,
  add: Plus,
  update: Pencil,
  delete: Trash2,
  remove: Minus,
  login: LogIn,
  register: UserPlus,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  add: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  remove: 'bg-orange-100 text-orange-800',
  login: 'bg-purple-100 text-purple-800',
  register: 'bg-indigo-100 text-indigo-800',
};

export default function AuditPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; data: AuditLog[] }>('/audit');
      if (response.data) {
        setLogs(response.data);
      }
    } catch {
      // Provide fallback empty state for offline/no-data scenarios
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs
    .filter(log => actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter))
    .filter(log =>
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getActionIcon = (action: string) => {
    const key = Object.keys(actionIcons).find(k => action.toLowerCase().includes(k));
    return key ? actionIcons[key] : FileText;
  };

  const getActionColor = (action: string) => {
    const key = Object.keys(actionColors).find(k => action.toLowerCase().includes(k));
    return key ? actionColors[key] : 'bg-gray-100 text-gray-800';
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Audit Logs</h1>
              <Badge variant="secondary">{filteredLogs.length} entries</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </header>

          <main className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-auto">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Created</SelectItem>
                  <SelectItem value="update">Updated</SelectItem>
                  <SelectItem value="delete">Deleted</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">No audit logs</h3>
                    <p className="text-sm">
                      {logs.length === 0 ? 'No activity recorded yet.' : 'No logs match your filters.'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const Icon = getActionIcon(log.action);
                        return (
                          <TableRow key={log._id}>
                            <TableCell>
                              <Badge className={getActionColor(log.action)}>
                                <Icon className="h-3 w-3 mr-1" />
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{log.entity || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.userName || 'System'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {log.details || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
