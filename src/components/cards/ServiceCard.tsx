"use client";
import React from "react";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { useRouter } from "next/navigation";

export type ServiceType =
  | "air"
  | "sea"
  | "warehousing"
  | "custom"
  | "road"
  | "agro";

export default function ServiceCard({
  image,
  title,
  description,
  type,
  url,
}: {
  image: string;
  title: string;
  description: string;
  type: ServiceType;
  url: string;
}) {
  const bgColor: Record<ServiceType, string> = {
    air: "bg-blue-100 ",
    sea: "bg-[#F9E2CA]",
    warehousing: "bg-[#C7DCCD]",
    custom: "bg-[#C7EEF0]",
    road: "bg-[#F9C8E9]",
    agro: "bg-[#E1C8DD]",
  };

  const router = useRouter();
  return (
    <div
      onClick={() => router.push(url)}
      className="border-blue-100 bg-blue-50 border-2 rounded-2xl p-5 flex flex-col gap-5 flex-1"
    >
      <div
        className={cn(
          " w-20 h-20 rounded-xl justify-center items-center flex ",
          bgColor[type],
        )}
      >
        <Image src={image} width={37.89} height={37.89} alt="service icon" />
      </div>

      <div className="gap-2 mt-4 flex flex-col w-10/12">
        <h5>{title}</h5>
        <p className="font-normal text-base text-gray-900">{description}</p>
      </div>
    </div>
  );
}
