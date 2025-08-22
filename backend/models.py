from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .db import Base
import secrets, base64

def generate_id():
    return base64.urlsafe_b64encode(secrets.token_bytes(8)).decode("utf-8").rstrip("=")

class Form(Base):
    __tablename__ = "forms"
    id = Column(String(20), primary_key=True, default=generate_id, index=True)
    responses_id = Column(String(20), unique=True, default=generate_id, index=True)
    question = Column(String, nullable=False)
    options = relationship("Option", back_populates="form", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "options"
    id = Column(String(20), primary_key=True, default=generate_id, index=True)
    text = Column(String, nullable=False)
    form_id = Column(String(20), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    form = relationship("Form", back_populates="options")
    responses = relationship("Response", back_populates="option", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"
    id = Column(String(20), primary_key=True, default=generate_id, index=True)
    option_id = Column(String(20), ForeignKey("options.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, nullable=True, index=True)  # Telegram user id or anon UUID
    option = relationship("Option", back_populates="responses")
    __table_args__ = (
        UniqueConstraint("option_id", "user_id", name="uq_response_option_user"),
    )
