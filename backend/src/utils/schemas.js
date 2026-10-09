const { z } = require('zod');
const { TYPES, PAYMENT_METHODS } = require('../models/Transaction');

const ID_RE = /^[a-f\d]{24}$/i;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// optional fields: '' / null / missing all become undefined
const blank = (schema) => z.union([schema, z.literal(''), z.null()]).optional().transform((v) => v || undefined);
const id = blank(z.string().regex(ID_RE, 'Invalid id'));
const day = z.string().regex(DAY_RE, 'Use the YYYY-MM-DD date format');
const text = (max) => blank(z.string().trim().max(max, `Must be at most ${max} characters`));
const amount = z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be greater than 0').max(1e10);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #22c55e');

exports.registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  currency: blank(z.string().trim().length(3).toUpperCase()),
});

exports.loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

exports.profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  currency: blank(z.string().trim().length(3).toUpperCase()),
});

exports.transactionSchema = z
  .object({
    type: z.enum(TYPES, { errorMap: () => ({ message: 'Invalid transaction type' }) }),
    amount,
    date: day,
    time: blank(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm time')),
    categoryId: id,
    personId: id,
    from: text(100),
    to: text(100),
    merchant: text(100),
    paymentMethod: blank(z.enum(PAYMENT_METHODS)),
    description: text(500),
    receiptUrl: blank(z.string().url().max(500)),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.type === 'expense' && !d.categoryId) ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Category is required for expenses' });
    if (d.type === 'sent' && !d.to && !d.personId) ctx.addIssue({ code: 'custom', path: ['to'], message: 'Who did you send money to?' });
    if (d.type === 'received' && !d.from && !d.personId) ctx.addIssue({ code: 'custom', path: ['from'], message: 'Who did you receive money from?' });
  });

exports.categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40),
  icon: blank(z.string().trim().max(16)),
  color: blank(color),
});

exports.personSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  phone: text(30),
  notes: text(500),
});

exports.goalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(80),
  targetAmount: amount,
  currentAmount: z.coerce.number().min(0, 'Cannot be negative').max(1e10).default(0),
  targetDate: blank(day),
  notes: text(500),
});

exports.recurringSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(80),
  amount,
  type: z.enum(['expense', 'income']),
  categoryId: id,
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: day,
  endDate: blank(day),
  paymentMethod: blank(z.enum(PAYMENT_METHODS)),
  active: z.boolean().optional(),
});

exports.budgetSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1970).max(2200),
  totalAmount: z.coerce.number().min(0, 'Budget cannot be negative').max(1e10),
  categoryBudgets: z
    .array(z.object({ categoryId: z.string().regex(ID_RE, 'Invalid category'), amount }))
    .max(50)
    .default([]),
});
