import { useState, type FormEvent } from 'react';

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

  const systemPrompt = {
    role: 'system',
    content: `You are a friendly barista AI assistant.
    Answer customer questions politely and always append the most appropriate animation name at the end of your response in this format: [animation: animation_name].
    ⚠️ Important: You **must always** include the animation tag at the end of your response, even if it's just [animation: idle].
    If no specific animation fits the context, use the default animation: idle.
    Available animations: ${animations.join(', ')}.
    Example: "I'll make your coffee right away! [animation: makeCoffee]"`,
  };

  const callGPT = async (prompt: string) => {
    const chatMessages = [
      systemPrompt,
      ...messages,
      { role: 'user', content: prompt },
    ];

    setLoading(true);

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

    let rawReply = ''; // 전체
    let visibleReply = ''; // 애니메이션 제외

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: prompt },
      { role: 'assistant', content: '' }, // 실시간 갱신될 부분
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
          // console.log(rawReply);

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: visibleReply,
            };
            return updated;
          });
        }
        await new Promise((res) => setTimeout(res, 50));
      }
    }

    // 애니메이션 태그 추출
    const animationMatch = rawReply.match(/\[animation:\s*(.*?)\]/i);
    const animation = animationMatch ? animationMatch[1].trim() : null;

    // console.log(animationMatch);

    setPlayAnimation(animation || null);
    setLoading(false);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    callGPT(input);
    setInput('');
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
        {loading && <div className="chatbot-message assistant">로딩 중...</div>}
      </div>
      <form onSubmit={onSubmit} className="chatbot-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
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
