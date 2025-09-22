# ♟️ Chess Server

<p align="center">
  <b>Real-time multiplayer chess backend with authentication, rating, and WebSocket gameplay</b>
</p>

A modern backend server for online chess games, featuring real-time gameplay, player authentication, Elo-like ratings, and robust state management. Built with Node.js, TypeScript, Prisma, PostgreSQL, Redis, and Socket.IO.


## 🚀 Features

### Authentication & User Management
- Secure user registration and login system with email/username
- Guest mode support with unique game codes
- JWT-based authentication for API and WebSocket connections
- User profiles with rating, bio, and game history

### Game Management
- Create games with customizable time controls
- Choose side preference (white/black/random)
- Join games via ID (authenticated) or game code (guests)
- Separate game tracking for authenticated and guest users
- Persistent game state with move history

### Gameplay
- Real-time move validation using chess.js
- Automatic detection of:
  - Checkmate
  - Stalemate
  - Insufficient material
  - Threefold repetition
- Draw offers with 30-second timeout
- Resignation handling

### Rating System
- Elo-like rating system (100-3500 range)
- ±20 rating points per win/loss
- Rating adjustments for checkmate and resignation

### Infrastructure & API
- Redis for session management and real-time features
- Separate WebSocket namespaces for auth/guest users
- Swagger/OpenAPI documentation
- RESTful API with DTO validation
- Modular TypeScript architecture with decorators


## 🛠️ Tech Stack
- **Node.js** & **TypeScript** — Core server logic with type safety
- **Express.js** & **class-validator** — REST API with validation
- **Prisma ORM** — Type-safe database access & migrations
- **PostgreSQL** — Persistent game & user data storage
- **Redis** — Real-time features & session management
- **Socket.IO** — WebSocket communication with namespaces
- **chess.js** — Chess move validation & game state
- **Swagger/OpenAPI** — API documentation & testing


## 📁 Project Structure
```
src/
  config/        # Configuration files
  controllers/   # API controllers
  dto/           # Data transfer objects
  enums/         # TypeScript enums
  interfaces/    # TypeScript interfaces
  middleware/    # Express & socket middlewares
  routes/        # API route definitions
  service/       # Business logic
  sockets/       # WebSocket event handlers
  utils/         # Utility functions
prisma/          # Prisma schema & migrations
generated/       # Generated Prisma client
```


## 🏁 Getting Started
1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/chess-server.git
   cd chess-server
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your config
4. **Run database migrations:**
   ```sh
   npx prisma migrate dev
   ```
5. **Start the server:**
   ```sh
   npm run dev
   ```



## ♟️ WebSocket Events


### Game Events

| Event         | Description                                                          | Response Events                               |
|---------------|----------------------------------------------------------------------|----------------------------------------------|
| `playerReady` | Join game room and mark as ready                                     | `ready`, `gameStarted`                        |
| `move`        | Make a chess move (includes validation)                              | `moveMade`, `gameEnded` (if game ends)        |
| `resign`      | Resign current game                                                  | `resigned`, `gameEnded`                       |
| `drawOffer`   | Offer a draw to opponent                                            | `drawOffered`                                 |
| `acceptDraw`  | Accept opponent's draw offer                                        | `drawAccepted`, `gameEnded`                   |
| `rejectDraw`  | Reject opponent's draw offer                                        | `drawRejected`                                |

### Game End Conditions
- Checkmate: Winner's rating +20, loser's rating -20
- Resignation: Winner's rating +20, loser's rating -20
- Draw (by agreement): No rating change
- Draw (by stalemate/insufficient material/threefold repetition): No rating change

### Error Handling
All events emit `gameError` on failure with a descriptive message.


## 🗺️ Roadmap
- [x] Authentication & authorization
- [x] Socket setup
- [x] Core chess logic, move validation, resign, draw offers
- [x] Rating system (Elo-like, with min/max bounds)


## 📝 Technical Notes

### Game State & Data Model
- FEN notation for board state persistence
- Move history tracked separately from board state
- Separate models for authenticated and guest games
- PostgreSQL UUID for game and user identification

### Authentication & Security
- JWT-based authentication flow
- Separate WebSocket namespaces for auth/guest users
- DTO-based request validation
- Middleware for socket and HTTP auth
- Password hashing with bcrypt

### Redis Usage
- Draw offers stored with 30-second expiration
- Session management for authenticated users
- Real-time game state synchronization

### Rating System
- Bounded Elo-like system (100-3500)
- Fixed 20-point increment/decrement
- Rating updates only on decisive results (checkmate/resignation)

---
