import nodemailer from "nodemailer";

/**
 * Checks whether real email delivery credentials are configured in environment variables.
 */
export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY) return true;
  const hasGmail = Boolean(
    (process.env.GMAIL_USER || process.env.EMAIL_USER) &&
      (process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS),
  );
  const hasSmtp = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
  return hasGmail || hasSmtp;
}

/**
 * Creates a Nodemailer transporter based on current environment variables.
 */
function createTransporter() {
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

export interface SendResetEmailResult {
  sent: boolean;
  devMode: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

/**
 * Sends a real password reset email with the 6-digit code and a 1-click reset link.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetCode: string,
  userName?: string,
): Promise<SendResetEmailResult> {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  const resetLink = `${clientUrl}/reset-password?email=${encodeURIComponent(toEmail)}&code=${encodeURIComponent(resetCode)}`;

  const transporter = createTransporter();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // If no email delivery mechanism is configured, log fallback for local testing
  if (!resendApiKey && !transporter) {
    console.log(
      `\n=======================================================\n` +
        `[GoalWeave Email] ⚠️ Dev Mode (No Resend API Key or SMTP credentials configured)\n` +
        `Recipient: ${toEmail}\n` +
        `6-Digit Code: ${resetCode}\n` +
        `Direct Reset Link: ${resetLink}\n` +
        `To send real emails, set RESEND_API_KEY or GMAIL_USER & GMAIL_APP_PASSWORD in backend/.env\n` +
        `=======================================================\n`,
    );
    return { sent: false, devMode: true };
  }

  const senderAddress =
    process.env.EMAIL_FROM ||
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER ||
    '"GoalWeave" <no-reply@goalweave.app>';

  const subject = `GoalWeave Password Reset Code: ${resetCode}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your GoalWeave Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px;
      background: linear-gradient(180deg, rgba(79, 70, 229, 0.12) 0%, rgba(17, 24, 39, 0) 100%);
      text-align: center;
      border-bottom: 1px solid #1f2937;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin: 0;
    }
    .content {
      padding: 32px;
    }
    .heading {
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 12px;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 24px;
    }
    .code-box {
      background: #1e1b4b;
      border: 1px solid #3730a3;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 0 0 24px;
    }
    .code-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #a5b4fc;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .code-value {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #ffffff;
      font-family: 'SF Mono', Consolas, Monaco, monospace;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .footer {
      padding: 24px 32px;
      background: #0d131f;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      line-height: 1.6;
      color: #64748b;
      text-align: center;
    }
    .footer-link {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">✦</div>
      <h1 class="brand-name">GoalWeave</h1>
    </div>
    <div class="content">
      <h2 class="heading">Password Reset Request</h2>
      <p class="paragraph">
        Hello${userName ? ` ${userName}` : ""},<br><br>
        We received a request to reset your password for your GoalWeave account. Use the 6-digit verification code below to set a new password:
      </p>

      <div class="code-box">
        <div class="code-label">Verification Code (Expires in 15 mins)</div>
        <div class="code-value">${resetCode}</div>
      </div>

      <div class="cta-container">
        <a href="${resetLink}" class="cta-button" target="_blank">Reset Password Directly →</a>
      </div>

      <p class="paragraph" style="font-size: 13px; margin-bottom: 0;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #818cf8; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
    <div class="footer">
      If you did not make this request, you can safely ignore this email. Your password will remain unchanged and your account is secure.<br><br>
      © ${new Date().getFullYear()} GoalWeave. AI-Powered Autonomous Learning Trajectories.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
GoalWeave Password Reset

Hello${userName ? ` ${userName}` : ""},

We received a request to reset your GoalWeave password.
Your 6-digit verification code is: ${resetCode}
(This code is valid for 15 minutes)

You can also reset your password directly by visiting:
${resetLink}

If you did not request this, please ignore this email.

— GoalWeave Team
  `.trim();

  try {
    // 1. If Resend API Key is set, use Resend's REST API
    if (resendApiKey) {
      const resendSender =
        process.env.EMAIL_FROM || "GoalWeave <onboarding@resend.dev>";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendSender,
          to: [toEmail],
          subject,
          text: textContent,
          html: htmlContent,
        }),
      });

      const resData = (await res.json()) as {
        id?: string;
        message?: string;
        name?: string;
      };

      if (!res.ok) {
        throw new Error(
          resData.message || `Resend API returned status ${res.status}`,
        );
      }

      console.log(
        `[GoalWeave Email via Resend] ✅ Real email sent successfully to ${toEmail}. MessageId: ${resData.id}`,
      );
      return { sent: true, devMode: false, messageId: resData.id };
    }

    // 2. Otherwise use Nodemailer (Gmail / SMTP)
    if (transporter) {
      const info = await transporter.sendMail({
        from: senderAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(
        `[GoalWeave Email] ✅ Real email sent successfully to ${toEmail}. MessageId: ${info.messageId}`,
      );
      return { sent: true, devMode: false, messageId: info.messageId };
    }

    return { sent: false, devMode: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[GoalWeave Email] ❌ Failed to deliver email to ${toEmail}:`, errorMsg);
    return { sent: false, devMode: false, error: errorMsg };
  }
}
