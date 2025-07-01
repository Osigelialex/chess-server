# Chess Server

A backend server for managing online chess games, player authentication, and real-time gameplay using WebSockets. This project is currently under development and will evolve as new features are added.

## Features
- User authentication (login, registration)
- Real-time chess gameplay via WebSockets (move validation, checkmate, draw, resign, draw offers/accept/reject)
- Game state management and persistence (with Prisma ORM and PostgreSQL)
- RESTful API endpoints for game and user management
- Redis integration for session, draw offers, and state management
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


## WebSocket Events

### Game Events
- `playerReady`: Player joins and marks themselves as ready
- `startGame`: Starts the game when both players are ready
- `move`: Make a chess move (validates move, updates state, handles checkmate/draw)
- `resign`: Player resigns, opponent wins, ratings updated
- `drawOffer`: Player offers a draw (stored in Redis, notifies both players)
- `acceptDraw`: Accept a draw offer (game ends in draw, cleans up state)
- `rejectDraw`: Reject a draw offer (notifies both players)

### Error Handling
- All events emit `gameError` on failure with a descriptive message

## Roadmap / TODO
- [x] Authentication and authorization
- [x] Socket setup
- [x] Core chess logic, move validation, resign, draw offers
- [x] Rating system (Elo-like, with min/max bounds)
- [ ] Implement game history and statistics
- [ ] Add deployment instructions


## Notes
- Draw offers are managed with Redis and expire after a timeout
- Game state is validated and updated on every move
- Ratings are updated on checkmate and resignation
- All socket events require the user to be a player in the game
