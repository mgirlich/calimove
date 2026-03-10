import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function handleInvite(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const jwt = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(jwt)
  if (userError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  if (user.app_metadata?.is_admin !== true) {
    return json({ error: 'Forbidden' }, 403)
  }

  const { email } = (await req.json()) as { email: string }
  if (!email) {
    return json({ error: 'Missing email' }, 400)
  }

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  if (error) {
    return json({ error: error.message }, 400)
  }

  return json({ success: true }, 200)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  return handleInvite(req, supabaseAdmin)
})
