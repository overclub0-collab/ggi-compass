import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LookupRequest {
  phone: string;
  password: string;
}

// Rate limiting configuration for lookup attempts
// Stricter limits to prevent password guessing attacks
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOOKUP_ATTEMPTS = 3; // 3 attempts per 24 hours per IP

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP from headers
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    console.log(`Lookup attempt from IP: ${clientIP}`);

    // Rate limiting check - use a separate prefix to differentiate from inquiry submissions
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const rateLimitKey = `lookup_${clientIP}`;
    
    const { count, error: countError } = await supabase
      .from("inquiry_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", rateLimitKey)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if (count !== null && count >= MAX_LOOKUP_ATTEMPTS) {
      console.log(`Lookup rate limit exceeded for IP: ${clientIP}, count: ${count}`);
      return new Response(
        JSON.stringify({ 
          error: "조회 시도 횟수가 초과되었습니다. 1시간 후에 다시 시도해 주세요." 
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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

    // Record this lookup attempt for rate limiting
    await supabase.from("inquiry_rate_limits").insert({
      ip_address: rateLimitKey,
    });

    // Find inquiries matching phone number first (get hashed passwords)
    const { data: inquiries, error } = await supabase
      .from("inquiries")
      .select("id, title, status, admin_reply, replied_at, created_at, password")
      .eq("phone", body.phone.trim())
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

    // Filter inquiries by comparing password hash
    const matchingInquiries = [];
    for (const inquiry of inquiries) {
      try {
        // Check if password is hashed (bcrypt hashes start with $2)
        const isHashed = inquiry.password.startsWith('$2');
        let isMatch = false;
        
        if (isHashed) {
          isMatch = await bcrypt.compare(body.password, inquiry.password);
        } else {
          // Legacy plain text password comparison (for existing data)
          isMatch = inquiry.password === body.password;
        }
        
        if (isMatch) {
          // Remove password from result before sending to client
          const { password, ...inquiryWithoutPassword } = inquiry;
          matchingInquiries.push(inquiryWithoutPassword);
        }
      } catch (err) {
        console.error("Password comparison error:", err);
      }
    }

    if (matchingInquiries.length === 0) {
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

    console.log(`Found ${matchingInquiries.length} inquiries`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inquiries: matchingInquiries 
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
