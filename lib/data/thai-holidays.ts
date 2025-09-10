// Thai Public Holidays Data
// This is a fallback data source when external APIs are not available

export interface ThaiHoliday {
  id: string
  name: string
  nameEn: string
  date: string
  type: 'public' | 'religious' | 'national'
  notes?: string
  isRecurring: boolean
}

export const THAI_HOLIDAYS_2025: ThaiHoliday[] = [
  {
    id: 'new-year-2025',
    name: 'วันขึ้นปีใหม่',
    nameEn: 'New Year\'s Day',
    date: '2025-01-01',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'makha-bucha-2025',
    name: 'วันมาฆบูชา',
    nameEn: 'Makha Bucha Day',
    date: '2025-02-12',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'chakri-memorial-2025',
    name: 'วันจักรี',
    nameEn: 'Chakri Memorial Day',
    date: '2025-04-06',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'songkran-1-2025',
    name: 'วันสงกรานต์',
    nameEn: 'Songkran Festival Day 1',
    date: '2025-04-13',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'songkran-2-2025',
    name: 'วันสงกรานต์',
    nameEn: 'Songkran Festival Day 2',
    date: '2025-04-14',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'songkran-3-2025',
    name: 'วันสงกรานต์',
    nameEn: 'Songkran Festival Day 3',
    date: '2025-04-15',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'labour-day-2025',
    name: 'วันแรงงาน',
    nameEn: 'Labour Day',
    date: '2025-05-01',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'coronation-day-2025',
    name: 'วันฉัตรมงคล',
    nameEn: 'Coronation Day',
    date: '2025-05-04',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'visakha-bucha-2025',
    name: 'วันวิสาขบูชา',
    nameEn: 'Visakha Bucha Day',
    date: '2025-05-12',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'royal-ploughing-2025',
    name: 'วันพืชมงคล',
    nameEn: 'Royal Ploughing Ceremony',
    date: '2025-05-19',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'queen-birthday-2025',
    name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสิริกิติ์',
    nameEn: 'HM Queen\'s Birthday',
    date: '2025-08-12',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'king-birthday-2025',
    name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
    nameEn: 'HM King\'s Birthday',
    date: '2025-07-28',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'asaha-bucha-2025',
    name: 'วันอาสาฬหบูชา',
    nameEn: 'Asanha Bucha Day',
    date: '2025-07-10',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'buddhist-lent-2025',
    name: 'วันเข้าพรรษา',
    nameEn: 'Buddhist Lent Day',
    date: '2025-07-11',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'chulalongkorn-day-2025',
    name: 'วันปิยมหาราช',
    nameEn: 'Chulalongkorn Day',
    date: '2025-10-23',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'constitution-day-2025',
    name: 'วันรัฐธรรมนูญ',
    nameEn: 'Constitution Day',
    date: '2025-12-10',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'new-year-eve-2025',
    name: 'วันสิ้นปี',
    nameEn: 'New Year\'s Eve',
    date: '2025-12-31',
    type: 'public',
    isRecurring: true
  }
]

export const THAI_HOLIDAYS_2026: ThaiHoliday[] = [
  {
    id: 'new-year-2026',
    name: 'วันขึ้นปีใหม่',
    nameEn: 'New Year\'s Day',
    date: '2026-01-01',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'makha-bucha-2026',
    name: 'วันมาฆบูชา',
    nameEn: 'Makha Bucha Day',
    date: '2026-03-02',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'chakri-memorial-2026',
    name: 'วันจักรี',
    nameEn: 'Chakri Memorial Day',
    date: '2026-04-06',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'songkran-1-2026',
    name: 'วันสงกรานต์',
    nameEn: 'Songkran Festival Day 1',
    date: '2026-04-13',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'songkran-2-2026',
    name: 'วันสงกรานต์',
    nameEn: 'Songkran Festival Day 2',
    date: '2026-04-14',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'songkran-3-2026',
    name: 'วันสงกรานต์',
    nameEn: 'Songkran Festival Day 3',
    date: '2026-04-15',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'labour-day-2026',
    name: 'วันแรงงาน',
    nameEn: 'Labour Day',
    date: '2026-05-01',
    type: 'public',
    isRecurring: true
  },
  {
    id: 'coronation-day-2026',
    name: 'วันฉัตรมงคล',
    nameEn: 'Coronation Day',
    date: '2026-05-04',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'visakha-bucha-2026',
    name: 'วันวิสาขบูชา',
    nameEn: 'Visakha Bucha Day',
    date: '2026-05-31',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'royal-ploughing-2026',
    name: 'วันพืชมงคล',
    nameEn: 'Royal Ploughing Ceremony',
    date: '2026-05-08',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'asaha-bucha-2026',
    name: 'วันอาสาฬหบูชา',
    nameEn: 'Asanha Bucha Day',
    date: '2026-06-29',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'buddhist-lent-2026',
    name: 'วันเข้าพรรษา',
    nameEn: 'Buddhist Lent Day',
    date: '2026-06-30',
    type: 'religious',
    isRecurring: true
  },
  {
    id: 'queen-birthday-2026',
    name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสิริกิติ์',
    nameEn: 'HM Queen\'s Birthday',
    date: '2026-08-12',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'king-birthday-2026',
    name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
    nameEn: 'HM King\'s Birthday',
    date: '2026-07-28',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'chulalongkorn-day-2026',
    name: 'วันปิยมหาราช',
    nameEn: 'Chulalongkorn Day',
    date: '2026-10-23',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'constitution-day-2026',
    name: 'วันรัฐธรรมนูญ',
    nameEn: 'Constitution Day',
    date: '2026-12-10',
    type: 'national',
    isRecurring: true
  },
  {
    id: 'new-year-eve-2026',
    name: 'วันสิ้นปี',
    nameEn: 'New Year\'s Eve',
    date: '2026-12-31',
    type: 'public',
    isRecurring: true
  }
]

export function getThaiHolidays(year: number): ThaiHoliday[] {
  switch (year) {
    case 2025:
      return THAI_HOLIDAYS_2025
    case 2026:
      return THAI_HOLIDAYS_2026
    default:
      // For other years, return 2025 data as fallback
      return THAI_HOLIDAYS_2025
  }
}

export function getHolidaysByMonth(holidays: ThaiHoliday[], month: number): ThaiHoliday[] {
  return holidays.filter(holiday => {
    const holidayMonth = new Date(holiday.date).getMonth() + 1
    return holidayMonth === month
  })
}

export function getHolidaysByType(holidays: ThaiHoliday[], type: 'public' | 'religious' | 'national'): ThaiHoliday[] {
  return holidays.filter(holiday => holiday.type === type)
}
