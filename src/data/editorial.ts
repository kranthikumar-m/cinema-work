export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: "news" | "review" | "interview" | "feature";
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
}

export const articles: Article[] = [
  {
    id: "1",
    title: "Tollywood Box Office Report: Telugu Cinema Dominates 2025",
    excerpt: "Telugu cinema continues its incredible run with record-breaking collections across India.",
    content: "The Telugu film industry has been on an unprecedented winning streak. From high-budget spectacles to heartfelt family dramas, Tollywood continues to push boundaries in storytelling and production value, cementing its position as a major force in Indian cinema.",
    category: "news",
    image: "/placeholder-article.svg",
    author: "Ravi Kumar",
    date: "2025-03-10",
    readTime: "5 min",
    tags: ["tollywood", "box-office", "telugu"],
  },
  {
    id: "2",
    title: "Most Anticipated Indian Films This Season",
    excerpt: "From Telugu blockbusters to Bollywood dramas, here are the movies everyone is waiting for.",
    content: "This season brings an exciting lineup of films across all Indian languages. With star-studded casts and visionary directors, the upcoming releases promise to deliver unforgettable cinematic experiences for audiences across the country.",
    category: "feature",
    image: "/placeholder-article.svg",
    author: "Priya Sharma",
    date: "2025-03-08",
    readTime: "4 min",
    tags: ["upcoming", "tollywood", "bollywood", "kollywood"],
  },
  {
    id: "3",
    title: "The Rise of Pan-India Cinema: Breaking Language Barriers",
    excerpt: "How Telugu and Tamil films are finding massive audiences across all of India.",
    content: "The concept of pan-India cinema has transformed the industry. Films originally made in Telugu and Tamil are now released simultaneously in multiple languages, reaching audiences far beyond their traditional markets. This shift has created a new era of Indian filmmaking.",
    category: "feature",
    image: "/placeholder-article.svg",
    author: "Arun Reddy",
    date: "2025-03-05",
    readTime: "7 min",
    tags: ["pan-india", "industry", "tollywood", "kollywood"],
  },
  {
    id: "4",
    title: "Director Spotlight: New Wave Directors in South Indian Cinema",
    excerpt: "Meet the filmmakers redefining storytelling in Telugu, Tamil, Kannada and Malayalam cinema.",
    content: "A new generation of directors across South India is pushing creative boundaries with fresh narratives and innovative filmmaking techniques. From realistic dramas to genre-bending thrillers, these filmmakers are earning both critical acclaim and commercial success.",
    category: "interview",
    image: "/placeholder-article.svg",
    author: "Lakshmi Menon",
    date: "2025-03-02",
    readTime: "6 min",
    tags: ["directors", "south-indian", "indie"],
  },
  {
    id: "5",
    title: "Music Review: Best Indian Film Soundtracks of the Year",
    excerpt: "From Tollywood chartbusters to soulful Bollywood melodies, the best music of the year.",
    content: "Indian cinema has always been known for its incredible music, and this year is no exception. From high-energy mass songs to hauntingly beautiful melodies, film composers across all languages have delivered outstanding work that continues to top the charts.",
    category: "review",
    image: "/placeholder-article.svg",
    author: "Deepak Nair",
    date: "2025-02-28",
    readTime: "8 min",
    tags: ["music", "soundtrack", "tollywood", "bollywood"],
  },
  {
    id: "6",
    title: "OTT Watch: Biggest Indian Movies Streaming This Month",
    excerpt: "All the major Telugu, Hindi, Tamil and Malayalam releases hitting streaming platforms.",
    content: "The streaming landscape for Indian cinema continues to grow. This month sees several major theatrical releases making their OTT debut across platforms. Here is your complete guide to what is streaming and where to watch.",
    category: "news",
    image: "/placeholder-article.svg",
    author: "Sneha Patel",
    date: "2025-02-25",
    readTime: "5 min",
    tags: ["ott", "streaming", "releases"],
  },
];

export function getArticlesByCategory(category: Article["category"]): Article[] {
  return articles.filter((a) => a.category === category);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}
