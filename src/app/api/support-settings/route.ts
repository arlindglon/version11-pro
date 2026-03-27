import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// ============================================
// SUPPORT SETTINGS API
// ============================================
// Keys stored in app_config table:
// - support_email
// - support_phone
// - support_address
// - support_hours
// - support_facebook
// - support_whatsapp
// - support_youtube
// - support_tutorials (JSON)
// - support_faqs (JSON)
// - tutorial_categories (JSON)
// - faq_categories (JSON)
// - developer_name
// - developer_website
// - developer_email
// ============================================

// GET - Fetch support settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .or('key.like.support_%,key.like.developer_%,key.like.tutorial_%,key.like.faq_%');

    const settings: Record<string, string> = {};
    
    if (data) {
      data.forEach(item => {
        settings[item.key] = item.value;
      });
    }

    // Parse JSON fields
    let tutorials = [];
    let faqs = [];
    let tutorialCategories = [];
    let faqCategories = [];
    
    try {
      tutorials = settings.support_tutorials ? JSON.parse(settings.support_tutorials) : [];
    } catch {
      tutorials = [];
    }
    
    try {
      faqs = settings.support_faqs ? JSON.parse(settings.support_faqs) : [];
    } catch {
      faqs = [];
    }
    
    try {
      tutorialCategories = settings.tutorial_categories ? JSON.parse(settings.tutorial_categories) : [];
    } catch {
      tutorialCategories = [];
    }
    
    try {
      faqCategories = settings.faq_categories ? JSON.parse(settings.faq_categories) : [];
    } catch {
      faqCategories = [];
    }

    return NextResponse.json({
      supportEmail: settings.support_email || '',
      supportPhone: settings.support_phone || '',
      supportAddress: settings.support_address || '',
      supportHours: settings.support_hours || '',
      supportFacebook: settings.support_facebook || '',
      supportWhatsapp: settings.support_whatsapp || '',
      supportYoutube: settings.support_youtube || '',
      tutorials,
      faqs,
      tutorialCategories,
      faqCategories,
      developerName: settings.developer_name || 'Dokan Team',
      developerWebsite: settings.developer_website || '',
      developerEmail: settings.developer_email || '',
    });
  } catch (error) {
    console.error('Support settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch support settings' }, { status: 500 });
  }
}

// POST - Update support settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const updates: Array<{ key: string; value: string; category: string; description: string }> = [];
    
    // Add simple fields
    if (body.supportEmail !== undefined) {
      updates.push({ key: 'support_email', value: body.supportEmail, category: 'support', description: 'Support email address' });
    }
    if (body.supportPhone !== undefined) {
      updates.push({ key: 'support_phone', value: body.supportPhone, category: 'support', description: 'Support phone number' });
    }
    if (body.supportAddress !== undefined) {
      updates.push({ key: 'support_address', value: body.supportAddress, category: 'support', description: 'Support address' });
    }
    if (body.supportHours !== undefined) {
      updates.push({ key: 'support_hours', value: body.supportHours, category: 'support', description: 'Support hours' });
    }
    if (body.supportFacebook !== undefined) {
      updates.push({ key: 'support_facebook', value: body.supportFacebook, category: 'support', description: 'Support Facebook page' });
    }
    if (body.supportWhatsapp !== undefined) {
      updates.push({ key: 'support_whatsapp', value: body.supportWhatsapp, category: 'support', description: 'Support WhatsApp number' });
    }
    if (body.supportYoutube !== undefined) {
      updates.push({ key: 'support_youtube', value: body.supportYoutube, category: 'support', description: 'Support YouTube channel' });
    }
    if (body.developerName !== undefined) {
      updates.push({ key: 'developer_name', value: body.developerName, category: 'developer', description: 'Developer name' });
    }
    if (body.developerWebsite !== undefined) {
      updates.push({ key: 'developer_website', value: body.developerWebsite, category: 'developer', description: 'Developer website' });
    }
    if (body.developerEmail !== undefined) {
      updates.push({ key: 'developer_email', value: body.developerEmail, category: 'developer', description: 'Developer email' });
    }
    
    // Add JSON fields
    if (body.tutorials !== undefined) {
      updates.push({ key: 'support_tutorials', value: JSON.stringify(body.tutorials), category: 'support', description: 'Video tutorials' });
    }
    if (body.faqs !== undefined) {
      updates.push({ key: 'support_faqs', value: JSON.stringify(body.faqs), category: 'support', description: 'FAQs' });
    }
    if (body.tutorialCategories !== undefined) {
      updates.push({ key: 'tutorial_categories', value: JSON.stringify(body.tutorialCategories), category: 'support', description: 'Tutorial categories' });
    }
    if (body.faqCategories !== undefined) {
      updates.push({ key: 'faq_categories', value: JSON.stringify(body.faqCategories), category: 'support', description: 'FAQ categories' });
    }

    // Upsert each setting
    for (const update of updates) {
      await supabase
        .from('app_config')
        .upsert({
          key: update.key,
          value: update.value,
          category: update.category,
          description: update.description,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support settings POST error:', error);
    return NextResponse.json({ error: 'Failed to save support settings' }, { status: 500 });
  }
}
