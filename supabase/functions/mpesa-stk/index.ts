import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeKenyanPhone = (value: string): string | null => {
  if (!/^[+\d\s()-]+$/.test(value.trim())) return null;
  const digits = value.replace(/[^\d]/g, '');
  const normalized = digits.startsWith('0') ? `254${digits.slice(1)}` : digits.startsWith('254') ? digits : '';
  return /^254[17]\d{8}$/.test(normalized) ? normalized : null;
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
  const shortcode = Deno.env.get('MPESA_SHORTCODE');
  const passkey = Deno.env.get('MPESA_PASSKEY');
  const callbackToken = Deno.env.get('MPESA_CALLBACK_TOKEN');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !consumerKey || !consumerSecret || !shortcode || !passkey || !callbackToken) {
    console.error('M-Pesa STK Push is missing one or more required server secrets.');
    return jsonResponse(503, { error: 'M-Pesa payments are not configured yet.' });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return jsonResponse(401, { error: 'Sign in to request a payment.' });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return jsonResponse(401, { error: 'Your session is invalid or expired.' });

  let body: { fine_id?: number; phone?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'A valid payment request is required.' });
  }

  const fineId = Number(body.fine_id);
  const phone = normalizeKenyanPhone(typeof body.phone === 'string' ? body.phone : '');
  if (!Number.isSafeInteger(fineId) || fineId < 1) return jsonResponse(400, { error: 'The fine ID is invalid.' });
  if (!phone) return jsonResponse(400, { error: 'Enter a valid Kenyan M-Pesa number, such as 0712345678.' });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: profile, error: profileError }, { data: fine, error: fineError }] = await Promise.all([
    serviceClient
      .from('profiles')
      .select('member_id, role, status')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle(),
    serviceClient
      .from('fines')
      .select('fine_id, member_id, amount, status')
      .eq('fine_id', fineId)
      .maybeSingle(),
  ]);
  if (profileError || !profile) return jsonResponse(403, { error: 'Your library profile could not be verified.' });
  if (profile.status !== 'active') return jsonResponse(403, { error: 'Your library account is not active.' });
  if (fineError || !fine) return jsonResponse(404, { error: 'Fine not found.' });
  if (profile.member_id !== fine.member_id) return jsonResponse(403, { error: 'You can only pay fines on your own account.' });
  if (fine.status !== 'unpaid') return jsonResponse(409, { error: 'This fine is already paid.' });

  const amount = Number(fine.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return jsonResponse(400, { error: 'M-Pesa STK payments require a whole-shilling fine amount.' });
  }

  const { data: payment, error: paymentError } = await serviceClient
    .from('fine_payments')
    .insert({
      fine_id: fine.fine_id,
      member_id: fine.member_id,
      amount,
      phone_number: phone,
      status: 'initiating',
    })
    .select('payment_id')
    .single();
  if (paymentError || !payment) {
    if (paymentError?.code === '23505') {
      return jsonResponse(409, { error: 'An M-Pesa request for this fine is already awaiting a result.' });
    }
    console.error('Could not create an M-Pesa payment record.', paymentError);
    return jsonResponse(500, { error: 'Could not start the payment. Please try again.' });
  }

  const markFailed = async (reason: string) => {
    const { error } = await serviceClient
      .from('fine_payments')
      .update({ status: 'failed', result_description: reason, updated_at: new Date().toISOString() })
      .eq('payment_id', payment.payment_id)
      .eq('status', 'initiating');
    if (error) console.error('Could not record the failed M-Pesa request.', error);
  };

  try {
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}` },
    });
    if (!tokenResponse.ok) {
      await markFailed('Could not authenticate with the M-Pesa sandbox.');
      console.error('M-Pesa OAuth request failed.', tokenResponse.status);
      return jsonResponse(502, { error: 'M-Pesa could not be reached. Please try again later.' });
    }
    const tokenData = await tokenResponse.json();
    if (typeof tokenData.access_token !== 'string') {
      await markFailed('The M-Pesa sandbox returned no access token.');
      console.error('M-Pesa OAuth response did not contain an access token.');
      return jsonResponse(502, { error: 'M-Pesa could not be reached. Please try again later.' });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback?token=${encodeURIComponent(callbackToken)}&payment_id=${payment.payment_id}`;
    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: `FINE${fine.fine_id}`,
        TransactionDesc: 'Library fine',
      }),
    });
    const stkData = await stkResponse.json();
    if (!stkResponse.ok || String(stkData.ResponseCode) !== '0' || !stkData.CheckoutRequestID) {
      const description = typeof stkData.ResponseDescription === 'string'
        ? stkData.ResponseDescription
        : typeof stkData.errorMessage === 'string'
          ? stkData.errorMessage
          : 'M-Pesa rejected the payment request.';
      await markFailed(description);
      return jsonResponse(502, { error: 'M-Pesa could not start the prompt. Check the number and try again.' });
    }

    const { data: updatedPayment, error: updateError } = await serviceClient
      .from('fine_payments')
      .update({
        status: 'pending',
        merchant_request_id: String(stkData.MerchantRequestID ?? ''),
        checkout_request_id: String(stkData.CheckoutRequestID),
        result_description: String(stkData.ResponseDescription ?? 'STK prompt sent.'),
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', payment.payment_id)
      .eq('status', 'initiating')
      .select('status')
      .maybeSingle();
    if (updateError) {
      console.error('M-Pesa accepted a prompt but the request could not be recorded.', updateError);
      return jsonResponse(500, { error: 'M-Pesa accepted the prompt, but its status could not be saved. Contact library staff before retrying.' });
    }
    if (!updatedPayment) {
      const { data: currentPayment, error: currentPaymentError } = await serviceClient
        .from('fine_payments')
        .select('status')
        .eq('payment_id', payment.payment_id)
        .single();
      if (currentPaymentError || !currentPayment) {
        console.error('Could not read the M-Pesa payment status after a callback race.', currentPaymentError);
        return jsonResponse(500, { error: 'M-Pesa accepted the prompt, but its status could not be confirmed. Contact library staff before retrying.' });
      }
      if (currentPayment.status === 'paid') {
        return jsonResponse(200, { payment_id: payment.payment_id, status: 'paid', message: 'Your M-Pesa payment was completed and recorded.' });
      }
      if (currentPayment.status === 'failed') {
        return jsonResponse(409, { error: 'M-Pesa reported that the payment was not completed.' });
      }
    }

    return jsonResponse(200, {
      payment_id: payment.payment_id,
      status: 'pending',
      message: `Check ${phone} and enter your M-Pesa PIN to complete payment.`,
    });
  } catch (error) {
    await markFailed('The M-Pesa sandbox request failed unexpectedly.');
    console.error('M-Pesa STK request failed.', error);
    return jsonResponse(502, { error: 'Could not contact M-Pesa. Please try again later.' });
  }
});
