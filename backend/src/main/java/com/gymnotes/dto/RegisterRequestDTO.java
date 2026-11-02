package com.gymnotes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequestDTO(
    @NotBlank(message = "O nome de usuário é obrigatório.")
    @Size(min = 3, max = 20, message = "O nome de usuário deve ter entre 3 e 20 caracteres.")
    @Pattern(regexp = "^[a-zA-Z0-9._]+$", message = "Use apenas letras, números, ponto e sublinhado no nome de usuário.")
    String username,

    @NotBlank(message = "O nome de exibição é obrigatório.")
    @Size(min = 2, max = 150, message = "O nome de exibição deve ter entre 2 e 150 caracteres.")
    String displayName,

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    String email,

    @NotBlank(message = "A senha é obrigatória.")
    @Size(min = 6, max = 100, message = "A senha deve ter no mínimo 6 caracteres.")
    String password
) {}
