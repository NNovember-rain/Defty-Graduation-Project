package com.example.common_library.file;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "defty.file")
public class FileProperties {
    private boolean enabled = true;
    private CloudinaryProperties cloudinary;

    @Data
    public static class CloudinaryProperties {
        private String cloudName;
        private String apiKey;
        private String apiSecret;
    }
}