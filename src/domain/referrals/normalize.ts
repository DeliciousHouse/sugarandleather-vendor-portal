export function extractDomain(email: string): string | null {
  const atIndex = email.indexOf("@");
  if (atIndex < 0) return null;
  const domain = email.slice(atIndex + 1).toLowerCase().trim();
  return domain || null;
}

type NormalizeInput = {
  leadEmail?: string | null;
  leadDomain?: string | null;
};

export function normalizeAttributionKey(input: NormalizeInput): string {
  const email = input.leadEmail?.trim();
  if (email) {
    return `email:${email.toLowerCase()}`;
  }

  const domain = input.leadDomain?.trim().toLowerCase();
  if (domain) {
    return `domain:${domain}`;
  }

  throw new Error(
    "Cannot derive attribution key: leadEmail or leadDomain is required"
  );
}
