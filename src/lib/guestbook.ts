// Guestbook backed by a free Supabase project (optional).
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time to enable it.
// Table + security policies: see supabase/guestbook.sql.

export type Entry = { id: number; name: string; message: string; created_at: string };

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const guestbookEnabled = Boolean(URL && KEY);

const headers = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' });

export async function listEntries(limit = 30): Promise<Entry[]> {
  if (!guestbookEnabled) return [];
  const r = await fetch(`${URL}/rest/v1/guestbook?select=id,name,message,created_at&order=created_at.desc&limit=${limit}`, { headers: headers() });
  if (!r.ok) throw new Error(`Guestbook read failed (${r.status})`);
  return ((await r.json()) as Entry[]).reverse();
}

export async function addEntry(name: string, message: string): Promise<void> {
  if (!guestbookEnabled) throw new Error('Guestbook is offline');
  const r = await fetch(`${URL}/rest/v1/guestbook`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({ name: name.slice(0, 24), message: message.slice(0, 160) }),
  });
  if (!r.ok) throw new Error(r.status === 429 ? 'Slow down a little, then try again' : `Couldn't save your message (${r.status})`);
}
