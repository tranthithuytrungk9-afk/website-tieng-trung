
import bai46de1 from "../../../netlify/functions/data/bai46-de1.json";
import bai46de2 from "../../../netlify/functions/data/bai46-de2.json";
import bai46de3 from "../../../netlify/functions/data/bai46-de3.json";
import bai46de4 from "../../../netlify/functions/data/bai46-de4.json";
import bai46de5 from "../../../netlify/functions/data/bai46-de5.json";

import bai47de1 from "../../../netlify/functions/data/bai47-de1.json";
import bai47de2 from "../../../netlify/functions/data/bai47-de2.json";
import bai47de3 from "../../../netlify/functions/data/bai47-de3.json";
import bai47de4 from "../../../netlify/functions/data/bai47-de4.json";
import bai47de5 from "../../../netlify/functions/data/bai47-de5.json";

import bai48de1 from "../../../netlify/functions/data/bai48-de1.json";
import bai48de2 from "../../../netlify/functions/data/bai48-de2.json";
import bai48de3 from "../../../netlify/functions/data/bai48-de3.json";
import bai48de4 from "../../../netlify/functions/data/bai48-de4.json";
import bai48de5 from "../../../netlify/functions/data/bai48-de5.json";

import bai49de1 from "../../../netlify/functions/data/bai49-de1.json";
import bai49de2 from "../../../netlify/functions/data/bai49-de2.json";
import bai49de3 from "../../../netlify/functions/data/bai49-de3.json";
import bai49de4 from "../../../netlify/functions/data/bai49-de4.json";
import bai49de5 from "../../../netlify/functions/data/bai49-de5.json";

import bai50de1 from "../../../netlify/functions/data/bai50-de1.json";
import bai50de2 from "../../../netlify/functions/data/bai50-de2.json";
import bai50de3 from "../../../netlify/functions/data/bai50-de3.json";
import bai50de4 from "../../../netlify/functions/data/bai50-de4.json";
import bai50de5 from "../../../netlify/functions/data/bai50-de5.json";

import bai59de1 from "../../../netlify/functions/data/bai59-de1.json";
import bai59de2 from "../../../netlify/functions/data/bai59-de2.json";
import bai59de3 from "../../../netlify/functions/data/bai59-de3.json";
import bai59de4 from "../../../netlify/functions/data/bai59-de4.json";
import bai59de5 from "../../../netlify/functions/data/bai59-de5.json";

import bai60de1 from "../../../netlify/functions/data/bai60-de1.json";
import bai60de2 from "../../../netlify/functions/data/bai60-de2.json";
import bai60de3 from "../../../netlify/functions/data/bai60-de3.json";
import bai60de4 from "../../../netlify/functions/data/bai60-de4.json";
import bai60de5 from "../../../netlify/functions/data/bai60-de5.json";

const sets = {
  "Bài 46": [bai46de1,bai46de2,bai46de3,bai46de4,bai46de5],
  "Bài 47": [bai47de1,bai47de2,bai47de3,bai47de4,bai47de5],
  "Bài 48": [bai48de1,bai48de2,bai48de3,bai48de4,bai48de5],
  "Bài 49": [bai49de1,bai49de2,bai49de3,bai49de4,bai49de5],
  "Bài 50": [bai50de1,bai50de2,bai50de3,bai50de4,bai50de5],
  "Bài 59": [bai59de1,bai59de2,bai59de3,bai59de4,bai59de5],
  "Bài 60": [bai60de1,bai60de2,bai60de3,bai60de4,bai60de5]
};

const normalize = value => String(value).toLowerCase()
  .replace(/[，。！？、,.!?；;：:\s]/g, "")
  .replace(/[\u200b-\u200d\ufeff]/g, "");

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

export async function onRequestPost({ request, env }) {
  try {
    const raw = await request.text();
    if (raw.length > 20000) return json(413, {error:"Dữ liệu quá lớn."});

    let data;
    try { data = JSON.parse(raw); }
    catch { return json(400, {error:"Dữ liệu không hợp lệ."}); }

    const ten = String(data.ten_hoc_sinh || "").trim();
    const lop = String(data.lop || "").trim();
    const lesson = data.bai_hoc;
    const soDe = Number(data.so_de);
    const lessonSets = sets[lesson];
    const questions = lessonSets && Number.isInteger(soDe)
      && soDe >= 1 && soDe <= 5 ? lessonSets[soDe - 1] : null;

    if (!ten || ten.length > 80 || !lop || lop.length > 40 ||
        !questions || !Array.isArray(data.answers) ||
        data.answers.length !== questions.length ||
        data.answers.some(a => typeof a !== "string" || a.length > 500)) {
      return json(400, {error:"Thông tin học sinh hoặc bài làm không hợp lệ."});
    }

    const details = questions.map((q, i) => ({
      correct: !!data.answers[i].trim() &&
        String(q.answer).split("|").some(
          v => normalize(v) === normalize(data.answers[i])
        ),
      answer: String(q.answer).split("|")[0],
      explain: q.explain
    }));

    const correctCount = details.filter(d => d.correct).length;
    const emptyCount = data.answers.filter(a => !a.trim()).length;
    const score = Math.round(correctCount / questions.length * 100);

    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return json(503, {error:"Chưa cấu hình Supabase trên Cloudflare."});
    }

    const record = {
      ten_hoc_sinh: ten,
      lop,
      bai_hoc: lesson,
      diem: score,
      so_de: soDe
    };

    const result = await fetch(
      url.replace(/\/$/, "") + "/rest/v1/ket_qua_hoc_sinh",
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(record)
      }
    );

    if (!result.ok) {
    console.error("Supabase error", result.status, await result.text());
      return json(502, {error:"Không lưu được điểm vào Supabase."});
    }

    const saved = await result.json();
    return json(200, {
      saved: true,
      score,
      correctCount,
      emptyCount,
      details,
      recordId: saved[0]?.id ?? "—"
    });
  } catch (error) {
    console.error("Submission error", error);
    return json(500, {error:"Lỗi xử lý bài nộp."});
  }
}
