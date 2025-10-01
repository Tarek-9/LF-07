import type {Metadata} from "next";
import React from "react";
import './globals.css';
import {Geist, Geist_Mono} from "next/font/google";
import Navigation from "@/components/molecules/Navigation/Navigation";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Lernfeld 7",
    description: "Lernfeld 7: Cyber-Physische Systeme ergänzen",
};

const RootLayout = ({children}: Readonly<{ children: React.ReactNode }>): React.ReactElement => {
    return (
        <html lang="de">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased px-8`}
        >
        <Navigation/>
        {children}
        </body>
        </html>
    );
}

export default RootLayout
