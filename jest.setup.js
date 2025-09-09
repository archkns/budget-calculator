import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.PGDATABASE = 'test_manday_calculator'
process.env.PGUSER = 'test_user'
process.env.PGPASSWORD = 'test_password'
process.env.PGHOST = 'localhost'
process.env.PGPORT = '5432'
