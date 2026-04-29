package com.projectmanagement.pmanage.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class ChatProperties {

    /**
     * Directory for chat file uploads.
     */
    private String uploadDir = "./uploads/chat";

}
