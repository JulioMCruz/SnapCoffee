# Snap Coffee - Farcaster Mini App

Snap Coffee is a social + on-chain loyalty mini-app built for Farcaster where users snap photos of their coffee at real coffee shops, earn tokens for participation, and after 10 coffees receive an NFT coupon they can redeem.

## Farcaster Mini App

This app is designed to run as a Farcaster Mini App, providing:

- **Seamless Authentication**: Users are automatically authenticated through Farcaster
- **Built-in Wallet**: Farcaster creates and manages wallets for users automatically  
- **Social Integration**: Direct integration with the Farcaster social graph
- **Base Network**: Optimized for fast, cheap transactions on Base

## Project Structure

This is a React + Vite + TypeScript application with shadcn/ui components, Tailwind CSS styling, and Farcaster Mini App SDK integration.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```sh
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd snap-coffee

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Mini App**: Farcaster Mini App SDK, Base MiniKit
- **Styling**: Tailwind CSS, shadcn/ui
- **Routing**: React Router DOM
- **State Management**: React hooks, localStorage
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Canvas Confetti
- **Web3**: Wagmi, Viem (for future blockchain integration)

## Current Features

- Mobile-first responsive design
- Instagram-style coffee feed
- Camera integration for photo capture
- Progress tracking (coffee count)
- User profiles and leaderboards
- Support/tipping modal
- NFT coupon display and redemption flow

## Planned Features (Web3 Integration)

- OnchainKit wallet integration
- Base network connectivity
- ERC20 $BEAN token rewards
- ERC721 NFT coupon system
- CDP Onramp for fiat-to-crypto tipping
- Smart contract interactions
- AI-powered content moderation

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── layouts/            # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── assets/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License