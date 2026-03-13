import { Star } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";
import type { Review } from "@/types/tmdb";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const rating = review.author_details.rating;

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
            {review.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{review.author}</p>
            <p className="text-xs text-gray-500">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        {rating && (
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{rating}/10</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">
        {truncate(review.content, 400)}
      </p>
    </div>
  );
}
