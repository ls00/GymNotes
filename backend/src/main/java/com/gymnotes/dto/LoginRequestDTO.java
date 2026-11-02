package com.gymnotes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequestDTO(
    @NotBlank(message = "Informe seu e-mail ou nome de usuário.")
    @Size(max = 255, message = "O login deve ter no máximo 255 caracteres.")
    String identifier,

    @NotBlank(message = "A senha é obrigatória.")
    String password
) {}
