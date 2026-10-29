const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env.");
}

const supabase = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

module.exports = { supabase };
