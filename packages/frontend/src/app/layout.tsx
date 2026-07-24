import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	applicationName: "Syncro",
	title: {
		default: "Syncro - Listen Together",
		template: "%s | Syncro",
	},
	description:
		"Create a shared music room, queue YouTube songs with friends, and stay synced in real time.",
	keywords: [
		"Syncro",
		"shared music room",
		"YouTube music player",
		"group listening",
		"listen together",
	],
	creator: "Syncro",
	publisher: "Syncro",
	openGraph: {
		title: "Syncro - Listen Together",
		description:
			"Create a shared music room, queue YouTube songs with friends, and stay synced in real time.",
		siteName: "Syncro",
		type: "website",
	},
	twitter: {
		card: "summary",
		title: "Syncro - Listen Together",
		description:
			"Create a shared music room, queue YouTube songs with friends, and stay synced in real time.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
