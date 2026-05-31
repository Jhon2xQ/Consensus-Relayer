import { createPublicClient, createWalletClient, http } from "viem";
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

export const publicClient = createPublicClient({
  chain,
  transport: http(env.RPC_URL),
});

export const walletClient = createWalletClient({
  account,
  chain,
  transport: http(env.RPC_URL),
});
