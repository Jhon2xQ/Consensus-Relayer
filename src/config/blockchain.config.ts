import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism, optimismSepolia } from "viem/chains";
import { env } from "./env";

const getChain = () => {
  // Development/Testnet: Optimism Sepolia
  if (env.NODE_ENV === "development") {
    return optimismSepolia;
  }

  // Production: Optimism Mainnet
  return optimism;
};

export const chain = getChain();
export const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

export const publicClient = createPublicClient({
  chain,
  transport: http(env.RPC_URL),
});

export const walletClient = createWalletClient({
  account,
  chain,
  transport: http(env.RPC_URL),
});
