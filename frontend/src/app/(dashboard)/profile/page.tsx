"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import { Check, ImagePlus, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { UpdateProfileRequest, UserSummary } from "@/types";

const maximumOriginalPhotoSize = 12 * 1024 * 1024;
const maximumUploadedPhotoSize = 1_200_000;

async function prepareProfilePhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem.");
  }
  if (file.size > maximumOriginalPhotoSize) {
    throw new Error("A imagem deve ter no máximo 12 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Não foi possível abrir essa imagem. Escolha outro arquivo.");
  }

  try {
    if (bitmap.width > 12_000 || bitmap.height > 12_000) {
      throw new Error("A resolução da imagem é muito alta. Escolha outra foto.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Não foi possível preparar a imagem. Tente outra foto.");
    }

    const sourceSize = Math.min(bitmap.width, bitmap.height);
    const sourceX = (bitmap.width - sourceSize) / 2;
    const sourceY = (bitmap.height - sourceSize) / 2;
    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      canvas.width,
      canvas.height
    );

    for (const quality of [0.85, 0.7, 0.55]) {
      const photo = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!photo) {
        throw new Error("Não foi possível preparar a imagem. Tente outra foto.");
      }
      if (photo.size <= maximumUploadedPhotoSize) return photo;
    }
  } finally {
    bitmap.close();
  }

  throw new Error("Não foi possível reduzir a foto o suficiente. Escolha outra.");
}

async function uploadProfilePhoto(photo: Blob) {
  const token = localStorage.getItem("gymnotes_token");
  if (!token) {
    throw new Error("Entre novamente para enviar sua foto de perfil.");
  }

  const response = await fetch("/api/profile-photo", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
    },
    body: photo,
  });
  let result: { error?: unknown; photoUrl?: unknown } = {};
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      result = body;
    }
  } catch {
    // Keep a localized fallback if the upload endpoint returns a non-JSON error.
  }

  if (!response.ok || typeof result.photoUrl !== "string") {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : "Não foi possível enviar sua foto de perfil."
    );
  }

  return result.photoUrl;
}

export default function ProfilePage() {
  const {
    user,
    isLoadingProfile,
    isProfileError,
    refetchProfile,
    updateProfile,
    isUpdatingProfile,
  } = useAuth();

  if (isLoadingProfile || !user) {
    if (isProfileError) {
      return (
        <section className="mx-4 mt-6 rounded-2xl border border-border bg-surface p-6 md:mx-0">
          <p className="text-sm text-white">
            Não foi possível carregar seu perfil.
          </p>
          <button
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-white hover:bg-white/5"
            onClick={() => void refetchProfile()}
            type="button"
          >
            Tentar novamente
          </button>
        </section>
      );
    }

    return (
      <section
        role="status"
        className="mx-4 mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-muted md:mx-0"
      >
        Carregando seu perfil…
      </section>
    );
  }

  return (
    <ProfileForm
      isUpdatingProfile={isUpdatingProfile}
      user={user}
      updateProfile={updateProfile}
    />
  );
}

