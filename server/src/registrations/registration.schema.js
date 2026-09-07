const { z } = require('zod');

const candidateSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  certificateId: z.string().trim().min(1).max(20),
  citizenId: z.string().trim().regex(/^\d{9,12}$/),
  phone: z.string().trim().regex(/^0\d{9}$/),
  email: z.string().trim().email().max(100),
  address: z.string().trim().min(1).max(200),
}).strict();

const registrationSchema = z.object({
  customerId: z.string().trim().min(1).max(20),
  registrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  candidates: z.array(candidateSchema).min(1).max(100),
}).strict();

module.exports = { candidateSchema, registrationSchema };
