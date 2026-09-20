package com.example.sports_questions.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

@Service
public class SportsAiService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final String baseUrl;
    private final String model;

    public SportsAiService(
            @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ollama.model:qwen2.5:3b}") String model) {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    public List<Map<String, String>> getQuestions(String sport) {
        String prompt = "Generate 10 different factual quiz questions about " + sport
                + " with accurate, concise answers. Focus on established rules and basic concepts."
                + " Return only a JSON array of objects with string fields question and answer.";
        Map<String, Object> itemFormat = Map.of(
                "type", "object",
                "properties", Map.of(
                        "question", Map.of("type", "string"),
                        "answer", Map.of("type", "string")),
                "required", List.of("question", "answer"),
                "additionalProperties", false);
        Map<String, Object> format = Map.of(
                "type", "array", "items", itemFormat, "minItems", 10, "maxItems", 10);
        Map<String, Object> request = Map.of(
                "model", model, "prompt", prompt, "stream", false, "format", format);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        Map<?, ?> response;
        try {
            response = restTemplate.postForObject(baseUrl + "/api/generate", entity, Map.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Check that Ollama is running and the configured model is installed.", exception);
        }
        if (response == null || !(response.get("response") instanceof String output) || output.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Ollama returned an empty response");
        }

        List<?> results;
        try {
            results = jsonMapper.readValue(output, List.class);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Ollama returned invalid JSON", exception);
        }
        if (results == null || results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Ollama returned no questions");
        }
        List<Map<String, String>> questions = new ArrayList<>();
        for (Object item : results) {
            if (!(item instanceof Map<?, ?> pair)
                    || !(pair.get("question") instanceof String question) || question.isBlank()
                    || !(pair.get("answer") instanceof String answer) || answer.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Each question must have an answer");
            }
            questions.add(Map.of("question", question.trim(), "answer", answer.trim()));
            if (questions.size() == 10) {
                break;
            }
        }
        return questions;
    }
}
