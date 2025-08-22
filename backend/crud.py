from sqlalchemy.orm import Session
from sqlalchemy import select, func
from . import models

def create_form(db: Session, question: str, options: list[str]) -> models.Form:
    form = models.Form(question=question)
    db.add(form)
    db.flush()  # ensures form.id is available
    for opt_text in options:
        db.add(models.Option(text=opt_text, form_id=form.id))
    db.commit()
    db.refresh(form)
    return form

def get_form(db: Session, form_id: str) -> models.Form | None:
    return db.get(models.Form, form_id)

def create_response(db: Session, option_id: str, user_id: str | None):
    # Remove previous responses by same user for this form (simple dedupe)
    if user_id is not None:
        # find form_id from option
        option = db.get(models.Option, option_id)
        if option:
            form_id = option.form_id
            # delete responses by that user in ANY option of this form
            opt_ids = [o.id for o in option.form.options]
            db.query(models.Response).filter(
                models.Response.user_id == user_id,
                models.Response.option_id.in_(opt_ids)
            ).delete(synchronize_session=False)
            db.commit()
    r = models.Response(option_id=option_id, user_id=user_id)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

def get_responses(db: Session, responses_id: str):
    form = db.query(models.Form).filter_by(responses_id=responses_id).first()
    if not form:
        return None
    responses = []
    for opt in form.options:
        responses.append({
            "option_id": opt.id,
            "option": opt.text,
            "count": len(opt.responses)
        })
    return {
        "form_id": form.id,
        "responses_id": form.responses_id,
        "question": form.question,
        "responses": responses
    }
