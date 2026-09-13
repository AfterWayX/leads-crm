export type ContactLite = {
  name: string;
  linkedin_url: string | null;
  is_primary?: boolean | null;
};

/** Prefer primary contact with LinkedIn; else any contact with LinkedIn. */
export function pickLinkedInContact(
  contacts: ContactLite[] | null | undefined
): ContactLite | null {
  if (!contacts?.length) return null;
  const withLi = contacts.filter((c) => c.linkedin_url);
  if (!withLi.length) return null;
  return withLi.find((c) => c.is_primary) || withLi[0];
}
