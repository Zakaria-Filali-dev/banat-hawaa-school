import { serve } from "std/server";
import { SmtpClient } from "https://esm.sh/smtp-client@v0.7.0";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), { status: 405 });
  }

  try {
    const { email, full_name, reason } = await req.json();
    if (!email || !full_name || !reason) {
      return new Response(JSON.stringify({ status: "error", message: "Missing fields" }), { status: 400 });
    }

    // Validate SMTP env vars
    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Deno.env.get("SMTP_PORT");
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");
    const SMTP_FROM = Deno.env.get("SMTP_FROM");
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      console.error("Missing SMTP environment variables");
      return new Response(JSON.stringify({ status: "error", message: "SMTP configuration error" }), { status: 500 });
    }

    const client = new SmtpClient();
    try {
      await client.connectTLS({
        hostname: SMTP_HOST,
        port: Number(SMTP_PORT),
        username: SMTP_USER,
        password: SMTP_PASS,
      });
      await client.send({
        from: SMTP_FROM,
        to: email,
        subject: "Application Rejected",
        content: `Hi ${full_name}, your registration was rejected. Reason: ${reason}`,
      });
      await client.close();
      console.log("Rejection email sent to", email);
      return new Response(JSON.stringify({ status: "success" }), { status: 200 });
    } catch (smtpErr) {
      console.error("SMTP send error:", smtpErr);
      return new Response(JSON.stringify({ status: "error", message: "Failed to send email" }), { status: 500 });
    }
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ status: "error", message: err.message || "Unknown error" }), { status: 500 });
  }
});
