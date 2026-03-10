import { Toaster } from 'sonner';
import './globals.css';

export const metadata = {
  title: 'MeetFlow - Video Calling App',
  description: 'Professional video calling application with real-time communication',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: 'rgba(22, 33, 62, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}