package com.example.sports_questions;

import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import com.example.sports_questions.Service.SportsAiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class SportsAiServiceTests {
    private SportsAiService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setup() {
        service = new SportsAiService("http://localhost:11434", "test-model");
        server = MockRestServiceServer.bindTo(
                (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate")).build();
    }

    @Test
    void returnsTenPairsFromOneOllamaRequest() {
        var pairs = pairs(10);
        server.expect(requestTo("http://localhost:11434/api/generate"))
                .andExpect(jsonPath("$.stream").value(false))
                .andExpect(jsonPath("$.format.type").value("array"))
                .andExpect(jsonPath("$.format.maxItems").value(10))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("cricket")))
                .andRespond(withSuccess(response(pairs), MediaType.APPLICATION_JSON));
        assertEquals(pairs, service.getQuestions("cricket"));
        server.verify();
    }

    @Test
    void includesSearchTopicInGenerationPrompt() {
        server.expect(requestTo("http://localhost:11434/api/generate"))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("offside rule")))
                .andRespond(withSuccess(response(pairs(10)), MediaType.APPLICATION_JSON));
        assertEquals(10, service.getQuestions("football", "offside rule").size());
        server.verify();
    }

    @Test
    void rejectsOverlongSearchPromptsBeforeCallingOllama() {
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> service.getQuestions("football", "x".repeat(1001))).getStatusCode());
        server.verify();
    }

    @Test
    void neverReturnsMoreThanTenPairs() {
        server.expect(requestTo("http://localhost:11434/api/generate"))
                .andRespond(withSuccess(response(pairs(12)), MediaType.APPLICATION_JSON));
        assertEquals(10, service.getQuestions("football").size());
        server.verify();
    }

    @Test
    void generatesFreshResultsInsteadOfHistory() {
        var first = Map.of("question", "First?", "answer", "First answer");
        var second = Map.of("question", "Second?", "answer", "Second answer");
        server.expect(requestTo("http://localhost:11434/api/generate"))
                .andRespond(withSuccess(response(List.of(first)), MediaType.APPLICATION_JSON));
        server.expect(requestTo("http://localhost:11434/api/generate"))
                .andRespond(withSuccess(response(List.of(second)), MediaType.APPLICATION_JSON));
        assertEquals(List.of(first), service.getQuestions("tennis"));
        assertEquals(List.of(second), service.getQuestions("tennis"));
        server.verify();
    }

    @Test
    void rejectsMissingAnswer() {
        server.expect(requestTo("http://localhost:11434/api/generate"))
                .andRespond(withSuccess(response(List.of(Map.of("question", "Question?"))),
                        MediaType.APPLICATION_JSON));
        assertEquals(HttpStatus.BAD_GATEWAY, assertThrows(ResponseStatusException.class,
                () -> service.getQuestions("badminton")).getStatusCode());
        server.verify();
    }

    @Test
    void rejectsEmptyResults() {
        server.expect(requestTo("http://localhost:11434/api/generate"))
                .andRespond(withSuccess(response(List.of()), MediaType.APPLICATION_JSON));
        assertEquals(HttpStatus.BAD_GATEWAY, assertThrows(ResponseStatusException.class,
                () -> service.getQuestions("volleyball")).getStatusCode());
        server.verify();
    }

    @Test
    void reportsOllamaFailure() {
        server.expect(requestTo("http://localhost:11434/api/generate")).andRespond(withServerError());
        assertEquals(HttpStatus.BAD_GATEWAY, assertThrows(ResponseStatusException.class,
                () -> service.getQuestions("cricket")).getStatusCode());
        server.verify();
    }

    private List<Map<String, String>> pairs(int count) {
        return IntStream.range(0, count)
                .mapToObj(i -> Map.of("question", "Question " + i, "answer", "Answer " + i)).toList();
    }

    private String response(Object result) {
        var mapper = tools.jackson.databind.json.JsonMapper.builder().build();
        return mapper.writeValueAsString(Map.of("response", mapper.writeValueAsString(result)));
    }
}
