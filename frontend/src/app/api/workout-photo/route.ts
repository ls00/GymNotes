import { put } from "@vercel/blob";

export const runtime = "nodejs";

const maximumPhotoSize = 1_200_000;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length <= 7) {
    return Response.json({ error: "É necessário entrar na conta para enviar a foto." }, { status: 401 });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!apiBaseUrl) {
    return Response.json({ error: "A URL da API não está configurada." }, { status: 503 });
  }
  if (request.headers.get("content-type") !== "image/jpeg") {
    return Response.json({ error: "Envie uma imagem JPEG." }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumPhotoSize) {
    return Response.json({ error: "A foto excede o tamanho permitido." }, { status: 413 });
  }

  const photo = Buffer.from(await request.arrayBuffer());
  if (
    photo.length === 0 ||
    photo.length > maximumPhotoSize ||
    photo[0] !== 0xff ||
    photo[1] !== 0xd8 ||
    photo[2] !== 0xff
  ) {
    return Response.json({ error: "A foto deve ser um arquivo JPEG válido de até 1,2 MB." }, { status: 400 });
  }

  const profileResponse = await fetch(`${apiBaseUrl}/users/me`, {
    headers: { Authorization: authorization },
    cache: "no-store",
    redirect: "error",
  });
  if (profileResponse.status === 401) {
    return Response.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }
  if (!profileResponse.ok) {
    return Response.json({ error: "Não foi possível validar sua sessão na API." }, { status: 502 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "O armazenamento de imagens não está configurado." }, { status: 503 });
  }

  const blob = await put(`workout-photos/${crypto.randomUUID()}.jpg`, photo, {
    access: "public",
    addRandomSuffix: true,
    contentType: "image/jpeg",
  });

  return Response.json({ photoUrl: blob.url });
}
