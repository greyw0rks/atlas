import type { Metadata } from "next";
import Link from "next/link";
import { DOCS_URL } from "@/components/landing/content";

export const metadata: Metadata = {
  title: "Run your local dashboard",
  description: "Open Atlas's memory dashboard on your own machine.",
};

export default function LocalDashboard() {
  return (
    <div className="atl-root min-h-screen px-6 py-12 sm:py-20">
      <main className="mx-auto max-w-[68ch]">
        <Link href="/" className="atl-link">Back to Atlas</Link>

        <h1 className="atl-display mt-12 text-[clamp(2rem,5vw,3.4rem)]">
          Your dashboard runs locally.
        </h1>
        <p className="atl-lede mt-6">
          This website introduces Atlas. To browse your repositories, sessions,
          and memories, run the dashboard on the machine where you installed
          the Atlas MCP server.
        </p>

        <section className="mt-12" aria-labelledby="start-dashboard">
          <h2 id="start-dashboard" className="text-xl font-semibold">
            Start the dashboard
          </h2>
          <p className="mt-3 text-[#a4adbd] leading-relaxed">
            In your Atlas checkout, after completing installation:
          </p>
          <pre className="atl-terminal atl-mono mt-5 overflow-x-auto p-5 text-sm leading-7">
            <code>{"cd /path/to/atlas\nnpm run dev"}</code>
          </pre>
          <p className="mt-5 text-[#a4adbd] leading-relaxed">
            Open <a href="http://localhost:3000/workspace" className="atl-link">localhost:3000/workspace</a>.
            The dashboard and MCP server use the same local SQLite index.
            Keep your configured .env file in that checkout.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href={`${DOCS_URL}#installation`} className="atl-btn atl-btn-primary">
            Installation guide
          </Link>
          <Link href="/#install" className="atl-btn atl-btn-ghost">Install Atlas</Link>
        </div>
      </main>
    </div>
  );
}
