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
    content: `당신은 친절한 바리스타 AI입니다. 고객의 질문에 예의 바르게 답변하고, 가장 적절한 애니메이션 이름을 [animation: 애니메이션이름] 형식으로 답변 끝에 붙이세요. 가능한 애니메이션: ${animations.join(
      ', '
    )}. 예: "커피를 내려드릴게요! [animation: makeCoffee]"`,
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

    let fullReply = '';

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
          fullReply += delta;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: fullReply,
            };
            return updated;
          });
        }
      }
    }

    // 마지막에 애니메이션 추출
    const animationMatch = fullReply.match(/\[animation:\s*(.*?)\]/i);
    const animation = animationMatch ? animationMatch[1].trim() : null;
    const cleanedReply = fullReply.replace(/\[animation:.*?\]/i, '').trim();

    setMessages((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = {
        ...updated[lastIndex],
        content: cleanedReply,
      };
      return updated;
    });

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
