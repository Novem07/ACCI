const { z } = require('zod');

const invoiceSchema = z.object({
  paymentMethod: z.string().trim().min(1).max(50),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

module.exports = { invoiceSchema };
