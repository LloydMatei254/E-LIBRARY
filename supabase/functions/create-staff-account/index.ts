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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Staff account creation is missing required Supabase server configuration.');
    return jsonResponse(503, { error: 'Staff account creation is not configured yet.' });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse(401, { error: 'Sign in as a super admin to create staff accounts.' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse(401, { error: 'Your session is invalid or expired.' });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: caller, error: callerError } = await serviceClient
    .from('profiles')
    .select('role, status')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (callerError) {
    console.error('Could not verify the staff account creator.', callerError);
    return jsonResponse(500, { error: 'Could not verify your staff permissions.' });
  }
  if (!caller || caller.role !== 'super_admin' || caller.status !== 'active') {
    return jsonResponse(403, { error: 'Only an active super admin can create staff accounts.' });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse(400, { error: 'A valid staff account request is required.' });
  }
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return jsonResponse(400, { error: 'A valid staff account request is required.' });
  }

  const body = rawBody as Record<string, unknown>;
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!fullName || fullName.length > 120) {
    return jsonResponse(400, { error: 'Enter a staff name of 1 to 120 characters.' });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(400, { error: 'Enter a valid staff email address.' });
  }
  if (phone.length > 30) return jsonResponse(400, { error: 'The phone number is too long.' });
  if (password.length < 8) return jsonResponse(400, { error: 'The password must be at least 8 characters.' });

  const { data: existingProfile, error: existingProfileError } = await serviceClient
    .from('profiles')
    .select('member_id')
    .ilike('email', email)
    .maybeSingle();
  if (existingProfileError) {
    console.error('Could not check for an existing staff email.', existingProfileError);
    return jsonResponse(500, { error: 'Could not check whether this email is available.' });
  }
  if (existingProfile) return jsonResponse(409, { error: 'A library profile with this email already exists.' });

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (createError) {
    if (/already|registered/i.test(createError.message)) {
      return jsonResponse(409, { error: 'An account with this email already exists.' });
    }
    console.error('Could not create the staff auth account.', createError);
    return jsonResponse(500, { error: 'Could not create the staff account.' });
  }
  if (!created.user) {
    console.error('Supabase did not return the newly created staff auth account.');
    return jsonResponse(500, { error: 'Could not create the staff account.' });
  }

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .update({ full_name: fullName, email, phone, role: 'librarian', status: 'active' })
    .eq('auth_user_id', created.user.id)
    .select('member_id')
    .maybeSingle();
  if (profileError || !profile) {
    const { error: cleanupError } = await serviceClient.auth.admin.deleteUser(created.user.id);
    if (cleanupError) console.error('Could not remove the incomplete staff auth account.', cleanupError);
    console.error(
      'Could not link the new staff auth account to its library profile.',
      profileError ?? 'The auth trigger did not create a profile row.',
    );
    return jsonResponse(500, { error: 'The staff account could not be linked to a library profile.' });
  }

  return jsonResponse(201, {
    staff: { full_name: fullName, email, role: 'librarian' },
  });
});
