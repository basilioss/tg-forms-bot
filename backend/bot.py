import os
import asyncio
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from telegram.ext import Application, ApplicationBuilder, CommandHandler, ContextTypes
from telegram.ext import MessageHandler, filters
from .db import Base, engine

load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173")

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

async def on_webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Handle data sent back from the Mini App.
    data = update.effective_message.web_app_data.data
    await update.message.reply_text(f"{data}")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [KeyboardButton("Create", web_app=WebAppInfo(url=f"{APP_BASE_URL}/#/create"))]
    ]
    await update.message.reply_text(
        'Welcome! Click the "Create" button to get started.',
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    )

def build_app() -> Application:
    if not TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not set")

    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, on_webapp_data))
    return app

if __name__ == "__main__":
    app = build_app()
    app.run_polling()
