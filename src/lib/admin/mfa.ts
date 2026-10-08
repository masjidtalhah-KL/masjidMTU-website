export type TotpFactor = { id: string; friendly_name?: string };
export const PRIMARY_AUTHENTICATOR = "Primary authenticator";
export const BACKUP_AUTHENTICATOR = "Backup authenticator";

export function missingAuthenticatorName(factors: readonly TotpFactor[]) {
  // Retain the existing two-factor enrollment limit, including unknown labels.
  if (factors.length >= 2) return null;
  if (!factors.some(factor => factor.friendly_name === PRIMARY_AUTHENTICATOR)) return PRIMARY_AUTHENTICATOR;
  if (!factors.some(factor => factor.friendly_name === BACKUP_AUTHENTICATOR)) return BACKUP_AUTHENTICATOR;
  return null;
}

export function selectedAuthenticator(factors: readonly TotpFactor[], previous: string) {
  if (factors.some(factor => factor.id === previous)) return previous;
  return factors.find(factor => factor.friendly_name === PRIMARY_AUTHENTICATOR)?.id
    ?? [...factors].sort((a, b) => a.id.localeCompare(b.id))[0]?.id
    ?? "";
}
