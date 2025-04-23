import z from "zod"
export const pricingContextResult = z.record(z.string(), z.any()).optional()
