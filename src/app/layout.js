import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import CustomAlertContainer from '@/components/CustomAlert';
import RouteMotion from '@/components/RouteMotion';
export const metadata = {
  title: 'GadgetTrustX | Smart Device Marketplace',
  description: 'AI-Powered electronics marketplace with verified devices.',
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
      <body className="bg-slate-900 text-slate-200 min-h-screen">
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
      </body>
    </html>
  );
}
