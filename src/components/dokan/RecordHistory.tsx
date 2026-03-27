'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Clock, 
  User, 
  ChevronRight,
  Eye,
  RotateCcw,
  Package,
  Users,
  Truck,
  ShoppingCart,
  ShoppingBag,
  Calculator,
  Settings,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import VersionCompare from './VersionCompare';

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
  entityType: string;
  entityId: string;
  entityName?: string;
  onClose: () => void;
  onRestore?: (versionNumber: number) => void;
  currentUserRole?: string;
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700 border-green-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  restore: 'bg-purple-100 text-purple-700 border-purple-200',
  void: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function RecordHistory({
  entityType,
  entityId,
  entityName,
  onClose,
  onRestore,
  currentUserRole
}: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [restoring, setRestoring] = useState(false);

  const canRestore = currentUserRole === 'Admin' || currentUserRole === 'SuperAdmin';

  useEffect(() => {
    fetchHistory();
  }, [entityType, entityId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?entityType=${entityType}&entityId=${entityId}`);
      const data = await res.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (!canRestore || !onRestore) return;
    
    setRestoring(true);
    try {
      // Get user context from localStorage
      const userStr = localStorage.getItem('dokan_user');
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          entityType,
          entityId,
          versionNumber,
          context: {
            userId: user?.id,
            userName: user?.name,
            userRole: user?.role,
          }
        })
      });

      const result = await res.json();
      
      if (result.success) {
        onRestore(versionNumber);
        fetchHistory();
        setSelectedLog(null);
      } else {
        alert(result.error || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Version History
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {entityName || entityId.slice(0, 8)} • {entityType}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Timeline */}
        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No history found for this record</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                {/* Timeline entries */}
                <div className="space-y-4">
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white ${
                        log.action === 'create' ? 'bg-green-500' :
                        log.action === 'delete' ? 'bg-red-500' :
                        log.action === 'restore' ? 'bg-purple-500' :
                        'bg-blue-500'
                      }`}></div>

                      {/* Content card */}
                      <div 
                        className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={actionColors[log.action]}>
                              {log.action}
                            </Badge>
                            <span className="text-xs text-slate-400">v{log.version_number}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.created_at)}
                          </div>
                        </div>

                        <p className="text-sm text-slate-700 mb-2">
                          {log.description || `${log.action} ${entityType}`}
                        </p>

                        <div className="flex items-center justify-between">
                          {log.user_name && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <User className="w-3 h-3" />
                              {log.user_name}
                              {log.user_role && (
                                <span className="text-slate-400">({log.user_role})</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {canRestore && index !== 0 && log.action !== 'delete' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-7 text-xs text-purple-600 hover:text-purple-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(log.version_number);
                                }}
                                disabled={restoring}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Changes preview */}
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Changed fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(log.changes).slice(0, 5).map((field) => (
                                <Badge key={field} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                              {Object.keys(log.changes).length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{Object.keys(log.changes).length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Version Compare Modal */}
      {selectedLog && (
        <VersionCompare
          oldData={selectedLog.old_data}
          newData={selectedLog.new_data}
          changes={selectedLog.changes}
          onClose={() => setSelectedLog(null)}
          onRestore={() => handleRestore(selectedLog.version_number)}
          canRestore={canRestore && logs[0]?.id !== selectedLog.id}
          versionNumber={selectedLog.version_number}
        />
      )}
    </div>
  );
}
