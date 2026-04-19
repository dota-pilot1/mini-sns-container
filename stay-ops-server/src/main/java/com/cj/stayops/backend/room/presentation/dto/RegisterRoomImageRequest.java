package com.cj.stayops.backend.room.presentation.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterRoomImageRequest(
	@NotBlank String s3Key
) {}
