import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LookupRequest {
  phone: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LookupRequest = await req.json();

    if (!body.phone || !body.password) {
      return new Response(
        JSON.stringify({ error: "연락처와 비밀번호를 입력해 주세요." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Looking up inquiry for phone: ${body.phone}`);

    // Find inquiries matching phone and password
    const { data: inquiries, error } = await supabase
      .from("inquiries")
      .select("id, title, status, admin_reply, replied_at, created_at")
      .eq("phone", body.phone.trim())
      .eq("password", body.password)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lookup error:", error);
      return new Response(
        JSON.stringify({ error: "조회 중 오류가 발생했습니다." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!inquiries || inquiries.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "일치하는 문의 내역이 없습니다. 연락처와 비밀번호를 확인해 주세요." 
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${inquiries.length} inquiries`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inquiries 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in lookup-inquiry:", error);
    return new Response(
      JSON.stringify({ error: "서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
