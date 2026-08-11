// POST /api/trace — streaming NDJSON endpoint for cross-chain wallet tracing.
//
// Request body: { address: "0x..." }
// Response: newline-delimited JSON stream of ChainProgress | TraceResult objects.
//
// Each line is a self-contained JSON object. The client parses line-by-line as
// they arrive. The final object has a `jobId` field and represents completion.

import { traceAddress } from "@/lib/tracer";
import type { Address } from "@/lib/adapters/types";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // 60s max for the full 6-chain trace

export async function POST(req: NextRequest) {
  let address: Address;

  try {
    const body = await req.json();
    address = body.address?.toLowerCase();

    if (!address || !/^0x[0-9a-f]{40}$/.test(address)) {
      return new Response(
        JSON.stringify({ error: "Invalid address format" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Create a readable stream from the async generator
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of traceAddress(address)) {
          // Emit each event as a line of JSON
          const line = JSON.stringify(event) + "\n";
          controller.enqueue(encoder.encode(line));
        }
        controller.close();
      } catch (error) {
        const errorLine = JSON.stringify({
          error: (error as Error).message,
        }) + "\n";
        controller.enqueue(encoder.encode(errorLine));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-cache",
      "x-accel-buffering": "no", // Disable nginx buffering
    },
  });
}
