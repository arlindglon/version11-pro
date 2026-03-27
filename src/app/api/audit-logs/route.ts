import { NextRequest, NextResponse } from 'next/server';
import { queryActivityLogs, getEntityHistory, getRecentActivity, getActivityStats, restoreEntityVersion } from '@/lib/activity-logger';
import { EntityType, ActionType } from '@/lib/activity-logger';

// GET - Fetch activity logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if requesting recent activity
    const recent = searchParams.get('recent');
    if (recent === 'true') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const data = await getRecentActivity(limit);
      return NextResponse.json({ data });
    }

    // Check if requesting stats
    const stats = searchParams.get('stats');
    if (stats === 'true') {
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const data = await getActivityStats(startDate, endDate);
      return NextResponse.json(data);
    }

    // Check if requesting entity history
    const entityType = searchParams.get('entityType') as EntityType | null;
    const entityId = searchParams.get('entityId');
    
    if (entityType && entityId) {
      const data = await getEntityHistory(entityType, entityId);
      return NextResponse.json({ data });
    }

    // General query with pagination
    const query = {
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      action: searchParams.get('action') as ActionType | undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await queryActivityLogs(query);
    
    return NextResponse.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error('Error in activity logs API:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

// POST - Restore a version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Only allow restore action
    if (body.action !== 'restore') {
      return NextResponse.json({ error: 'Invalid action. Only restore is allowed.' }, { status: 400 });
    }

    const { entityType, entityId, versionNumber, context } = body;

    if (!entityType || !entityId || !versionNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await restoreEntityVersion(
      entityType as EntityType,
      entityId,
      versionNumber,
      {
        userId: context?.userId,
        userName: context?.userName,
        userRole: context?.userRole,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error in activity logs POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
