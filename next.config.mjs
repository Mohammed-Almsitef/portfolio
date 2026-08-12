/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * lib/content.ts reads content/*.json from disk at runtime. Next only traces
   * files reachable through imports, so without this the JSON never ships with
   * the serverless functions and any dynamic route throws
   * `Singleton "site" not found` — while prerendered pages keep working,
   * because they were built when the files were present.
   */
  outputFileTracingIncludes: {
    '/**': ['./content/**/*'],
  },
}

export default nextConfig
