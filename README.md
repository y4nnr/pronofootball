# PronoFootball - Football Prediction Application

A comprehensive football prediction platform built with Next.js, featuring real-time betting, leaderboards, and detailed statistics.

## 🏆 Features

### Core Functionality
- **User Authentication**: Secure login/registration system with NextAuth.js
- **Football Predictions**: Bet on match outcomes with real-time scoring
- **Competitions**: Support for multiple tournaments (Euro 2016 historical data included)
- **Real-time Leaderboards**: Multiple ranking systems by points, averages, and streaks
- **Personal Statistics**: Detailed performance tracking with visual analytics
- **Admin Panel**: Complete tournament and user management

### Statistics & Analytics
- **Personal Stats Dashboard**: 
  - All-time ranking and average points per game
  - Longest streaks (points and exact scores) with date ranges
  - Last 10 games performance with visual timeline
  - Competition wins and trophy cabinet
- **Global Leaderboards**:
  - Top players by total points
  - Best average performers (minimum 5 games)
  - Longest streaks with start/end dates
  - Competition winners hall of fame
- **Real Data Integration**: Based on actual Euro 2016 historical results

### User Experience
- **Multilingual Support**: English and French localization
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live score updates and instant leaderboard changes
- **Profile Management**: Custom avatars and user preferences

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Heroicons
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker containerization
- **Internationalization**: next-i18next

## 📊 Database Schema

### Core Models
- **Users**: Authentication and profile management
- **UserStats**: Performance tracking and statistics
- **Competitions**: Tournament organization
- **Teams**: National and club teams with logos
- **Games**: Match scheduling and results
- **Bets**: User predictions and scoring

### Real Data
- **8 Real Users**: Authentic Euro 2016 participants with final rankings
- **51 Historical Games**: Complete Euro 2016 tournament results
- **408 Realistic Bets**: Distributed across all matches with proper scoring
- **29 Teams**: 24 National + 5 Club teams with Wikipedia flag logos

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL (via Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pronofootball
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the database**
   ```bash
   docker-compose up -d postgres
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to access the application.

### Default Admin Account
- **Email**: admin@pronofootball.com
- **Password**: admin123

## 📁 Project Structure

```
pronofootball/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Next.js pages and API routes
│   ├── api/           # Backend API endpoints
│   ├── admin/         # Admin panel pages
│   └── ...            # Application pages
├── prisma/            # Database schema and migrations
├── public/            # Static assets
├── styles/            # Global styles
└── docker-compose.yml # Docker configuration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Current session

### Statistics
- `GET /api/stats/leaderboard` - Global leaderboards with streak dates
- `GET /api/stats/current-user` - Individual user statistics
- `GET /api/stats/user-performance` - Last 10 games performance

### Betting
- `GET /api/bets` - User's betting history
- `POST /api/bets` - Place new bet
- `PUT /api/bets/[id]` - Update existing bet

### Admin
- `GET /api/admin/users` - User management
- `POST /api/games/[id]/finish` - Finalize game results

## 🎯 Key Features Implemented

### Enhanced Statistics (Latest Updates)
- **Streak Date Tracking**: Start and end dates for all streaks
- **Game Count Display**: Number of games played shown for all players
- **Visual Performance Timeline**: Color-coded bars for last 10 games
- **Comprehensive Personal Stats**: 5 key metrics with detailed breakdowns

### Data Integrity
- **Real Historical Data**: Authentic Euro 2016 tournament results
- **Proper Point Distribution**: Realistic betting patterns and scoring
- **Admin User Support**: Separate stats calculation for admin users
- **Fallback Mechanisms**: Graceful handling of missing data

## 🔒 Security Features

- **Secure Authentication**: Password hashing with bcrypt
- **Role-based Access**: Admin and user role separation
- **API Protection**: Session-based route protection
- **Input Validation**: Comprehensive data validation

## 🌐 Internationalization

- **English**: Complete translation
- **French**: Full localization support
- **Extensible**: Easy addition of new languages

## 📈 Performance

- **Optimized Queries**: Efficient database operations with Prisma
- **Caching**: Strategic API response caching
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic bundle optimization

## 🐳 Docker Support

Complete containerization with:
- **Multi-stage builds**: Optimized production images
- **PostgreSQL**: Persistent database container
- **Development**: Hot-reload support
- **Production**: Optimized deployment configuration

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions, please open an issue in the GitHub repository.

---

**PronoFootball** - Making football predictions fun and competitive! ⚽
