import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

const generateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent },
  })),
}));

describe('AiService chat personality', () => {
  const config = {
    get: (key: string) => key === 'GEMINI_API_KEY' ? 'test-key' : undefined,
  } as ConfigService;
  const service = new AiService(config);

  beforeEach(() => {
    generateContent.mockReset().mockResolvedValue({ text: 'Here is a helpful answer.' });
  });

  it.each([
    ['chat', 'Help with programming'],
    ['learn', 'patient tutor'],
    ['debug', 'debugging partner'],
    ['review', 'constructive code review'],
    ['unknown', 'Help with programming'],
  ])('applies the shared personality and %s mode instructions', async (mode, expected) => {
    await expect(service.chat({
      message: 'Help me',
      mode,
      history: [{ role: 'assistant', content: 'Earlier answer' }],
    })).resolves.toEqual({ reply: 'Here is a helpful answer.' });

    const request = generateContent.mock.calls[0][0];
    expect(request.config.systemInstruction).toContain('warm, conversational, patient');
    expect(request.config.systemInstruction).toContain('never claim to have run code');
    expect(request.config.systemInstruction).toContain(expected);
    expect(request.contents).toEqual([
      { role: 'model', parts: [{ text: 'Earlier answer' }] },
      { role: 'user', parts: [{ text: 'Help me' }] },
    ]);
  });
});
