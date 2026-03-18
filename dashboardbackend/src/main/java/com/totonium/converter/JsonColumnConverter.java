package com.totonium.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Converter
public class JsonColumnConverter implements AttributeConverter<Object, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Object attribute) {
        if (attribute == null) {
            return null;
        }
        if (attribute instanceof List<?> list) {
            if (list.isEmpty()) {
                return null;
            }
            try {
                return objectMapper.writeValueAsString(list);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to convert list to JSON", e);
            }
        }
        if (attribute instanceof Map<?, ?> map) {
            if (map.isEmpty()) {
                return null;
            }
            try {
                return objectMapper.writeValueAsString(map);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to convert map to JSON", e);
            }
        }
        throw new RuntimeException("Unsupported type: " + attribute.getClass().getName());
    }

    @Override
    public Object convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            if (dbData.trim().startsWith("[")) {
                return objectMapper.readValue(dbData, new TypeReference<List<Object>>() {});
            } else if (dbData.trim().startsWith("{")) {
                return objectMapper.readValue(dbData, new TypeReference<Map<String, Object>>() {});
            }
            return objectMapper.readValue(dbData, new TypeReference<List<Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert JSON to object", e);
        }
    }

    public static List<String> convertStringList(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert JSON to string list", e);
        }
    }

    public static Map<String, Object> convertToMap(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(dbData, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert JSON to map", e);
        }
    }
}
