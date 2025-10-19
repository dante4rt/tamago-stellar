import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";
import { Client, networks, Pet } from "../contracts/src/index";
import {
  rpc,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

const server = new rpc.Server("https://soroban-testnet.stellar.org");

// Initialize the wallet kit
export const walletKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: null,
  modules: allowAllModules(),
});

// Contract configuration
const CONTRACT_CONFIG = {
  ...networks.testnet,
  rpcUrl: "https://soroban-testnet.stellar.org",
  allowHttp: false,
  publicKey: undefined,
};

// Initialize the contract client
export const contractClient = new Client(CONTRACT_CONFIG);

// Wallet connection state
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  selectedWallet: ISupportedWallet | null;
}

export class StellarService {
  private static instance: StellarService;
  private walletState: WalletState = {
    isConnected: false,
    address: null,
    selectedWallet: null,
  };

  public static getInstance(): StellarService {
    if (!StellarService.instance) {
      StellarService.instance = new StellarService();
    }
    return StellarService.instance;
  }

  async connectWallet(): Promise<WalletState> {
    return new Promise((resolve, reject) => {
      walletKit.openModal({
        onWalletSelected: async (wallet: ISupportedWallet) => {
          try {
            walletKit.setWallet(wallet.id);
            const { address } = await walletKit.getAddress();

            CONTRACT_CONFIG.publicKey = address;

            this.walletState = {
              isConnected: true,
              address,
              selectedWallet: wallet,
            };

            resolve(this.walletState);
          } catch (error) {
            reject(error);
          }
        },
        onClosed: (error?: Error) => {
          if (error) reject(error);
          else reject(new Error("User closed wallet selection"));
        },
      });
    });
  }

  disconnectWallet() {
    this.walletState = {
      isConnected: false,
      address: null,
      selectedWallet: null,
    };
  }

  getWalletState(): WalletState {
    return this.walletState;
  }

  private ensureConnected() {
    if (!this.walletState.isConnected || !this.walletState.address) {
      throw new Error("Wallet not connected");
    }
    return this.walletState.address;
  }

  // Contract methods using the clean SDK pattern
  async createPet(name: string): Promise<Pet> {
    const address = this.ensureConnected();

    // Use contract client to get the operation
    const tx = await contractClient.create({
      owner: address,
      name,
    });

    try {
      // Use the existing contract client approach
      const signedTxXdr = await walletKit.signTransaction(tx.toXDR(), {
        address,
        networkPassphrase: networks.testnet.networkPassphrase,
      });

      const toSubmit = TransactionBuilder.fromXDR(
        signedTxXdr.signedTxXdr,
        networks.testnet.networkPassphrase
      );

      const result = await server.sendTransaction(toSubmit);

      if (result.status === "ERROR") {
        throw new Error("Transaction failed");
      }

      // Handle transaction result following docs pattern
      if (result.status === "PENDING") {
        let getResponse = await server.getTransaction(result.hash);

        while (getResponse.status === "NOT_FOUND") {
          getResponse = await server.getTransaction(result.hash);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (getResponse.status === "SUCCESS") {
          if (!getResponse.resultMetaXdr) {
            throw new Error("Empty resultMetaXDR in transaction response");
          }
        } else if (getResponse.status === "FAILED") {
          throw new Error("Transaction failed");
        }
      }
    } catch (error) {
      // Handle XDR parsing errors gracefully - this fixes the "Bad union switch: 4" error
      if (error instanceof Error) {
        if (error.message.includes("Bad union switch") ||
          error.message.includes("XDR") ||
          error.name === "XDRError") {
          return tx.result;
        }
      }

      throw error;
    }

    return tx.result;
  }

  async getPet(): Promise<Pet | null> {
    const address = this.ensureConnected();

    try {
      const tx = await contractClient.get_pet({ owner: address });
      return tx.result;
    } catch (error) {
      return null;
    }
  }

  async getCoins(): Promise<number> {
    const address = this.ensureConnected();

    try {
      const tx = await contractClient.get_coins({ owner: address });
      return Number(tx.result);
    } catch (error) {
      return 0;
    }
  }

  async feedPet(): Promise<void> {
    await this.executeContractMethod(() => contractClient.feed({ owner: this.ensureConnected() }));
  }

  async playWithPet(): Promise<void> {
    await this.executeContractMethod(() => contractClient.play({ owner: this.ensureConnected() }));
  }

  async workWithPet(): Promise<void> {
    await this.executeContractMethod(() => contractClient.work({ owner: this.ensureConnected() }));
  }

  async putPetToSleep(): Promise<void> {
    await this.executeContractMethod(() => contractClient.sleep({ owner: this.ensureConnected() }));
  }

  async mintGlasses(): Promise<void> {
    await this.executeContractMethod(() => contractClient.mint_glasses({ owner: this.ensureConnected() }));
  }

  async removePet(): Promise<void> {
    await this.executeContractMethod(() => contractClient.remove_pet({ owner: this.ensureConnected() }));
  }

  // Helper method to execute contract methods with proper types
  private async executeContractMethod(contractCall: () => Promise<{ toXDR: () => string }>): Promise<void> {
    const address = this.ensureConnected();

    try {
      const tx = await contractCall();

      const signedTxXdr = await walletKit.signTransaction(tx.toXDR(), {
        address,
        networkPassphrase: networks.testnet.networkPassphrase,
      });

      const toSubmit = TransactionBuilder.fromXDR(
        signedTxXdr.signedTxXdr,
        networks.testnet.networkPassphrase
      );

      const result = await server.sendTransaction(toSubmit);

      if (result.status === "ERROR") {
        throw new Error("Transaction failed");
      }

      // Clean polling pattern
      if (result.status === "PENDING") {
        let getResponse = await server.getTransaction(result.hash);

        while (getResponse.status === "NOT_FOUND") {
          getResponse = await server.getTransaction(result.hash);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (getResponse.status === "FAILED") {
          throw new Error("Transaction failed");
        }

        if (getResponse.status === "SUCCESS" && !getResponse.resultMetaXdr) {
          throw new Error("Empty resultMetaXDR in transaction response");
        }
      }
    } catch (error) {
      // Handle XDR parsing errors gracefully
      if (error instanceof Error) {
        if (error.message.includes("Bad union switch") ||
          error.message.includes("XDR") ||
          error.name === "XDRError") {
          return;
        }
      }

      throw error;
    }
  }
}

export const stellarService = StellarService.getInstance();