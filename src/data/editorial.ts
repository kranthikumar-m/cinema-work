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
    title: "The Future of Blockbuster Cinema in 2025",
    excerpt: "How studios are adapting to changing audiences and new distribution models.",
    content: "The landscape of blockbuster cinema continues to evolve as studios navigate shifting audience preferences and the growing influence of streaming platforms. Major releases are now being planned with both theatrical and digital distribution in mind, creating new opportunities for filmmakers to reach wider audiences while maintaining the spectacle of the big-screen experience.",
    category: "feature",
    image: "/placeholder-article.svg",
    author: "Sarah Mitchell",
    date: "2025-03-10",
    readTime: "5 min",
    tags: ["industry", "box-office", "streaming"],
  },
  {
    id: "2",
    title: "Top 10 Most Anticipated Films This Season",
    excerpt: "From sequels to original stories, here are the movies everyone is talking about.",
    content: "This season brings an exciting lineup of films that promise to captivate audiences worldwide. From highly anticipated sequels of beloved franchises to bold original stories from visionary directors, the upcoming slate offers something for every type of moviegoer.",
    category: "news",
    image: "/placeholder-article.svg",
    author: "James Rodriguez",
    date: "2025-03-08",
    readTime: "4 min",
    tags: ["upcoming", "preview", "anticipated"],
  },
  {
    id: "3",
    title: "Behind the Scenes: The Art of Movie Sound Design",
    excerpt: "An exclusive look at how sound designers create immersive cinematic worlds.",
    content: "Sound design is one of the most overlooked yet crucial elements of filmmaking. In this deep dive, we explore how modern sound designers use cutting-edge technology and creative techniques to build the sonic landscapes that make movies truly immersive.",
    category: "feature",
    image: "/placeholder-article.svg",
    author: "Alex Chen",
    date: "2025-03-05",
    readTime: "7 min",
    tags: ["behind-the-scenes", "sound", "craft"],
  },
  {
    id: "4",
    title: "Director Spotlight: Rising Voices in World Cinema",
    excerpt: "Meet the new generation of filmmakers redefining storytelling across the globe.",
    content: "A new wave of directors from around the world is reshaping the cinematic landscape with fresh perspectives and innovative storytelling techniques. From South Korea to Nigeria, these filmmakers are bringing diverse stories to international audiences.",
    category: "interview",
    image: "/placeholder-article.svg",
    author: "Maya Patel",
    date: "2025-03-02",
    readTime: "6 min",
    tags: ["directors", "world-cinema", "indie"],
  },
  {
    id: "5",
    title: "The Evolution of Visual Effects in Modern Cinema",
    excerpt: "How VFX technology has transformed the way stories are told on screen.",
    content: "Visual effects have come a long way from the early days of practical effects and blue screens. Today's VFX artists use sophisticated tools to create photorealistic environments, characters, and action sequences that push the boundaries of imagination.",
    category: "feature",
    image: "/placeholder-article.svg",
    author: "David Park",
    date: "2025-02-28",
    readTime: "8 min",
    tags: ["vfx", "technology", "filmmaking"],
  },
  {
    id: "6",
    title: "Award Season Predictions: Who Will Take Home the Gold?",
    excerpt: "Our critics weigh in on the frontrunners for this year's major film awards.",
    content: "As award season heats up, the competition among this year's standout performances and films is fiercer than ever. Our panel of critics breaks down the frontrunners and dark horses in every major category.",
    category: "review",
    image: "/placeholder-article.svg",
    author: "Rachel Thompson",
    date: "2025-02-25",
    readTime: "5 min",
    tags: ["awards", "predictions", "oscars"],
  },
];

export function getArticlesByCategory(category: Article["category"]): Article[] {
  return articles.filter((a) => a.category === category);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}
