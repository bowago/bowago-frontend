"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, Home, LifeBuoy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/bowago-logo.svg"
            alt="BowaGO"
            width={120}
            height={48}
            priority
          />
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-brand" />
          </div>

          <p className="text-6xl font-bold font-display text-gray-800 tracking-tight">
            404
          </p>
          <h1 className="text-lg font-semibold text-gray-800 mt-3">
            This shipment took a wrong turn
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            The page you&apos;re looking for doesn&apos;t exist, may have moved,
            or the link is out of date.
          </p>

          <div className="flex flex-col gap-3 mt-8">
            <Link
              href="/dashboard"
              className="w-full bg-brand text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <Link
              href="/dashboard/tickets?new=1"
              className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <LifeBuoy className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
