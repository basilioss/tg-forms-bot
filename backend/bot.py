import os
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, ApplicationBuilder, CommandHandler, ContextTypes
from .db import SessionLocal, Base, engine
from . import crud

load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173")

Base.metadata.create_all(bind=engine)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Hi! Create a poll with:\n/newpoll Question? | Option A | Option B\n"
        "Get results with:\n/results POLL_ID"
    )

async def newpoll(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text or ""
    payload = text[len("/newpoll"):].strip()
    if "|" not in payload:
        await update.message.reply_text("Usage: /newpoll Question? | Option 1 | Option 2 [| Option 3 ...]")
        return
    parts = [p.strip() for p in payload.split("|") if p.strip()]
    question = parts[0] if parts else ""
    options = parts[1:]
    if not question or len(options) < 2:
        await update.message.reply_text("Please provide a question and at least two options.")
        return
    db = SessionLocal()
    poll = crud.create_poll(db, question, options)
    link = f"https://t.me/FormsTelegramBot?startapp=poll{poll.id}"
    await update.message.reply_text(f"Poll created: {poll.question}\nVote here: {link}\nPoll ID: {poll.id}")

async def results(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = (context.args or [])
    if not args:
        await update.message.reply_text("Usage: /results POLL_ID")
        return
    poll_id = args[0].strip()
    db = SessionLocal()
    r = crud.get_results(db, poll_id)
    if not r:
        await update.message.reply_text("Poll not found.")
        return
    lines = [r["question"]]
    for item in r["results"]:
        lines.append(f"• {item['option']}: {item['votes']}")
    link = f"{APP_BASE_URL}/results/{poll_id}"
    lines.append(f"Chart: {link}")
    await update.message.reply_text("\n".join(lines))

def build_app() -> Application:
    if not TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not set")
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("newpoll", newpoll))
    app.add_handler(CommandHandler("results", results))
    return app

async def run_bot():
    app = build_app()
    await app.initialize()
    await app.start()
    # Run until canceled
    await app.updater.start_polling()
    try:
        await asyncio.Event().wait()
    finally:
        await app.updater.stop()
        await app.stop()
        await app.shutdown()

if __name__ == "__main__":
    asyncio.run(run_bot())
