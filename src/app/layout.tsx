import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LikedMealsProvider } from "@/contexts/LikedMealsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maistas365 - AI-Powered Meal Prep Made Simple",
  description: "Transform your meal planning with AI. Get personalized recipes, real product recommendations, and create the perfect meal prep routine tailored just for you.",
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
        <LikedMealsProvider>
          {children}
        </LikedMealsProvider>
      </body>
    </html>
  );
}
