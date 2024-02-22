"use client";

import "./globals.css";
import AsyncLayoutDynamic from "@/containers/async-layout-dynamic";
import "reflect-metadata";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Starter Kit</title>
        <meta property="og:title" content="Starter Kit" key="title" />
        <link rel="shortcut icon" type="image/x-icon" href={"/favicon.ico"} />
      </head>
      <body className="font-mono">
        <AsyncLayoutDynamic>{children}</AsyncLayoutDynamic>
      </body>
    </html>
  );
}
