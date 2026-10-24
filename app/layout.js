import "./globals.css";

export const metadata = {
  title: "The Chess tools",
  description: "Focus on chess and Play better.",
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
