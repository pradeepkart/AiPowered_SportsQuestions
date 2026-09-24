# Sports questions with Ollama

Open one of these five endpoints to generate a fresh list of questions and answers:

- GET /api/cricket
- GET /api/football
- GET /api/tennis
- GET /api/badminton
- GET /api/volleyball

Each request asks Ollama for 10 pairs and returns at most 10, as a JSON array.
Every item has question and answer fields. There is no history, repository,
DTO layer, database, or other application endpoint. All five endpoints accept an
optional `prompt` query parameter (maximum 1000 characters) to tailor the generated
quiz to the user's topic, for example `/api/cricket?prompt=questions%20about%20batting`.

## Run

The Spring Boot application lives in `backend/`, including controllers, services,
configuration, tests, and Maven build files. The React app lives in `frontend/`.

Requires Java 21+ and Ollama. Start Ollama if needed with:

```powershell
ollama serve
```

Then, in another terminal:

```powershell
ollama pull qwen2.5:3b
cd backend
.\mvnw.cmd spring-boot:run
```

Open http://localhost:8080/api/cricket (or one of the other four sports).
The Ollama URL and model are in `backend/src/main/resources/application.properties`.
Generating 10 pairs may take a little time.
Ollama failures or malformed responses return HTTP 502.

Run checks from `backend/` with `.\mvnw.cmd test`.

## React frontend

The `frontend` folder contains a React + JavaScript app with a responsive black
and purple UI. Requires Node.js 22. Run the backend and Ollama as described above,
then start the frontend in another terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` requests to the backend on port 8080.
Choose a sport and type a topic, such as "Give me 10 cricket questions" or
"Give me tennis answers only". The app detects the sport and requested display
format. If the prompt doesn't specify a format, the selected display control is
used. Switch between questions, answers, and both without generating again.
The backend requests 10 pairs; if the model returns fewer, the UI reports the
actual count. Copy set copies only the currently displayed fields.

```powershell
npm test
npm run build
npm run preview
```

The production bundle is generated in `frontend/dist`. For deployment, serve it
with an `/api` reverse proxy to Spring Boot (the Vite proxy is for local use).
Local preview runs on http://localhost:4173 and also proxies to port 8080.
