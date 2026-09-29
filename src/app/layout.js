import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import CustomAlertContainer from '@/components/CustomAlert';
import RouteMotion from '@/components/RouteMotion';
export const metadata = {
  title: 'GadgetTrustX — Marketplace Gadget Terpercaya Indonesia',
  description: 'Beli & jual smartphone, laptop, dan gadget bekas berkualitas dari seller terverifikasi. Dilengkapi AI valuation, cek IMEI, dan proteksi pembeli.',
  keywords: 'marketplace gadget, jual beli hp bekas, smartphone second, gadget terpercaya, imei checker',
  openGraph: {
    title: 'GadgetTrustX — Marketplace Gadget Terpercaya',
    description: 'Belanja gadget lebih aman dengan seller terverifikasi dan teknologi AI.',
    type: 'website',
  },
  icons: {
    icon: '/images/gadgettrustx_logo_1777378546198.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/images/gadgettrustx_logo_1777378546198.jpg?v=3" />
      </head>
      <body className="min-h-screen bg-[#020817] text-slate-100">
        <ToastProvider>
          <AuthProvider>
            <CustomAlertContainer />
            <Navbar />
            <main>
              <RouteMotion>
                {children}
              </RouteMotion>
            </main>
            <ChatWidget />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
