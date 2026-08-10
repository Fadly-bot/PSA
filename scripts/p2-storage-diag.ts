/** Storage diagnostic (temporary): checks env presence + bucket existence/public (never prints secrets). */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL set:', !!url);
console.log('SUPABASE_SERVICE_ROLE_KEY set:', !!key);

if (!url || !key) {
  console.log('RESULT: STORAGE_NOT_CONFIGURED');
  process.exit(0);
}

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: buckets, error } = await client.storage.listBuckets();
if (error) {
  console.log('listBuckets error:', error.message);
  process.exit(0);
}
console.log('buckets:', JSON.stringify((buckets ?? []).map((b) => ({ id: b.id, public: b.public }))));
const covers = (buckets ?? []).find((b) => b.id === 'book-covers');
console.log('book-covers bucket exists:', !!covers, '| public:', covers?.public ?? 'N/A');

if (covers) {
  const { data: files, error: listErr } = await client.storage.from('book-covers').list('', { limit: 5 });
  console.log('files in book-covers:', listErr ? `error ${listErr.message}` : (files ?? []).map((f) => f.name));
  const { data: pub } = client.storage.from('book-covers').getPublicUrl('test-probe.jpg');
  console.log('publicUrl sample:', pub.publicUrl);
}
process.exit(0);
