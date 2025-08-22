import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppRoot,
  List,
  Section,
  Text,
  Button,
  Input,
  IconButton,
} from "@telegram-apps/telegram-ui";
import "@telegram-apps/telegram-ui/dist/styles.css";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function CreateFormPage() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([""]);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdForm, setCreatedForm] = useState(null);

  // Setup Telegram Mini App
  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
    } catch {}
  }, []);

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateOption = useCallback((index: number, value: string) => {
    setOptions((prev) => {
      const newOptions = [...prev];
      newOptions[index] = value;

      const isLast = index === newOptions.length - 1;
      const hasValue = value.trim().length > 0;
      const underLimit = newOptions.length < 10;

      if (isLast && hasValue && underLimit) {
        newOptions.push("");
      }

      return newOptions;
    });
  }, []);

  const isFormValid = () => {
    const validQuestion = question.trim().length > 0;
    const validOptions = options.filter(opt => opt.trim().length > 0).length >= 1;
    return validQuestion && validOptions;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setStatus("Please provide a question and at least one option");
      return;
    }

    setIsSubmitting(true);
    setStatus("Creating form...");

    try {
      const validOptions = options.filter((opt) => opt.trim().length > 0);
      const response = await fetch(`${API}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create form");
      }

      const form = await response.json();
      setCreatedForm(form);

      const tg = (window as any)?.Telegram?.WebApp;
      if (tg) {
        const url = "https://t.me/FormsTelegramBot?startapp";
        tg.sendData(`
✅ Form created successfully!

📄 View Form: ${url}=form_${form.id}
📊 View Responses: ${url}=responses_${form.responses_id}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledOptionsCount = options.filter((opt) => opt.trim().length > 0).length;
  const showRemoveButtons = filledOptionsCount > 1;

  return (
    <AppRoot>
      <List
        style={{
          background: "var(--tgui--secondary_bg_color)",
          padding: 10,
        }}
      >
        <Section header="Create New Form">
          <Input
            header="Question"
            placeholder="What's your favorite color?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
          />
        </Section>

        <Section header="Form Options">
          {options.map((option, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  maxLength={100}
                  style={{ width: "100%" }}
                />
              </div>
              {showRemoveButtons && (
                <IconButton
                  size="s"
                  mode="plain"
                  onClick={() => removeOption(index)}
                  style={{
                    flexShrink: 0,
                    minWidth: "40px",
                    color: "var(--tgui--destructive_text_color)",
                  }}
                >
                  ✕
                </IconButton>
              )}
            </div>
          ))}
        </Section>

        <Button
          mode="filled"
          size="l"
          stretched
          disabled={!isFormValid() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Creating..." : "Create Form"}
        </Button>

        {status && (
          <Text style={{ textAlign: "center", marginTop: "8px" }}>
            {status}
          </Text>
        )}
      </List>
    </AppRoot>
  );
}
