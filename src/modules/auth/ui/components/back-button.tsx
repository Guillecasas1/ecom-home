"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UrlObject } from "node:url";

interface BackButtonProps {
  href: UrlObject;
  label: string;
}

export const BackButton = ({ href, label }: BackButtonProps) => {
  return (
    <Button variant="link" className="w-full font-normal" size="sm" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
};
