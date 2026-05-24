'use client';

import Link from 'next/link';

const footerGroups = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Cari gadget', href: '/marketplace' },
      { label: 'Smart matching', href: '/smart-matching' },
      { label: 'Trade-in', href: '/trade-in' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'AI valuation', href: '/price-checker' },
      { label: 'IMEI verification', href: '/verification' },
      { label: 'Seller profile', href: '/seller-profile' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Masuk', href: '/login' },
      { label: 'Daftar', href: '/register' },
      { label: 'Keranjang', href: '/cart' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(260px,1.15fr)_minmax(0,1fr)]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center text-2xl font-black tracking-tight text-white">
              Gadget<span className="text-blue-400">TrustX</span>
            </Link>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Marketplace gadget baru dan preloved dengan katalog seller, verifikasi perangkat, serta tools pendukung yang membantu Anda berbelanja lebih yakin.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-200">System operational</span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-bold uppercase text-slate-500">{group.title}</h3>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-slate-300 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) 2026 GadgetTrustX. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="transition-colors hover:text-slate-300">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-slate-300">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-slate-300">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