function ProfileForm({
  user,
  isUpdatingProfile,
  updateProfile,
}: {
  user: UserSummary;
  isUpdatingProfile: boolean;
  updateProfile: (profile: UpdateProfileRequest) => Promise<UserSummary>;
}) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    user.profilePictureUrl ?? ""
  );
  const [bio, setBio] = useState(user.bio ?? "");
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setSaved(false);
    setIsUploadingPhoto(true);
    try {
      const photo = await prepareProfilePhoto(file);
      setProfilePictureUrl(await uploadProfilePhoto(photo));
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a foto. Tente novamente."
      );
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSaved(false);

    try {
      const updatedUser = await updateProfile({
        name: name.trim(),
        username: username.trim(),
        profilePictureUrl: profilePictureUrl.trim(),
        bio: bio.trim(),
      });
      setName(updatedUser.name);
      setUsername(updatedUser.username);
      setProfilePictureUrl(updatedUser.profilePictureUrl ?? "");
      setBio(updatedUser.bio ?? "");
      setSaved(true);
    } catch {
      setFormError(
        "Não foi possível salvar seu perfil. Verifique os dados e tente novamente."
      );
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-8 pt-6 md:px-0 md:pt-0">
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
          Sua conta
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Perfil
        </h1>
        <p className="mt-2 text-sm text-muted">
          Atualize as informações que aparecem na sua conta.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-surface p-5 md:p-8"
      >
        <div className="mb-7 flex items-center gap-4 border-b border-border pb-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-muted">
            {profilePictureUrl ? (
              <Image
                alt="Foto do perfil"
                className="h-14 w-14 rounded-full object-cover"
                height={56}
                src={profilePictureUrl}
                unoptimized
                width={56}
              />
            ) : (
              <UserRound aria-hidden="true" className="h-7 w-7" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{user.name}</p>
            <p className="truncate text-sm text-muted">@{user.username}</p>
          </div>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-white">
            Nome
            <input
              autoComplete="name"
              className="min-h-12 rounded-xl border border-border bg-black/20 px-4 text-white placeholder:text-muted focus:border-white/50 focus:outline-none"
              maxLength={150}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-white">
            Nome de usuário
            <span className="flex min-h-12 items-center rounded-xl border border-border bg-black/20 px-4 text-muted focus-within:border-white/50">
              <span aria-hidden="true">@</span>
              <input
                autoComplete="username"
                className="h-full min-w-0 flex-1 bg-transparent pl-1 text-white placeholder:text-muted focus:outline-none"
                maxLength={20}
                minLength={3}
                onChange={(event) => setUsername(event.target.value)}
                pattern="[a-zA-Z0-9._]+"
                required
                value={username}
              />
            </span>
            <span className="text-xs font-normal text-muted">
              Use de 3 a 20 letras, números, pontos ou sublinhados.
            </span>
          </label>

          <label className="grid gap-2 text-sm font-medium text-white">
            Email
            <input
              autoComplete="email"
              className="min-h-12 rounded-xl border border-border bg-black/10 px-4 text-muted"
              readOnly
              value={user.email}
            />
            <span className="text-xs font-normal text-muted">
              O email não pode ser alterado por aqui.
            </span>
          </label>

          <section className="grid gap-2 text-sm font-medium text-white">
            <h2>Foto do perfil</h2>
            <p className="text-xs font-normal text-muted">
              Escolha uma imagem de até 12 MB. Ela será ajustada para o formato
              quadrado. Salve as alterações para aplicar a foto ao perfil.
            </p>
            <input
              ref={photoInputRef}
              accept="image/*"
              aria-label="Escolher foto do perfil"
              className="sr-only"
              onChange={(event) => void handleProfilePhotoChange(event)}
              type="file"
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-white transition hover:border-white/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUploadingPhoto || isUpdatingProfile}
                onClick={() => photoInputRef.current?.click()}
                type="button"
              >
                <ImagePlus aria-hidden="true" className="h-4 w-4" />
                {isUploadingPhoto
                  ? "Enviando foto…"
                  : profilePictureUrl
                    ? "Trocar foto"
                    : "Enviar foto"}
              </button>
              {profilePictureUrl && (
                <button
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm text-muted transition hover:border-white/50 hover:text-white disabled:opacity-50"
                  disabled={isUploadingPhoto || isUpdatingProfile}
                  onClick={() => {
                    setProfilePictureUrl("");
                    setPhotoError("");
                    setSaved(false);
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Remover foto
                </button>
              )}
            </div>
            {photoError && (
              <p role="alert" className="text-sm font-normal text-red-400">
                {photoError}
              </p>
            )}
          </section>

          <label className="grid gap-2 text-sm font-medium text-white">
            Bio
            <textarea
              className="min-h-28 resize-y rounded-xl border border-border bg-black/20 px-4 py-3 text-white placeholder:text-muted focus:border-white/50 focus:outline-none"
              maxLength={1000}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Conte um pouco sobre você"
              value={bio}
            />
            <span className="text-right text-xs font-normal text-muted">
              {bio.length}/1000
            </span>
          </label>
        </div>

        {formError && (
          <p role="alert" className="mt-5 text-sm text-red-400">
            {formError}
          </p>
        )}
        {saved && (
          <p
            role="status"
            className="mt-5 flex items-center gap-2 text-sm text-emerald-400"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            Perfil atualizado.
          </p>
        )}

        <div className="mt-7 flex justify-end">
          <button
            className="min-h-12 rounded-xl bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isUpdatingProfile || isUploadingPhoto}
            type="submit"
          >
            {isUpdatingProfile ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </main>
  );
}
