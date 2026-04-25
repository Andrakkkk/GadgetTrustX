import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-wide mb-6">
            The Future of Used Electronics
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
            Buy & Sell Gadgets with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Absolute Trust</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            AI-powered price checks, IMEI verification, transparent seller scores, and smart buyer matching. Welcome to GadgetTrustX.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/marketplace" className="btn-primary text-lg px-8 py-4">
              Explore Marketplace
            </Link>
            <Link href="/smart-matching" className="btn-secondary text-lg px-8 py-4 bg-slate-800/80 border border-slate-700">
              Find My Match
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass-panel p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Price Checker</h3>
              <p className="text-slate-400 mb-4">Never overpay or undersell. Our AI analyzes market data to suggest the fairest price based on RAM, Storage, and Condition.</p>
              <Link href="/price-checker" className="text-blue-400 font-medium hover:text-blue-300 flex items-center">Try it out <span className="ml-1">→</span></Link>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Verified Device Check</h3>
              <p className="text-slate-400 mb-4">Input an IMEI or Serial Number. We cross-reference global databases to ensure the device is authentic and not blacklisted.</p>
              <Link href="/verification" className="text-emerald-400 font-medium hover:text-emerald-300 flex items-center">Verify a device <span className="ml-1">→</span></Link>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Trade-In Ecosystem</h3>
              <p className="text-slate-400 mb-4">Negotiate securely and trade in your old devices. Transparent valuations directly applied to your next purchase.</p>
              <Link href="/trade-in" className="text-purple-400 font-medium hover:text-purple-300 flex items-center">Estimate value <span className="ml-1">→</span></Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
