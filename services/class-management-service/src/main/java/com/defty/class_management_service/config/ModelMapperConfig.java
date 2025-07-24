package com.defty.class_management_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;

import java.util.logging.Logger;

@Configuration
public class ModelMapperConfig {
    private static final Logger LOGGER = Logger.getLogger(ModelMapperConfig.class.getName());

    @Bean
    public ModelMapper strictModelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        // Thiết lập Strict Mapping
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)  // Kích hoạt ánh xạ theo trường
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE)
                .setAmbiguityIgnored(true); // ✅ Bỏ qua nếu có sự không rõ ràng trong ánh xạ

        // ✅ Converter tự động bỏ qua nếu kiểu dữ liệu không khớp
        modelMapper.getConfiguration().setPropertyCondition(context -> {
            try {
                context.getDestinationType().cast(context.getSource());
                return true; // Nếu có thể cast được thì ánh xạ
            } catch (ClassCastException e) {
                LOGGER.warning("Bỏ qua trường không cùng kiểu dữ liệu: "
                        + context.getSourceType() + " -> " + context.getDestinationType());
                return false; // Nếu không thể cast, bỏ qua ánh xạ
            }
        });

        return modelMapper;
    }
}

