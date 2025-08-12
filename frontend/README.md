# Rental Management System - Frontend

A modern, responsive Next.js application for rental management with TypeScript, Tailwind CSS, and comprehensive UI/UX design.

## 🚀 Features

### For Customers
- **Product Browsing**: Intuitive product catalog with search and filtering
- **Real-time Availability**: Live inventory checking with date selection
- **Easy Booking**: Streamlined rental order process
- **Order Tracking**: Real-time status updates and delivery tracking
- **Payment Integration**: Multiple payment methods (Stripe, Razorpay, PayPal)
- **Profile Management**: Account settings and order history

### For Business Users (End Users)
- **Dashboard Analytics**: Comprehensive business metrics and insights
- **Product Management**: Full CRUD operations for rental inventory
- **Order Processing**: Complete order lifecycle management
- **Customer Management**: Customer profiles and interaction history
- **Delivery Coordination**: Pickup and return scheduling
- **Financial Reports**: Revenue tracking and analytics

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Custom component library with shadcn/ui patterns
- **Forms**: React Hook Form with Zod validation
- **API Integration**: Axios with interceptors and error handling
- **State Management**: React Context + React Query
- **Authentication**: JWT-based with automatic token refresh
- **Payments**: Stripe Elements integration
- **Icons**: Heroicons
- **Animations**: Framer Motion

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── customer/          # Customer dashboard and features
│   ├── end-user/          # Business user dashboard and features
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── pages/            # Page-specific components
│   └── providers/        # Context providers
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── services/             # API service layers
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Clone and navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://rentalmanagementsystem-production.up.railway.app/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#3b82f6 to #1d4ed8)
- **Secondary**: Gray scales for text and backgrounds
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Headings**: Inter font family, bold weights
- **Body**: Inter font family, regular weight
- **Code**: JetBrains Mono

### Components
All components follow a consistent design pattern with:
- Proper spacing and padding
- Consistent border radius
- Hover and focus states
- Loading states
- Error states

## 🔐 Authentication Flow

1. **Registration**: Users choose between Customer or Business account
2. **Login**: Email/password authentication with JWT tokens
3. **Token Management**: Automatic refresh and secure storage
4. **Role-based Routing**: Different dashboards based on user type

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: 
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
- **Touch Friendly**: All interactive elements are appropriately sized

## 🚀 API Integration

### Service Layer Architecture
- **authService**: Authentication and user management
- **productService**: Product catalog and inventory
- **orderService**: Order processing and management
- **paymentService**: Payment processing
- **reportService**: Analytics and reporting

### Error Handling
- Global error boundaries
- API error interception
- User-friendly error messages
- Automatic retry logic

## 🎯 Key Pages

### Authentication
- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/forgot-password` - Password reset

### Customer Portal
- `/customer/dashboard` - Customer overview
- `/customer/browse` - Product catalog
- `/customer/orders` - Order history
- `/customer/profile` - Account settings

### Business Portal
- `/end-user/dashboard` - Business overview
- `/end-user/products` - Product management
- `/end-user/orders` - Order management
- `/end-user/reports` - Analytics dashboard

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

## 🧪 Testing Strategy

- **Unit Tests**: Component testing with Jest
- **Integration Tests**: API integration testing
- **E2E Tests**: User flow testing with Cypress
- **Visual Tests**: Component visual regression testing

## 📊 Performance Optimization

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: webpack-bundle-analyzer
- **Caching**: React Query for data caching
- **Lazy Loading**: Lazy-loaded components and routes

## 🌐 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Docker
```bash
# Build Docker image
docker build -t rental-frontend .

# Run container
docker run -p 3000:3000 rental-frontend
```

## 🔒 Security Features

- **JWT Token Security**: Secure token storage and refresh
- **Input Validation**: Zod schema validation
- **XSS Protection**: Built-in Next.js protections
- **CSRF Protection**: API security headers
- **Environment Variables**: Secure configuration management

## 🎨 UI/UX Features

### Visual Design
- **Modern Interface**: Clean, professional design
- **Consistent Branding**: Unified color scheme and typography
- **Intuitive Navigation**: Clear information architecture
- **Visual Feedback**: Loading states and animations

### User Experience
- **Fast Loading**: Optimized performance
- **Offline Support**: Service worker implementation
- **Accessibility**: WCAG 2.1 compliance
- **Keyboard Navigation**: Full keyboard support

## 📈 Analytics & Monitoring

- **User Analytics**: Track user interactions
- **Performance Monitoring**: Real-time performance metrics
- **Error Tracking**: Comprehensive error logging
- **Usage Statistics**: Feature usage analytics

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📝 Code Style

- **ESLint**: Code linting rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Conventional Commits**: Commit message format

## 🐛 Troubleshooting

### Common Issues

1. **SWC Binary Error**: 
   ```bash
   npm install --save-dev @swc/core
   ```

2. **Port Already in Use**:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **Environment Variables Not Loading**:
   - Ensure `.env.local` file exists
   - Restart development server

## 📞 Support

- **Documentation**: Comprehensive inline documentation
- **Issue Tracking**: GitHub Issues
- **Community**: Discussions and Q&A

---

**Built with ❤️ using modern web technologies for a seamless rental management experience.**
