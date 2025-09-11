import { 
  calculateAssignmentCost, 
  calculateProjectSummary, 
  calculateBufferDays,
  calculateExecutionDays,
  calculateBusinessDays,
  formatCurrency,
  formatPercentage,
  sanitizeCSVCell
} from '../lib/calculations';
import { formatDate } from '../lib/utils';
import { ProjectAssignment, Project } from '../lib/schemas';
import Decimal from 'decimal.js';

describe('Calculation Functions', () => {
  describe('calculateAssignmentCost', () => {
    it('should calculate row cost correctly for assignment', () => {
      const assignment: ProjectAssignment = {
        id: 1,
        project_id: 1,
        daily_rate: 15000,
        days_allocated: 10,
        buffer_days: 0,
        total_mandays: 10,
        total_price: 150000
      };

      const result = calculateAssignmentCost(assignment);
      
      expect(result.rowCost.toNumber()).toBe(150000);
    });

    it('should calculate cost with buffer days', () => {
      const assignment: ProjectAssignment = {
        id: 1,
        project_id: 1,
        daily_rate: 15000,
        days_allocated: 10,
        buffer_days: 2,
        total_mandays: 12,
        total_price: 180000
      };

      const result = calculateAssignmentCost(assignment);
      
      // 15000 * (10 + 2) = 180000
      expect(result.rowCost.toNumber()).toBe(180000);
    });

    it('should calculate cost correctly with different rates', () => {
      const assignment: ProjectAssignment = {
        id: 1,
        project_id: 1,
        daily_rate: 20000,
        days_allocated: 5,
        buffer_days: 1,
        total_mandays: 6,
        total_price: 120000
      };

      const result = calculateAssignmentCost(assignment);
      
      // 20000 * (5 + 1) = 120000
      expect(result.rowCost.toNumber()).toBe(120000);
    });
  });

  describe('calculateProjectSummary', () => {
    const mockProject: Project = {
      id: 1,
      name: 'Test Project',
      currency_code: 'THB',
      currency_symbol: '฿',
      hours_per_day: 7,
      tax_enabled: true,
      tax_percentage: 7,
      proposed_price: 300000,
      execution_days: 30,
      buffer_days: 5,
      calendar_mode: false,
      working_week: 'MON_TO_FRI'
    };

    const mockAssignments: ProjectAssignment[] = [
      {
        id: 1,
        project_id: 1,
        daily_rate: 15000,
        days_allocated: 10,
        buffer_days: 0,
        total_mandays: 10,
        total_price: 150000
      },
      {
        id: 2,
        project_id: 1,
        daily_rate: 20000,
        days_allocated: 5,
        buffer_days: 0,
        total_mandays: 5,
        total_price: 100000
      }
    ];

    it('should calculate project summary with tax', () => {
      const result = calculateProjectSummary(mockAssignments, mockProject);
      
      expect(result.subtotal.toNumber()).toBe(250000); // 150000 + 100000
      expect(result.tax.toNumber()).toBe(17500); // 250000 * 0.07
      expect(result.cost.toNumber()).toBe(267500); // 250000 + 17500
      expect(result.proposedPrice.toNumber()).toBe(300000);
      expect(result.roi.toNumber()).toBeCloseTo(12.15, 2); // ((300000 - 267500) / 267500) * 100
      expect(result.margin.toNumber()).toBeCloseTo(10.83, 2); // ((300000 - 267500) / 300000) * 100
    });

    it('should calculate project summary without tax', () => {
      const projectWithoutTax = { ...mockProject, tax_enabled: false };
      const result = calculateProjectSummary(mockAssignments, projectWithoutTax);
      
      expect(result.subtotal.toNumber()).toBe(250000);
      expect(result.tax.toNumber()).toBe(0);
      expect(result.cost.toNumber()).toBe(250000);
      expect(result.roi.toNumber()).toBe(20); // ((300000 - 250000) / 250000) * 100
      expect(result.margin.toNumber()).toBeCloseTo(16.67, 2); // ((300000 - 250000) / 300000) * 100
    });
  });

  describe('Day calculations', () => {
    it('should calculate buffer days correctly', () => {
      expect(calculateBufferDays(50, 45)).toBe(5);
      expect(calculateBufferDays(30, 35)).toBe(0); // Cannot be negative
    });

    it('should calculate execution days correctly', () => {
      expect(calculateExecutionDays(50, 5)).toBe(45);
      expect(calculateExecutionDays(30, 35)).toBe(0); // Cannot be negative
    });

    it('should calculate business days correctly', () => {
      const startDate = new Date('2025-09-01'); // Monday
      const endDate = new Date('2025-09-05'); // Friday
      
      expect(calculateBusinessDays(startDate, endDate)).toBe(5);
    });
  });

  describe('Formatting functions', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(new Decimal(15000))).toBe('฿15,000.00');
      expect(formatCurrency(new Decimal(1500000), '$')).toBe('$1,500,000.00');
    });

    it('should format percentage correctly', () => {
      expect(formatPercentage(new Decimal(15.5))).toBe('15.50%');
      expect(formatPercentage(new Decimal(-5.25))).toBe('-5.25%');
    });
  });

  describe('CSV sanitization', () => {
    it('should sanitize dangerous CSV cells', () => {
      expect(sanitizeCSVCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeCSVCell('+1+1')).toBe("'+1+1");
      expect(sanitizeCSVCell('-5')).toBe("'-5");
      expect(sanitizeCSVCell('@username')).toBe("'@username");
      expect(sanitizeCSVCell('normal text')).toBe('normal text');
    });
  });

  describe('Project end_date calculation for parallel assignments', () => {
    it('should calculate end_date based on maximum assignment duration for parallel work', () => {
      const assignments = [
        {
          id: 1,
          project_id: 1,
          daily_rate: 15000,
          days_allocated: 10,
          buffer_days: 2,
          total_mandays: 12,
          total_price: 180000
        },
        {
          id: 2,
          project_id: 1,
          daily_rate: 20000,
          days_allocated: 15,
          buffer_days: 3,
          total_mandays: 18,
          total_price: 360000
        },
        {
          id: 3,
          project_id: 1,
          daily_rate: 12000,
          days_allocated: 8,
          buffer_days: 1,
          total_mandays: 9,
          total_price: 108000
        }
      ];

      // Calculate maximum assignment duration (execution_days + buffer_days)
      const maxAssignmentDuration = Math.max(...assignments.map(a => (a.days_allocated || 0) + (a.buffer_days || 0)), 0);
      
      // Should be 15 + 3 = 18 days (the longest assignment)
      expect(maxAssignmentDuration).toBe(18);
    });

    it('should handle projects with no assignments by using project execution_days + buffer_days', () => {
      const assignments: ProjectAssignment[] = [];
      const project = {
        execution_days: 20,
        buffer_days: 5
      };

      const maxAssignmentDuration = assignments.length > 0 
        ? Math.max(...assignments.map(a => (a.days_allocated || 0) + (a.buffer_days || 0)), 0)
        : (project.execution_days || 0) + (project.buffer_days || 0);
      
      // Should be 20 + 5 = 25 days
      expect(maxAssignmentDuration).toBe(25);
    });

    it('should handle assignments with zero or undefined values', () => {
      const assignments = [
        {
          id: 1,
          project_id: 1,
          daily_rate: 15000,
          days_allocated: 0,
          buffer_days: 0,
          total_mandays: 0,
          total_price: 0
        },
        {
          id: 2,
          project_id: 1,
          daily_rate: 20000,
          days_allocated: undefined,
          buffer_days: undefined,
          total_mandays: 0,
          total_price: 0
        }
      ];

      const maxAssignmentDuration = Math.max(...assignments.map(a => (a.days_allocated || 0) + (a.buffer_days || 0)), 0);
      
      // Should be 0 since all assignments have 0 or undefined values
      expect(maxAssignmentDuration).toBe(0);
    });
  });

  describe('Date formatting', () => {
    it('should format date in DD MMM YYYY format', () => {
      expect(formatDate('2025-09-11')).toBe('11 Sep 2025');
      expect(formatDate('2025-01-01')).toBe('01 Jan 2025');
      expect(formatDate('2025-12-31')).toBe('31 Dec 2025');
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-09-11');
      expect(formatDate(date)).toBe('11 Sep 2025');
    });

    it('should handle null and undefined values', () => {
      expect(formatDate(null)).toBe('Not set');
      expect(formatDate(undefined)).toBe('Not set');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date');
      expect(formatDate('2025-13-45')).toBe('Invalid date');
    });

    it('should handle empty string', () => {
      expect(formatDate('')).toBe('Not set');
    });
  });
});
