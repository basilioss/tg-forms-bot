from sqlalchemy.orm import Session
from sqlalchemy import select, func
from . import models

def create_poll(db: Session, question: str, options: list[str]) -> models.Poll:
    poll = models.Poll(question=question)
    db.add(poll)
    db.flush()  # ensures poll.id is available
    for opt_text in options:
        db.add(models.Option(text=opt_text, poll_id=poll.id))
    db.commit()
    db.refresh(poll)
    return poll

def get_poll(db: Session, poll_id: str) -> models.Poll | None:
    return db.get(models.Poll, poll_id)

def create_vote(db: Session, option_id: str, user_id: str | None):
    # Remove previous votes by same user for this poll (simple dedupe)
    if user_id is not None:
        # find poll_id from option
        option = db.get(models.Option, option_id)
        if option:
            poll_id = option.poll_id
            # delete votes by that user in ANY option of this poll
            opt_ids = [o.id for o in option.poll.options]
            db.query(models.Vote).filter(
                models.Vote.user_id == user_id,
                models.Vote.option_id.in_(opt_ids)
            ).delete(synchronize_session=False)
            db.commit()
    v = models.Vote(option_id=option_id, user_id=user_id)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v

def get_results(db: Session, poll_id: str):
    poll = get_poll(db, poll_id)
    if not poll:
        return None
    results = []
    for opt in poll.options:
        results.append({
            "option_id": opt.id,
            "option": opt.text,
            "votes": len(opt.votes)
        })
    return {
        "poll_id": poll.id,
        "question": poll.question,
        "results": results
    }
