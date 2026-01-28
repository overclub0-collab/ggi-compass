import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageRoleRequest {
  action: 'add' | 'lookup';
  email?: string;
  user_id?: string;
  role?: 'admin' | 'moderator' | 'user';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is an admin
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user: requestingUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the requesting user is an admin
    const { data: adminRole, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ManageRoleRequest = await req.json();
    console.log('Request body:', JSON.stringify(body));

    if (body.action === 'lookup') {
      // Look up user by email
      if (!body.email) {
        return new Response(
          JSON.stringify({ error: '이메일이 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: users, error: lookupError } = await supabaseAuth.auth.admin.listUsers();
      
      if (lookupError) {
        console.error('User lookup error:', lookupError);
        return new Response(
          JSON.stringify({ error: '사용자 조회에 실패했습니다.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const foundUser = users.users.find(u => u.email?.toLowerCase() === body.email?.toLowerCase());
      
      if (!foundUser) {
        return new Response(
          JSON.stringify({ error: '해당 이메일로 가입된 사용자가 없습니다.', found: false }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already has a role
      const { data: existingRole } = await supabaseAuth
        .from('user_roles')
        .select('*')
        .eq('user_id', foundUser.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ 
          found: true, 
          user_id: foundUser.id, 
          email: foundUser.email,
          existing_role: existingRole?.role || null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'add') {
      // Add or update user role
      if (!body.user_id || !body.role) {
        return new Response(
          JSON.stringify({ error: '사용자 ID와 역할이 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if role already exists
      const { data: existingRole } = await supabaseAuth
        .from('user_roles')
        .select('*')
        .eq('user_id', body.user_id)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabaseAuth
          .from('user_roles')
          .update({ role: body.role })
          .eq('id', existingRole.id);

        if (updateError) {
          console.error('Update role error:', updateError);
          return new Response(
            JSON.stringify({ error: '역할 업데이트에 실패했습니다.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Role updated for user ${body.user_id} to ${body.role}`);
        return new Response(
          JSON.stringify({ success: true, action: 'updated', role: body.role }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Insert new role
        const { error: insertError } = await supabaseAuth
          .from('user_roles')
          .insert({ user_id: body.user_id, role: body.role });

        if (insertError) {
          console.error('Insert role error:', insertError);
          return new Response(
            JSON.stringify({ error: '역할 추가에 실패했습니다.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Role added for user ${body.user_id}: ${body.role}`);
        return new Response(
          JSON.stringify({ success: true, action: 'added', role: body.role }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: '유효하지 않은 액션입니다.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
