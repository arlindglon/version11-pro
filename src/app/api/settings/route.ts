import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// Helper to get value from either snake_case or camelCase
const getValue = (obj: Record<string, any>, snakeCase: string, camelCase: string, defaultValue: any = '') => {
  return obj[snakeCase] ?? obj[camelCase] ?? defaultValue;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Fetch settings error:', error);
      // Return default settings
      return NextResponse.json({
        id: 'default',
        shopName: 'Dokan',
        shopLogo: '',
        shopBannerImage: '',
        shopAddress: '',
        shopPhone: '',
        shopEmail: '',
        shopWebsite: '',
        shopBio: '',
        shopServices: '',
        taxId: '',
        registrationNo: '',
        openingHours: '',
        facebookUrl: '',
        instagramUrl: '',
        whatsappNumber: '',
        youtubeUrl: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        bankBranch: '',
        loadingText: 'Loading...',
        currency: 'BDT',
        currencySymbol: '৳',
        taxRate: 0,
        taxEnabled: false,
        allowWalkInCustomer: true,
      });
    }

    console.log('GET settings - raw data:', data);
    console.log('GET settings - allowWalkInCustomer from DB:', getValue(data, 'allow_walk_in_customer', 'allowWalkInCustomer'));

    // Map snake_case DB columns to camelCase for frontend
    return NextResponse.json({
      id: data.id,
      shopName: getValue(data, 'shop_name', 'shopName', 'Dokan'),
      shopLogo: getValue(data, 'shop_logo', 'shopLogo', ''),
      shopBannerImage: getValue(data, 'shop_banner_image', 'shopBannerImage', ''),
      shopAddress: getValue(data, 'shop_address', 'shopAddress', ''),
      shopPhone: getValue(data, 'shop_contact', 'shopContact', ''),
      shopEmail: getValue(data, 'shop_email', 'shopEmail', ''),
      shopWebsite: getValue(data, 'website', 'shopWebsite', ''),
      shopBio: getValue(data, 'shop_bio', 'shopBio', ''),
      shopServices: getValue(data, 'shop_services', 'shopServices', ''),
      taxId: getValue(data, 'tax_id', 'taxId', ''),
      registrationNo: getValue(data, 'registration_no', 'registrationNo', ''),
      openingHours: getValue(data, 'opening_hours', 'openingHours', ''),
      facebookUrl: getValue(data, 'facebook', 'facebookUrl', ''),
      instagramUrl: getValue(data, 'instagram', 'instagramUrl', ''),
      whatsappNumber: getValue(data, 'whatsapp', 'whatsappNumber', ''),
      youtubeUrl: getValue(data, 'youtube_url', 'youtubeUrl', ''),
      bankName: getValue(data, 'bank_name', 'bankName', ''),
      bankAccountName: getValue(data, 'bank_account_name', 'bankAccountName', ''),
      bankAccountNumber: getValue(data, 'bank_account_number', 'bankAccountNumber', ''),
      bankBranch: getValue(data, 'bank_branch', 'bankBranch', ''),
      loadingText: getValue(data, 'loading_text', 'loadingText', 'Loading...'),
      currency: getValue(data, 'currency', 'currency', 'BDT'),
      currencySymbol: getValue(data, 'currency_symbol', 'currencySymbol', '৳'),
      taxRate: getValue(data, 'tax_rate', 'taxRate', 0),
      taxEnabled: getValue(data, 'tax_enabled', 'taxEnabled', false),
      allowWalkInCustomer: getValue(data, 'allow_walk_in_customer', 'allowWalkInCustomer', true) === true,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({
      id: 'default',
      shopName: 'Dokan',
      shopLogo: '',
      shopBannerImage: '',
      shopAddress: '',
      shopPhone: '',
      shopEmail: '',
      shopWebsite: '',
      shopBio: '',
      shopServices: '',
      taxId: '',
      registrationNo: '',
      openingHours: '',
      facebookUrl: '',
      instagramUrl: '',
      whatsappNumber: '',
      youtubeUrl: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankBranch: '',
      loadingText: 'Loading...',
      currency: 'BDT',
      currencySymbol: '৳',
      taxRate: 0,
      taxEnabled: false,
      allowWalkInCustomer: true,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    console.log('PUT settings - received body:', body);
    console.log('PUT settings - allowWalkInCustomer to save:', body.allowWalkInCustomer);

    // Map camelCase frontend to snake_case DB columns
    const updateData: Record<string, any> = {
      id: 'default-settings',
    };

    // Map all fields to snake_case
    if (body.shopName !== undefined) updateData.shop_name = body.shopName;
    if (body.shopLogo !== undefined) updateData.shop_logo = body.shopLogo;
    if (body.shopBannerImage !== undefined) updateData.shop_banner_image = body.shopBannerImage;
    if (body.shopAddress !== undefined) updateData.shop_address = body.shopAddress;
    if (body.shopPhone !== undefined) updateData.shop_contact = body.shopPhone;
    if (body.shopEmail !== undefined) updateData.shop_email = body.shopEmail;
    if (body.shopWebsite !== undefined) updateData.website = body.shopWebsite;
    if (body.shopBio !== undefined) updateData.shop_bio = body.shopBio;
    if (body.shopServices !== undefined) updateData.shop_services = body.shopServices;
    if (body.taxId !== undefined) updateData.tax_id = body.taxId;
    if (body.registrationNo !== undefined) updateData.registration_no = body.registrationNo;
    if (body.openingHours !== undefined) updateData.opening_hours = body.openingHours;
    if (body.currencySymbol !== undefined) updateData.currency_symbol = body.currencySymbol;
    if (body.receiptFooter !== undefined) updateData.receipt_footer = body.receiptFooter;
    if (body.invoiceNote !== undefined) updateData.invoice_note = body.invoiceNote;
    if (body.facebookUrl !== undefined) updateData.facebook = body.facebookUrl;
    if (body.instagramUrl !== undefined) updateData.instagram = body.instagramUrl;
    if (body.whatsappNumber !== undefined) updateData.whatsapp = body.whatsappNumber;
    if (body.youtubeUrl !== undefined) updateData.youtube_url = body.youtubeUrl;
    if (body.bankName !== undefined) updateData.bank_name = body.bankName;
    if (body.bankAccountName !== undefined) updateData.bank_account_name = body.bankAccountName;
    if (body.bankAccountNumber !== undefined) updateData.bank_account_number = body.bankAccountNumber;
    if (body.bankBranch !== undefined) updateData.bank_branch = body.bankBranch;
    if (body.loadingText !== undefined) updateData.loading_text = body.loadingText;
    if (body.allowWalkInCustomer !== undefined) updateData.allow_walk_in_customer = body.allowWalkInCustomer;

    console.log('PUT settings - updateData to save:', updateData);

    // Try update first with WHERE clause
    const { data: updateResult, error: updateError } = await supabase
      .from('app_settings')
      .update(updateData)
      .eq('id', 'default-settings')
      .select()
      .single();

    let data = updateResult;
    let error = updateError;

    // If no rows updated, try upsert
    if (error || !data) {
      console.log('Update failed, trying upsert...', error);
      const { data: upsertResult, error: upsertError } = await supabase
        .from('app_settings')
        .upsert(updateData, { onConflict: 'id' })
        .select()
        .single();

      data = upsertResult;
      error = upsertError;
    }

    if (error) {
      console.error('PUT settings - Supabase error:', error);
      throw error;
    }

    console.log('PUT settings - data from Supabase after save:', data);

    // Return properly formatted response - map snake_case to camelCase
    const responseData = {
      id: data.id,
      shopName: getValue(data, 'shop_name', 'shopName', 'Dokan'),
      shopLogo: getValue(data, 'shop_logo', 'shopLogo', ''),
      shopBannerImage: getValue(data, 'shop_banner_image', 'shopBannerImage', ''),
      shopAddress: getValue(data, 'shop_address', 'shopAddress', ''),
      shopPhone: getValue(data, 'shop_contact', 'shopContact', ''),
      shopEmail: getValue(data, 'shop_email', 'shopEmail', ''),
      shopWebsite: getValue(data, 'website', 'shopWebsite', ''),
      shopBio: getValue(data, 'shop_bio', 'shopBio', ''),
      shopServices: getValue(data, 'shop_services', 'shopServices', ''),
      taxId: getValue(data, 'tax_id', 'taxId', ''),
      registrationNo: getValue(data, 'registration_no', 'registrationNo', ''),
      openingHours: getValue(data, 'opening_hours', 'openingHours', ''),
      facebookUrl: getValue(data, 'facebook', 'facebookUrl', ''),
      instagramUrl: getValue(data, 'instagram', 'instagramUrl', ''),
      whatsappNumber: getValue(data, 'whatsapp', 'whatsappNumber', ''),
      youtubeUrl: getValue(data, 'youtube_url', 'youtubeUrl', ''),
      bankName: getValue(data, 'bank_name', 'bankName', ''),
      bankAccountName: getValue(data, 'bank_account_name', 'bankAccountName', ''),
      bankAccountNumber: getValue(data, 'bank_account_number', 'bankAccountNumber', ''),
      bankBranch: getValue(data, 'bank_branch', 'bankBranch', ''),
      loadingText: getValue(data, 'loading_text', 'loadingText', 'Loading...'),
      currency: getValue(data, 'currency', 'currency', 'BDT'),
      currencySymbol: getValue(data, 'currency_symbol', 'currencySymbol', '৳'),
      taxRate: getValue(data, 'tax_rate', 'taxRate', 0),
      taxEnabled: getValue(data, 'tax_enabled', 'taxEnabled', false),
      allowWalkInCustomer: getValue(data, 'allow_walk_in_customer', 'allowWalkInCustomer', true) === true,
    };

    console.log('PUT settings - returning response:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
