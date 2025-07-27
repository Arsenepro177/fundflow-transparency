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

    const { milestoneId, isValid } = await req.json()

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

    // Get validator profile and verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'validator') {
      return new Response(JSON.stringify({ error: 'Only validators can vote' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create validation record
    const { data: validation, error: validationError } = await supabase
      .from('validations')
      .insert([{
        milestone_id: milestoneId,
        validator_id: profile.id,
        is_valid: isValid
      }])
      .select()
      .single()

    if (validationError) {
      console.error('Validation error:', validationError)
      return new Response(JSON.stringify({ error: 'Failed to create validation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Count positive votes for this milestone
    const { data: positiveVotes, error: countError } = await supabase
      .from('validations')
      .select('id')
      .eq('milestone_id', milestoneId)
      .eq('is_valid', true)

    if (countError) {
      console.error('Count error:', countError)
      return new Response(JSON.stringify({ error: 'Failed to count votes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const positiveVoteCount = positiveVotes?.length || 0
    const APPROVAL_THRESHOLD = 3

    let milestoneUpdated = false

    // If threshold met, update milestone status
    if (positiveVoteCount >= APPROVAL_THRESHOLD) {
      const { error: milestoneUpdateError } = await supabase
        .from('milestones')
        .update({ status: 'COMPLETED' })
        .eq('id', milestoneId)

      if (milestoneUpdateError) {
        console.error('Milestone update error:', milestoneUpdateError)
      } else {
        milestoneUpdated = true

        // Create ledger entry for fund release
        const { error: ledgerError } = await supabase
          .from('ledger')
          .insert([{
            event_type: 'release',
            details: {
              milestone_id: milestoneId,
              validation_id: validation.id,
              positive_votes: positiveVoteCount,
              threshold_met: true,
              timestamp: new Date().toISOString()
            }
          }])

        if (ledgerError) {
          console.error('Ledger error:', ledgerError)
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      validation: validation,
      positive_votes: positiveVoteCount,
      milestone_completed: milestoneUpdated
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