import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppRoot,
  List,
  Section,
  Text,
  Button,
  Input,
  IconButton,
} from '@telegram-apps/telegram-ui';
import '@telegram-apps/telegram-ui/dist/styles.css';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['']);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPoll, setCreatedPoll] = useState(null);

  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
      
      // Set up back button
      if (tg?.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => navigate('/'));
      }
    } catch {}

    // Cleanup back button on unmount
    return () => {
      try {
        const tg = (window as any)?.Telegram?.WebApp;
        if (tg?.BackButton) {
          tg.BackButton.hide();
        }
      } catch {}
    };
  }, [navigate]);

  const copyPollUrl = () => {
    if (createdPoll) {
      const url = `https://t.me/FormsTelegramBot?startapp=form_${createdPoll.id}`;
      navigator.clipboard.writeText(url).then(() => {
        setStatus('📋 PollURL copied to clipboard!');
      }).catch(() => {
        setStatus('❌ Failed to copy URL');
      });
    }
  };

  const copyResponsesUrl = () => {
    if (createdPoll) {
      const url = `https://t.me/FormsTelegramBot?startapp=responses_${createdPoll.results_id}`;
      navigator.clipboard.writeText(url).then(() => {
        setStatus('📋 Responses URL copied to clipboard!');
      }).catch(() => {
        setStatus('❌ Failed to copy URL');
      });
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateOption = useCallback((index: number, value: string) => {
    setOptions(prev => {
      const newOptions = [...prev];
      newOptions[index] = value;
      
      // Auto-add empty option if this was the last option and it's not empty
      const isLastOption = index === newOptions.length - 1;
      const hasValue = value.trim().length > 0;
      const canAddMore = newOptions.length < 10;
      
      if (isLastOption && hasValue && canAddMore) {
        newOptions.push('');
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
      setStatus('Please provide a question and at least two options');
      return;
    }

    setIsSubmitting(true);
    setStatus('Creating poll...');

    try {
      const validOptions = options.filter(opt => opt.trim().length > 0);
      const response = await fetch(`${API}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create poll');
      }

      const poll = await response.json();
      setStatus('✅ Poll created successfully!');
      setCreatedPoll(poll);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count non-empty options to determine if remove buttons should show
  const filledOptionsCount = options.filter(opt => opt.trim().length > 0).length;
  const showRemoveButtons = filledOptionsCount > 1;

  return (
    <AppRoot>
      <List
        style={{
          background: 'var(--tgui--secondary_bg_color)',
          padding: 10,
        }}
      >
        <Section header="Create New Poll">
          <Input
            header="Question"
            placeholder="What's your favorite color?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
          />
        </Section>

        <Section header="Poll Options">
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
                style={{
                  width: "100%",   // force it to fill its container
                }}
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

        {!createdPoll ? (
          <Button
            mode="filled"
            size="l"
            stretched
            disabled={!isFormValid() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
          </Button>
        ) : (
          <>
            <Button
              mode="filled"
              size="l"
              stretched
              onClick={() => navigate(`/poll/${createdPoll.id}`)}
              style={{ marginBottom: '8px' }}
            >
              📊 View Poll
            </Button>
            <Button
              mode="outline"
              size="l"
              stretched
              onClick={copyPollUrl}
              style={{ marginBottom: '8px' }}
            >
              🔗 Copy Poll URL
            </Button>
            <Button
              mode="outline"
              size="l"
              stretched
              onClick={copyResponsesUrl}
              style={{ marginBottom: '8px' }}
            >
              📬 Copy Responses URL
            </Button>
          </>
        )}
        
        {status && (
          <Text style={{ textAlign: 'center', marginTop: '8px' }}>
            {status}
          </Text>
        )}
      </List>
    </AppRoot>
  );
}
