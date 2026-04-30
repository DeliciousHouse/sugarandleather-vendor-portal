export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailResult = {
  id?: string;
  error?: string;
};

export interface EmailAdapter {
  send(message: EmailMessage): Promise<EmailResult>;
}

// ---------------------------------------------------------------------------
// Resend REST adapter — no SDK dependency required
// ---------------------------------------------------------------------------

export function createResendAdapter(apiKey: string, from: string): EmailAdapter {
  return {
    async send(message) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          return { error: `Resend error ${res.status}: ${body}` };
        }

        const data = (await res.json()) as { id?: string };
        return { id: data.id };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Logging stub used in dev/test when RESEND_API_KEY is absent
// ---------------------------------------------------------------------------

export function createStubAdapter(): EmailAdapter {
  return {
    async send(message) {
      console.log("[email stub] to=%s subject=%s", message.to, message.subject);
      return { id: "stub_" + Date.now() };
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton resolved from env — swappable for tests
// ---------------------------------------------------------------------------

let _adapter: EmailAdapter | null = null;

export function getEmailAdapter(): EmailAdapter {
  if (_adapter) return _adapter;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@sugarandleather.ai";

  _adapter = apiKey ? createResendAdapter(apiKey, from) : createStubAdapter();
  return _adapter;
}

export function setEmailAdapter(adapter: EmailAdapter): void {
  _adapter = adapter;
}

export function resetEmailAdapter(): void {
  _adapter = null;
}
