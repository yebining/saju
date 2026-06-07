import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 키 없으면 null — 라우트가 저장/조회를 건너뛴다(앱은 동작).
const client = url && key ? createClient(url, key) : null;

export type StoredPayload = { kind: "rich" | "basic"; data: unknown };

export async function getStoredReading(key: string): Promise<StoredPayload | null> {
  if (!client) return null;
  try {
    const { data, error } = await client.from("saju_readings").select("payload").eq("key", key).maybeSingle();
    if (error || !data) return null;
    return data.payload as StoredPayload;
  } catch {
    return null;
  }
}

export async function storeReading(key: string, category: string, payload: StoredPayload): Promise<void> {
  if (!client) return;
  try {
    await client.from("saju_readings").upsert({ key, category, payload }, { onConflict: "key" });
  } catch {
    /* 저장 실패는 무시(부가기능) */
  }
}
