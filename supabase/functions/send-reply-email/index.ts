import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyEmailRequest {
  customerName: string;
  customerEmail: string;
  inquiryTitle: string;
  inquiryContent: string;
  adminReply: string;
}

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "이메일 서비스가 설정되지 않았습니다." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const body: ReplyEmailRequest = await req.json();
    
    // Validate required fields
    if (!body.customerEmail || !body.adminReply || !body.inquiryTitle) {
      return new Response(
        JSON.stringify({ error: "필수 항목이 누락되었습니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    
    // Escape all user-provided content to prevent HTML injection
    const safeCustomerName = escapeHtml(body.customerName || '고객');
    const safeInquiryTitle = escapeHtml(body.inquiryTitle);
    const safeInquiryContent = escapeHtml(body.inquiryContent || '');
    const safeAdminReply = escapeHtml(body.adminReply);
    
    const emailHtml = `
      <div style="font-family: 'Pretendard', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">✉️ 문의에 대한 답변이 도착했습니다</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 20px 0; color: #333;">
            안녕하세요, <strong>${safeCustomerName}</strong>님.
          </p>
          <p style="margin: 0 0 20px 0; color: #666;">
            문의하신 내용에 대한 답변을 드립니다.
          </p>
          
          <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 20px;">
            <p style="font-weight: bold; color: #333; margin: 0 0 10px 0; font-size: 14px;">📋 문의 제목</p>
            <p style="color: #666; margin: 0; font-size: 14px;">${safeInquiryTitle}</p>
          </div>
          
          ${safeInquiryContent ? `
          <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 20px;">
            <p style="font-weight: bold; color: #333; margin: 0 0 10px 0; font-size: 14px;">📝 문의 내용</p>
            <p style="color: #666; margin: 0; font-size: 14px; white-space: pre-wrap;">${safeInquiryContent}</p>
          </div>
          ` : ''}
          
          <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border: 1px solid #b3d9f7; margin-bottom: 20px;">
            <p style="font-weight: bold; color: #0066cc; margin: 0 0 10px 0; font-size: 14px;">💬 답변 내용</p>
            <p style="color: #333; margin: 0; font-size: 14px; white-space: pre-wrap;">${safeAdminReply}</p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">
            추가 문의사항이 있으시면 언제든 연락 주세요.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              GGI 가구 | ggigagu@naver.com
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              본 이메일은 발신 전용이며, 회신되지 않습니다.
            </p>
          </div>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "GGI 가구 <onboarding@resend.dev>",
      to: [body.customerEmail],
      reply_to: "ggigagu@naver.com",
      subject: `[GGI] 문의 답변: ${safeInquiryTitle}`,
      html: emailHtml,
    });

    console.log("Reply email sent successfully to:", body.customerEmail, emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "답변 이메일이 발송되었습니다." 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reply-email:", error);
    return new Response(
      JSON.stringify({ error: "이메일 발송에 실패했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
