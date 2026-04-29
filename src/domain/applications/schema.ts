import { z } from "zod";

export const SubjectiveAnswersSchema = z.object({
  whyPartner: z
    .string()
    .min(1, "Please explain why you want to partner with Sugar & Leather AI"),
  promotionStrategy: z
    .string()
    .min(1, "Please describe how you plan to promote Aries AI"),
  audienceFit: z
    .string()
    .min(1, "Please describe why your audience is a good fit"),
});

export const ApplicationSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("A valid email address is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  promotionChannels: z
    .array(z.string().min(1))
    .min(1, "Select at least one promotion channel"),
  aiTechExperience: z.string().min(1, "AI and technology experience is required"),
  audience: z.string().min(1, "Audience description is required"),
  subjectiveAnswers: SubjectiveAnswersSchema,
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;
export type SubjectiveAnswers = z.infer<typeof SubjectiveAnswersSchema>;
