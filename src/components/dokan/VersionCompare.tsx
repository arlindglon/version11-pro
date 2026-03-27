'use client';

import React from 'react';
import { X, ArrowRight, Plus, Minus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface FieldChange {
  old: unknown;
  new: unknown;
  type: 'added' | 'removed' | 'modified';
}

interface Props {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changes: Record<string, FieldChange> | null;
  onClose: () => void;
  onRestore?: () => void;
  canRestore?: boolean;
  versionNumber?: number;
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const formatFieldName = (field: string): string => {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export default function VersionCompare({ 
  oldData, 
  newData, 
  changes, 
  onClose, 
  onRestore,
  canRestore = false,
  versionNumber
}: Props) {
  const changeEntries = changes ? Object.entries(changes) : [];
  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {})
  ].filter(k => !k.startsWith('_') && !['createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(k)));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Version Comparison</h3>
            {versionNumber && (
              <p className="text-sm text-slate-500">Version #{versionNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canRestore && onRestore && (
              <Button onClick={onRestore} className="gap-2">
                <Edit className="w-4 h-4" />
                Restore This Version
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="p-6">
            {/* Changes Summary */}
            {changeEntries.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-3">Changes Summary</h4>
                <div className="grid gap-2">
                  {changeEntries.map(([field, change]) => (
                    <div 
                      key={field}
                      className={`p-3 rounded-lg border ${
                        change.type === 'added' ? 'bg-green-50 border-green-200' :
                        change.type === 'removed' ? 'bg-red-50 border-red-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {change.type === 'added' && <Plus className="w-4 h-4 text-green-600" />}
                        {change.type === 'removed' && <Minus className="w-4 h-4 text-red-600" />}
                        {change.type === 'modified' && <Edit className="w-4 h-4 text-blue-600" />}
                        <span className="font-medium">{formatFieldName(field)}</span>
                        <Badge variant="outline" className={
                          change.type === 'added' ? 'border-green-300 text-green-700' :
                          change.type === 'removed' ? 'border-red-300 text-red-700' :
                          'border-blue-300 text-blue-700'
                        }>
                          {change.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-1">Old Value</p>
                          <p className={`font-mono ${change.type === 'added' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {formatValue(change.old)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-1">New Value</p>
                          <p className={`font-mono ${change.type === 'removed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {formatValue(change.new)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Old Data */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  Previous State
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
                  {oldData ? (
                    <pre className="whitespace-pre-wrap text-slate-700">
                      {JSON.stringify(oldData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-slate-400 italic">No previous data</p>
                  )}
                </div>
              </div>

              {/* New Data */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  New State
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
                  {newData ? (
                    <pre className="whitespace-pre-wrap text-slate-700">
                      {JSON.stringify(newData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-slate-400 italic">No new data</p>
                  )}
                </div>
              </div>
            </div>

            {/* All Fields */}
            <div className="mt-6">
              <h4 className="font-semibold text-slate-900 mb-3">All Fields</h4>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-600">Field</th>
                      <th className="text-left p-3 font-medium text-slate-600">Old Value</th>
                      <th className="text-left p-3 font-medium text-slate-600">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.from(allKeys).map((key) => {
                      const oldVal = oldData?.[key as keyof typeof oldData];
                      const newVal = newData?.[key as keyof typeof newData];
                      const hasChange = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                      
                      return (
                        <tr key={key} className={hasChange ? 'bg-yellow-50' : ''}>
                          <td className="p-3 font-medium">{formatFieldName(key)}</td>
                          <td className={`p-3 font-mono text-xs ${hasChange ? 'text-red-600' : 'text-slate-600'}`}>
                            {formatValue(oldVal)}
                          </td>
                          <td className={`p-3 font-mono text-xs ${hasChange ? 'text-green-600' : 'text-slate-600'}`}>
                            {formatValue(newVal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
