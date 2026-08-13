# AI Interview Coach

AI Interview Coach is a full-stack technical interview practice platform for aspiring AI Engineers, ML Engineers, and Data Scientists. It provides a realistic five-question interview, evaluates each response, and produces a final report that helps candidates identify their strengths and the topics they should improve.

Candidates choose their target role, interview topic, and difficulty before beginning. They can complete the interview in written mode or use the real-time voice mode, where the interviewer asks questions aloud and automatically opens the microphone after each question. The application evaluates responses with LLM and RAG-supported context, then asks a relevant follow-up question until the interview is complete.

## Live App

- Frontend: https://ai-interview-coach-ten-black.vercel.app
- Backend API: https://ai-interview-coach-2-82in.onrender.com
- API health check: https://ai-interview-coach-2-82in.onrender.com/health

## Features

- Written and real-time voice interview modes.
- Role options for AI Engineer, ML Engineer, and Data Scientist.
- Configurable topics and Easy, Medium, or Hard difficulty levels.
- Five-question interview flow with answer evaluation and follow-up questions.
- RAG-supported technical evaluation using interview reference material.
- Final report with question scores, overall rating, strengths, improvement areas, recommended topics, and hiring recommendation.
- Graceful early-end handling for incomplete interviews.
- Automatic voice flow: interviewer speaks, microphone starts, candidate finishes an answer, and the next question begins.

## Language Availability

English (`en-US`) is currently the only available language for both written and real-time voice interviews. The interview questions, reference material, AI evaluation, speech recognition, and speech synthesis are aligned to English so candidates receive reliable scores.

Portuguese, German, Chinese, Spanish, and Italian are shown as unavailable in the language selector. Multilingual interview support and translated evaluation material are planned for a future release.

## Architecture

```text
React + Vite frontend
	|
	| Axios HTTP requests
	v
FastAPI backend
	|
	+-- Interview session and answer flow
	+-- OpenAI question generation and evaluation
	+-- RAG retrieval and vector search
	+-- Language-mismatch intent classification
	v
Final interview report
```

## Technology Stack

- **Frontend:** React, Vite, React Router, Axios, Tailwind CSS, Web Speech API
- **Backend:** Python, FastAPI, Pydantic, Uvicorn
- **AI and RAG:** OpenAI, LangChain, Hugging Face sentence transformers, Pinecone

## Run Locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create `backend/.env` with the environment variables required by the configured OpenAI and vector-store services before running evaluation features.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## API

The FastAPI interview routes are available under `/api/interview`:

- `POST /start` starts a new interview.
- `POST /answer` evaluates an answer and returns the next question or final report.
- `POST /stop` ends an interview early.
- `POST /conversation` handles supported conversational turns during voice interviews.

Developed by Shrabani Panigrahi.
