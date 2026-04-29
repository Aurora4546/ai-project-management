package com.projectmanagement.pmanage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LabelRequest {

    @NotBlank(message = "Label name is required")
    private String name;

    @NotBlank(message = "Label color is required")
    private String color;
}
