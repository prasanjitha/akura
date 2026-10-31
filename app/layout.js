import './globals.css';
export const metadata = {
  title: 'Akuru — Sinhala Unicode to Legacy',
  description: 'Convert Sinhala Unicode to DL-Manel legacy text instantly and copy it in one click.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }) {
  return <html lang="si"><body>{children}</body></html>;
}
