import { z } from "zod";

export const partnershipSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(15, "Enter a valid phone number"),
  institutionName: z.string().min(2, "Institution name is required"),
  role: z.enum(
    ["vc", "dean", "iic", "faculty", "admin", "other"],
    { message: "Select your role" }
  ),
  cityState: z.string().min(2, "City / state is required"),
  collegeType: z
    .enum(["iit_iim_nit", "state", "private", "other", ""])
    .optional(),
  interest: z.enum(
    ["anchor", "discovery", "media"],
    { message: "Select your interest" }
  ),
  message: z.string().max(2000).optional(),
  consent: z.literal(true, {
    message: "You must agree to be contacted",
  }),
});

export type PartnershipLead = z.infer<typeof partnershipSchema>;

export const roleLabels: Record<PartnershipLead["role"], string> = {
  vc: "Vice Chancellor",
  dean: "Dean",
  iic: "IIC Head",
  faculty: "Faculty",
  admin: "Admin",
  other: "Other",
};

export const interestLabels: Record<PartnershipLead["interest"], string> = {
  anchor: "Anchor partnership (100 slots)",
  discovery: "30-min discovery call",
  media: "Media kit / more information",
};

export const collegeTypeLabels = {
  iit_iim_nit: "IIT / IIM / NIT",
  state: "State university",
  private: "Private institution",
  other: "Other",
} as const;
