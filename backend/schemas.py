from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class OptionOut(BaseModel):
    id: str
    text: str
    model_config = ConfigDict(from_attributes=True)

class PollCreate(BaseModel):
    question: str
    options: List[str]

class PollOut(BaseModel):
    id: str
    results_id: str
    question: str
    options: List[OptionOut]
    model_config = ConfigDict(from_attributes=True)

class VoteCreate(BaseModel):
    user_id: Optional[str] = None
    option_id: str

class ResultsItem(BaseModel):
    option_id: str
    option: str
    votes: int

class ResultsOut(BaseModel):
    poll_id: str
    results_id: str
    question: str
    results: List[ResultsItem]
