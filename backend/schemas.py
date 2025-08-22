from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class OptionOut(BaseModel):
    id: str
    text: str
    model_config = ConfigDict(from_attributes=True)

class FormCreate(BaseModel):
    question: str
    options: List[str]

class FormOut(BaseModel):
    id: str
    responses_id: str
    question: str
    options: List[OptionOut]
    model_config = ConfigDict(from_attributes=True)

class ResponseCreate(BaseModel):
    user_id: Optional[str] = None
    option_id: str

class ResponseItem(BaseModel):
    option_id: str
    option: str
    count: int

class ResponsesOut(BaseModel):
    form_id: str
    responses_id: str
    question: str
    responses: List[ResponseItem]
