import { uploadBlobPhoto } from "@/lib/uploadBlobPhoto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return uploadBlobPhoto(request, "profile-photos");
}
