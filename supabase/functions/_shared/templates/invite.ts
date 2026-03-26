export interface InviteTemplateOptions {
  org: string;
  role: string;
  token: string;
  locale?: 'es' | 'en';
  inviterName?: string;
}

export interface TemplateResult {
  subject: string;
  html: string;
  text: string;
}

const translations = {
  es: {
    subject: (org: string) => `Te han invitado a ${org}`,
    title: '¡Te han invitado!',
    invitedBy: (inviter: string, org: string, role: string) => 
      `<strong>${inviter}</strong> te ha invitado a unirte a <strong>${org}</strong> como <strong>${role}</strong>.`,
    buttonText: 'Unirme ahora',
    roleLabel: 'Rol asignado:',
    orgLabel: 'Organización:',
    disclaimer: 'Si no esperabas este email, puedes ignorarlo. Este enlace expirará en <strong>7 días</strong>.',
    linkHelp: 'Si el botón no funciona, copia y pega este enlace en tu navegador:',
    textInvite: (inviter: string, org: string, role: string) => 
      `${inviter} te ha invitado a unirte a ${org} como ${role}.`,
    textButton: 'Para aceptar la invitación, visita:',
    textDisclaimer: 'Si no esperabas este email, puedes ignorarlo. Este enlace expirará en 7 días.'
  },
  en: {
    subject: (org: string) => `You've been invited to ${org}`,
    title: 'You\'ve been invited!',
    invitedBy: (inviter: string, org: string, role: string) => 
      `<strong>${inviter}</strong> has invited you to join <strong>${org}</strong> as <strong>${role}</strong>.`,
    buttonText: 'Join now',
    roleLabel: 'Assigned role:',
    orgLabel: 'Organization:',
    disclaimer: 'If you weren\'t expecting this email, you can safely ignore it. This link will expire in <strong>7 days</strong>.',
    linkHelp: 'If the button doesn\'t work, copy and paste this link in your browser:',
    textInvite: (inviter: string, org: string, role: string) => 
      `${inviter} has invited you to join ${org} as ${role}.`,
    textButton: 'To accept the invitation, visit:',
    textDisclaimer: 'If you weren\'t expecting this email, you can safely ignore it. This link will expire in 7 days.'
  }
};

export function inviteTemplate({ 
  org, 
  role, 
  token, 
  locale = 'es',
  inviterName = 'Alguien'
}: InviteTemplateOptions): TemplateResult {
  const t = translations[locale];
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
  const inviteUrl = `${appUrl}/invite/accept?token=${token}`;

  const subject = t.subject(org);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">${t.title}</h1>
        </div>
        
        <div style="padding: 40px 32px;">
          <p style="font-size: 18px; margin-bottom: 24px; color: #374151;">
            ${t.invitedBy(inviterName, org, role)}
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4);">
              ${t.buttonText}
            </a>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>${t.roleLabel}</strong> ${role}<br>
              <strong>${t.orgLabel}</strong> ${org}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
            ${t.disclaimer}
          </p>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 20px; text-align: center;">
            ${t.linkHelp}<br>
            <span style="word-break: break-all;">${inviteUrl}</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${t.title}

${t.textInvite(inviterName, org, role)}

${t.textButton} ${inviteUrl}

${t.roleLabel} ${role}
${t.orgLabel} ${org}

${t.textDisclaimer}
  `.trim();

  return { subject, html, text };
}