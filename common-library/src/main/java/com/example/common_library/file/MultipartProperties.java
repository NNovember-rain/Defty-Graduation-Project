package com.example.common_library.file;


import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "defty.multipart")
public class MultipartProperties {
    private boolean enabled = true;

    //mb
    private int maxFileSizeMb = 150;
    private int maxRequestSizeMb = 150;
}