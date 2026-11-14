import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  const expectedToken = Deno.env.get('MPESA_CALLBACK_TOKEN');
  const callbackUrl = new URL(request.url);
  const actualToken = callbackUrl.searchParams.get('token');
  if (!expectedToken || !actualToken || actualToken !== expectedToken) {
    return jsonResponse(401, { error: 'Unauthorized callback.' });
  }
  const paymentId = Number(callbackUrl.searchParams.get('payment_id'));
  if (!Number.isSafeInteger(paymentId) || paymentId < 1) {
    return jsonResponse(400, { error: 'Callback is missing a valid payment reference.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('M-Pesa callback is missing Supabase server configuration.');
    return jsonResponse(503, { error: 'Callback is not configured.' });
  }

  let callback: {
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        ResultCode?: number;
        ResultDesc?: string;
        CallbackMetadata?: { Item?: { Name?: string; Value?: string | number }[] };
      };
    };
  };
  try {
    callback = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid callback body.' });
  }

  const stkCallback = callback.Body?.stkCallback;
  const checkoutRequestId = stkCallback?.CheckoutRequestID;
  const resultCode = Number(stkCallback?.ResultCode);
  if (!checkoutRequestId || !Number.isInteger(resultCode)) {
    return jsonResponse(400, { error: 'Callback is missing payment result details.' });
  }

  const metadata = stkCallback?.CallbackMetadata?.Item ?? [];
  const receipt = metadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value;
  const amountValue = metadata.find((item) => item.Name === 'Amount')?.Value;
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc('finalize_mpesa_payment', {
    p_payment_id: paymentId,
    p_checkout_request_id: checkoutRequestId,
    p_result_code: resultCode,
    p_result_description: stkCallback?.ResultDesc ?? '',
    p_amount: amountValue === undefined ? null : Number(amountValue),
    p_mpesa_receipt_number: receipt === undefined ? null : String(receipt),
  });
  if (error || !data) {
    console.error('Could not reconcile an M-Pesa callback.', error);
    return jsonResponse(500, { error: 'Payment result could not be recorded.' });
  }

  return jsonResponse(200, { ResultCode: 0, ResultDesc: 'Accepted' });
});
