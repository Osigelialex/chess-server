# Chess Server

A backend server for managing online chess games, player authentication, and real-time gameplay using WebSockets. This project is currently under development and will evolve as new features are added.

## Features
- User authentication (login, registration)
- Real-time chess gameplay via WebSockets
- Game state management and persistence
- RESTful API endpoints for game and user management
- Redis integration for session and state management
- Modular architecture for scalability

## Technologies Used
- **Node.js** & **TypeScript**: Core server and application logic
- **Express.js**: REST API framework
- **Prisma ORM**: Database access and migrations
- **PostgreSQL**: Primary database
- **Redis**: Caching and session management
- **Socket.IO**: Real-time communication

## Project Structure
- `src/` - Main source code
  - `config/` - App configs
  - `controllers/` - API controllers
  - `database/` - Database connection and logic
  - `dto/` - Data transfer objects
  - `enums/` - Typescript Enums
  - `interfaces/` - Typescript interfaces
  - `middleware/` - Express and socket middlewares
  - `redis/` - Redis Client configurations
  - `routes/` - API route definitions
  - `service/` - Business logic
  - `sockets/` - WebSocket event handlers
  - `utils/` - Utility functions
- `prisma/` - Prisma schema and migrations
- `generated/` - Generated Prisma client

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start the server: `npm run dev`

## Roadmap / TODO
- [x] Authentication and authorization
- [x] Socket setup
- [ ] Complete core chess logic and move validation
- [ ] Add ranking system
- [ ] Implement game history and statistics
- [ ] Add deployment instructions

Feel free to suggest features as the project grows!
