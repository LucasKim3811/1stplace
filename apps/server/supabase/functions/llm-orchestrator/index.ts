import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, payload } = await req.json();
    console.log(`LLM call for role: ${role}`);

    const validRoles = ['planner', 'programmer', 'reviewer', 'evaluator'] as const;
    type RoleType = typeof validRoles[number];

    if (!validRoles.includes(role as RoleType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be: planner, programmer, reviewer, evaluator' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Build system prompts based on role
    const systemPrompts: Record<RoleType, string> = {
      planner: `You are the Planner for an RTL PPA optimizer. Propose 2-3 SAFE optimization candidates that do NOT change I/O interfaces. 
Use only these transforms: pipeline_depth, unroll_factor, fsm_encoding, abc_script, resource_sharing, clock_period_ns.
Return valid JSON: {"candidates":[{"transform":"...", "params":{...}, "rationale":"..."}]}`,
      
      programmer: `You are the Programmer for an RTL optimizer. Apply the requested transform to the Verilog code.
Return valid JSON: {"patches":[{"path":"...", "unified_diff":"..."}], "explanation":"..."}`,
      
      reviewer: `You are the Reviewer. Check if the proposed changes are safe and maintain functional correctness.
Return valid JSON: {"ok": true/false, "reasons":["..."]}`,
      
      evaluator: `You are the Evaluator. Decide if optimization should stop based on results.
Return valid JSON: {"stop": true/false, "reason":"..."}`
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[role as RoleType] },
          { role: 'user', content: JSON.stringify(payload) }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(generatedText);
    } catch {
      // If not valid JSON, wrap it
      result = { raw_response: generatedText };
    }

    console.log(`LLM ${role} response:`, result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in llm-orchestrator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});