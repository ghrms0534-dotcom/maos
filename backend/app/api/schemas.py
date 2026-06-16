from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


class ToolInfo(BaseModel):
    name: str
    category: str
    description: str
    status: str
    detail: str
