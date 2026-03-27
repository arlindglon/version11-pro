/**
 * Diff Utilities for comparing old and new data
 * Used by the Activity Logging System to track changes
 */

export interface FieldChange {
  old: unknown;
  new: unknown;
  type: 'added' | 'removed' | 'modified';
}

export interface DiffResult {
  changes: Record<string, FieldChange>;
  hasChanges: boolean;
  changeCount: number;
  addedFields: string[];
  removedFields: string[];
  modifiedFields: string[];
}

/**
 * Compare two objects and return the differences
 */
export function computeDiff(oldData: Record<string, unknown> | null | undefined, newData: Record<string, unknown> | null | undefined): DiffResult {
  const changes: Record<string, FieldChange> = {};
  const addedFields: string[] = [];
  const removedFields: string[] = [];
  const modifiedFields: string[] = [];

  // Handle null/undefined cases
  const oldObj = oldData || {};
  const newObj = newData || {};

  // Get all unique keys
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    // Skip internal fields
    if (key.startsWith('_') || key === 'createdAt' || key === 'updatedAt' || key === 'created_at' || key === 'updated_at') {
      continue;
    }

    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (oldValue === undefined && newValue !== undefined) {
      // Field added
      changes[key] = { old: undefined, new: newValue, type: 'added' };
      addedFields.push(key);
    } else if (oldValue !== undefined && newValue === undefined) {
      // Field removed
      changes[key] = { old: oldValue, new: undefined, type: 'removed' };
      removedFields.push(key);
    } else if (!areEqual(oldValue, newValue)) {
      // Field modified
      changes[key] = { old: oldValue, new: newValue, type: 'modified' };
      modifiedFields.push(key);
    }
  }

  const hasChanges = addedFields.length > 0 || removedFields.length > 0 || modifiedFields.length > 0;

  return {
    changes,
    hasChanges,
    changeCount: addedFields.length + removedFields.length + modifiedFields.length,
    addedFields,
    removedFields,
    modifiedFields,
  };
}

/**
 * Deep equality check
 */
function areEqual(a: unknown, b: unknown): boolean {
  // Handle null/undefined
  if (a === null && b === null) return true;
  if (a === undefined && b === undefined) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;

  // Handle primitives
  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => areEqual(item, b[index]));
  }

  // Handle objects
  if (Array.isArray(a) || Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(key => areEqual(aObj[key], bObj[key]));
}

/**
 * Generate human-readable description of changes
 */
export function generateChangeDescription(
  entityType: string,
  action: 'create' | 'update' | 'delete' | 'restore' | 'void',
  changes: Record<string, FieldChange>,
  entityName?: string
): string {
  const entityLabel = getEntityLabel(entityType);
  const name = entityName ? ` "${entityName}"` : '';

  switch (action) {
    case 'create':
      return `Created new ${entityLabel}${name}`;
    
    case 'delete':
      return `Deleted ${entityLabel}${name}`;
    
    case 'restore':
      return `Restored ${entityLabel}${name}`;
    
    case 'void':
      return `Voided ${entityLabel}${name}`;
    
    case 'update': {
      const changeKeys = Object.keys(changes);
      if (changeKeys.length === 0) {
        return `Updated ${entityLabel}${name} (no field changes)`;
      }
      
      const formattedFields = changeKeys
        .slice(0, 5)
        .map(formatFieldName)
        .join(', ');
      
      const more = changeKeys.length > 5 ? ` and ${changeKeys.length - 5} more` : '';
      return `Updated ${entityLabel}${name}: ${formattedFields}${more}`;
    }
    
    default:
      return `Unknown action on ${entityLabel}${name}`;
  }
}

/**
 * Get human-readable entity label
 */
export function getEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    products: 'Product',
    customers: 'Customer',
    suppliers: 'Supplier',
    sales: 'Sale',
    purchases: 'Purchase',
    expenses: 'Expense',
    users: 'User',
    categories: 'Category',
    settings: 'Settings',
  };
  return labels[entityType] || entityType;
}

/**
 * Format field name for display
 */
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format value for display in change log
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...';
  }
  
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Filter sensitive fields from data
 */
export function filterSensitiveFields(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'api_key'];
  const filtered: Record<string, unknown> = { ...data };
  
  for (const field of sensitiveFields) {
    if (filtered[field] !== undefined) {
      filtered[field] = '********';
    }
  }
  
  return filtered;
}

/**
 * Create a summary of changes for quick display
 */
export function createChangeSummary(diff: DiffResult): string[] {
  const summary: string[] = [];
  
  for (const field of diff.addedFields) {
    const change = diff.changes[field];
    summary.push(`+ ${formatFieldName(field)}: ${formatValue(change.new)}`);
  }
  
  for (const field of diff.removedFields) {
    const change = diff.changes[field];
    summary.push(`- ${formatFieldName(field)}: ${formatValue(change.old)}`);
  }
  
  for (const field of diff.modifiedFields) {
    const change = diff.changes[field];
    summary.push(`~ ${formatFieldName(field)}: ${formatValue(change.old)} → ${formatValue(change.new)}`);
  }
  
  return summary;
}
