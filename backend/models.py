from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .db import Base
import secrets, base64

def generate_id():
    return base64.urlsafe_b64encode(secrets.token_bytes(8)).decode("utf-8").rstrip("=")

class Poll(Base):
    __tablename__ = "polls"
    id = Column(String(20), primary_key=True, default=generate_id, index=True)
    results_id = Column(String(20), unique=True, default=generate_id, index=True)
    question = Column(String, nullable=False)
    options = relationship("Option", back_populates="poll", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "options"
    id = Column(String(20), primary_key=True, default=generate_id, index=True)
    text = Column(String, nullable=False)
    poll_id = Column(String(20), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False, index=True)
    poll = relationship("Poll", back_populates="options")
    votes = relationship("Vote", back_populates="option", cascade="all, delete-orphan")

class Vote(Base):
    __tablename__ = "votes"
    id = Column(String(20), primary_key=True, default=generate_id, index=True)
    option_id = Column(String(20), ForeignKey("options.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, nullable=True, index=True)  # Telegram user id or anon UUID
    option = relationship("Option", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("option_id", "user_id", name="uq_vote_option_user"),
    )
