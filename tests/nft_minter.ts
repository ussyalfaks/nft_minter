import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, SystemProgram } from "@solana/web3.js";
import type { NftMinter } from "../target/types/nft_minter";
import { expect } from "chai";
import BN from "bn.js";

describe("NFT Operations with Latest Metaplex Dependencies", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as NodeWallet;
  const program = anchor.workspace.nftMinter as Program<NftMinter>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  
  // Derive the mint authority PDA
  const mintAuthority = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("authority")], program.programId)[0];

  // Test data following the reference examples
  const collectionMetadata = {
    name: "Codigo DevQuest Collection",
    symbol: "CDC",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/nft.json",
  };

  const nftMetadata = {
    name: "Codigo DevQuest NFT #1",
    symbol: "CDN",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/nft.json",
  };

  // Generate keypairs for our tests
  const collectionKeypair = Keypair.generate();
  const collectionMint = collectionKeypair.publicKey;

  const nftKeypair = Keypair.generate();
  const nftMint = nftKeypair.publicKey;

  // Helper functions to derive metadata and master edition PDAs
  const getMetadata = (mint: anchor.web3.PublicKey): anchor.web3.PublicKey => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
  };

  const getMasterEdition = (mint: anchor.web3.PublicKey): anchor.web3.PublicKey => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
  };

  it("Program Deployment Verification", async () => {
    console.log("Program ID:", program.programId.toString());
    console.log("Provider endpoint:", provider.connection.rpcEndpoint);
    console.log("Wallet address:", wallet.publicKey.toString());
    
    const programAccount = await provider.connection.getAccountInfo(program.programId);
    expect(programAccount).to.not.be.null;
    expect(programAccount!.executable).to.be.true;
    
    console.log("✅ NFT Operations program is successfully deployed and accessible");
  });

  it("Create Collection NFT", async () => {
    console.log("\\n--- Creating Collection ---");
    console.log("Collection Mint Key:", collectionMint.toBase58());

    // Derive PDAs for metadata and master edition
    const metadata = getMetadata(collectionMint);
    console.log("Collection Metadata Account:", metadata.toBase58());

    const masterEdition = getMasterEdition(collectionMint);
    console.log("Master Edition Account:", masterEdition.toBase58());

    // Get the associated token account for the collection
    const destination = getAssociatedTokenAddressSync(collectionMint, wallet.publicKey);
    console.log("Collection Token Account:", destination.toBase58());

    // Create the collection
    const tx = await program.methods
      .createCollection(collectionMetadata.name, collectionMetadata.symbol, collectionMetadata.uri)
      .accountsPartial({
        user: wallet.publicKey,
        mint: collectionMint,
        mintAuthority,
        metadata,
        masterEdition,
        destination,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([collectionKeypair])
      .rpc({
        skipPreflight: true,
      });
    
    console.log("Collection NFT created successfully!");
    console.log("Transaction signature:", tx);

    // Verify collection was created properly
    const collectionAccount = await provider.connection.getAccountInfo(collectionMint);
    expect(collectionAccount).to.not.be.null;
    expect(collectionAccount!.owner.toString()).to.equal(TOKEN_PROGRAM_ID.toString());

    const metadataAccount = await provider.connection.getAccountInfo(metadata);
    expect(metadataAccount).to.not.be.null;
    expect(metadataAccount!.owner.toString()).to.equal(TOKEN_METADATA_PROGRAM_ID.toString());

    console.log("✅ Collection verification successful");
  });

  it("Mint NFT to Collection", async () => {
    console.log("\\n--- Minting NFT to Collection ---");
    console.log("NFT Mint Key:", nftMint.toBase58());

    // Derive PDAs for NFT metadata and master edition
    const metadata = getMetadata(nftMint);
    console.log("NFT Metadata Account:", metadata.toBase58());

    const masterEdition = getMasterEdition(nftMint);
    console.log("NFT Master Edition Account:", masterEdition.toBase58());

    // Get the associated token account for the NFT
    const destination = getAssociatedTokenAddressSync(nftMint, wallet.publicKey);
    console.log("NFT Token Account:", destination.toBase58());

    // Mint the NFT
    const tx = await program.methods
      .mintNft(nftMetadata.name, nftMetadata.symbol, nftMetadata.uri)
      .accountsPartial({
        owner: wallet.publicKey,
        destination,
        metadata,
        masterEdition,
        mint: nftMint,
        mintAuthority,
        collectionMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([nftKeypair])
      .rpc({
        skipPreflight: true,
      });
    
    console.log("NFT minted successfully!");
    console.log("Transaction signature:", tx);

    // Verify NFT was created properly
    const nftAccount = await provider.connection.getAccountInfo(nftMint);
    expect(nftAccount).to.not.be.null;
    expect(nftAccount!.owner.toString()).to.equal(TOKEN_PROGRAM_ID.toString());

    const metadataAccount = await provider.connection.getAccountInfo(metadata);
    expect(metadataAccount).to.not.be.null;
    expect(metadataAccount!.owner.toString()).to.equal(TOKEN_METADATA_PROGRAM_ID.toString());

    // Verify token was minted to the associated token account
    const tokenAccount = await provider.connection.getAccountInfo(destination);
    expect(tokenAccount).to.not.be.null;

    console.log("✅ NFT verification successful");
  });

  it("Verify NFT Collection", async () => {
    console.log("\\n--- Verifying NFT as part of Collection ---");
    
    // Get metadata accounts for both NFT and collection
    const nftMetadata = getMetadata(nftMint);
    console.log("NFT Metadata:", nftMetadata.toBase58());

    const collectionMetadata = getMetadata(collectionMint);
    console.log("Collection Metadata:", collectionMetadata.toBase58());

    const collectionMasterEdition = getMasterEdition(collectionMint);
    console.log("Collection Master Edition:", collectionMasterEdition.toBase58());

    // Verify the collection
    const tx = await program.methods
      .verifyCollection()
      .accountsPartial({
        authority: wallet.publicKey,
        metadata: nftMetadata,
        mint: nftMint,
        mintAuthority,
        collectionMint,
        collectionMetadata,
        collectionMasterEdition,
        systemProgram: SystemProgram.programId,
        sysvarInstruction: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc({
        skipPreflight: true,
      });
    
    console.log("Collection verified successfully!");
    console.log("Transaction signature:", tx);

    console.log("✅ Collection verification successful");
  });

  it("Mint Multiple NFTs to Same Collection", async () => {
    console.log("\\n--- Minting Multiple NFTs to Same Collection ---");
    
    // Create multiple NFT keypairs
    const nft2Keypair = Keypair.generate();
    const nft3Keypair = Keypair.generate();

    const nfts = [
      { keypair: nft2Keypair, name: "Codigo DevQuest NFT #2", symbol: "CDN2" },
      { keypair: nft3Keypair, name: "Codigo DevQuest NFT #3", symbol: "CDN3" }
    ];

    for (const [index, nft] of nfts.entries()) {
      console.log(`\\nMinting NFT ${index + 2}:`);
      console.log("NFT Mint Key:", nft.keypair.publicKey.toBase58());

      const metadata = getMetadata(nft.keypair.publicKey);
      const masterEdition = getMasterEdition(nft.keypair.publicKey);
      const destination = getAssociatedTokenAddressSync(nft.keypair.publicKey, wallet.publicKey);

      const tx = await program.methods
        .mintNft(nft.name, nft.symbol, nftMetadata.uri)
        .accountsPartial({
          owner: wallet.publicKey,
          destination,
          metadata,
          masterEdition,
          mint: nft.keypair.publicKey,
          mintAuthority,
          collectionMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([nft.keypair])
        .rpc({
          skipPreflight: true,
        });

      console.log(`NFT ${index + 2} minted successfully! Tx:`, tx);

      // Verify the NFT account exists
      const nftAccount = await provider.connection.getAccountInfo(nft.keypair.publicKey);
      expect(nftAccount).to.not.be.null;
    }

    console.log("✅ Multiple NFT minting successful");
  });

  it("Program IDL and Structure Validation", () => {
    console.log("\\n--- Program Structure Validation ---");
    
    const idl = program.idl;
    const instructionNames = idl.instructions.map(ix => ix.name);
    
    // Validate all expected instructions exist
    expect(instructionNames).to.include("createCollection");
    expect(instructionNames).to.include("mintNft");
    expect(instructionNames).to.include("verifyCollection");
    
    console.log("Program instructions:", instructionNames);

    // Validate createCollection instruction parameters
    const createCollectionIx = program.idl.instructions.find(ix => ix.name === "createCollection");
    expect(createCollectionIx).to.not.be.undefined;
    const createCollectionArgs = createCollectionIx!.args;
    expect(createCollectionArgs.some(arg => arg.name === "name")).to.be.true;
    expect(createCollectionArgs.some(arg => arg.name === "symbol")).to.be.true;
    expect(createCollectionArgs.some(arg => arg.name === "uri")).to.be.true;

    // Validate mintNft instruction parameters
    const mintNftIx = program.idl.instructions.find(ix => ix.name === "mintNft");
    expect(mintNftIx).to.not.be.undefined;
    const mintNftArgs = mintNftIx!.args;
    expect(mintNftArgs.some(arg => arg.name === "name")).to.be.true;
    expect(mintNftArgs.some(arg => arg.name === "symbol")).to.be.true;
    expect(mintNftArgs.some(arg => arg.name === "uri")).to.be.true;

    // Validate verifyCollection instruction exists
    const verifyCollectionIx = program.idl.instructions.find(ix => ix.name === "verifyCollection");
    expect(verifyCollectionIx).to.not.be.undefined;

    console.log("✅ Program structure validation successful");
    console.log("✅ All instruction parameters correctly defined");
  });

  it("Account Balance and Token Supply Verification", async () => {
    console.log("\\n--- Account Balance and Supply Verification ---");

    // Check collection token supply (should be 1)
    const collectionSupply = await provider.connection.getTokenSupply(collectionMint);
    expect(collectionSupply.value.uiAmount).to.equal(1);
    console.log("Collection supply:", collectionSupply.value.uiAmount);

    // Check NFT token supply (should be 1)
    const nftSupply = await provider.connection.getTokenSupply(nftMint);
    expect(nftSupply.value.uiAmount).to.equal(1);
    console.log("NFT supply:", nftSupply.value.uiAmount);

    // Check that user owns the collection token
    const collectionTokenAccount = getAssociatedTokenAddressSync(collectionMint, wallet.publicKey);
    const collectionTokenBalance = await provider.connection.getTokenAccountBalance(collectionTokenAccount);
    expect(collectionTokenBalance.value.uiAmount).to.equal(1);
    console.log("User collection token balance:", collectionTokenBalance.value.uiAmount);

    // Check that user owns the NFT token
    const nftTokenAccount = getAssociatedTokenAddressSync(nftMint, wallet.publicKey);
    const nftTokenBalance = await provider.connection.getTokenAccountBalance(nftTokenAccount);
    expect(nftTokenBalance.value.uiAmount).to.equal(1);
    console.log("User NFT token balance:", nftTokenBalance.value.uiAmount);

    console.log("✅ All token balances and supplies verified correctly");
  });

  it("Update NFT Metadata", async () => {
    console.log("\n--- Testing Metadata Updates ---");
    
    // Derive the metadata account for the NFT
    const nftMetadata = getMetadata(nftMint);
    console.log("NFT Metadata Account:", nftMetadata.toBase58());

    // Update the NFT metadata with new name and URI
    const updatedName = "Updated Codigo DevQuest NFT #1";
    const updatedUri = "https://updated-uri.example.com/nft.json";

    const tx = await program.methods
      .updateMetadata(updatedName, null, updatedUri)
      .accountsPartial({
        metadata: nftMetadata,
        mint: nftMint,
        mintAuthority,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc({
        skipPreflight: true,
      });
    
    console.log("Metadata updated successfully!");
    console.log("Transaction signature:", tx);

    // Verify metadata account still exists
    const metadataAccount = await provider.connection.getAccountInfo(nftMetadata);
    expect(metadataAccount).to.not.be.null;
    expect(metadataAccount!.owner.toString()).to.equal(TOKEN_METADATA_PROGRAM_ID.toString());

    console.log("✅ Metadata update verification successful");
  });

  it("Create Programmable NFT", async () => {
    console.log("\n--- Testing Programmable NFT Creation ---");
    
    // Generate keypair for programmable NFT
    const programmableNftKeypair = Keypair.generate();
    const programmableNftMint = programmableNftKeypair.publicKey;
    console.log("Programmable NFT Mint Key:", programmableNftMint.toBase58());

    // Derive PDAs for metadata and master edition
    const metadata = getMetadata(programmableNftMint);
    const masterEdition = getMasterEdition(programmableNftMint);
    const destination = getAssociatedTokenAddressSync(programmableNftMint, wallet.publicKey);

    // Create the programmable NFT
    const creators = [wallet.publicKey]; // Add wallet as creator
    const tx = await program.methods
      .createProgrammableNft(
        "Programmable NFT #1",
        "PNFT",
        "https://example.com/programmable-nft.json",
        500, // 5% royalties
        creators
      )
      .accountsPartial({
        owner: wallet.publicKey,
        mint: programmableNftMint,
        destination,
        metadata,
        masterEdition,
        mintAuthority,
        collectionMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([programmableNftKeypair])
      .rpc({
        skipPreflight: true,
      });
    
    console.log("Programmable NFT created successfully!");
    console.log("Transaction signature:", tx);

    // Verify NFT was created
    const nftAccount = await provider.connection.getAccountInfo(programmableNftMint);
    expect(nftAccount).to.not.be.null;
    expect(nftAccount!.owner.toString()).to.equal(TOKEN_PROGRAM_ID.toString());

    const metadataAccount = await provider.connection.getAccountInfo(metadata);
    expect(metadataAccount).to.not.be.null;
    expect(metadataAccount!.owner.toString()).to.equal(TOKEN_METADATA_PROGRAM_ID.toString());

    console.log("✅ Programmable NFT creation successful");
  });

  it("Create Utility NFT", async () => {
    console.log("\n--- Testing Utility NFT Creation ---");
    
    // Generate keypair for utility NFT
    const utilityNftKeypair = Keypair.generate();
    const utilityNftMint = utilityNftKeypair.publicKey;
    console.log("Utility NFT Mint Key:", utilityNftMint.toBase58());

    // Derive PDAs for metadata and master edition
    const metadata = getMetadata(utilityNftMint);
    const masterEdition = getMasterEdition(utilityNftMint);
    const destination = getAssociatedTokenAddressSync(utilityNftMint, wallet.publicKey);

    // Create the utility NFT with usage tracking
    const tx = await program.methods
      .createUtilityNft(
        "Utility NFT #1",
        "UNFT",
        "https://example.com/utility-nft.json",
        1, // UseMethod::Multiple (enum value 1)
        new BN(10), // remaining uses
        new BN(10)  // total uses
      )
      .accountsPartial({
        owner: wallet.publicKey,
        mint: utilityNftMint,
        destination,
        metadata,
        masterEdition,
        mintAuthority,
        collectionMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([utilityNftKeypair])
      .rpc({
        skipPreflight: true,
      });
    
    console.log("Utility NFT created successfully!");
    console.log("Transaction signature:", tx);

    // Verify NFT was created
    const nftAccount = await provider.connection.getAccountInfo(utilityNftMint);
    expect(nftAccount).to.not.be.null;
    expect(nftAccount!.owner.toString()).to.equal(TOKEN_PROGRAM_ID.toString());

    const metadataAccount = await provider.connection.getAccountInfo(metadata);
    expect(metadataAccount).to.not.be.null;
    expect(metadataAccount!.owner.toString()).to.equal(TOKEN_METADATA_PROGRAM_ID.toString());

    console.log("✅ Utility NFT creation successful");
  });

  it("Extended IDL Validation for New Features", () => {
    console.log("\n--- Extended Program Structure Validation ---");
    
    const idl = program.idl;
    const instructionNames = idl.instructions.map(ix => ix.name);
    
    // Validate all new instructions exist
    const expectedInstructions = [
      "createCollection",
      "mintNft",
      "verifyCollection", 
      "updateMetadata",
      "createAssetWithRoyalties",
      "createAssetWithTransferDelegate",
      "addBurnDelegatePlugin",
      "removePlugin",
      "updateRoyaltiesPlugin",
      "createProgrammableNft",
      "createUtilityNft"
    ];
    
    for (const expectedIx of expectedInstructions) {
      expect(instructionNames).to.include(expectedIx);
      console.log(`✅ Found instruction: ${expectedIx}`);
    }

    // Validate updateMetadata instruction parameters
    const updateMetadataIx = program.idl.instructions.find(ix => ix.name === "updateMetadata");
    expect(updateMetadataIx).to.not.be.undefined;
    const updateMetadataArgs = updateMetadataIx!.args;
    expect(updateMetadataArgs.some(arg => arg.name === "name")).to.be.true;
    expect(updateMetadataArgs.some(arg => arg.name === "symbol")).to.be.true;
    expect(updateMetadataArgs.some(arg => arg.name === "uri")).to.be.true;

    // Validate createProgrammableNft instruction parameters
    const createProgrammableNftIx = program.idl.instructions.find(ix => ix.name === "createProgrammableNft");
    expect(createProgrammableNftIx).to.not.be.undefined;
    const createProgrammableNftArgs = createProgrammableNftIx!.args;
    expect(createProgrammableNftArgs.some(arg => arg.name === "creators")).to.be.true;
    expect(createProgrammableNftArgs.some(arg => arg.name === "sellerFeeBasisPoints")).to.be.true;

    // Validate createUtilityNft instruction parameters
    const createUtilityNftIx = program.idl.instructions.find(ix => ix.name === "createUtilityNft");
    expect(createUtilityNftIx).to.not.be.undefined;
    const createUtilityNftArgs = createUtilityNftIx!.args;
    expect(createUtilityNftArgs.some(arg => arg.name === "useMethod")).to.be.true;
    expect(createUtilityNftArgs.some(arg => arg.name === "remainingUses")).to.be.true;
    expect(createUtilityNftArgs.some(arg => arg.name === "totalUses")).to.be.true;

    console.log("✅ Extended program structure validation successful");
    console.log(`✅ All ${expectedInstructions.length} instructions correctly defined`);
  });

  it("Comprehensive Feature Integration Test", async () => {
    console.log("\n--- Testing Full Feature Integration ---");
    
    // This test demonstrates that all features work together
    // Create a new collection specifically for integration testing
    const integrationCollectionKeypair = Keypair.generate();
    const integrationCollectionMint = integrationCollectionKeypair.publicKey;
    
    console.log("Integration Collection Mint:", integrationCollectionMint.toBase58());

    // 1. Create integration collection
    const collectionMetadata = getMetadata(integrationCollectionMint);
    const collectionMasterEdition = getMasterEdition(integrationCollectionMint);
    const collectionDestination = getAssociatedTokenAddressSync(integrationCollectionMint, wallet.publicKey);

    const createCollectionTx = await program.methods
      .createCollection("Integration Collection", "INTC", "https://example.com/integration-collection.json")
      .accountsPartial({
        user: wallet.publicKey,
        mint: integrationCollectionMint,
        mintAuthority,
        metadata: collectionMetadata,
        masterEdition: collectionMasterEdition,
        destination: collectionDestination,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([integrationCollectionKeypair])
      .rpc({ skipPreflight: true });

    console.log("✅ Integration collection created:", createCollectionTx);

    // 2. Create multiple NFTs with different features
    const integrationNftKeypair = Keypair.generate();
    const integrationNftMint = integrationNftKeypair.publicKey;

    const nftMetadata = getMetadata(integrationNftMint);
    const nftMasterEdition = getMasterEdition(integrationNftMint);
    const nftDestination = getAssociatedTokenAddressSync(integrationNftMint, wallet.publicKey);

    // Create a programmable NFT in the integration collection
    const createNftTx = await program.methods
      .createProgrammableNft(
        "Integration NFT #1",
        "INFT",
        "https://example.com/integration-nft.json",
        250, // 2.5% royalties
        [wallet.publicKey]
      )
      .accountsPartial({
        owner: wallet.publicKey,
        mint: integrationNftMint,
        destination: nftDestination,
        metadata: nftMetadata,
        masterEdition: nftMasterEdition,
        mintAuthority,
        collectionMint: integrationCollectionMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([integrationNftKeypair])
      .rpc({ skipPreflight: true });

    console.log("✅ Integration NFT created:", createNftTx);

    // 3. Update the NFT metadata
    const updateTx = await program.methods
      .updateMetadata("Updated Integration NFT #1", null, "https://updated.example.com/integration-nft.json")
      .accountsPartial({
        metadata: nftMetadata,
        mint: integrationNftMint,
        mintAuthority,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc({ skipPreflight: true });

    console.log("✅ Integration NFT metadata updated:", updateTx);

    // Verify all accounts exist and are properly configured
    const collectionAccount = await provider.connection.getAccountInfo(integrationCollectionMint);
    const nftAccount = await provider.connection.getAccountInfo(integrationNftMint);
    const collectionMetadataAccount = await provider.connection.getAccountInfo(collectionMetadata);
    const nftMetadataAccount = await provider.connection.getAccountInfo(nftMetadata);

    expect(collectionAccount).to.not.be.null;
    expect(nftAccount).to.not.be.null;
    expect(collectionMetadataAccount).to.not.be.null;
    expect(nftMetadataAccount).to.not.be.null;

    // Verify token supplies
    const collectionSupply = await provider.connection.getTokenSupply(integrationCollectionMint);
    const nftSupply = await provider.connection.getTokenSupply(integrationNftMint);
    expect(collectionSupply.value.uiAmount).to.equal(1);
    expect(nftSupply.value.uiAmount).to.equal(1);

    console.log("✅ Comprehensive feature integration test successful");
    console.log("✅ All features working together correctly");
  });
});
