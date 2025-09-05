# ♟️ Chess Server

<p align="center">
  <b>Real-time multiplayer chess backend with authentication, rating, and WebSocket gameplay</b>
</p>

A modern backend server for online chess games, featuring real-time gameplay, player authentication, Elo-like ratings, and robust state management. Built with Node.js, TypeScript, Prisma, PostgreSQL, Redis, and Socket.IO.


## 🚀 Features
- Secure user authentication (login, registration)
- Real-time chess gameplay via WebSockets (move validation, checkmate, draw, resign, draw offers/accept/reject)
- Persistent game state with Prisma ORM & PostgreSQL
- RESTful API endpoints for user and game management
- Redis-powered session, draw offer, and state management
- Modular, scalable TypeScript architecture


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

| Event         | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `playerReady` | Player marks themselves as ready. Game starts when both players are ready.  |
| `move`        | Make a chess move. Validates move, updates state, handles checkmate/draw.   |
| `resign`      | Player resigns. Opponent wins, ratings updated.                             |
| `drawOffer`   | Player offers a draw (stored in Redis, notifies both players).              |
| `acceptDraw`  | Accept a draw offer. Game ends in draw, cleans up state.                    |
| `rejectDraw`  | Reject a draw offer (notifies both players).                                |

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



## 📝 Notes
- Draw offers are managed with Redis and expire after a timeout
- Game state is validated and updated on every move
- Ratings are updated on checkmate and resignation
- All socket events require the user to be a player in the game

---
