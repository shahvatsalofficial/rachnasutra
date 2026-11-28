const PATTERNS: { name: string; re: RegExp; keep?: string }[] = [
  { name: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'github-token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: 'github-pat', re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: 'openai-style-key', re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'private-key', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { name: 'stripe-key', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { name: 'npm-token', re: /\bnpm_[A-Za-z0-9]{30,}\b/g },
  { name: 'jwt', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
  { name: 'bearer-token', re: /\bBearer\s+(?=[A-Za-z._~+/-]*\d)[A-Za-z0-9._~+/-]{16,}=*/g },
  // The patterns below keep the surrounding text and mask only the value.
  { name: 'url-credential', re: /\b([a-z][a-z0-9+.-]*:\/\/[^\s/:@"']*:)[^\s/@"']+(?=@)/gi, keep: '$1[REDACTED]' },
  { name: 'query-credential', re: /([?&](?:access_token|auth_token|token|api[_-]?key|key|secret|password)=)(?!\[)[^&\s"'<>]{8,}/gi, keep: '$1[REDACTED]' },
  {
    // password = "x", "client_secret": "x", apiKeyProd: 'x'
    name: 'credential-assignment',
    re: /((?:password|passwd|secret|api[_-]?key|token|access[_-]?key|private[_-]?key)[\w-]{0,40}["']?\s*[:=]\s*)(["'])(?!\[REDACTED)[^"'\s]{8,}\2/gi,
    keep: '$1$2[REDACTED]$2',
  },
  {
    // API_KEY=abc123 (upper-case environment style, no quotes)
    name: 'env-assignment',
    re: /\b([A-Z0-9_]{0,40}(?:PASSWORD|PASSWD|SECRET|API_?KEY|TOKEN|ACCESS_?KEY|PRIVATE_KEY)[A-Z0-9_]{0,40}=)(?!\[)[^\s"'<>;&{}$()]{8,}/g,
    keep: '$1[REDACTED]',
  },
];

export interface SecretHit {
  kind: string;
}

/** Return the kinds of secret found in a line (never the value). */
export function detectSecrets(line: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    if (p.re.test(line)) hits.push({ kind: p.name });
  }
  return hits;
}

/** Mask anything that looks like a secret. Used on every excerpt before it reaches a report. */
export function redact(text: string): string {
  let out = text;
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    out = out.replace(p.re, p.keep ?? `[REDACTED:${p.name}]`);
  }
  return out;
}

export function excerpt(line: string, max = 160): string {
  const r = redact(line.trim());
  return r.length > max ? `${r.slice(0, max)}...` : r;
}
