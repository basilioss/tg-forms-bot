import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from .db import Base, engine, SessionLocal
from . import crud, models, schemas

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Forms Bot API", version="0.2.0")

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

@app.post("/api/forms", response_model=schemas.FormOut)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    if not form.question.strip() or len(form.options) < 1:
        raise HTTPException(status_code=400, detail="Provide question and at least one option.")
    options = [o.strip() for o in form.options if o.strip()]
    f = crud.create_form(db, form.question.strip(), options)
    return schemas.FormOut(
        id=f.id,
        responses_id=f.responses_id,
        question=f.question,
        options=[schemas.OptionOut.model_validate(o) for o in f.options]
    )

@app.get("/api/forms/{form_id}", response_model=schemas.FormOut)
def get_form(form_id: str, db: Session = Depends(get_db)):
    f = crud.get_form(db, form_id)
    if not f:
        raise HTTPException(status_code=404, detail="Form not found")
    return schemas.FormOut(
        id=f.id,
        responses_id=f.responses_id,
        question=f.question,
        options=[schemas.OptionOut.model_validate(o) for o in f.options]
    )

@app.post("/api/forms/{form_id}/response")
def submit_response(form_id: str, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if response.option_id not in [o.id for o in form.options]:
        raise HTTPException(status_code=400, detail="Option does not belong to form")
    r = crud.create_response(db, response.option_id, response.user_id)
    return {"ok": True, "response_id": r.id}

@app.get("/api/responses/{responses_id}", response_model=schemas.ResponsesOut)
def get_responses(responses_id: str, db: Session = Depends(get_db)):
    r = crud.get_responses(db, responses_id)
    if not r:
        raise HTTPException(status_code=404, detail="Form not found")
    return r
