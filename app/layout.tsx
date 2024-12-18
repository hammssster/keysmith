import { AppProvider } from '@/components/app-provider';
import { Theme } from '@radix-ui/themes';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@radix-ui/themes/styles.css';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Solana Keysmith',
	description: 'A simple Solana keypair generator',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Theme>
					<AppProvider>{children}</AppProvider>
				</Theme>
			</body>
		</html>
	);
}
