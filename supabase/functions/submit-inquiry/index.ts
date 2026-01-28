import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InquiryRequest {
  name: string;
  phone: string;
  email: string;
  title: string;
  content: string;
  password: string;
  privacyAgreed: boolean;
}

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

// HTML escape function to prevent XSS/HTML injection
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'\/]/g, (char) => map[char]);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP from headers
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    console.log(`Inquiry submission from IP: ${clientIP}`);

    // Rate limiting check
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { count, error: countError } = await supabase
      .from("inquiry_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIP)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if (count !== null && count >= MAX_REQUESTS_PER_WINDOW) {
      console.log(`Rate limit exceeded for IP: ${clientIP}, count: ${count}`);
      return new Response(
        JSON.stringify({ 
          error: "너무 많은 요청이 감지되었습니다. 5분 후에 다시 시도해 주세요." 
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse request body
    const body: InquiryRequest = await req.json();
    
    // Validate required fields
    if (!body.name || !body.phone || !body.email || !body.title || !body.content || !body.password) {
      return new Response(
        JSON.stringify({ error: "모든 필수 항목을 입력해 주세요." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!body.privacyAgreed) {
      return new Response(
        JSON.stringify({ error: "개인정보 수집에 동의해 주세요." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Basic validation
    const phoneRegex = /^[0-9\-\+\s]{9,20}$/;
    if (!phoneRegex.test(body.phone)) {
      return new Response(
        JSON.stringify({ error: "올바른 연락처 형식을 입력해 주세요." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: "올바른 이메일 형식을 입력해 주세요." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Insert rate limit record
    await supabase.from("inquiry_rate_limits").insert({
      ip_address: clientIP,
    });

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(body.password);
    console.log("Password hashed successfully");

    // Insert inquiry with hashed password
    const { data: inquiry, error: insertError } = await supabase
      .from("inquiries")
      .insert({
        name: body.name.trim().substring(0, 100),
        phone: body.phone.trim().substring(0, 20),
        email: body.email.trim().substring(0, 255),
        title: body.title.trim().substring(0, 200),
        content: body.content.trim().substring(0, 5000),
        password: hashedPassword,
        ip_address: clientIP,
        privacy_agreed: body.privacyAgreed,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "문의 등록에 실패했습니다. 다시 시도해 주세요." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Inquiry created successfully: ${inquiry.id}`);

    // Send email notification to admin with HTML-escaped content
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Escape all user-provided content to prevent HTML injection
        const safeName = escapeHtml(body.name);
        const safePhone = escapeHtml(body.phone);
        const safeEmail = escapeHtml(body.email);
        const safeTitle = escapeHtml(body.title);
        const safeContent = escapeHtml(body.content);
        
        await resend.emails.send({
          from: "GGI 문의알림 <onboarding@resend.dev>",
          to: ["ggigagu@naver.com"],
          subject: `[GGI 새 문의] ${safeTitle}`,
          html: `
            <div style="font-family: 'Pretendard', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 20px;">📩 새로운 문의가 접수되었습니다</h1>
              </div>
              <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">작성자</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">연락처</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safePhone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">이메일</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">제목</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeTitle}</td>
                  </tr>
                </table>
                <div style="margin-top: 20px;">
                  <p style="font-weight: bold; margin-bottom: 10px;">문의 내용:</p>
                  <div style="background: white; padding: 15px; border-radius: 4px; border: 1px solid #eee; white-space: pre-wrap;">${safeContent}</div>
                </div>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">
                  접수 시간: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                </p>
              </div>
            </div>
          `,
        });
        console.log("Admin notification email sent successfully");
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email notification");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "문의가 성공적으로 접수되었습니다.",
        id: inquiry.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-inquiry:", error);
    return new Response(
      JSON.stringify({ error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
