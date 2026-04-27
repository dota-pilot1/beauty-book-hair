package com.cj.beautybook.blog.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class LexicalPreviewExtractor {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_NODES = 4;

    public static String extract(String lexicalJson) {
        if (lexicalJson == null || lexicalJson.isBlank()) return null;
        try {
            JsonNode tree = MAPPER.readTree(lexicalJson);
            JsonNode root = tree.path("root");
            JsonNode children = root.path("children");
            if (!children.isArray() || children.isEmpty()) return null;

            // 첫 MAX_NODES 개 노드만 포함한 새 JSON 생성
            int limit = Math.min(children.size(), MAX_NODES);
            ObjectNode newRoot = MAPPER.createObjectNode();
            newRoot.put("type", root.path("type").asText("root"));
            newRoot.put("format", root.path("format").asText(""));
            newRoot.put("indent", root.path("indent").asInt(0));
            newRoot.put("version", root.path("version").asInt(1));
            newRoot.put("direction", root.path("direction").asText("ltr"));
            newRoot.set("children", MAPPER.createArrayNode()
                    .addAll((com.fasterxml.jackson.databind.node.ArrayNode)
                            MAPPER.createArrayNode().addAll(
                                    java.util.stream.StreamSupport
                                            .stream(children.spliterator(), false)
                                            .limit(limit)
                                            .collect(java.util.stream.Collectors.toList())
                            )));

            ObjectNode result = MAPPER.createObjectNode();
            result.set("root", newRoot);
            return MAPPER.writeValueAsString(result);
        } catch (Exception e) {
            return null;
        }
    }
}
