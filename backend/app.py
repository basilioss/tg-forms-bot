import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .db import Base, engine, SessionLocal
from . import crud, models, schemas

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Poll Bot API", version="0.1.0")

# Allow local dev frontends (Vite) and simple deployments
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    os.getenv("APP_BASE_URL", "http://localhost:5173"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.post("/api/polls", response_model=schemas.PollOut)
def create_poll(poll: schemas.PollCreate, db: Session = Depends(get_db)):
    if not poll.question.strip() or len(poll.options) < 1:
        raise HTTPException(status_code=400, detail="Provide question and at least one option.")
    options = [o.strip() for o in poll.options if o.strip()]
    if len(options) < 1:
        raise HTTPException(status_code=400, detail="Provide question and at least one option.")
    p = crud.create_poll(db, poll.question.strip(), options)
    return schemas.PollOut(
        id=p.id,
        results_id=p.results_id,
        question=p.question,
        options=[schemas.OptionOut.model_validate(o) for o in p.options]
    )

@app.get("/api/polls/{poll_id}", response_model=schemas.PollOut)
def get_poll(poll_id: str, db: Session = Depends(get_db)):
    p = crud.get_poll(db, poll_id)
    if not p:
        raise HTTPException(status_code=404, detail="Poll not found")
    return schemas.PollOut(
        id=p.id,
        results_id=p.results_id,
        question=p.question,
        options=[schemas.OptionOut.model_validate(o) for o in p.options]
    )

@app.post("/api/polls/{poll_id}/vote")
def vote(poll_id: str, vote: schemas.VoteCreate, db: Session = Depends(get_db)):
    poll = crud.get_poll(db, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    # ensure option belongs to poll
    if vote.option_id not in [o.id for o in poll.options]:
        raise HTTPException(status_code=400, detail="Option does not belong to poll")
    v = crud.create_vote(db, vote.option_id, vote.user_id)
    return {"ok": True, "vote_id": v.id}

@app.get("/api/results/{results_id}", response_model=schemas.ResultsOut)
def results(results_id: str, db: Session = Depends(get_db)):
    r = crud.get_results(db, results_id)
    if not r:
        raise HTTPException(status_code=404, detail="Poll not found")
    return r
