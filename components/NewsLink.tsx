"use client";

import posthog from "posthog-js";

interface NewsItem {
  link: string;
  title: string;
  source?: string | null;
  date?: string | null;
}

export default function NewsLink({ item, city, wardId }: { item: NewsItem; city: string; wardId: string }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-md border bg-card p-3 text-sm hover:bg-accent hover:border-foreground/20 transition-[background-color,border-color] duration-200"
      onClick={() =>
        posthog.capture("news_link_clicked", {
          city,
          ward_id: wardId,
          source: item.source ?? null,
          url: item.link,
        })
      }
    >
      <p className="font-medium leading-snug">{item.title}</p>
      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
        {item.source ? <span>{item.source}</span> : null}
        {item.date ? (
          <span>
            {" · "}
            {new Date(item.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ) : null}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity duration-200"
        >
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      </p>
    </a>
  );
}
