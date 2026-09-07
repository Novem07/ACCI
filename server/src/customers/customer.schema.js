const { z } = require('zod');

const customerSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  organization: z.string().trim().min(1).max(20),
  citizenId: z.string().trim().regex(/^\d{9,12}$/).optional().or(z.literal('')),
  phone: z.string().trim().regex(/^0\d{9}$/),
  email: z.string().trim().email().max(100),
  address: z.string().trim().min(1).max(200),
}).strict();

module.exports = { customerSchema };
