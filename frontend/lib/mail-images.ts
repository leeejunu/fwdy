import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const MAIL_IMAGE_BUCKET = "images";

export async function uploadMailImage(dataUrl: string, role: "shipper" | "console") {
  const supabase = getSupabaseBrowserClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("로그인 후 이미지를 저장할 수 있어요.");

  const blob = await fetch(dataUrl).then(response => response.blob());
  const path = `${user.id}/${crypto.randomUUID()}/${role}.jpg`;
  const { data, error } = await supabase.storage.from(MAIL_IMAGE_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`이미지 저장 실패: ${error.message}`);
  return data.path;
}

export async function downloadMailImage(path: string) {
  const { data, error } = await getSupabaseBrowserClient().storage.from(MAIL_IMAGE_BUCKET).download(path);
  if (error) throw new Error(`저장된 이미지를 불러오지 못했어요: ${error.message}`);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("이미지를 읽지 못했어요."));
    reader.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
    reader.readAsDataURL(data);
  });
}

export async function deleteMailImages(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await getSupabaseBrowserClient().storage.from(MAIL_IMAGE_BUCKET).remove(paths);
  if (error) throw new Error(`저장된 이미지 삭제 실패: ${error.message}`);
}
