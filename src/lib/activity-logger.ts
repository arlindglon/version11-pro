/**
 * Activity Logger Service
 * Centralized logging for all entity changes with version control
 */

import { supabase } from './db';
import { computeDiff, generateChangeDescription, filterSensitiveFields, DiffResult } from './diff-utils';

// Types
export type EntityType = 'products' | 'customers' | 'suppliers' | 'sales' | 'purchases' | 'expenses' | 'users' | 'categories' | 'settings';
export type ActionType = 'create' | 'update' | 'delete' | 'restore' | 'void';

export interface ActivityLogEntry {
  id?: string;
  entity_type: EntityType;
  entity_id: string;
  action: ActionType;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  changes?: Record<string, { old: unknown; new: unknown; type: string }>;
  version_number?: number;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
  description?: string;
  notes?: string;
  restored_from_id?: string;
  restored_by_id?: string;
  restored_by_name?: string;
  restored_at?: Date;
  branch_id?: string;
  created_at?: Date;
}

export interface LogContext {
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  branchId?: string;
  notes?: string;
}

export interface ActivityLogQuery {
  entityType?: EntityType;
  entityId?: string;
  action?: ActionType;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Log an activity (main entry point)
 */
export async function logActivity(
  entityType: EntityType,
  entityId: string,
  action: ActionType,
  oldData: Record<string, unknown> | null | undefined,
  newData: Record<string, unknown> | null | undefined,
  context: LogContext = {}
): Promise<ActivityLogEntry | null> {
  try {
    // Filter sensitive data
    const filteredOldData = oldData ? filterSensitiveFields(oldData) : null;
    const filteredNewData = newData ? filterSensitiveFields(newData) : null;

    // Compute diff for updates
    let diff: DiffResult | null = null;
    if (action === 'update' && filteredOldData && filteredNewData) {
      diff = computeDiff(filteredOldData, filteredNewData);
    }

    // Get next version number
    const versionNumber = await getNextVersionNumber(entityType, entityId);

    // Generate description
    const entityName = (filteredNewData?.name || filteredOldData?.name || filteredNewData?.customerName || filteredOldData?.customerName) as string | undefined;
    const description = generateChangeDescription(entityType, action, diff?.changes || {}, entityName);

    // Use only the most basic fields that are guaranteed to exist
    const logEntry = {
      entity_type: entityType,
      entity_id: entityId,
      action,
    };

    // Try to add data fields - these might exist or not
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          ...logEntry,
          old_data: filteredOldData,
          new_data: filteredNewData,
          user_id: context.userId,
          user_name: context.userName,
        }])
        .select()
        .single();

      if (error) {
        // If that fails, try with just the basic fields
        console.error('Failed to log activity with full data:', error);
        
        const { data: basicData, error: basicError } = await supabase
          .from('audit_logs')
          .insert([logEntry])
          .select()
          .single();
          
        if (basicError) {
          console.error('Failed to log activity with basic data:', basicError);
          return null;
        }
        
        return basicData as ActivityLogEntry;
      }

      return data as ActivityLogEntry;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

/**
 * Get next version number for an entity
 */
async function getNextVersionNumber(entityType: string, entityId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('version_number')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 1;
    }

    return (data[0].version_number || 0) + 1;
  } catch {
    return 1;
  }
}

/**
 * Query activity logs
 */
export async function queryActivityLogs(query: ActivityLogQuery = {}): Promise<{ data: ActivityLogEntry[]; total: number; page: number; limit: number }> {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const offset = (page - 1) * limit;

  try {
    let queryBuilder = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (query.entityType) {
      queryBuilder = queryBuilder.eq('entity_type', query.entityType);
    }
    if (query.entityId) {
      queryBuilder = queryBuilder.eq('entity_id', query.entityId);
    }
    if (query.action) {
      queryBuilder = queryBuilder.eq('action', query.action);
    }
    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }
    if (query.startDate) {
      queryBuilder = queryBuilder.gte('created_at', query.startDate.toISOString());
    }
    if (query.endDate) {
      queryBuilder = queryBuilder.lte('created_at', query.endDate.toISOString());
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to query activity logs:', error);
      return { data: [], total: 0, page, limit };
    }

    return {
      data: (data || []) as ActivityLogEntry[],
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error querying activity logs:', error);
    return { data: [], total: 0, page, limit };
  }
}

/**
 * Get history for a specific entity
 */
export async function getEntityHistory(entityType: EntityType, entityId: string): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get entity history:', error);
      return [];
    }

    return (data || []) as ActivityLogEntry[];
  } catch (error) {
    console.error('Error getting entity history:', error);
    return [];
  }
}

/**
 * Get a specific version of an entity
 */
export async function getEntityVersion(entityType: EntityType, entityId: string, versionNumber: number): Promise<ActivityLogEntry | null> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('version_number', versionNumber)
      .single();

    if (error) {
      console.error('Failed to get entity version:', error);
      return null;
    }

    return data as ActivityLogEntry;
  } catch (error) {
    console.error('Error getting entity version:', error);
    return null;
  }
}

/**
 * Restore an entity to a specific version
 * Only Admin and SuperAdmin can perform restores
 */
export async function restoreEntityVersion(
  entityType: EntityType,
  entityId: string,
  versionNumber: number,
  context: LogContext
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    // Check permissions - only Admin can restore
    if (context.userRole && !['Admin', 'SuperAdmin'].includes(context.userRole)) {
      return { success: false, error: 'Permission denied. Only Admin can restore versions.' };
    }

    // Get the version to restore
    const version = await getEntityVersion(entityType, entityId, versionNumber);
    if (!version) {
      return { success: false, error: 'Version not found' };
    }

    const dataToRestore = version.new_data;
    if (!dataToRestore) {
      return { success: false, error: 'No data to restore' };
    }

    // Get current state before restore
    const { data: currentData } = await supabase
      .from(entityType)
      .select('*')
      .eq('id', entityId)
      .single();

    // Restore the data
    const { error: restoreError } = await supabase
      .from(entityType)
      .update({
        ...dataToRestore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entityId);

    if (restoreError) {
      return { success: false, error: restoreError.message };
    }

    // Log the restore action
    await logActivity(
      entityType,
      entityId,
      'restore',
      currentData || null,
      dataToRestore,
      {
        ...context,
        notes: `Restored to version ${versionNumber}`,
      }
    );

    return { success: true, data: dataToRestore };
  } catch (error) {
    console.error('Error restoring entity version:', error);
    return { success: false, error: 'Failed to restore version' };
  }
}

/**
 * Get recent activity (for dashboard)
 */
export async function getRecentActivity(limit: number = 20): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }

    return (data || []) as ActivityLogEntry[];
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(startDate?: Date, endDate?: Date): Promise<{
  totalActions: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byUser: Record<string, number>;
}> {
  try {
    let query = supabase.from('audit_logs').select('action, entity_type, user_name');

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data) {
      return { totalActions: 0, byAction: {}, byEntityType: {}, byUser: {} };
    }

    const byAction: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    for (const item of data) {
      byAction[item.action] = (byAction[item.action] || 0) + 1;
      byEntityType[item.entity_type] = (byEntityType[item.entity_type] || 0) + 1;
      const userName = item.user_name || 'System';
      byUser[userName] = (byUser[userName] || 0) + 1;
    }

    return {
      totalActions: data.length,
      byAction,
      byEntityType,
      byUser,
    };
  } catch {
    return { totalActions: 0, byAction: {}, byEntityType: {}, byUser: {} };
  }
}
