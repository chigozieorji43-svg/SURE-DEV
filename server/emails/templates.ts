/**
 * SureDev Email HTML Templates
 * Responsive, branded HTML email templates for Resend email service.
 */

export const SUREDEV_EMAIL_HEADER = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SureDev Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: #0f172a;
      padding: 28px 32px;
      text-align: center;
      border-bottom: 3px solid #10b981;
    }
    .brand-logo {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .brand-tag {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .content {
      padding: 32px;
      line-height: 1.6;
      color: #334155;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: #f1f5f9;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #10b981;
      text-decoration: underline;
    }
    .card {
      background: #f8fafc;
      border-left: 4px solid #10b981;
      padding: 16px 20px;
      border-radius: 6px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-logo">
        <span style="color:#10b981;">Sure</span>Dev
      </div>
      <div class="brand-tag">Abia State Tech Directory & Ecosystem</div>
    </div>
    <div class="content">
`;

export const SUREDEV_EMAIL_FOOTER = `
    </div>
    <div class="footer">
      <p style="margin:0 0 8px 0; font-weight:500;">
        You're receiving this email because you have a SureDev account.
      </p>
      <p style="margin:0; color:#94a3b8;">
        Abia Tech Guild &bull; Aba, Abia State, Nigeria<br/>
        <a href="https://suredev.ng/settings">Manage Email Preferences</a> &bull; 
        <a href="https://suredev.ng/unsubscribe">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export function welcomeEmailTemplate(name: string, userType: 'developer' | 'employer' = 'developer'): string {
  const isDev = userType === 'developer';
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#0f172a; margin-top:0;">Welcome to SureDev, ${name || 'Innovator'}! 🚀</h2>
    <p>We're thrilled to have you join <strong>SureDev</strong> — Abia State's premier talent directory and collaboration network.</p>
    
    <div class="card">
      <h3 style="margin:0 0 8px 0; color:#0f172a; font-size:16px;">Next steps to get started:</h3>
      <ul style="margin:0; padding-left:20px; color:#475569;">
        <li><strong>Complete Your Profile:</strong> Add your skills, bio, and custom avatar under "My Credentials".</li>
        ${isDev 
          ? '<li><strong>Showcase Projects:</strong> Add portfolio projects to showcase your building expertise to hiring employers.</li>'
          : '<li><strong>Browse Top Talent:</strong> Explore verified local developers in Aba and Umuahia ready for hire.</li>'
        }
        <li><strong>Connect & Collaborate:</strong> ${isDev ? 'Send peer-to-peer collaboration proposals to fellow developers.' : 'Submit direct job inquiries and project offers.'}</li>
        <li><strong>Start Building:</strong> Elevate the local ecosystem together!</li>
      </ul>
    </div>

    <div style="text-align:center;">
      <a href="https://suredev.ng/dashboard" class="btn">Explore Your Dashboard</a>
    </div>

    <p style="font-size:14px; color:#64748b;">If you have any questions, our AI Assistant is available 24/7 on the platform to guide you.</p>
  ${SUREDEV_EMAIL_FOOTER}`;
}

export function verificationEmailTemplate(name: string, actionUrl: string): string {
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#0f172a; margin-top:0;">Verify Your SureDev Account ✉️</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Thank you for signing up for SureDev. Please verify your email address to ensure full access to messaging, collaboration requests, and directory updates.</p>

    <div style="text-align:center; margin:30px 0;">
      <a href="${actionUrl || 'https://suredev.ng/verify'}" class="btn">Verify Email Address</a>
    </div>

    <p style="font-size:13px; color:#64748b;">If you did not register for a SureDev account, you can safely ignore this email.</p>
  ${SUREDEV_EMAIL_FOOTER}`;
}

export function passwordResetTemplate(name: string, actionUrl: string): string {
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#0f172a; margin-top:0;">Reset Your Password 🔐</h2>
    <p>Hi ${name || 'User'},</p>
    <p>We received a request to reset your password for your SureDev account.</p>

    <div style="text-align:center; margin:30px 0;">
      <a href="${actionUrl}" class="btn">Reset Password</a>
    </div>

    <p style="font-size:13px; color:#64748b;">If you didn't request a password reset, your account is safe and no action is needed.</p>
  ${SUREDEV_EMAIL_FOOTER}`;
}

export function collabRequestTemplate(params: {
  senderName: string;
  projectTitle?: string;
  message?: string;
  actionUrl?: string;
}): string {
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#0f172a; margin-top:0;">You have a new collaboration request 🤝</h2>
    <p><strong>${params.senderName}</strong> wants to collaborate with you on SureDev!</p>

    <div class="card">
      ${params.projectTitle ? `<p style="margin:0 0 8px 0;"><strong>Project:</strong> ${params.projectTitle}</p>` : ''}
      <p style="margin:0; color:#334155; font-style:italic;">"${params.message || 'Hey! I saw your profile on SureDev and would love to partner up on an upcoming project.'}"</p>
    </div>

    <div style="text-align:center;">
      <a href="${params.actionUrl || 'https://suredev.ng/dashboard'}" class="btn">Open SureDev & Respond</a>
    </div>
  ${SUREDEV_EMAIL_FOOTER}`;
}

export function newMessageTemplate(params: {
  senderName: string;
  messageSnippet: string;
  actionUrl?: string;
}): string {
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#0f172a; margin-top:0;">New Message Received 💬</h2>
    <p>You have a new message from <strong>${params.senderName}</strong> on SureDev:</p>

    <div class="card">
      <p style="margin:0; color:#334155; font-style:italic;">"${params.messageSnippet}"</p>
    </div>

    <div style="text-align:center;">
      <a href="${params.actionUrl || 'https://suredev.ng/dashboard'}" class="btn">Reply on SureDev</a>
    </div>
  ${SUREDEV_EMAIL_FOOTER}`;
}

export function weeklyUpdateTemplate(params: {
  topDevs?: string[];
  newProjects?: string[];
  featuredOps?: string[];
  trendingSkills?: string[];
}): string {
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#0f172a; margin-top:0;">SureDev Weekly Ecosystem Digest ⚡</h2>
    <p>Here is what is happening in the Abia State Tech Talent Ecosystem this week:</p>

    <div class="card">
      <h3 style="margin:0 0 8px 0; color:#0f172a; font-size:15px;">🌟 Featured Developers This Week</h3>
      <p style="margin:0; color:#475569;">${(params.topDevs || ['Chigozie Orji (Full Stack)', 'Amaechi Kalu (Mobile Engineering)', 'Ifeanyi Okonkwo (Cloud Infra)']).join(' &bull; ')}</p>
    </div>

    <div class="card" style="border-left-color: #3b82f6;">
      <h3 style="margin:0 0 8px 0; color:#0f172a; font-size:15px;">🚀 New Projects Built in Aba & Umuahia</h3>
      <p style="margin:0; color:#475569;">${(params.newProjects || ['Abia Micro-Grid Dashboard', 'E-Logistics Aba Market Gateway', 'CooperativeNG Portal']).join(' &bull; ')}</p>
    </div>

    <div class="card" style="border-left-color: #f59e0b;">
      <h3 style="margin:0 0 8px 0; color:#0f172a; font-size:15px;">🔥 Trending High-Demand Skills</h3>
      <p style="margin:0; color:#475569;">${(params.trendingSkills || ['React 19', 'TypeScript', 'Node.js', 'Firebase', 'Tailwind CSS', 'Docker']).join(' &bull; ')}</p>
    </div>

    <div style="text-align:center;">
      <a href="https://suredev.ng/directory" class="btn">Explore Directory Opportunities</a>
    </div>
  ${SUREDEV_EMAIL_FOOTER}`;
}

export function announcementTemplate(params: {
  title: string;
  message: string;
  senderName?: string;
}): string {
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#0f172a; margin-top:0;">📢 ${params.title}</h2>
    <p>Official message from ${params.senderName || 'SureDev Administration'}:</p>

    <div class="card" style="border-left-color: #8b5cf6;">
      <div style="white-space: pre-wrap; color:#334155;">${params.message}</div>
    </div>

    <div style="text-align:center;">
      <a href="https://suredev.ng" class="btn">Visit SureDev Portal</a>
    </div>
  ${SUREDEV_EMAIL_FOOTER}`;
}

export function securityAlertTemplate(params: {
  time: string;
  browser: string;
  location?: string;
  ip?: string;
}): string {
  return `${SUREDEV_EMAIL_HEADER}
    <h2 style="color:#b91c1c; margin-top:0;">🛡️ New Login Detected</h2>
    <p>We detected a new login session to your SureDev account.</p>

    <div class="card" style="border-left-color: #ef4444;">
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr>
          <td style="padding:6px 0; color:#64748b; font-weight:600;">Time:</td>
          <td style="padding:6px 0; color:#0f172a;">${params.time}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#64748b; font-weight:600;">Browser / Device:</td>
          <td style="padding:6px 0; color:#0f172a;">${params.browser}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#64748b; font-weight:600;">Location:</td>
          <td style="padding:6px 0; color:#0f172a;">${params.location || 'Aba, Abia State, Nigeria'}</td>
        </tr>
        ${params.ip ? `
        <tr>
          <td style="padding:6px 0; color:#64748b; font-weight:600;">IP Address:</td>
          <td style="padding:6px 0; color:#0f172a;">${params.ip}</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="font-size:13px; color:#64748b;">If this was you, no action is needed. If you did not log in at this time, please change your password immediately.</p>

    <div style="text-align:center;">
      <a href="https://suredev.ng/reset-password" class="btn" style="background-color:#dc2626;">Secure Account Now</a>
    </div>
  ${SUREDEV_EMAIL_FOOTER}`;
}
