'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import { Product } from '@/types';
import { productsApi } from '@/lib/api/products';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  items?: AddedItem[];
}

interface AddedItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit?: string;
  reason?: string;
  notes?: string;
}

interface PRItem {
  product_id: number;
  product?: Product;
  quantity: number;
  unit: string;
  reason: string;
  notes: string;
  project_site: string;
}

interface Props {
  onAddItems: (items: PRItem[]) => void;
}

export default function AIProcurementChat({ onAddItems }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي للمشتريات. أخبرني بما تحتاجه وسأضيفه لك مباشرة.\n\nيمكنك:\n• كتابة احتياجاتك بالعربي أو الإنجليزي\n• تسجيل صوتي\n• إرسال صورة قائمة أو سكرين شوت' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Send message ────────────────────────────────────────────────────
  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text && !imageFile) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build history for API (only text content for history)
      const history = newMessages.map((m) => ({ role: m.role, content: m.content }));

      const formData = new FormData();
      formData.append('messages', JSON.stringify(history));
      if (imageFile) {
        formData.append('image', imageFile);
        setImageFile(null);
        setImagePreview(null);
      }

      const res = await apiClient.post('/ai/chat/', formData);
      const { reply, tool_use } = res.data;

      let addedItems: AddedItem[] = [];

      if (tool_use?.items?.length) {
        addedItems = tool_use.items;

        // Resolve full product objects
        const prItems: PRItem[] = [];
        for (const item of tool_use.items) {
          try {
            const product = await productsApi.getById(item.product_id);
            prItems.push({
              product_id: item.product_id,
              product,
              quantity: item.quantity,
              unit: item.unit || product.unit || '',
              reason: item.reason || '',
              notes: item.notes || '',
              project_site: '',
            });
          } catch {
            prItems.push({
              product_id: item.product_id,
              quantity: item.quantity,
              unit: item.unit || '',
              reason: item.reason || '',
              notes: item.notes || '',
              project_site: '',
            });
          }
        }
        onAddItems(prItems);
      }

      const assistantText = tool_use?.message || reply || '✓ تم';
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: assistantText,
        items: addedItems.length ? addedItems : undefined,
      }]);
    } catch (err: any) {
      const serverError = err?.response?.data?.error;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: serverError
          ? `❌ ${serverError}`
          : '❌ حدث خطأ في الاتصال، حاول مرة أخرى.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, imageFile, messages, onAddItems]);

  // ── Voice recording ─────────────────────────────────────────────────
  const toggleRecording = async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Use Web Speech API for transcription (browser built-in)
        // Fallback: send audio as text placeholder
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          // Already handled via continuous recognition below
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);

      // Use Web Speech API for live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev ? prev + ' ' + transcript : transcript);
        };
        recognition.onend = () => {
          mediaRef.current?.stop();
          setRecording(false);
        };
        recognition.start();
        mediaRef.current = { stop: () => recognition.stop() } as any;
      }
    } catch {
      alert('لا يمكن الوصول إلى الميكروفون');
    }
  };

  // ── Image upload ────────────────────────────────────────────────────
  const handleImage = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image'));
    if (item) {
      const file = item.getAsFile();
      if (file) handleImage(file);
    }
  };

  // ── Keyboard ────────────────────────────────────────────────────────
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 24,
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700,
          boxShadow: '0 2px 12px rgba(249,115,22,0.4)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <span style={{ fontSize: 18 }}>🤖</span> AI Assistant
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      width: 400, height: 560,
      background: 'var(--card-bg)', border: '1px solid var(--border-primary)',
      borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f97316, #ea580c)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>AI Procurement Assistant</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Claude · يفهم عربي وإنجليزي</div>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%', padding: '8px 12px', borderRadius: 12,
              background: m.role === 'user' ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'var(--bg-secondary)',
              color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
              fontSize: 13, lineHeight: 1.5,
              borderBottomRightRadius: m.role === 'user' ? 4 : 12,
              borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12,
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
            {m.items && m.items.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4, width: '88%' }}>
                {m.items.map((it, j) => (
                  <div key={j} style={{
                    fontSize: 11, padding: '5px 10px', borderRadius: 8,
                    background: '#d1fae5', color: '#065f46',
                    border: '1px solid #6ee7b7',
                  }}>
                    ✓ <strong>{it.product_name}</strong> × {it.quantity} {it.unit || ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#f97316',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>جاري التفكير…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div style={{ padding: '0 14px 8px', position: 'relative', display: 'inline-block' }}>
          <img src={imagePreview} alt="preview" style={{ maxHeight: 80, borderRadius: 8, border: '1px solid var(--border-primary)' }} />
          <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
            style={{ position: 'absolute', top: -4, right: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-primary)', display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        {/* Image upload */}
        <button type="button" onClick={() => fileInputRef.current?.click()}
          title="أرسل صورة"
          style={{ flexShrink: 0, padding: '7px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>
          📎
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = ''; }} />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          placeholder="اكتب احتياجاتك… أو الصق صورة"
          style={{
            flex: 1, resize: 'none', border: '1px solid var(--border-primary)',
            borderRadius: 8, padding: '7px 10px', fontSize: 13,
            background: 'var(--input-bg)', color: 'var(--text-primary)',
            outline: 'none', maxHeight: 80, overflowY: 'auto',
            fontFamily: 'inherit', lineHeight: 1.4,
          }}
        />

        {/* Voice */}
        <button type="button" onClick={toggleRecording}
          title={recording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
          style={{
            flexShrink: 0, padding: '7px', borderRadius: 8, cursor: 'pointer', fontSize: 16,
            background: recording ? '#fee2e2' : 'var(--bg-secondary)',
            border: `1px solid ${recording ? '#ef4444' : 'var(--border-primary)'}`,
            color: recording ? '#ef4444' : 'var(--text-secondary)',
            animation: recording ? 'pulse 1s infinite' : 'none',
          }}>
          {recording ? '⏹' : '🎤'}
        </button>

        {/* Send */}
        <button type="button" onClick={() => send()} disabled={loading || (!input.trim() && !imageFile)}
          style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: 8,
            background: loading || (!input.trim() && !imageFile) ? 'var(--bg-tertiary)' : 'linear-gradient(135deg,#f97316,#ea580c)',
            color: loading || (!input.trim() && !imageFile) ? 'var(--text-secondary)' : '#fff',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 700,
          }}>
          ↑
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0)}
          40%{transform:translateY(-6px)}
        }
        @keyframes pulse {
          0%,100%{opacity:1} 50%{opacity:0.5}
        }
      `}</style>
    </div>
  );
}
