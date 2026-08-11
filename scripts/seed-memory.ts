/**
 * Seed the memory layer with 40 real cross-chain addresses
 * Run: tsx scripts/seed-memory.ts
 */

import { traceAddress } from '../lib/tracer';

// 40 diverse cross-chain addresses for seeding
// Mix of: bridge users, DeFi protocols, known multi-chain actors, treasury addresses
const SEED_ADDRESSES = [
  // Known bridge users & multi-chain protocols
  '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf', // Polygon ERC20 bridge
  '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30', // Loopring L2
  '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65', // Biconomy relayer
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC (Circle) - multi-chain
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT (Tether) - multi-chain
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI (MakerDAO) - multi-chain
  '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router
  '0x881D40237659C251811CEC9c364ef91dC08D300C', // Metamask Swap Router
  '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', // 0x Exchange Proxy
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Universal Router

  // Treasury & DAO addresses (likely multi-chain)
  '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f', // Compound Timelock
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Aave Ecosystem Reserve
  '0x5f65f7b609678448494De4C87521CdF6cEf1e932', // Compound Grants
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // Sushi multi-sig
  '0x5a98FcBEA516Cf06857215779Fd812CA3beF1B32', // Lido treasury

  // Known cross-chain traders (high volume)
  '0x8EB8a3b98659Cce290402893d0123abb75E3ab28', // Avalanche Bridge
  '0x2796317b0fF8538F253012862c06787Adfb8cEb6', // Across Protocol relayer
  '0x9008D19f58AAbD9eD0D60971565AA8510560ab41', // Cowswap settlement
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3 Router 2
  '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router 1

  // Bridge contracts (source of counterparty data)
  '0x4Dae2f939ACf50408e13d58534Ff8c2776d45265', // Stargate Router
  '0x1116898DdA4015eD8dDefb84b6e8Bc24528Af2d8', // Synapse Bridge
  '0x6Ab6d61428fde76768D7b45D8BFeec19c6eF91A8', // Anyswap Router V6
  '0x88DCDC47D2f83a99CF0000FDF667A468bB958a78', // Multichain Router V6
  '0xd0660cD418a64a1d44E9214ad8e459324D8157f1', // Wormhole Token Bridge
  '0x3ee18B2214AFF97000D974cf647E7C347E8fa585', // Wormhole Core Bridge

  // CEX deposit addresses (known multi-chain)
  '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance 14
  '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 15
  '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Binance 16
  '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F', // Binance 17
  '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976', // Binance 18

  // NFT bridges & marketplaces (cross-chain activity)
  '0x00000000000001ad428e4906aE43D8F9852d0dD6', // OpenSea Seaport
  '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b', // OpenSea Registry
  '0x7f268357A8c2552623316e2562D90e642bB538E5', // OpenSea Wyvern Exchange

  // Additional DeFi protocols
  '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // Compound cTokens
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH (widely bridged)
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC (widely bridged)
  '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK (widely bridged)
  '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // MKR (bridged to L2s)
];

async function seedMemory() {
  console.log(`Starting seed run: ${SEED_ADDRESSES.length} addresses\n`);

  let completed = 0;
  let failed = 0;

  for (const address of SEED_ADDRESSES) {
    try {
      console.log(`[${completed + failed + 1}/${SEED_ADDRESSES.length}] Tracing ${address}...`);

      // traceAddress is an async generator - consume all progress updates
      let result;
      for await (const update of traceAddress(address as `0x${string}`)) {
        // The final yield is the TraceResult (has totalTransfers field)
        if ('totalTransfers' in update) {
          result = update;
        }
      }

      if (result) {
        console.log(`  ✓ ${result.totalTransfers} transfers, ${result.bridgeHops.length} hops`);
        completed++;
      } else {
        console.error(`  ✗ Failed: No result yielded`);
        failed++;
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }

    // Brief pause to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\nSeed run complete: ${completed} succeeded, ${failed} failed`);
}

seedMemory().catch(console.error);
