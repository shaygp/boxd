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

  const handleClick = (starPosition: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (readonly && onClickWhenReadonly) {
      onClickWhenReadonly();
    } else if (!readonly && onRatingChange) {
      // Calculate if click was on left or right half of star
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const clickX = 'clientX' in e ? e.clientX : (e as React.TouchEvent).touches[0]?.clientX || 0;
      const relativeX = clickX - rect.left;
      const halfWidth = rect.width / 2;

      // If click is on left half, give half star (x.5), otherwise full star
      const rating = relativeX < halfWidth ? starPosition - 0.5 : starPosition;
      onRatingChange(rating);
    }
  };

  const handleMouseMove = (starPosition: number, e: React.MouseEvent) => {
    // Disable hover on touch devices to prevent conflicts
    if (!readonly && !('ontouchstart' in window)) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const halfWidth = rect.width / 2;

      // If hovering over left half, show half star (x.5), otherwise full star
      const rating = relativeX < halfWidth ? starPosition - 0.5 : starPosition;
      setHoverRating(rating);
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
          const isFull = displayRating >= position;
          const isHalf = displayRating >= position - 0.5 && displayRating < position;
          const isEmpty = displayRating < position - 0.5;

          return (
            <div
              key={position}
              className={`relative flex items-center justify-center ${
                (readonly && onClickWhenReadonly) || !readonly ? 'cursor-pointer' : ''
              }`}
              onClick={(e) => handleClick(position, e)}
              onMouseMove={(e) => handleMouseMove(position, e)}
              onMouseLeave={handleMouseLeave}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleClick(position, e);
              }}
            >
              {/* Background star (empty state) */}
              <Star
                size={size === "sm" ? 20 : size === "md" ? 24 : 28}
                className="text-gray-600 fill-gray-800"
                strokeWidth={1.5}
              />

              {/* Filled star overlay */}
              {(isFull || isHalf) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: isHalf ? 'inset(0 50% 0 0)' : 'none'
                  }}
                >
                  <Star
                    size={size === "sm" ? 20 : size === "md" ? 24 : 28}
                    className="text-yellow-400 fill-yellow-400"
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
