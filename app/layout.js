import "./globals.css";

export const metadata = {
  title: "The Chess Club",
  description: "Think ahead. Play better.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
