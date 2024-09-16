
# NFT Marketplace Backend

This project implements the backend for an **NFT Marketplace** built with **TypeScript** and **ethers.js**. It enables users to trade NFTs, handle payments through platforms like **Binance**, **Coinbase**, and **Stripe**, and manage NFT metadata through decentralized storage solutions such as **IPFS**.

The marketplace allows users to buy, sell, and mint NFTs while utilizing gas-free meta transactions. The backend also supports real-time interaction through WebSockets, providing a dynamic and responsive experience.

## Key Features

- **Gas-free transactions** via meta transactions with **ethers.js**.
- Integration with **Binance**, **Coinbase**, and **Stripe** for handling payments.
- **MongoDB** and **PostgreSQL** database support for storing user and transaction data.
- Decentralized file storage using **IPFS** for NFT metadata.
- Real-time WebSocket communication for marketplace events.
- Comprehensive metadata handling, ensuring accurate information for all NFTs.
- Support for **wearables** and virtual assets, enabling marketplace functionality for virtual worlds like **Decentraland**.

## Services Overview

### 1. **IPFS Service**
   - Manages interactions with IPFS to store and retrieve decentralized NFT metadata.
   
### 2. **Marketplace Service**
   - Handles operations related to listing, buying, and selling NFTs. This service interacts directly with Ethereum smart contracts to facilitate seamless transactions.

### 3. **Minter Service**
   - Responsible for minting new NFTs, ensuring correct metadata is assigned and stored.

### 4. **Metadata Service**
   - Fetches, validates, and maps NFT metadata from IPFS and other decentralized storage systems, ensuring the marketplace has up-to-date information.

### 5. **User Service**
   - Manages user authentication and validation, ensuring secure access and operations within the marketplace.

### 6. **Payment Integration (Binance, Coinbase, Stripe)**
   - Processes payments through various platforms, enabling users to buy NFTs using different currencies and payment methods.

### 7. **NFT Service**
   - Retrieves NFT data from Ethereum contracts, including ownership details, metadata, and transaction history.

### 8. **WebSocket Service**
   - Provides real-time updates to users on NFT listings, transactions, and marketplace events.

### 9. **World Service**
   - Supports virtual worlds by enabling users to trade wearables, land, and other digital assets within platforms like **Decentraland**.

### 10. **Third-Party Transaction Service**
   - Manages external transaction processing, ensuring smooth integration with third-party systems.

## Prerequisites

- **Node.js** v16+
- **npm** or **yarn**
- **MongoDB** or **PostgreSQL**
- Ethereum development tools (e.g., **Ganache** or **Infura**)
- API keys for **Binance** and **Coinbase**

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/pvtallulah/nft-marketplace.git
   cd nft-marketplace
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables in an `.env` file:

   ```bash
   DATABASE_URL=<your-mongo-or-postgres-url>
   ETHEREUM_NETWORK=<network-name>
   INFURA_API_KEY=<your-infura-api-key>
   BINANCE_API_KEY=<your-binance-api-key>
   COINBASE_API_KEY=<your-coinbase-api-key>
   STRIPE_SECRET_KEY=<your-stripe-secret-key>
   ```

4. Run database migrations:

   ```bash
   npm run migrations
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

## Docker Setup

To build and run the application using Docker:

```bash
npm run start:docker
```

For GitHub Actions CI/CD:

```bash
npm run start:docker:gh
```

## API Documentation

View Swagger API documentation at:

```
http://localhost:<port>/docs
```

## Running Tests

```bash
npm run test
```

## Deployment

Ensure environment variables are configured, and deploy using Docker or your preferred cloud provider.

## License

This project is licensed under the **ISC License**.
