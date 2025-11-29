package com.example.common_library.file;


import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "defty.server-file")
public class ServerFileProperties {
    private boolean enabled = false;
    private String rootDir = "/app/shared";

    private Limits limits = new Limits();

    @Data
    public static class Limits { // byte
        private long imageMaxSize = 5 * 1024 * 1024;
        private long audioMaxSize = 10 * 1024 * 1024;
        private long videoMaxSize = 50 * 1024 * 1024;
        private long documentMaxSize = 10 * 1024 * 1024;
        private long defaultMaxSize = 20 * 1024 * 1024;
    }
}