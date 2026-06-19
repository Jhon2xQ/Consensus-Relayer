import { createPublicClient, createWalletClient, fallback, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism, optimismSepolia } from "viem/chains";
import { env } from "./env.config";

const getChain = () => {
  if (env.NODE_ENV === "development") {
    return optimismSepolia;
  }
  return optimism;
};

export const chain = getChain();
export const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

// viem fallback transport: if the primary RPC fails, retry on the fallback URL.
// Default fallback to the public Optimism Sepolia endpoint. Avoids adding the
// same URL twice (would cause pointless self-failover loops).
const FALLBACK_RPC_URL_DEFAULT = "https://sepolia.optimism.io";
const fallbackUrl = env.FALLBACK_RPC_URL ?? FALLBACK_RPC_URL_DEFAULT;
const transports = [http(env.RPC_URL)];
if (fallbackUrl !== env.RPC_URL) {
  transports.push(http(fallbackUrl));
}

export const publicClient = createPublicClient({
  chain,
  transport: fallback(transports, { rank: false }),
});

export const walletClient = createWalletClient({
  account,
  chain,
  transport: fallback(transports, { rank: false }),
});
