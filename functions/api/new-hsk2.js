// Cloudflare Pages Function - NEW HSK 2
// Duong dan: /api/new-hsk2

const respond = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });

async function saveToSupabase(env, table, data) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Chua cau hinh Supabase");
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/${table}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    throw new Error("Loi luu du lieu");
  }

  return (await response.json())[0];
}

export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get("Origin");

    if (
      !origin ||
      origin !== new URL(request.url).origin
    ) {
      return respond({ error: "Nguon gui khong hop le" }, 403);
    }

    const body = await request.json();

    if (body.action === "student") {
      const ho_ten = String(body.ho_ten || "").trim();
      const lop = String(body.lop || "").trim();

      if (
        ho_ten.length < 2 ||
        ho_ten.length > 100 ||
        !lop ||
        lop.length > 60
      ) {
        return respond({ error: "Thong tin hoc sinh khong hop le" }, 400);
      }

      const student = await saveToSupabase(
        env,
        "new_hsk2_hoc_sinh",
        { ho_ten, lop }
      );

      return respond({
        ok: true,
        hoc_sinh_id: student.id
      });
    }

    const id = String(body.hoc_sinh_id || "");
    const bai = body.bai_hoc;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      !Number.isInteger(bai) ||
      bai < 1 ||
      bai > 15
    ) {
      return respond({ error: "Thong tin bai hoc khong hop le" }, 400);
    }

    if (body.action === "progress") {
      const allowed = [
        "tu_moi", "luyen_tu", "chu_han",
        "nghe", "noi", "ngu_phap", "on_tap"
      ];

      if (!allowed.includes(body.phan_hoc)) {
        return respond({ error: "Phan hoc khong hop le" }, 400);
      }

      const muc = body.muc_do ?? null;

      if (
        muc !== null &&
        (!Number.isInteger(muc) || muc < 1 || muc > 3)
      ) {
        return respond({ error: "Muc do khong hop le" }, 400);
      }

      const fields = [
        "so_lan_tuong_tac",
        "so_cau_dung",
        "so_cau_sai",
        "thoi_gian_hoc_giay"
      ];

      const values = {};

      for (const field of fields) {
        const value = body[field] ?? 0;

        if (
          !Number.isInteger(value) ||
          value < 0 ||
          value > 100000
        ) {
          return respond({ error: "So lieu khong hop le" }, 400);
        }

        values[field] = value;
      }

      const result = await saveToSupabase(
        env,
        "new_hsk2_tien_do",
        {
          hoc_sinh_id: id,
          bai_hoc: bai,
          phan_hoc: body.phan_hoc,
          muc_do: muc,
          ...values,
          du_lieu_chi_tiet: {}
        }
      );

      return respond({ ok: true, id: result.id });
    }

    if (body.action === "score") {
      const correct = body.so_cau_dung;

      if (
        !Number.isInteger(correct) ||
        correct < 0 ||
        correct > 25
      ) {
        return respond({ error: "Diem khong hop le" }, 400);
      }

      const result = await saveToSupabase(
        env,
        "new_hsk2_diem",
        {
          hoc_sinh_id: id,
          bai_hoc: bai,
          so_cau_dung: correct,
          tong_so_cau: 25,
          diem: correct * 4,
          chi_tiet: {
            nguon: "client_unverified"
          }
        }
      );

      return respond({
        ok: true,
        id: result.id,
        diem: result.diem
      });
    }

    return respond({ error: "Thao tac khong hop le" }, 400);

  } catch (error) {
    console.error("NEW HSK2:", error.message);

    return respond({
      error: "Khong luu duoc du lieu"
    }, 500);
  }
}

export function onRequestGet() {
  return respond({
    ok: true,
    service: "NEW HSK 2",
    status: "ready"
  });
}
