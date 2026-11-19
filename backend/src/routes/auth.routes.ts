import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requestOtp, verifyOtp } from '../services/auth/auth-service.js';

const requestOtpSchema = z.object({
  phone: z.string().min(10)
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().min(4)
});

export const authRoutes: FastifyPluginAsync = async (server) => {
  server.post('/api/auth/otp/request', async (request, reply) => {
    const parsed = requestOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Valid 10-digit mobile number required' }
      });
    }
    const result = requestOtp(parsed.data.phone);
    return reply.send(result);
  });

  server.post('/api/auth/otp/verify', async (request, reply) => {
    const parsed = verifyOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Phone and 6-digit OTP code required' }
      });
    }
    const result = verifyOtp(parsed.data.phone, parsed.data.code);
    return reply.send(result);
  });
};
