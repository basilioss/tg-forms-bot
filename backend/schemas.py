from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class OptionOut(BaseModel):
    id: int
    text: str
    model_config = ConfigDict(from_attributes=True)

class PollCreate(BaseModel):
    question: str
    options: List[str]

class PollOut(BaseModel):
    id: int
    question: str
    options: List[OptionOut]
    model_config = ConfigDict(from_attributes=True)

class VoteCreate(BaseModel):
    user_id: Optional[str] = None
    option_id: int

class ResultsItem(BaseModel):
    option_id: int
    option: str
    votes: int

class ResultsOut(BaseModel):
    poll_id: int
    question: str
    results: List[ResultsItem]
