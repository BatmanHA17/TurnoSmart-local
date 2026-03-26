export interface MailResult {
  ok: boolean;
  status?: number;
  body?: any;
  messageId?: string;
  error?: string;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({ to, subject, html, text }: MailOptions): Promise<MailResult> {
  try {
    const postmarkToken = Deno.env.get('POSTMARK_TOKEN');
    if (!postmarkToken) {
      console.error('POSTMARK_TOKEN not configured');
      return { ok: false, error: 'POSTMARK_TOKEN not configured' };
    }

    const emailData = {
      From: Deno.env.get('POSTMARK_FROM') || 'hi@turnosmart.app',
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text || stripHtml(html),
      MessageStream: Deno.env.get('POSTMARK_MESSAGE_STREAM') || 'outbound'
    };

    console.log('Sending email via Postmark to:', to);

    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': postmarkToken,
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Postmark error:', response.status, result);
      return { 
        ok: false, 
        status: response.status, 
        body: result,
        error: result.Message || 'Email sending failed'
      };
    }

    console.log('Email sent successfully:', result.MessageID);
    return { 
      ok: true, 
      status: response.status, 
      body: result,
      messageId: result.MessageID 
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Simple HTML strip function for text fallback
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}