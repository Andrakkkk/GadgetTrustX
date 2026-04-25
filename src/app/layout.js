import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';

export const metadata = {
  title: 'GadgetTrustX | Smart Device Marketplace',
  description: 'AI-Powered electronics marketplace with verified devices.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-200 min-h-screen">
        <AuthProvider>
          <Navbar />
          <main>
            {children}
          </main>
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
