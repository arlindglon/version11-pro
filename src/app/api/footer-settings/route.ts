import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET - Fetch footer settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .or('key.like.footer_%,key.like.developer_%');

    const settings: Record<string, string> = {};
    
    if (data) {
      data.forEach(item => {
        settings[item.key] = item.value;
      });
    }

    return NextResponse.json({
      companyName: settings.footer_company_name || '',
      companyAddress: settings.footer_company_address || '',
      companyPhone: settings.footer_company_phone || '',
      companyEmail: settings.footer_company_email || '',
      facebookUrl: settings.footer_facebook || '',
      instagramUrl: settings.footer_instagram || '',
      youtubeUrl: settings.footer_youtube || '',
      whatsappNumber: settings.footer_whatsapp || '',
      developerName: settings.developer_name || 'Dokan Team',
      developerWebsite: settings.developer_website || '',
      developerEmail: settings.developer_email || '',
      showDeveloperCredit: settings.footer_show_developer !== 'false',
      customFooterText: settings.footer_custom_text || '',
      // New toggle options
      showFooter: settings.footer_show !== 'false',
      showQuickLinks: settings.footer_show_quick_links !== 'false',
      showContact: settings.footer_show_contact !== 'false',
      showSupport: settings.footer_show_support !== 'false',
      showSocialLinks: settings.footer_show_social_links !== 'false',
    });
  } catch (error) {
    console.error('Footer settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch footer settings' }, { status: 500 });
  }
}

// POST - Update footer settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const updates: Array<{ key: string; value: string; category: string; description: string }> = [];
    
    // Add fields
    if (body.companyName !== undefined) {
      updates.push({ key: 'footer_company_name', value: body.companyName, category: 'footer', description: 'Company name for footer' });
    }
    if (body.companyAddress !== undefined) {
      updates.push({ key: 'footer_company_address', value: body.companyAddress, category: 'footer', description: 'Company address for footer' });
    }
    if (body.companyPhone !== undefined) {
      updates.push({ key: 'footer_company_phone', value: body.companyPhone, category: 'footer', description: 'Company phone for footer' });
    }
    if (body.companyEmail !== undefined) {
      updates.push({ key: 'footer_company_email', value: body.companyEmail, category: 'footer', description: 'Company email for footer' });
    }
    if (body.facebookUrl !== undefined) {
      updates.push({ key: 'footer_facebook', value: body.facebookUrl, category: 'footer', description: 'Facebook URL for footer' });
    }
    if (body.instagramUrl !== undefined) {
      updates.push({ key: 'footer_instagram', value: body.instagramUrl, category: 'footer', description: 'Instagram URL for footer' });
    }
    if (body.youtubeUrl !== undefined) {
      updates.push({ key: 'footer_youtube', value: body.youtubeUrl, category: 'footer', description: 'YouTube URL for footer' });
    }
    if (body.whatsappNumber !== undefined) {
      updates.push({ key: 'footer_whatsapp', value: body.whatsappNumber, category: 'footer', description: 'WhatsApp number for footer' });
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
    if (body.showDeveloperCredit !== undefined) {
      updates.push({ key: 'footer_show_developer', value: body.showDeveloperCredit ? 'true' : 'false', category: 'footer', description: 'Show developer credit' });
    }
    if (body.customFooterText !== undefined) {
      updates.push({ key: 'footer_custom_text', value: body.customFooterText, category: 'footer', description: 'Custom footer text' });
    }
    
    // New toggle options
    if (body.showFooter !== undefined) {
      updates.push({ key: 'footer_show', value: body.showFooter ? 'true' : 'false', category: 'footer', description: 'Show footer' });
    }
    if (body.showQuickLinks !== undefined) {
      updates.push({ key: 'footer_show_quick_links', value: body.showQuickLinks ? 'true' : 'false', category: 'footer', description: 'Show quick links section' });
    }
    if (body.showContact !== undefined) {
      updates.push({ key: 'footer_show_contact', value: body.showContact ? 'true' : 'false', category: 'footer', description: 'Show contact section' });
    }
    if (body.showSupport !== undefined) {
      updates.push({ key: 'footer_show_support', value: body.showSupport ? 'true' : 'false', category: 'footer', description: 'Show support section' });
    }
    if (body.showSocialLinks !== undefined) {
      updates.push({ key: 'footer_show_social_links', value: body.showSocialLinks ? 'true' : 'false', category: 'footer', description: 'Show social links' });
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
    console.error('Footer settings POST error:', error);
    return NextResponse.json({ error: 'Failed to save footer settings' }, { status: 500 });
  }
}
