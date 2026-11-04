
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ChatDto } from './chat.dto';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async chat(dto: ChatDto): Promise<{ reply: string }> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Nexus AI is not configured. Please check the backend environment.',
      );
    }

    const model =
      this.configService.get<string>('GEMINI_MODEL') ||
      'gemini-2.5-flash';
      console.log('[Nexus AI] model selected:', model);

    const modeInstructions: Record<string, string> = {
      chat: 'You are Nexus AI, a friendly and knowledgeable coding assistant inside NexusCode. Help users with programming and software development.',
      learn: 'You are Nexus AI acting as a patient programming tutor. Explain concepts step by step, use clear examples, and help the user learn rather than simply giving answers.',
      debug: 'You are Nexus AI acting as an expert debugging assistant. Identify likely causes, explain why they occur, and suggest specific fixes. Ask for missing error messages or code when needed.',
      review: 'You are Nexus AI performing a thoughtful code review. Look for bugs, readability, maintainability, performance, and security issues. Explain your findings and suggest improvements.',
    };

    const instructions =
      modeInstructions[dto.mode ?? 'chat'] ?? modeInstructions.chat;

    const history = (dto.history ?? [])
      .slice(-20)
      .filter(
        (item) =>
          typeof item.content === 'string' &&
          item.content.trim().length > 0,
      )
      .map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      }));

    try {
      const ai = new GoogleGenAI({ apiKey });

      const request = {
        contents: [
          ...history,
          {
            role: 'user',
            parts: [
              { text: dto.message },
              ...(dto.images ?? []).map((image) => ({
                inlineData: {
                  mimeType: image.mimeType,
                  data: image.data,
                },
              })),
            ],
          },
        ],
        config: {
          systemInstruction: instructions,
          maxOutputTokens: 2048,
        },
      };

      // Gemini returns 503/429 during demand spikes: retry, then fall back to a second model.
      const fallback =
        this.configService.get<string>('GEMINI_FALLBACK_MODEL') ||
        model;
      const models = [model, model, fallback, fallback];
      let response;

      for (let attempt = 0; attempt < models.length; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: models[attempt],
            ...request,
          });
          break;
        } catch (err) {
          const status = (err as { status?: number }).status;
          const retryable = status === 503 || status === 429;
          if (!retryable || attempt === models.length - 1) throw err;
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }

      if (!response) throw new Error('Gemini returned no response.');

      const reply = response.text?.trim();

      if (!reply) {
        console.error(
          'Nexus AI returned an empty response.',
          { model },
        );

        throw new Error('Gemini returned an empty response.');
      }

      return { reply };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Nexus AI request failed.');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Nexus AI request failed with an unknown error.');
        console.error(error);
      }

      throw new ServiceUnavailableException(
        'Nexus AI could not generate a response. Check the backend logs and Gemini configuration.',
      );
    }
  }

  /** Short inline code completion for the Playground (fill-in-the-middle). Returns '' on any failure. */
  async complete(prefix: string, suffix: string, language: string): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) return '';
    const model =
      this.configService.get<string>('GEMINI_COMPLETE_MODEL') ||
      this.configService.get<string>('GEMINI_MODEL') ||
      'gemini-3.6-flash';
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  `Language: ${language}\n` +
                  `Code before the cursor:\n${prefix.slice(-2500)}\n<CURSOR>\n` +
                  `Code after the cursor:\n${suffix.slice(0, 800)}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction:
            'You are an inline code completion engine. Output ONLY the text to insert at <CURSOR>: ' +
            'at most 3 short lines, no explanations, no markdown fences, no repeating existing code. ' +
            'If nothing sensible fits, output nothing.',
          maxOutputTokens: 80,
          temperature: 0.2,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      return (response.text ?? '').replace(/^```[a-z]*\n?|\n?```$/g, '').replace(/\s+$/, '');
    } catch {
      return '';
    }
  }
}
