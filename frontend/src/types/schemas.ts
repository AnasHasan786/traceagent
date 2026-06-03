import { z } from "zod";

export const IncidentIngestSchema = z.object({
  workspace_id: z.string().min(3, "Workspace ID must be at least 3 characters"),
  service_name: z.string().min(1, "Service name is required"),
  raw_log: z.string().min(10, "Raw log must be at least 10 characters"),
});

export type IncidentIngestType = z.infer<typeof IncidentIngestSchema>;
