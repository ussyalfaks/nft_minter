# NFT Minter - Complete Solana NFT Operations

A comprehensive Solana smart contract for NFT operations using the latest Metaplex standards. Built with Anchor 0.31.1, mpl-token-metadata, and mpl-core.

## ✨ Features

- **Collection Creation** - Create NFT collections with metadata
- **Basic & Advanced NFT Minting** - Standard and programmable NFTs
- **Metadata Updates** - Update NFT metadata after creation
- **Asset Plugins** - Royalties, transfer delegates, burn delegates
- **Utility NFTs** - NFTs with usage tracking and limits
- **Collection Verification** - Verify NFT collection membership

## 🚀 Quick Start

### Prerequisites
- [Rust](https://rustup.rs/) 1.70+
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) 1.16+
- [Anchor CLI](https://anchor-lang.com/docs/installation) 0.31+
- [Node.js](https://nodejs.org/) 18+

### Installation
```bash
git clone <your-repo>
cd nft_minter
yarn install
anchor build
anchor test
```

## 📋 Available Instructions

| Instruction | Description |
|-------------|-------------|
| `createCollection` | Create NFT collection with metadata |
| `mintNft` | Mint basic NFT to collection |
| `verifyCollection` | Verify NFT as part of collection |
| `updateMetadata` | Update NFT name, symbol, or URI |
| `createProgrammableNft` | Create NFT with royalties & creators |
| `createUtilityNft` | Create NFT with usage tracking |
| `createAssetWithRoyalties` | Create mpl-core asset with royalties |
| `createAssetWithTransferDelegate` | Create asset with transfer delegation |
| `addBurnDelegatePlugin` | Add burn delegation to asset |
| `removePlugin` | Remove plugin from asset |
| `updateRoyaltiesPlugin` | Update royalty settings |

## 💻 Developer Guide

### 1. Basic Collection & NFT Creation

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Setup
const provider = anchor.AnchorProvider.env();
const program = anchor.workspace.nftMinter;
const wallet = provider.wallet;

// Generate keypairs
const collectionKeypair = Keypair.generate();
const nftKeypair = Keypair.generate();

// Get PDAs
const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const mintAuthority = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("authority")], 
  program.programId
)[0];

const getMetadata = (mint) => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
};

const getMasterEdition = (mint) => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
};

// Create Collection
await program.methods
  .createCollection("My Collection", "MC", "https://example.com/collection.json")
  .accountsPartial({
    user: wallet.publicKey,
    mint: collectionKeypair.publicKey,
    mintAuthority,
    metadata: getMetadata(collectionKeypair.publicKey),
    masterEdition: getMasterEdition(collectionKeypair.publicKey),
    destination: getAssociatedTokenAddressSync(collectionKeypair.publicKey, wallet.publicKey),
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  })
  .signers([collectionKeypair])
  .rpc();

// Mint NFT to Collection
await program.methods
  .mintNft("My NFT", "MN", "https://example.com/nft.json")
  .accountsPartial({
    owner: wallet.publicKey,
    mint: nftKeypair.publicKey,
    destination: getAssociatedTokenAddressSync(nftKeypair.publicKey, wallet.publicKey),
    metadata: getMetadata(nftKeypair.publicKey),
    masterEdition: getMasterEdition(nftKeypair.publicKey),
    mintAuthority,
    collectionMint: collectionKeypair.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  })
  .signers([nftKeypair])
  .rpc();
```

### 2. Update NFT Metadata

```typescript
await program.methods
  .updateMetadata("Updated NFT Name", null, "https://example.com/updated.json")
  .accountsPartial({
    metadata: getMetadata(nftKeypair.publicKey),
    mint: nftKeypair.publicKey,
    mintAuthority,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  })
  .rpc();
```

### 3. Create Programmable NFT with Royalties

```typescript
import BN from "bn.js";

const programmableNftKeypair = Keypair.generate();

await program.methods
  .createProgrammableNft(
    "Programmable NFT",
    "PNFT", 
    "https://example.com/programmable.json",
    500, // 5% royalties
    [wallet.publicKey] // creators
  )
  .accountsPartial({
    owner: wallet.publicKey,
    mint: programmableNftKeypair.publicKey,
    destination: getAssociatedTokenAddressSync(programmableNftKeypair.publicKey, wallet.publicKey),
    metadata: getMetadata(programmableNftKeypair.publicKey),
    masterEdition: getMasterEdition(programmableNftKeypair.publicKey),
    mintAuthority,
    collectionMint: collectionKeypair.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  })
  .signers([programmableNftKeypair])
  .rpc();
```

### 4. Create Utility NFT with Usage Tracking

```typescript
const utilityNftKeypair = Keypair.generate();

await program.methods
  .createUtilityNft(
    "Utility NFT",
    "UNFT",
    "https://example.com/utility.json", 
    1, // UseMethod::Multiple
    new BN(10), // remaining uses
    new BN(10)  // total uses
  )
  .accountsPartial({
    owner: wallet.publicKey,
    mint: utilityNftKeypair.publicKey,
    destination: getAssociatedTokenAddressSync(utilityNftKeypair.publicKey, wallet.publicKey),
    metadata: getMetadata(utilityNftKeypair.publicKey),
    masterEdition: getMasterEdition(utilityNftKeypair.publicKey),
    mintAuthority,
    collectionMint: collectionKeypair.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  })
  .signers([utilityNftKeypair])
  .rpc();
```

## 📚 Use Method Values

For `createUtilityNft`, use these values:
- `0` = Burn (single use, destroys NFT)
- `1` = Multiple (can be used multiple times)
- `2` = Single (single use, keeps NFT)

## 🔧 Program Architecture

```
programs/nft_minter/src/
├── lib.rs                    # Main program entry point
└── contexts/
    ├── create_collection.rs  # Collection creation logic
    ├── mint_nft.rs          # Basic NFT minting
    ├── verify_collection.rs # Collection verification
    ├── update_metadata.rs   # Metadata updates
    ├── asset_plugins.rs     # mpl-core asset plugins
    └── advanced_nft.rs      # Programmable & utility NFTs
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
anchor test
```

The test suite includes:
- ✅ 12 passing tests
- Collection creation and verification
- NFT minting and metadata updates
- Advanced NFT features
- Asset plugin functionality
- Integration tests

## 📦 Dependencies

### Rust (Cargo.toml)
```toml
[dependencies]
anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }
anchor-spl = { version = "0.31.1", features = ["metadata"] }
mpl-core = { version = "0.8.0", features = ["serde"] }
mpl-token-metadata = { version = "5.1.0", features = ["serde"] }
```

### JavaScript (package.json)
```json
{
  "@coral-xyz/anchor": "^0.31.1",
  "@metaplex-foundation/mpl-token-metadata": "^3.1.2",
  "@solana/spl-token": "^0.4.8",
  "@solana/web3.js": "^1.95.3",
  "bn.js": "^5.2.1"
}
```

## 🚀 Deployment

### Local Testing
```bash
solana-test-validator
anchor test
```

### Devnet Deployment
```bash
anchor build
anchor deploy --provider.cluster devnet
```

### Mainnet Deployment (Production)
```bash
anchor deploy --provider.cluster mainnet-beta
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `anchor test`
6. Submit a pull request

## 📖 Additional Resources

- [Anchor Documentation](https://anchor-lang.com/)
- [Metaplex Documentation](https://developers.metaplex.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Documentation](https://spl.solana.com/token)

## 📄 License

ISC License - see LICENSE file for details.