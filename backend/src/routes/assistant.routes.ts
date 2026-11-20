import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { processAssistantMessage } from '../services/assistant/assistant-service.js';

const messageSchema = z.object({
  sessionId: z.string().optional(),
  text: z.string().min(1),
  language: z.enum(['en', 'hi', 'bn']).optional(),
  profile: z.any().optional(),
  context: z.any().optional()
});

export const assistantRoutes: FastifyPluginAsync = async (server) => {
  server.post('/api/assistant/message', async (request, reply) => {
    const parsed = messageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'text is required' }
      });
    }

    const userId = (request.headers['x-user-id'] as string) || undefined;
    const response = await processAssistantMessage({
      ...parsed.data,
      userId
    });

    return reply.send(response);
  });

  server.post('/api/assistant/transcribe', async (request, reply) => {
    const { text, language } = (request.body as { text?: string; language?: string }) || {};
    return reply.send({
      text: text || 'Victoria Memorial to Sector V tomorrow at nine',
      language: language || 'en',
      confidence: 0.98,
      status: 'transcribed'
    });
  });
};
