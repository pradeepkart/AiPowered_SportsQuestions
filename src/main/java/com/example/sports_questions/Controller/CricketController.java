package com.example.sports_questions.Controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.sports_questions.Service.SportsAiService;

@RestController
@RequestMapping("/api/cricket")
public class CricketController {
    private final SportsAiService sportsAiService;

    public CricketController(SportsAiService sportsAiService) {
        this.sportsAiService = sportsAiService;
    }

    @GetMapping
    public List<Map<String, String>> getQuestions() {
        return sportsAiService.getQuestions("cricket");
    }
}
