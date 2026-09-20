# Sports questions with Ollama

Open one of these five endpoints to generate a fresh list of questions and answers:

- GET /api/cricket
- GET /api/football
- GET /api/tennis
- GET /api/badminton
- GET /api/volleyball

Each request asks Ollama for 10 pairs and returns at most 10, as a JSON array.
Every item has question and answer fields. There is no history, repository,
DTO layer, database, or other application endpoint.

## Run

Requires Java 21+ and Ollama. Start Ollama if needed with:

```powershell
ollama serve
```

Then, in another terminal:

```powershell
ollama pull qwen2.5:3b
.\mvnw.cmd spring-boot:run
```

Open http://localhost:8080/api/cricket (or one of the other four sports).
The Ollama URL and model are in src/main/resources/application.properties.
Generating 10 pairs may take a little time.
Ollama failures or malformed responses return HTTP 502.

Run checks with .\mvnw.cmd test.
