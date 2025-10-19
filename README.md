# 🐾 Tamago Stellar - Blockchain Tamagotchi Game

A retro-style pixel pet game built on the Stellar blockchain where you can create, care for, and interact with virtual pets that exist on-chain. Every action affects your pet's stats in real-time on the blockchain.

![Tamago Stellar](https://img.shields.io/badge/Stellar-Blockchain-blue) ![React](https://img.shields.io/badge/React-18.3.1-blue) ![Rust](https://img.shields.io/badge/Rust-Smart_Contract-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)

## 🎮 Features

### 🐱 Pet System
- **Create Pet**: Deploy your unique pet on the Stellar blockchain
- **Feed**: Increase hunger stats and keep your pet alive
- **Play**: Boost happiness levels through interactive play
- **Work**: Earn on-chain coins while reducing energy
- **Sleep**: Restore energy levels for continued activities
- **Time Decay**: Stats naturally decrease over time, requiring regular care

### 💰 Economy
- **Coin System**: Earn coins through pet work activities
- **NFT Items**: Mint and equip cosmetic items like cool glasses
- **On-chain Storage**: All progress stored permanently on Stellar

### 🔗 Blockchain Integration
- **Stellar Network**: Built using Soroban smart contracts
- **Wallet Connection**: Support for multiple Stellar wallets
- **Real-time Sync**: Instant synchronization between UI and blockchain state
- **Decentralized**: All pet data and actions recorded on-chain

## 🏗️ Architecture

### Smart Contract (`/contract`)
The Rust-based Soroban smart contract handles all game logic:

```rust
// Main contract structure
pub struct TamagotchiContract;

// Pet data structure
pub struct Pet {
    pub owner: Address,
    pub name: String,
    pub birthdate: u64,
    pub last_updated: u64,
    pub is_alive: bool,

    // Stats (0-100)
    pub hunger: u32,
    pub happiness: u32,
    pub energy: u32,

    // Customization
    pub has_glasses: bool,
}
```

**Key Functions:**
- `create(owner, name)` - Create a new pet
- `feed(owner)` - Feed pet (+30 hunger)
- `play(owner)` - Play with pet (+20 happiness, -15 energy)
- `sleep(owner)` - Pet sleeps (+40 energy)
- `work(owner)` - Pet works (-20 energy, -10 happiness, +25 coins)
- `mint_glasses(owner)` - Purchase cosmetic glasses (50 coins)
- `get_pet(owner)` - Retrieve pet with decay calculations
- `get_coins(owner)` - Get current coin balance

**Game Mechanics:**
- **Stat Decay**: Hunger decreases by 1 per hour, happiness by 1 per 2 hours
- **Death Conditions**: Pet dies when hunger or happiness reaches 0
- **Energy Requirements**: Work requires minimum 20 energy
- **Economic Balance**: Work costs energy/happiness but provides coins

### Frontend (`/ui`)
Modern React application with TypeScript:

**Tech Stack:**
- **React 18.3.1** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** with custom pixel art styling
- **Radix UI** for accessible component primitives
- **React Query** for efficient data fetching
- **React Router** for navigation

**Key Components:**
- `WalletContext.tsx` - Stellar wallet connection management
- `GameContext.tsx` - Game state and blockchain synchronization
- `PetDisplay.tsx` - Visual pet representation with mood states
- `StatsBar.tsx` - Real-time stat visualization
- `ActionButtons.tsx` - Pet interaction controls
- `Wardrobe.tsx` - Equipment and customization system

**Stellar Integration:**
- `@stellar/stellar-sdk` for blockchain interactions
- `@creit.tech/stellar-wallets-kit` for wallet connectivity
- Real-time synchronization between local state and on-chain data
- Optimistic UI updates with blockchain confirmation

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Rust** with Soroban CLI
- **Stellar wallet** (Freighter, Albedo, etc.)

### 1. Clone Repository
```bash
git clone https://github.com/dante4rt/tamago-stellar.git
cd tamago-stellar
```

### 2. Smart Contract Setup
```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/tamago_stellar.wasm --network testnet
```

### 3. Frontend Setup
```bash
cd ui
npm install
npm run dev
```

### 4. Connect & Play
1. Open http://localhost:5173
2. Connect your Stellar wallet
3. Create your first pet
4. Start caring for your blockchain companion!

## 🎯 Game Rules

### Pet Care Basics
- **Feed regularly**: Hunger decreases by 1 every hour
- **Play often**: Happiness decreases by 1 every 2 hours
- **Balance work**: Earn coins but manage energy carefully
- **Rest when needed**: Sleep restores energy for activities

### Death & Revival
- Pets die when hunger OR happiness reaches 0
- Dead pets can be replaced by creating a new one
- All progress (coins, items) resets with new pet creation

### Economy System
- **Work Income**: 25 coins per work session
- **Energy Cost**: 20 energy per work session
- **Happiness Cost**: 10 happiness per work session
- **Cool Glasses**: 50 coins, permanent cosmetic upgrade

## 🔧 Development

### Contract Development
```bash
cd contract
cargo test                    # Run smart contract tests
cargo build --release         # Build optimized contract
soroban contract optimize     # Optimize for deployment
```

### Frontend Development
```bash
cd ui
npm run dev                   # Development server
npm run build                 # Production build
npm run lint                  # Code linting
npm run preview              # Preview production build
```

### Testing
The smart contract includes comprehensive tests covering:
- Pet creation and lifecycle management
- All game actions (feed, play, work, sleep)
- Stat decay and death mechanics
- Economic transactions and item minting
- Edge cases and error conditions
- Multi-user isolation and data integrity

## 🌟 Technical Highlights

### Blockchain Features
- **Persistent State**: All game data stored permanently on Stellar
- **Decentralized Logic**: Game mechanics enforced by smart contract
- **Real-time Updates**: Instant synchronization across all clients
- **Wallet Integration**: Seamless connection to Stellar ecosystem

### Smart Contract Architecture
- **Gas Optimization**: Efficient storage patterns and minimal compute
- **Error Handling**: Comprehensive panic conditions for invalid states
- **Time Management**: Block timestamp-based decay calculations
- **Data Integrity**: Type-safe Rust implementation with extensive testing

### Frontend Engineering
- **Modern React**: Hooks, context, and functional components
- **Type Safety**: Full TypeScript coverage for reliability
- **Responsive Design**: Mobile-first pixel art aesthetic
- **State Management**: Reactive updates with optimistic UI patterns

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stellar Foundation** for the Soroban smart contract platform
- **Pixel Art Community** for visual inspiration
- **React & TypeScript** communities for excellent tooling
- **Tamagotchi** for the original concept that inspired this blockchain adaptation

---

**Built with ❤️ by [Dante4rt](https://github.com/dante4rt)**

*Experience the nostalgia of virtual pets with the security and permanence of blockchain technology.*