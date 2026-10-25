package com.gymnotes.dto;

import com.gymnotes.domain.enums.InteractionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record InteractionRequestDTO(
    @NotNull(message = "O tipo de alvo é obrigatório (WORKOUT ou MEAL).")
    @Pattern(regexp = "^(WORKOUT|MEAL)$", message = "O targetType deve ser 'WORKOUT' ou 'MEAL'.")
    String targetType,

    @NotNull(message = "O ID do alvo é obrigatório.")
    UUID targetId,

    @NotNull(message = "O tipo de interação é obrigatório (LIKE ou COMMENT).")
    InteractionType type,

    @Size(max = 1000, message = "O comentário deve ter no máximo 1000 caracteres.")
    String commentText
) {}

