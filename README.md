# pydantic-ai-agent

PydanticAI와 Ollama 기반 로컬 AI Agent Platform 프로젝트입니다. 현재 구조는 React 대시보드, FastAPI 백엔드, Agent runner, Multi MCP Orchestrator, Hybrid Tool Router, Docker/Kubernetes 배포 구성을 포함합니다.

## 구조

```text
pydantic-ai-agent/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── config.py
│   │   └── main.py
│   ├── scripts/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── data/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.ts
├── k8s/
├── Dockerfile
├── pyproject.toml
├── uv.lock
├── README.md
├── .env.example
├── .gitignore
└── .dockerignore
```

## 요구사항

- Python 3.11 이상
- uv
- Node.js 20 이상
- Ollama
- Ollama model: `qwen2.5:3b`
- Docker, kind, kubectl

## 백엔드 실행

Windows PowerShell 기준입니다.

```powershell
uv venv
.\.venv\Scripts\Activate.ps1
uv sync
Copy-Item .env.example .env
ollama pull qwen2.5:3b
```

로컬 실행은 `.env`의 값을 사용합니다.

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

Ollama 연결 확인:

```powershell
uv run python backend/scripts/health_check.py
```

CLI 실행:

```powershell
uv run python -m backend.app.main
```

FastAPI 실행:

```powershell
uvicorn backend.app.api.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger:

```text
http://localhost:8000/docs
```

Health check:

```powershell
curl http://localhost:8000/health
```

기존 chat endpoint:

```powershell
curl -X POST http://localhost:8000/chat `
  -H "Content-Type: application/json" `
  -d "{\"message\":\"hello\"}"
```

Dashboard chat endpoint:

```powershell
curl -X POST http://localhost:8000/api/chat `
  -H "Content-Type: application/json" `
  -d "{\"message\":\"현재 Kubernetes pod 상태 알려줘\"}"
```

## 프론트엔드 실행

```powershell
cd frontend
npm install
npm run dev
```

브라우저 접속:

```text
http://localhost:5173
```

Frontend API client의 기본 백엔드 주소는 아래와 같습니다.

```text
http://localhost:8000
```

다른 백엔드 주소를 사용하려면 `frontend/.env`에 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8000
```

Production build:

```powershell
cd frontend
npm run build
```

## API

- `GET /health`: 서버 상태 확인
- `GET /tools`: 현재 Agent 도구 목록 조회
- `POST /chat`: 기존 chat endpoint
- `POST /api/chat`: Dashboard용 chat endpoint

`POST /api/chat` 요청:

```json
{
  "message": "현재 Kubernetes pod 상태 알려줘"
}
```

응답:

```json
{
  "answer": "..."
}
```

## Dashboard

React + TypeScript + Vite + TailwindCSS 기반 대시보드입니다.

- Top Header: API Status
- Left Sidebar: Chat, History, Tools, Settings
- Center: Chat UI, input box, Send button, Loading spinner, New Chat
- Right Sidebar: Agent Info, Available Tools, Reasoning Process

Reasoning Process UI는 실제 chain-of-thought가 아니라 진행 단계 표시용입니다.

```text
1. Detect intent
2. Select tool
3. Execute tool
4. Process result
5. Return answer
```

## Response Guards

최종 응답은 자연스러운 한국어를 우선합니다. 중국어/일본어 문자가 섞이면 language guard가 1회 재시도하고, 실패하면 안전 문구를 반환합니다.

Tool 결과는 가능한 raw output 그대로가 아니라 한국어 요약 또는 보기 좋은 상태 표로 반환합니다. `kubectl`, shell, JSON, YAML, table 출력은 output guard가 감지합니다.

Kubernetes 원본 상태값은 그대로 유지합니다.

```text
Running
Pending
CrashLoopBackOff
ImagePullBackOff
```

## Kubernetes Deploy

Kubernetes Pod 안에서 `localhost`는 로컬 PC가 아니라 Pod 자기 자신입니다. Deployment에서는 Ollama 주소를 `http://host.docker.internal:11434`로 주입합니다. 로컬 `.env`의 `localhost` 값은 변경하지 않습니다.

```powershell
docker build -t pydantic-ai-agent:local .
kind load docker-image pydantic-ai-agent:local
kubectl apply -f k8s/agent-deployment.yaml
kubectl get pods
kubectl logs deployment/pydantic-ai-agent
kubectl delete -f k8s/agent-deployment.yaml
```

`kind load docker-image`는 kind 노드가 로컬 Docker 이미지를 사용할 수 있게 합니다. `imagePullPolicy: Never`는 외부 registry pull 대신 kind 노드에 로드된 이미지를 사용하게 합니다.

## Tools

- `get_git_status`: `git status --short`
- `get_k8s_pods`: Kubernetes Pod 조회
- `get_k8s_deployments`: Kubernetes Deployment 조회
- `get_k8s_services`: Kubernetes Service 조회
- `get_k8s_namespaces`: Kubernetes Namespace 조회
- `get_k8s_nodes`: Kubernetes Node 조회
- `get_github_repo_info`: GitHub public repository 정보 조회
- `get_public_ip`: public IP 조회

## 예시 질문

```text
안녕
쿠버네티스가 무엇인가
현재 pods 상태 알려줘
default namespace pod 보여줘
현재 deployment 상태 알려줘
현재 service 목록 알려줘
현재 namespace 목록 알려줘
현재 node 상태 알려줘
pod 상태 보기 좋게 요약해줘
FastAPI endpoint 하나 만들어줘
```

## 검증

Backend tests:

```powershell
pytest
```

Frontend build:

```powershell
cd frontend
npm run build
```
