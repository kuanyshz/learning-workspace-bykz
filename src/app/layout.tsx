import { type Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Learning Workspace',
  description: 'Modern learning platform with native code editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-white">
        {children}
      </body>
    </html>
  );
}
