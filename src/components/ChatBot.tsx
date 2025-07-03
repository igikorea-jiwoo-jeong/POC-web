import { useRef, useState, type FormEvent } from 'react';

const ChatBot = ({
  animations,
  setPlayAnimation,
}: {
  animations: string[];
  setPlayAnimation: (name: string | null) => void;
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: '챗봇에 오신 걸 환영합니다!' },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null); // ms 단위

  const playTTS = async (text: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${
          import.meta.env.VITE_TTS_APIKEY
        }`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: 'ko-KR', name: 'ko-KR-Standard-A' },
            audioConfig: { audioEncoding: 'MP3' },
          }),
        }
      );

      const data = await response.json();

      if (data.audioContent) {
        const audioSrc = 'data:audio/mp3;base64,' + data.audioContent;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        audio.play();
      } else {
        console.error('No audio content returned', data);
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  const systemPrompt = {
    role: 'system',
    content: `You are a polite Starbucks barista in New York, role-playing in a cafe setting.

When taking an order, always ask:
1. Drink type  
2. Size (Tall, Grande, Venti) and temperature (iced/hot)  
3. Customizations (milk type, extra shot, etc.)

Once the customer finishes ordering and the drink is being made, respond with:
[animation: make]

End **every** response with an appropriate animation tag:
[animation: animation_name]

If you're unsure which to use, fall back to:
[animation: talk_1]

You must choose the animation that best matches the tone or situation.

Available animations: ${animations.join(', ')}

Examples:
- "Sorry, we don't have oat milk today." → [animation: disapointment]  
- "I'll make your coffee right away!" → [animation: make]
`,
  };

  const callGPT = async (prompt: string) => {
    const chatMessages = [
      systemPrompt,
      ...messages,
      { role: 'user', content: prompt },
    ];

    setLoading(true);

    try {
      const startTime = performance.now(); // 시작 시간 기록

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: chatMessages,
          stream: true,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      let rawReply = '';
      let visibleReply = '';

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: prompt },
        { role: 'assistant', content: '' },
      ]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && line.startsWith('data:'));

        for (const line of lines) {
          const message = line.replace(/^data:\s*/, '');
          if (message === '[DONE]') continue;

          const parsed = JSON.parse(message);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            rawReply += delta;
            visibleReply = rawReply.split('[')?.[0];

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1].content = visibleReply;
              return updated;
            });
          }
          await new Promise((res) => setTimeout(res, 50));
        }
      }

      const endTime = performance.now();
      setResponseTime(endTime - startTime);

      const animationMatch = rawReply.match(/\[animation:\s*(.*?)\]/i);
      const animation = animationMatch ? animationMatch[1].trim() : null;

      await playTTS(visibleReply);
      setCurrentAnimation(animation);
      setPlayAnimation(animation || null);
      setLoading(false);
    } catch (error) {
      console.error('GPT 응답 처리 중 오류:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송합니다. 오류가 발생했습니다. 다시 입력해주세요.',
        },
      ]);
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    callGPT(input);
    setInput('');
  };

  const handleEndChat = () => {
    setMessages([{ role: 'system', content: '챗봇에 오신 걸 환영합니다!' }]);
    setInput('');
    setCurrentAnimation(null);
    setPlayAnimation('idle');
    setResponseTime(null);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages
          .filter((m) => m.role !== 'system')
          .map((msg, i) => (
            <div
              key={i}
              className={`chatbot-message ${
                msg.role === 'user' ? 'user' : 'assistant'
              }`}
            >
              {msg.role}: {msg.content}
            </div>
          ))}
        {responseTime !== null && (
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
            응답 시간: {(responseTime / 1000).toFixed(2)}초
          </div>
        )}

        {loading && <div className="chatbot-message assistant">로딩 중...</div>}
      </div>

      {currentAnimation === 'make' && (
        <button onClick={handleEndChat} style={{ marginTop: '10px' }}>
          ☕ 주문 완료! 채팅 끝내기
        </button>
      )}

      <form onSubmit={onSubmit} className="chatbot-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            loading ? '응답을 기다리는 중입니다...' : '메시지를 입력하세요'
          }
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          전송
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
