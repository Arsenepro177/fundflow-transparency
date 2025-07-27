import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { projectId, amount } = await req.json()

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get donor profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Start transaction by creating donation record
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert([{
        donor_id: profile.id,
        project_id: projectId,
        amount: amount
      }])
      .select()
      .single()

    if (donationError) {
      console.error('Donation error:', donationError)
      return new Response(JSON.stringify({ error: 'Failed to create donation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update project funds_raised
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        funds_raised: supabase.sql`funds_raised + ${amount}`
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Project update error:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update project funds' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create ledger entry
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert([{
        event_type: 'donation',
        details: {
          donation_id: donation.id,
          donor_id: profile.id,
          project_id: projectId,
          amount: amount,
          timestamp: new Date().toISOString()
        }
      }])

    if (ledgerError) {
      console.error('Ledger error:', ledgerError)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      donation: donation 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})