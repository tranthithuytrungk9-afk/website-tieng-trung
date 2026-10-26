const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });

async function sb(env, path) {
  const url = env.SUPABASE_URL.replace(/\/$/, "") + path;

  const response = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY
    }
  });

  if (!response.ok) {
    throw new Error("Supabase " + response.status);
  }

  return response.json();
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Chưa cấu hình máy chủ" }, 503);
    }

    // Kiểm tra người dùng đã đăng nhập Supabase.
    const auth = request.headers.get("Authorization") || "";

    if (!/^Bearer\s+\S+$/.test(auth)) {
      return json({ error: "Vui lòng đăng nhập" }, 401);
    }

    const token = auth.replace(/^Bearer\s+/, "");

    const response = await fetch(
      env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/user",
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: "Bearer " + token
        }
      }
    );

    if (!response.ok) {
      return json({ error: "Phiên đăng nhập không hợp lệ" }, 401);
    }

    const user = await response.json();

    if (!user.id) {
      return json({ error: "Không xác định tài khoản" }, 401);
    }

    // Chỉ tài khoản có trong bảng phân quyền mới được xem dữ liệu.
    const allowed = await sb(
      env,
      "/rest/v1/new_hsk2_giao_vien" +
      "?select=user_id&user_id=eq." +
      encodeURIComponent(user.id) +
      "&limit=1"
    );

    if (!allowed.length) {
      return json({
        error: "Tài khoản chưa được cấp quyền giáo viên"
      }, 403);
    }

    // Đọc thông tin học sinh, tiến độ và điểm kiểm tra.
    const tables = [
      ["students", "new_hsk2_hoc_sinh", "ngay_tao"],
      ["progress", "new_hsk2_tien_do", "cap_nhat_luc"],
      ["scores", "new_hsk2_diem", "ngay_nop"]
    ];

    const result = { ok: true };

    for (const [label, table, order] of tables) {
      let rows = [];

      for (let offset = 0; offset < 10000; offset += 1000) {
        const batch = await sb(
          env,
          "/rest/v1/" + table +
          "?select=*&order=" + order +
          ".desc&limit=1000&offset=" + offset
        );

        rows.push(...batch);

        if (batch.length < 1000) {
          break;
        }
      }

      result[label] = rows;
    }

    return json(result);

  } catch (error) {
    console.error("Teacher NEW HSK2:", error.message);

    return json({
      error: "Không tải được dữ liệu, hãy thử lại"
    }, 500);
  }
}
