import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  totalRatings?: number;
  onClickWhenReadonly?: () => void;
  hideStars?: boolean;
}

export const StarRating = ({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  totalRatings = 0,
  onClickWhenReadonly,
  hideStars = false,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (readonly && onClickWhenReadonly) {
      onClickWhenReadonly();
    } else if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    // Disable hover on touch devices to prevent conflicts
    if (!readonly && !('ontouchstart' in window)) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly && !('ontouchstart' in window)) {
      setHoverRating(0);
    }
  };

  const displayRating = readonly ? rating : (hoverRating || rating);

  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  const starSizes = {
    sm: 16,
    md: 18,
    lg: 22,
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {readonly && (
        <div className="text-center sm:text-left">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {`Average Rating ${totalRatings > 0 ? `(${totalRatings.toLocaleString()} ${totalRatings === 1 ? 'rating' : 'ratings'})` : '(No ratings yet)'}`}
          </span>
        </div>
      )}

      {/* Rating Display */}
      {readonly && (
        <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-yellow-400">{displayRating.toFixed(1)}</span>
          <span className="text-lg sm:text-xl font-medium text-muted-foreground">/ 5.0</span>
        </div>
      )}

      {/* Stars */}
      {!hideStars && (
      <div className="flex items-center justify-center sm:justify-start gap-1">
        {[1, 2, 3, 4, 5].map((position) => {
          const isActive = displayRating >= position;
          const isPartial = displayRating > position - 1 && displayRating < position;

          return (
            <div
              key={position}
              className={`relative flex items-center justify-center ${
                (readonly && onClickWhenReadonly) || !readonly ? 'cursor-pointer' : ''
              }`}
              onClick={(e) => handleClick(position, e)}
              onMouseEnter={() => handleMouseEnter(position)}
              onMouseLeave={handleMouseLeave}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleClick(position, e as any);
              }}
            >
              {/* Star icon */}
              <Star
                size={size === "sm" ? 20 : size === "md" ? 24 : 28}
                className={`${
                  isActive ? 'text-yellow-400 fill-yellow-400' :
                  isPartial ? 'text-yellow-400 fill-yellow-400' :
                  'text-gray-600 fill-gray-800'
                }`}
                strokeWidth={1.5}
              />
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
