# Budget Calculator

A comprehensive web application for project cost estimation, team allocation, and pricing management built with Next.js 15, TypeScript, and PostgreSQL. This tool helps businesses accurately calculate project costs, manage team resources, and track financial metrics with precision.

## 🚀 Live Demo

**Application URL**: https://budget-calculator.lindy.site

## 📋 Features

### Core Functionality
- **Project Cost Estimation**: Calculate project costs with team allocations, rates, and multipliers
- **Team Library Management**: CRUD operations for team members with roles, levels, and rates
- **Rate Card System**: Manage daily rates for different roles and experience levels
- **Financial Calculations**: ROI%, Margin%, tax calculations with Decimal.js precision
- **Day Configuration**: Execution days, buffer days, calendar mode with holiday handling
- **Multi-Currency Support**: Real-time currency conversion and exchange rate management
- **Holiday Management**: Public holiday tracking with external API integration

### Key Pages
1. **Dashboard** (`/`) - Project overview with stats and recent projects
2. **Team Library** (`/team`) - Manage team members with search, filter, and pagination
3. **Rate Cards** (`/rate-cards`) - Configure daily rates by role and level
4. **Project Workspace** (`/projects/[id]`) - Detailed project management with tabs
5. **Currency Management** (`/currencies`) - Multi-currency support with exchange rates
6. **Holiday Management** (`/holidays`) - Public holiday calendar management

### Advanced Features
- **Inline Editing**: Edit rates and assignments directly in tables
- **Real-time Calculations**: Live updates of costs, ROI, and margins
- **CSV Import/Export**: Bulk operations for team data
- **Currency Conversion**: Real-time exchange rate updates from external APIs
- **Holiday Integration**: Thai public holidays with custom treatment options
- **Project Templates**: Save and compare project configurations
- **Interactive Gantt Charts**: Visual project timeline management
- **PDF Export**: Generate project reports and documentation

## 🛠 Tech Stack

### Frontend
- **Next.js 15** with App Router and TypeScript
- **React 19** with modern hooks and concurrent features
- **Tailwind CSS** + **shadcn/ui** + **Radix UI** for components
- **Lucide React** for icons
- **next-themes** for dark mode support
- **Motion** (Framer Motion) for animations
- **Recharts** for data visualization
- **React Hook Form** with Zod validation

### Backend & Database
- **Supabase PostgreSQL** database with comprehensive schema
- **Next.js API Routes** with Edge/Node runtime optimization
- **Zod** for validation and type safety
- **PostgreSQL** with advanced indexing and triggers

### Calculations & Data Processing
- **Decimal.js** for precise financial calculations
- **date-fns** for date manipulation and formatting
- **CSV/ICS parsing** for data imports
- **Real-time currency conversion** with external APIs
- **Holiday calendar integration** with external services

### UI/UX Components
- **Interactive Gantt Charts** for project timeline visualization
- **Virtualized Tables** for large dataset performance
- **Inline Editing** with real-time validation
- **PDF Generation** with jsPDF and html2canvas
- **Responsive Design** with mobile-first approach

### Development & Testing
- **TypeScript** for type safety
- **ESLint** with Next.js configuration
- **Comprehensive test coverage** for calculations
- **Performance optimizations** with Edge Runtime

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
- **rate_cards** - Daily rates by role and level
- **team_members** - Team library with default rates
- **projects** - Project configurations and settings
- **project_assignments** - Team member allocations per project
- **public_holidays** - Holiday calendar with treatment options
- **project_templates** - Saved project configurations
- **currencies** - Multi-currency support with exchange rates
- **levels** - Experience level definitions (Junior, Senior, etc.)

### Key Features
- **Automatic timestamps** with triggers
- **Referential integrity** with foreign keys
- **Performance indexes** on frequently queried columns
- **Enum types** for level types and status values
- **Real-time currency conversion** with external API integration
- **Holiday management** with external calendar sync
- **Advanced indexing** for optimal query performance

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
│   │   ├── currencies/    # Currency management APIs
│   │   ├── holidays/      # Holiday management APIs
│   │   ├── projects/      # Project management APIs
│   │   ├── rate-cards/    # Rate card APIs
│   │   ├── roles/         # Role management APIs
│   │   └── team/          # Team management APIs
│   ├── currencies/        # Currency management page
│   ├── holidays/          # Holiday management page
│   ├── projects/          # Project workspace
│   │   ├── [id]/         # Individual project page
│   │   └── new/          # New project creation
│   ├── rate-cards/        # Rate management page
│   ├── team/              # Team library page
│   └── page.tsx           # Dashboard
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── currency-converter.tsx
│   ├── interactive-gantt.tsx
│   └── virtualized-table.tsx
├── hooks/                 # Custom React hooks
│   ├── use-api.ts
│   ├── use-currencies.ts
│   └── use-debounce.ts
├── lib/                   # Utilities and logic
│   ├── db/               # Database connection and schema
│   ├── schemas/          # Zod validation schemas
│   ├── calculations.ts   # Core calculation functions
│   ├── currencies.ts     # Currency utilities
│   └── utils.ts          # General utilities
└── supabase/             # Supabase configuration
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

- [ ] User authentication and role-based permissions
- [ ] Real-time collaboration with WebSockets
- [ ] Advanced reporting and analytics dashboard
- [ ] Mobile app with React Native
- [ ] Integration with external project management tools (Jira, Asana)
- [ ] Advanced holiday calendar management for multiple countries
- [ ] Bulk operations for project assignments
- [ ] Time tracking and actual vs. estimated cost analysis
- [ ] Client portal for project visibility
- [ ] Advanced Gantt chart features with dependencies
- [ ] Automated project cost alerts and notifications
- [ ] Integration with accounting software
- [ ] Advanced export options (Excel, Google Sheets)
- [ ] Project templates with industry-specific configurations
- [ ] **Fix drag & drop functionality in Gantt chart**

## 📄 License

This project is proprietary software for project cost estimation and team allocation.

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.

## 🏆 Key Benefits

- **Accurate Cost Estimation**: Precise financial calculations with Decimal.js
- **Multi-Currency Support**: Real-time exchange rates and currency conversion
- **Team Resource Management**: Comprehensive team library with role-based rates
- **Holiday Integration**: Automatic holiday exclusion from project timelines
- **Real-time Updates**: Live calculation updates as you modify project parameters
- **Export Capabilities**: PDF reports and CSV exports for external use
- **Responsive Design**: Works seamlessly across desktop and mobile devices

---

**Built with ❤️ for efficient project cost estimation and team allocation**
