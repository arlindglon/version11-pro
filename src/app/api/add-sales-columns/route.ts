import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // First, check what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('sales')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      return NextResponse.json({ error: sampleError.message }, { status: 500 });
    }
    
    const existingColumns = sampleData && sampleData.length > 0 
      ? Object.keys(sampleData[0]) 
      : sampleData ? Object.keys(sampleData) : [];
    
    // Check if payments column exists
    const hasPaymentsColumn = existingColumns.includes('payments');
    const hasHistoryColumn = existingColumns.includes('history');
    
    // Try to update a record with payments column to see if it's accepted
    if (!hasPaymentsColumn && sampleData && sampleData.length > 0) {
      const testId = sampleData[0].id;
      
      // Try to add payments field
      const { error: updateError } = await supabase
        .from('sales')
        .update({ payments: '[]' } as any)
        .eq('id', testId);
      
      if (updateError) {
        console.log('Payments column does not exist:', updateError.message);
      } else {
        console.log('Payments column exists or was added');
      }
    }
    
    // Try to update a record with history column
    if (!hasHistoryColumn && sampleData && sampleData.length > 0) {
      const testId = sampleData[0].id;
      
      const { error: updateError } = await supabase
        .from('sales')
        .update({ history: '[]' } as any)
        .eq('id', testId);
      
      if (updateError) {
        console.log('History column does not exist:', updateError.message);
      } else {
        console.log('History column exists or was added');
      }
    }
    
    // Re-check columns after update attempt
    const { data: newData } = await supabase
      .from('sales')
      .select('*')
      .limit(1);
    
    const finalColumns = newData && newData.length > 0 
      ? Object.keys(newData[0]) 
      : newData ? Object.keys(newData) : [];
    
    return NextResponse.json({
      existingColumns,
      finalColumns,
      hasPaymentsColumn: finalColumns.includes('payments'),
      hasHistoryColumn: finalColumns.includes('history'),
      message: 'Column check complete'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
