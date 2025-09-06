import { z } from "zod";

// Enum for available time tools
export enum TimeTools {
  GET_CURRENT_TIME = "get_current_time",
  CONVERT_TIME = "convert_time"
}

// Interface for time result information
export interface TimeResult {
  timezone: string;
  datetime: string;
  day_of_week: string;
  is_dst: boolean;
}

// Interface for time conversion results
export interface TimeConversionResult {
  source: TimeResult;
  target: TimeResult;
  time_difference: string;
}

// Zod schema for get_current_time tool input
export const GetCurrentTimeInputSchema = z.object({
  timezone: z.string().describe("IANA timezone name (e.g., 'America/New_York', 'Europe/London'). Defaults to Asia/Tokyo if not provided.").optional()
});

export type GetCurrentTimeInput = z.infer<typeof GetCurrentTimeInputSchema>;

// Zod schema for convert_time tool input
export const ConvertTimeInputSchema = z.object({
  source_timezone: z.string().describe("Source IANA timezone name (e.g., 'America/New_York', 'Europe/London')"),
  time: z.string().describe("Time to convert in 24-hour format (HH:MM)"),
  target_timezone: z.string().describe("Target IANA timezone name (e.g., 'Asia/Tokyo', 'America/San_Francisco')")
});

export type ConvertTimeInput = z.infer<typeof ConvertTimeInputSchema>;