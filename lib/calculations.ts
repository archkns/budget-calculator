import Decimal from 'decimal.js';
import { ProjectAssignment, Project } from './schemas';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 28, rounding: 4 });

export interface ProjectSummary {
  subtotal: Decimal;
  tax: Decimal;
  cost: Decimal;
  proposedPrice: Decimal;
  roi: Decimal;
  margin: Decimal;
}

export interface AssignmentCost {
  assignmentId: number;
  dailyRate: Decimal;
  daysAllocated: Decimal;
  bufferDays: Decimal;
  totalMandays: Decimal;
  rowCost: Decimal;
}

/**
 * Calculate the cost for a single assignment row
 */
export function calculateAssignmentCost(assignment: ProjectAssignment): AssignmentCost {
  const dailyRate = new Decimal(assignment.daily_rate);
  const daysAllocated = new Decimal(assignment.days_allocated);
  const bufferDays = new Decimal(assignment.buffer_days || 0);
  const totalMandays = daysAllocated.add(bufferDays);
  
  const rowCost = dailyRate.mul(totalMandays);

  return {
    assignmentId: assignment.id!,
    dailyRate,
    daysAllocated,
    bufferDays,
    totalMandays,
    rowCost,
  };
}

/**
 * Calculate project totals and financial metrics
 */
export function calculateProjectSummary(
  assignments: ProjectAssignment[],
  project: Project
): ProjectSummary {
  // Calculate subtotal from all billable assignments
  const subtotal = assignments.reduce((sum, assignment) => {
    const cost = calculateAssignmentCost(assignment);
    return sum.add(cost.rowCost);
  }, new Decimal(0));

  // Calculate tax if enabled
  const taxRate = project.tax_enabled ? new Decimal(project.tax_percentage).div(100) : new Decimal(0);
  const tax = subtotal.mul(taxRate);

  // Calculate total cost (grand total)
  const cost = subtotal.add(tax);

  // Get proposed price
  const proposedPrice = new Decimal(project.proposed_price || 0);

  // Calculate ROI and Margin
  let roi = new Decimal(0);
  let margin = new Decimal(0);

  if (cost.gt(0) && proposedPrice.gt(0)) {
    // ROI% = ((Proposed - Cost) / Cost) × 100
    roi = proposedPrice.sub(cost).div(cost).mul(100);
    
    // Margin% = ((Proposed - Cost) / Proposed) × 100
    margin = proposedPrice.sub(cost).div(proposedPrice).mul(100);
  }

  return {
    subtotal,
    tax,
    cost,
    proposedPrice,
    roi,
    margin,
  };
}

/**
 * Calculate buffer days from final days and execution days
 */
export function calculateBufferDays(finalDays: number, executionDays: number): number {
  return Math.max(0, finalDays - executionDays);
}

/**
 * Calculate execution days from final days and buffer days
 */
export function calculateExecutionDays(finalDays: number, bufferDays: number): number {
  return Math.max(0, finalDays - bufferDays);
}

/**
 * Calculate business days between two dates, excluding weekends
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Calculate business days excluding holidays
 */
export function calculateBusinessDaysExcludingHolidays(
  startDate: Date,
  endDate: Date,
  holidays: Date[]
): number {
  let count = 0;
  const current = new Date(startDate);
  const holidaySet = new Set(holidays.map(h => h.toISOString().split('T')[0]));
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateString = current.toISOString().split('T')[0];
    
    // Count if it's a weekday and not a holiday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Format currency with proper decimal places
 */
export function formatCurrency(amount: Decimal, currencySymbol: string = '฿'): string {
  return `${currencySymbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Format percentage with proper decimal places
 */
export function formatPercentage(percentage: Decimal): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Validate and sanitize CSV input to prevent injection attacks
 */
export function sanitizeCSVCell(cell: string): string {
  // Remove potential CSV injection characters at the start
  const dangerous = /^[=+\-@]/;
  if (dangerous.test(cell)) {
    return `'${cell}`;
  }
  return cell;
}

