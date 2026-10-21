import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json() as { prefix: string; suffix: string };
  const { prefix = '', suffix = '' } = body;

  // deepseek-coder FIM (fill-in-middle) format
  const prompt = `<|fim_begin|>${prefix}<|fim_hole|>${suffix}<|fim_end|>`;

  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-coder:1.3b',
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 100,
          stop: ['\n\n\n', '</body>', '</html>', '<|endoftext|>'],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NextResponse.json({ completion: '' });

    const data = await res.json() as { response?: string };
    const completion = (data.response ?? '').trim();
    return NextResponse.json({ completion });
  } catch {
    return NextResponse.json({ completion: '' });
  }
}
