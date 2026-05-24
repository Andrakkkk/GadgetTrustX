export function getSupabasePassword(password) {
  if (typeof password !== 'string') return password;
  if (password.length === 0 || password.length >= 6) return password;
  return `${password}#GadgetTrustX`;
}
