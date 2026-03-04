"use client";

import dynamic from "next/dynamic";
import type { Props } from "@cp949/react-wordcloud";
import { Skeleton } from "@/components/ui/skeleton";

const ReactWordcloud = dynamic(
  () => import("@cp949/react-wordcloud").then((mod) => mod.default),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> },
);

const STOP_WORDS = new Set([
  // English
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "this", "that", "was", "are",
  "be", "has", "have", "had", "not", "they", "we", "you", "he", "she",
  "i", "my", "me", "do", "so", "if", "no", "up", "out", "just", "like",
  "its", "your", "can", "will", "would", "could", "should", "about",
  "been", "were", "what", "when", "who", "how", "all", "each", "which",
  "their", "there", "them", "then", "than", "these", "those", "into",
  "some", "her", "him", "his", "our", "more", "very", "also", "does",
  "did", "one", "two", "get", "got", "don't", "dont", "im", "i'm",
  "really", "much", "still", "too", "way", "know", "make", "think",
  // French
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "est", "en",
  "que", "qui", "dans", "ce", "il", "ne", "sur", "pas", "plus", "par",
  "je", "se", "son", "sa", "ses", "au", "aux", "avec", "tout", "mais",
  "cette", "pour", "sont", "une", "nous", "vous", "ils", "elle", "elles",
  "mon", "ton", "nos", "vos", "leur", "leurs", "cest", "jai", "quel",
  "quelle", "quelles", "quels", "tres", "bien", "fait", "comme", "moi",
  "toi", "lui", "soi", "aussi", "ici", "voir", "peut", "dit", "fait",
  // Spanish
  "el", "los", "las", "del", "por", "con", "una", "para", "como",
  "pero", "sus", "mas", "ese", "eso", "esa", "esto", "esta", "estos",
  "estas", "ese", "esos", "esas", "muy", "sin", "sobre", "entre",
  "hay", "tiene", "fue", "ser", "era", "han", "sido", "tiene", "todo",
  "cuando", "desde", "donde", "puede", "porque", "cada", "otro", "otra",
]);

function tokenize(texts: string[]): Array<{ text: string; value: number }> {
  const wordCounts = new Map<string, number>();

  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }

  return Array.from(wordCounts.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 80);
}

const options: Props["options"] = {
  fontSizes: [14, 56],
  rotations: 0,
  rotationAngles: [0, 0],
  padding: 3,
  deterministic: true,
  fontFamily: "var(--font-geist-sans)",
};

interface WordCloudProps {
  texts: string[];
}

export function WordCloud({ texts }: WordCloudProps) {
  const words = tokenize(texts);

  if (words.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No word data available.
      </p>
    );
  }

  return (
    <div className="h-[250px] w-full sm:h-[300px]">
      <ReactWordcloud words={words} options={options} />
    </div>
  );
}
