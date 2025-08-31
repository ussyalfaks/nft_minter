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

## 🤖 Built with Codigo AI

This project was enhanced with [Codigo AI](https://www.codigo.ai/), an advanced AI-powered development platform that helps developers build robust Solana programs and Web3 applications. Codigo AI provides:

- **Smart Contract Generation** - AI-assisted Solana program development
- **Code Analysis & Optimization** - Advanced static analysis and performance insights
- **Security Auditing** - Automated vulnerability detection and security best practices
- **Documentation Generation** - Comprehensive docs and integration guides
- **Testing Framework** - Automated test generation and coverage analysis

Visit [https://www.codigo.ai/](https://www.codigo.ai/) to accelerate your Web3 development workflow.

## 📄 License

ISC License - see LICENSE file for details.