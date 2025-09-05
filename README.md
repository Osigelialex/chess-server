# ♟️ Chess Server

<p align="center">
  <b>Real-time multiplayer chess backend with authentication, rating, and WebSocket gameplay</b>
</p>

A modern backend server for online chess games, featuring real-time gameplay, player authentication, Elo-like ratings, and robust state management. Built with Node.js, TypeScript, Prisma, PostgreSQL, Redis, and Socket.IO.


## 🚀 Features

### Authentication
- Secure user registration and login system
- Guest mode support for casual games
- Socket authentication middleware for secure WebSocket connections

### Game Management
- Create games with customizable time controls (default: 5+0)
- Choose side (white/black/random) when creating a game
- Join existing games through unique game IDs
- Persistent game state using Prisma ORM & PostgreSQL

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

### Infrastructure
- Redis for session management and draw offers
- WebSocket namespaces for authenticated and guest users
- RESTful API endpoints for game management
- Modular TypeScript architecture


## 🛠️ Tech Stack
- **Node.js** & **TypeScript** — Core server logic
- **Express.js** — REST API framework
- **Prisma ORM** — Database access & migrations
- **PostgreSQL** — Main database
- **Redis** — Caching & session management
- **Socket.IO** — Real-time communication


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
- [ ] Guest match logic
- [ ] Game history & statistics
- [ ] Deployment instructions



## 📝 Technical Notes

### Game State Management
- FEN notation used for board state persistence
- Move validation using chess.js library
- Game moves history tracked in database
- Automatic cleanup of game rooms on game end

### Authentication & Security
- Separate WebSocket namespaces for authenticated and guest users
- Socket authentication middleware using JWT tokens
- Player verification for all game actions

### Redis Usage
- Draw offers stored with 30-second expiration
- Session management for authenticated users
- Real-time game state synchronization

### Rating System
- Bounded Elo-like system (100-3500)
- Fixed 20-point increment/decrement
- Rating updates only on decisive results (checkmate/resignation)

---
