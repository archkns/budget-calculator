# Budget Calculator

A comprehensive internal-only web application for project cost estimation, team allocation, and pricing built with Next.js 14, TypeScript, and PostgreSQL.

## 🚀 Live Demo

**Application URL**: https://budget-calculator.lindy.site

## 📋 Features

### Core Functionality
- **Project Cost Estimation**: Calculate project costs with team allocations, rates, and multipliers
- **Team Library Management**: CRUD operations for team members with roles, tiers, and rates
- **Rate Card System**: Manage daily rates for different roles and experience levels
- **Financial Calculations**: ROI%, Margin%, tax calculations with Decimal.js precision
- **Day Configuration**: Execution days, buffer days, calendar mode with holiday handling

### Key Pages
1. **Dashboard** (`/`) - Project overview with stats and recent projects
2. **Team Library** (`/team`) - Manage team members with search, filter, and pagination
3. **Rate Cards** (`/rate-cards`) - Configure daily rates by role and tier
4. **Project Workspace** (`/projects/[id]`) - Detailed project management with tabs

### Advanced Features
- **Inline Editing**: Edit rates and assignments directly in tables
- **Real-time Calculations**: Live updates of costs, ROI, and margins
- **CSV Import/Export**: Bulk operations for team data
- **Holiday Management**: Thai public holidays with custom treatment options
- **Templates & Scenarios**: Save and compare project configurations

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** + **shadcn/ui** + **Radix UI** for components
- **Lucide React** for icons
- **next-themes** for dark mode support
- **Framer Motion** for animations

### Backend
- **Supabase PostgreSQL** database with comprehensive schema
- **Next.js API Routes** with Edge/Node runtime optimization
- **Zod** for validation and type safety
- **react-hook-form** for form management

### Calculations & Data
- **Decimal.js** for precise financial calculations
- **date-fns** for date manipulation
- **CSV/ICS parsing** for imports

### Testing
- **Jest** + **Testing Library** for unit/integration tests
- **MSW** for API mocking
- **11 passing tests** covering core calculations

## 📊 Rate Card (Omelet Rates)

| Role | Team Lead | Senior | Junior |
|------|-----------|--------|--------|
| Project Director | ฿60,000 | - | - |
| Experience Designer (UX/UI) | ฿18,000 | ฿14,000 | ฿10,000 |
| Project Owner | ฿20,000 | ฿16,000 | ฿12,000 |
| Business Innovation Analyst (BA) | ฿20,000 | ฿16,000 | ฿12,000 |
| System Analyst | ฿18,000 | ฿14,000 | ฿12,000 |
| Frontend Dev | ฿18,000 | ฿14,000 | ฿12,000 |
| Backend Dev | ฿20,000 | ฿14,000 | ฿12,000 |
| LINE Dev | ฿22,000 | ฿16,000 | ฿12,000 |
| DevOps | ฿25,000 | ฿18,000 | N/A |
| QA Tester | ฿16,000 | ฿13,000 | ฿10,000 |
| Operation | ฿12,000 | ฿10,500 | ฿9,000 |

## 🧮 Calculation Formulas

### Project Totals
```
Subtotal = Σ(Daily Rate × Days × Utilization% × Multiplier) for billable assignments
Tax = Subtotal × Tax% (if enabled)
Cost (Grand Total) = Subtotal + Tax
ROI% = ((Proposed Price - Cost) / Cost) × 100
Margin% = ((Proposed Price - Cost) / Proposed Price) × 100
```

### Day Configuration
```
Final Days = Execution Days + Buffer Days
Buffer Days = max(0, Final Days - Execution Days)
Execution Days = max(0, Final Days - Buffer Days)
```

## 🗄 Database Schema

### Core Tables
- **roles** - Role definitions (Project Director, Frontend Dev, etc.)
- **rate_cards** - Daily rates by role and tier
- **team_members** - Team library with default rates
- **projects** - Project configurations and settings
- **project_assignments** - Team member allocations per project
- **public_holidays** - Holiday calendar with treatment options
- **project_templates** - Saved project configurations

### Key Features
- **Automatic timestamps** with triggers
- **Referential integrity** with foreign keys
- **Performance indexes** on frequently queried columns
- **Enum types** for tier levels and status values

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd budget-calculator
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up Supabase database**
The application is configured to use Supabase PostgreSQL. The database connection is already set up with the provided connection string.

4. **Configure environment (Optional)**
Create a `.env.local` file if you want to override the default Supabase connection:
```bash
# Supabase Database Configuration
PGHOST=your-supabase-host
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=your_actual_password

# Database URL for direct connection
DATABASE_URL=postgresql://postgres:your_actual_password@your-supabase-host:5432/postgres
```

5. **Run development server**
```bash
bun dev
```

6. **Run tests**
```bash
bun test
```

## 📁 Project Structure

```
budget-calculator/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── projects/[id]/     # Project workspace
│   ├── team/              # Team library
│   ├── rate-cards/        # Rate management
│   └── page.tsx           # Dashboard
├── components/            # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and logic
│   ├── db/               # Database connection and schema
│   ├── schemas/          # Zod validation schemas
│   └── calculations.ts   # Core calculation functions
├── __tests__/            # Test files
└── public/               # Static assets
```

## 🧪 Testing

The application includes comprehensive tests for:
- **Calculation Functions**: ROI, margin, assignment costs
- **Day Calculations**: Buffer days, execution days, business days
- **Formatting**: Currency and percentage formatting
- **Security**: CSV injection prevention

Run tests with:
```bash
bun test
```

## 🔒 Security Features

- **Zod validation** on all API endpoints
- **CSV injection protection** for imports
- **Input sanitization** for user data
- **Type safety** with TypeScript
- **SQL injection prevention** with parameterized queries

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with automatic Edge/Node runtime optimization

### Environment Variables
```env
# Supabase Database Configuration (already configured)
PGHOST=your-supabase-host
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=your_actual_password

# Database URL for direct connection
DATABASE_URL=postgresql://postgres:your_actual_password@your-supabase-host:5432/postgres

# Optional: Supabase client configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

## 📈 Performance Optimizations

- **Edge Runtime** for read operations (GET requests)
- **Node Runtime** for heavy operations (CSV/ICS parsing, exports)
- **Database indexes** on frequently queried columns
- **Streaming exports** for large files
- **Component lazy loading** where appropriate

## 🎯 Future Enhancements

- [ ] User authentication and permissions
- [ ] Real-time collaboration with WebSockets
- [ ] Advanced reporting and analytics
- [ ] Mobile app with React Native
- [ ] Integration with external project management tools
- [ ] Multi-currency support with exchange rates
- [ ] Advanced holiday calendar management
- [ ] Bulk operations for project assignments

## 📄 License

This is an internal-only application for project cost estimation and team allocation.

## 🤝 Contributing

This is an internal project. For questions or suggestions, please contact the development team.

---

**Built with ❤️ for efficient project cost estimation and team allocation**
