/**
 * Quick chatbot API smoke test (next match + badminton net height).
 * Run: node scripts/test-chatbot-api.mjs
 */
const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const email = `chatbot-test-${Date.now()}@test.local`;
const password = 'TestPass123!';

async function req(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function main() {
  console.log('=== Chatbot API test ===\n');

  const reg = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Chatbot Tester',
      email,
      password,
      role: 'player',
    }),
  });
  console.log('Register:', reg.status, reg.body?.error || reg.body?.success || 'ok');

  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const token = login.body?.token;
  if (!token) {
    console.error('Login failed:', login.status, login.body);
    process.exit(1);
  }
  console.log('Login:', login.status, 'user id:', login.body?.user?.id);

  const auth = { Authorization: `Bearer ${token}` };

  const conv = await req('/chat/conversations', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ title: 'API Test' }),
  });
  const convId = conv.body?.data?._id;
  if (!convId) {
    console.error('Create conversation failed:', conv.status, conv.body);
    process.exit(1);
  }
  console.log('Conversation:', convId);

  const questions = [
    'When is my next match?',
    'What is the height of a badminton net?',
  ];

  for (const q of questions) {
    console.log('\n--- User:', q);
    const msg = await req(`/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ message: q }),
    });
    console.log('HTTP status:', msg.status);
    const ai = msg.body?.data?.aiMessage?.content;
    const user = msg.body?.data?.userMessage?.content;
    console.log('User message saved:', user ? 'yes' : 'no');
    console.log('AI in HTTP response:', ai ? ai.slice(0, 500) : '(missing)');
    if (msg.body?.error) console.log('Error:', msg.body.error);
  }

  // Direct RAG endpoint probe
  console.log('\n--- Direct Hugging Face RAG probe ---');
  try {
    const rag = await fetch('https://sportssphere-chatbot.hf.space/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the height of a badminton net?' }),
      signal: AbortSignal.timeout(15000),
    });
    const ragText = await rag.text();
    console.log('HF status:', rag.status);
    console.log('HF body (first 400 chars):', ragText.slice(0, 400));
  } catch (e) {
    console.log('HF RAG failed:', e.message);
  }

  console.log('\n=== Done ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
