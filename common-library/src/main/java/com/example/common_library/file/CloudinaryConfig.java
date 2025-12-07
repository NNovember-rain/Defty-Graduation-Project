package com.example.common_library.file;

import com.cloudinary.Cloudinary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@EnableConfigurationProperties(FileProperties.class)
public class CloudinaryConfig {

    private final FileProperties fileProperties;

    public CloudinaryConfig(FileProperties fileProperties) {
        this.fileProperties = fileProperties;
        log.info("Cloudinary configuration active.");
    }

    @Bean
    public Cloudinary cloudinary() {
        FileProperties.CloudinaryProperties cloudinaryProps = fileProperties.getCloudinary();
        Map config = new HashMap();
        config.put("cloud_name", cloudinaryProps.getCloudName());
        config.put("api_key", cloudinaryProps.getApiKey());
        config.put("api_secret", cloudinaryProps.getApiSecret());
        config.put("secure", true);
        return new Cloudinary(config);
    }
}