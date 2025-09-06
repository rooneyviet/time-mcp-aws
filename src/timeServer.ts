import { TimeResult, TimeConversionResult } from './types.js';

export class TimeServer {
  private readonly defaultTimezone: string;

  constructor(defaultTimezone: string = 'Asia/Tokyo') {
    this.defaultTimezone = defaultTimezone;
  }

  /**
   * Get current time in specified timezone
   */
  getCurrentTime(timezoneName: string): TimeResult {
    try {
      // Validate timezone
      const timezone = this.validateTimezone(timezoneName);
      
      const currentTime = new Date();
      
      // Get timezone-aware datetime
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const formattedDateTime = formatter.format(currentTime).replace(' ', 'T');
      
      // Get day of week
      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long'
      });
      const dayOfWeek = dayFormatter.format(currentTime);
      
      // Check DST
      const isDst = this.isDaylightSavingTime(currentTime, timezone);
      
      return {
        timezone: timezoneName,
        datetime: formattedDateTime,
        day_of_week: dayOfWeek,
        is_dst: isDst
      };
    } catch (error) {
      throw new Error(`Invalid timezone: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert time between timezones
   */
  convertTime(sourceTimezone: string, timeStr: string, targetTimezone: string): TimeConversionResult {
    try {
      // Validate timezones
      const sourceZone = this.validateTimezone(sourceTimezone);
      const targetZone = this.validateTimezone(targetTimezone);
      
      // Parse time string
      const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) {
        throw new Error('Invalid time format. Expected HH:MM [24-hour format]');
      }
      
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Invalid time values. Hours must be 0-23, minutes must be 0-59');
      }
      
      // Create a date for today
      const today = new Date();
      
      // Create the source time by parsing the time string in the source timezone
      // This creates a timezone-aware moment that represents the specified time in the source timezone
      const sourceTimeString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      
      // Create a date that represents the exact moment in the source timezone
      const sourceMoment = this.createDateInTimezone(sourceTimeString, sourceZone);
      
      // Get the source result
      const sourceResult = this.getTimeResultForDate(sourceMoment, sourceZone, sourceTimezone);
      
      // Convert the same moment to target timezone
      const targetResult = this.getTimeResultForDate(sourceMoment, targetZone, targetTimezone);
      
      // Calculate time difference
      const timeDifference = this.calculateTimeDifference(sourceMoment, sourceZone, targetZone);
      
      return {
        source: sourceResult,
        target: targetResult,
        time_difference: timeDifference
      };
    } catch (error) {
      throw new Error(`Time conversion error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate timezone string
   */
  private validateTimezone(timezone: string): string {
    try {
      // Test if timezone is valid by creating a date formatter
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return timezone;
    } catch (error) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
  }

  /**
   * Check if a date is in daylight saving time for a given timezone
   */
  private isDaylightSavingTime(date: Date, timezone: string): boolean {
    // Get timezone offset for the date
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (!offsetPart) return false;
    
    // Get timezone offset for January (winter) of the same year
    const winterDate = new Date(date.getFullYear(), 0, 1);
    const winterFormatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    const winterParts = winterFormatter.formatToParts(winterDate);
    const winterOffsetPart = winterParts.find(part => part.type === 'timeZoneName');
    
    if (!winterOffsetPart) return false;
    
    // If current offset is different from winter offset, we're in DST
    return offsetPart.value !== winterOffsetPart.value;
  }

  /**
   * Get TimeResult for a specific date in a timezone
   */
  private getTimeResultForDate(date: Date, timezone: string, timezoneName: string): TimeResult {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const formattedDateTime = formatter.format(date).replace(' ', 'T');
    
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    });
    const dayOfWeek = dayFormatter.format(date);
    
    const isDst = this.isDaylightSavingTime(date, timezone);
    
    return {
      timezone: timezoneName,
      datetime: formattedDateTime,
      day_of_week: dayOfWeek,
      is_dst: isDst
    };
  }

  /**
   * Calculate time difference between two timezones
   */
  private calculateTimeDifference(date: Date, sourceZone: string, targetZone: string): string {
    // Get the UTC offset for each timezone
    const sourceOffset = this.getTimezoneOffset(date, sourceZone);
    const targetOffset = this.getTimezoneOffset(date, targetZone);
    
    // Calculate difference in hours
    const diffMinutes = targetOffset - sourceOffset;
    const diffHours = diffMinutes / 60;
    
    if (Number.isInteger(diffHours)) {
      return `${diffHours >= 0 ? '+' : ''}${diffHours.toFixed(0)}h`;
    } else {
      // For fractional hours (like Nepal's UTC+5:45)
      const formatted = diffHours.toFixed(2).replace(/\.?0+$/, '');
      return `${diffHours >= 0 ? '+' : ''}${formatted}h`;
    }
  }

  /**
   * Create a Date object that represents a specific time in a specific timezone
   */
  private createDateInTimezone(timeString: string, timezone: string): Date {
    // Parse the time string and create a Date assuming it's in the specified timezone
    // This is tricky because JavaScript Date constructor assumes local timezone
    
    // First, create a temporary date to understand the offset difference
    const tempDate = new Date(timeString);
    
    // Get what this time would be in the target timezone
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Get the offset between what we want and what we got
    const targetString = formatter.format(tempDate).replace(' ', 'T');
    const targetDate = new Date(targetString);
    const offset = tempDate.getTime() - targetDate.getTime();
    
    // Apply the reverse offset to get the correct UTC time
    return new Date(tempDate.getTime() + offset);
  }

  /**
   * Get timezone offset in minutes from UTC using proper Intl API
   */
  private getTimezoneOffset(date: Date, timezone: string): number {
    try {
      // Use Intl.DateTimeFormat to get timezone offset
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      });
      
      const parts = formatter.formatToParts(date);
      const offsetPart = parts.find(part => part.type === 'timeZoneName');
      
      if (!offsetPart?.value) {
        return 0;
      }
      
      // Parse offset string like "+09:00" or "-05:00"
      const match = offsetPart.value.match(/^([+-])(\d{2}):(\d{2})$/);
      if (!match) {
        return 0;
      }
      
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3], 10);
      
      return sign * (hours * 60 + minutes);
    } catch {
      return 0;
    }
  }

  /**
   * Get default timezone
   */
  getDefaultTimezone(): string {
    return this.defaultTimezone;
  }
}