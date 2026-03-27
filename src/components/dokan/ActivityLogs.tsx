'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Users,
  Truck,
  ShoppingCart,
  ShoppingBag,
  Calculator,
  Settings,
  FileText,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  Ban,
  Clock,
  User,
  Eye
} from 'lucide-react';
import { formatCurrency } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'void';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changes: Record<string, { old: unknown; new: unknown; type: string }> | null;
  version_number: number;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  description: string | null;
  created_at: string;
}

interface Props {
  onViewRecord?: (entityType: string, entityId: string) => void;
  onViewVersion?: (log: ActivityLog) => void;
  currentUserRole?: string;
}

const entityIcons: Record<string, React.ReactNode> = {
  products: <Package className="w-4 h-4" />,
  customers: <Users className="w-4 h-4" />,
  suppliers: <Truck className="w-4 h-4" />,
  sales: <ShoppingCart className="w-4 h-4" />,
  purchases: <ShoppingBag className="w-4 h-4" />,
  expenses: <Calculator className="w-4 h-4" />,
  users: <User className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  categories: <FileText className="w-4 h-4" />,
};

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  restore: <RotateCcw className="w-4 h-4" />,
  void: <Ban className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700 border-green-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  restore: 'bg-purple-100 text-purple-700 border-purple-200',
  void: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function ActivityLogs({ onViewRecord, onViewVersion, currentUserRole }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const canRestore = currentUserRole === 'Admin' || currentUserRole === 'SuperAdmin';

  useEffect(() => {
    fetchLogs();
  }, [page, filterEntity, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (filterEntity !== 'all') params.set('entityType', filterEntity);
      if (filterAction !== 'all') params.set('action', filterAction);

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      
      setLogs(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.description?.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      log.user_name?.toLowerCase().includes(search) ||
      log.entity_id.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEntityName = (log: ActivityLog): string => {
    const data = log.new_data || log.old_data;
    if (!data) return log.entity_id.slice(0, 8);
    return (data.name as string) || (data.customerName as string) || (data.supplierName as string) || log.entity_id.slice(0, 8);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Activity Logs</h2>
          <p className="text-slate-500">Track all changes across your system</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="customers">Customers</SelectItem>
            <SelectItem value="suppliers">Suppliers</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="purchases">Purchases</SelectItem>
            <SelectItem value="expenses">Expenses</SelectItem>
            <SelectItem value="users">Users</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="restore">Restore</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Created</p>
              <p className="text-xl font-bold">{logs.filter(l => l.action === 'create').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Updated</p>
              <p className="text-xl font-bold">{logs.filter(l => l.action === 'update').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Deleted</p>
              <p className="text-xl font-bold">{logs.filter(l => l.action === 'delete').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onViewVersion?.(log)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${actionColors[log.action]}`}>
                      {actionIcons[log.action]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">
                          {entityIcons[log.entity_type]}
                          <span className="ml-1 capitalize">{log.entity_type}</span>
                        </span>
                        <Badge variant="outline" className={actionColors[log.action]}>
                          {log.action}
                        </Badge>
                        <span className="text-sm text-slate-400">v{log.version_number}</span>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-1">
                        {log.description || `${log.action} ${log.entity_type}`}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </span>
                        {log.user_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user_name}
                          </span>
                        )}
                        <span className="truncate">
                          ID: {log.entity_id.slice(0, 8)}...
                        </span>
                      </div>

                      {/* Changes preview */}
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.keys(log.changes).slice(0, 4).map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {Object.keys(log.changes).length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{Object.keys(log.changes).length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {onViewRecord && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewRecord(log.entity_type, log.entity_id);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
