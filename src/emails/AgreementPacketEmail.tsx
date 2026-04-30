export interface AgreementPacketEmailProps {
  applicantName: string;
  packetUrl: string;
  ndaVersion: string;
  agreementVersion: string;
}

export interface PartnerActivationEmailProps {
  partnerName: string;
  loginUrl: string;
}

export function renderAgreementPacketEmail(
  props: AgreementPacketEmailProps
): { html: string; text: string } {
  const { applicantName, packetUrl, ndaVersion, agreementVersion } = props;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0E0C0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 32px;">
    <h1 style="font-size:28px;color:#EDE8E1;margin-bottom:24px;font-weight:700;letter-spacing:-0.02em;">
      Your Partner Agreement
    </h1>
    <p style="color:#A8A5AE;margin-bottom:16px;">Hi ${applicantName},</p>
    <p style="color:#EDE8E1;line-height:1.6;margin-bottom:24px;">
      Your application has been reviewed and approved. Please review and sign the attached documents to complete your partner onboarding with Sugar &amp; Leather AI.
    </p>
    <p style="color:#A8A5AE;font-size:14px;margin-bottom:12px;">
      Agreement packet &mdash; NDA v${ndaVersion} + Partner Agreement v${agreementVersion}
    </p>
    <a href="${packetUrl}"
       style="display:inline-block;background:#C5B8D4;color:#0E0C0F;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin-bottom:32px;">
      Review &amp; Sign Documents
    </a>
    <p style="color:#6B6570;font-size:13px;line-height:1.6;border-top:1px solid rgba(237,232,225,0.12);padding-top:20px;margin-top:0;">
      Once you have signed, our team will receive the executed documents and complete your account activation.
      Please allow 1&ndash;2 business days for review.
    </p>
    <p style="color:#6B6570;font-size:13px;">Questions? Reply to this email.</p>
    <p style="color:#6B6570;font-size:12px;margin-top:24px;">Sugar &amp; Leather AI</p>
  </div>
</body>
</html>`.trim();

  const text = `Hi ${applicantName},

Your Sugar & Leather partner application has been approved.

Please review and sign your agreement packet (NDA v${ndaVersion} + Partner Agreement v${agreementVersion}):

${packetUrl}

Once you have signed, our team will receive the executed documents and complete your account activation.
Please allow 1-2 business days for review.

Questions? Reply to this email.

Sugar & Leather AI`;

  return { html, text };
}

export function renderPartnerActivationEmail(
  props: PartnerActivationEmailProps
): { html: string; text: string } {
  const { partnerName, loginUrl } = props;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0E0C0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 32px;">
    <h1 style="font-size:28px;color:#EDE8E1;margin-bottom:24px;font-weight:700;">
      Welcome to the Partner Program
    </h1>
    <p style="color:#A8A5AE;margin-bottom:16px;">Hi ${partnerName},</p>
    <p style="color:#EDE8E1;line-height:1.6;margin-bottom:24px;">
      Your agreement has been signed and your account is now active. You can log in to your partner portal to start submitting referrals and tracking your earnings.
    </p>
    <a href="${loginUrl}"
       style="display:inline-block;background:#C5B8D4;color:#0E0C0F;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin-bottom:32px;">
      Access Partner Portal
    </a>
    <p style="color:#6B6570;font-size:13px;line-height:1.6;border-top:1px solid rgba(237,232,225,0.12);padding-top:20px;margin-top:0;">
      Questions? Reply to this email and our team will get back to you.
    </p>
    <p style="color:#6B6570;font-size:12px;margin-top:24px;">Sugar &amp; Leather AI</p>
  </div>
</body>
</html>`.trim();

  const text = `Hi ${partnerName},

Your agreement has been signed and your partner account is now active.

Log in to your partner portal:

${loginUrl}

Questions? Reply to this email.

Sugar & Leather AI`;

  return { html, text };
}
