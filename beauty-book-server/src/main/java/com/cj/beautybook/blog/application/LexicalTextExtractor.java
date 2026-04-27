package com.cj.beautybook.blog.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class LexicalTextExtractor {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_LENGTH = 300;

    public static String extract(String lexicalJson) {
        if (lexicalJson == null || lexicalJson.isBlank()) return "";
        try {
            JsonNode root = MAPPER.readTree(lexicalJson);
            StringBuilder sb = new StringBuilder();
            collectText(root, sb);
            String text = sb.toString().trim();
            return text.length() > MAX_LENGTH ? text.substring(0, MAX_LENGTH) + "…" : text;
        } catch (Exception e) {
            return "";
        }
    }

    private static void collectText(JsonNode node, StringBuilder sb) {
        if (node.isTextual()) return;
        if (node.has("text") && node.get("text").isTextual()) {
            String t = node.get("text").asText();
            if (!t.isBlank()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(t.trim());
            }
        }
        if (node.has("children")) {
            for (JsonNode child : node.get("children")) {
                collectText(child, sb);
            }
        } else {
            for (JsonNode child : node) {
                collectText(child, sb);
            }
        }
    }
}
