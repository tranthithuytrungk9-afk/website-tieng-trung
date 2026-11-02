// Cloudflare Pages Function: /api/new-hsk3
// Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and TEACHER_EMAILS in Cloudflare Preview.
const reply = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});
const isInt = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const validText = (x, min, max) => typeof x === 'string' && x.trim().length >= min && x.trim().length <= max;

class SupabaseError extends Error {
  constructor(status, code) { super('Supabase request failed'); this.status = status; this.code = code; }
}
async function sb(env, path, init = {}) {
  const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('MISSING_SUPABASE_CONFIG');
  const response = await fetch(url.replace(/\/$/, '') + path, {
    ...init,
    headers: { apikey: key, Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  // Supabase/PostgREST often returns an empty body for successful INSERTs.
  const body = await response.text();
  if (!response.ok) {
    let code = 'UNKNOWN';
    try { const error = JSON.parse(body); if (typeof error.code === 'string') code = error.code; } catch (_) {}
    throw new SupabaseError(response.status, code);
  }
  if (!body.trim()) return null;
  try { return JSON.parse(body); } catch (_) { throw new Error('INVALID_SUPABASE_RESPONSE'); }
}
function safeError(error, fallback) {
  if (error instanceof SupabaseError) return reply({ error: fallback, upstream_status: error.status, supabase_code: error.code }, 502);
  if (error?.message === 'MISSING_SUPABASE_CONFIG') return reply({ error: 'Máy chủ chưa cấu hình Supabase', code: 'MISSING_SUPABASE_CONFIG' }, 500);
  return reply({ error: fallback, code: 'SERVER_ERROR' }, 500);
}
export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get('Origin');
    if (origin !== new URL(request.url).origin) return reply({ error: 'Nguồn gửi không hợp lệ' }, 403);
    if (Number(request.headers.get('Content-Length') || 0) > 12000) return reply({ error: 'Dữ liệu quá lớn' }, 413);
    const x = await request.json();
    if (!x || !validText(x.student_name, 2, 100) || !validText(x.class_name, 1, 60) ||
        !isInt(x.lesson, 1, 18) || !isInt(x.correct, 0, 500) || !isInt(x.total, 1, 500) ||
        x.correct > x.total || !isInt(x.score, 0, 100) ||
        x.score !== Math.round(x.correct * 100 / x.total))
      return reply({ error: 'Thông tin điểm không hợp lệ' }, 400);
    const data = {
      student_name: x.student_name.trim(), class_name: x.class_name.trim(),
      lesson_number: x.lesson, set_number: 1, correct_count: x.correct,
      total_questions: x.total, score_percent: x.score, source: 'student_client_unverified'
    };
    await sb(env, '/rest/v1/new_hsk3_scores', {
      method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(data)
    });
    return reply({ ok: true, success: true });
  } catch (error) { return safeError(error, 'Không lưu được điểm'); }
}
export async function onRequestGet({ request, env }) {
  try {
    const auth = request.headers.get('Authorization') || '';
    if (!/^Bearer\s+\S+$/.test(auth)) return reply({ error: 'Chưa đăng nhập' }, 401);
    const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return reply({ error: 'Chưa cấu hình máy chủ' }, 500);
    const response = await fetch(url.replace(/\/$/, '') + '/auth/v1/user', {
      headers: { apikey: key, Authorization: auth }
    });
    if (!response.ok) return reply({ error: 'Phiên đăng nhập không hợp lệ' }, 401);
    const user = await response.json();
    const allowed = String(env.TEACHER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!allowed.length || !allowed.includes(String(user.email || '').toLowerCase()))
      return reply({ error: 'Tài khoản chưa được cấp quyền giáo viên' }, 403);
    const scores = await sb(env, '/rest/v1/new_hsk3_scores?select=*&order=created_at.desc&limit=1000');
    return reply({ ok: true, scores });
  } catch (error) { return safeError(error, 'Không tải được điểm'); }
}
