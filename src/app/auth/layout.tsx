import { AuthLayout } from "@/components/layout/authLayout";
import React from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthLayout>{children}</AuthLayout>;
}
