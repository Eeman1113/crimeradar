"use client";

import { useState } from "react";
import { Check, Copy, Download, MessageCircle, Send, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ShareCardProps {
  title: string;
  summary: string;
  url: string;
  prefersScreenshot?: boolean;
}

export default function ShareCard({
  title,
  summary,
  url,
  prefersScreenshot = false,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const message = `${title} — ${summary}`;
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(url);
  const encodedCombined = encodeURIComponent(`${message} ${url}`);

  const whatsappHref = `https://wa.me/?text=${encodedCombined}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
  const telegramHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;

  async function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // swallow — clipboard may be unavailable (insecure context, perms)
    }
  }

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Share"
    >
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground pr-1">
        <Share2 className="size-3.5" aria-hidden="true" />
        Share
      </span>

      <Button asChild variant="outline" size="sm" aria-label="Share on WhatsApp">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
      </Button>

      <Button asChild variant="outline" size="sm" aria-label="Share on X">
        <a href={twitterHref} target="_blank" rel="noopener noreferrer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>X</span>
        </a>
      </Button>

      <Button asChild variant="outline" size="sm" aria-label="Share on Telegram">
        <a href={telegramHref} target="_blank" rel="noopener noreferrer">
          <Send aria-hidden="true" />
          <span>Telegram</span>
        </a>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? "Link copied" : "Copy link"}
        aria-live="polite"
      >
        {copied ? (
          <>
            <Check aria-hidden="true" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy aria-hidden="true" />
            <span>Copy link</span>
          </>
        )}
      </Button>

      {prefersScreenshot ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-disabled="true"
          title="Coming soon"
          className="opacity-60 cursor-not-allowed"
        >
          <Download aria-hidden="true" />
          <span>Download as image</span>
          <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Soon
          </span>
        </Button>
      ) : null}
    </div>
  );
}
