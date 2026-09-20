package com.example.sports_questions.Controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.sports_questions.Service.SportsAiService;

@RestController
@RequestMapping("/api/football")
public class FootballController {
    private final SportsAiService sportsAiService;

    public FootballController(SportsAiService sportsAiService) {
        this.sportsAiService = sportsAiService;
    }

    @GetMapping
    public List<Map<String, String>> getQuestions() {
        return sportsAiService.getQuestions("football");
    }
}
