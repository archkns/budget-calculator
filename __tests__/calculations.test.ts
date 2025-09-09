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
import { ProjectAssignment, Project } from '../lib/schemas';
import Decimal from 'decimal.js';

describe('Calculation Functions', () => {
  describe('calculateAssignmentCost', () => {
    it('should calculate row cost correctly for billable assignment', () => {
      const assignment: ProjectAssignment = {
        id: 1,
        project_id: 1,
        daily_rate: 15000,
        days_allocated: 10,
        utilization_percentage: 100,
        multiplier: 1.0,
        is_billable: true,
        ignore_holidays: false,
        custom_multipliers: {}
      };

      const result = calculateAssignmentCost(assignment);
      
      expect(result.rowCost.toNumber()).toBe(150000);
      expect(result.isBillable).toBe(true);
    });

    it('should return zero cost for non-billable assignment', () => {
      const assignment: ProjectAssignment = {
        id: 1,
        project_id: 1,
        daily_rate: 15000,
        days_allocated: 10,
        utilization_percentage: 100,
        multiplier: 1.0,
        is_billable: false,
        ignore_holidays: false,
        custom_multipliers: {}
      };

      const result = calculateAssignmentCost(assignment);
      
      expect(result.rowCost.toNumber()).toBe(0);
      expect(result.isBillable).toBe(false);
    });

    it('should apply utilization and multiplier correctly', () => {
      const assignment: ProjectAssignment = {
        id: 1,
        project_id: 1,
        daily_rate: 20000,
        days_allocated: 5,
        utilization_percentage: 80,
        multiplier: 1.5,
        is_billable: true,
        ignore_holidays: false,
        custom_multipliers: {}
      };

      const result = calculateAssignmentCost(assignment);
      
      // 20000 * 5 * 0.8 * 1.5 = 120000
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
      buffer_days: 5
    };

    const mockAssignments: ProjectAssignment[] = [
      {
        id: 1,
        project_id: 1,
        daily_rate: 15000,
        days_allocated: 10,
        utilization_percentage: 100,
        multiplier: 1.0,
        is_billable: true,
        ignore_holidays: false,
        custom_multipliers: {}
      },
      {
        id: 2,
        project_id: 1,
        daily_rate: 20000,
        days_allocated: 5,
        utilization_percentage: 100,
        multiplier: 1.0,
        is_billable: true,
        ignore_holidays: false,
        custom_multipliers: {}
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
});
