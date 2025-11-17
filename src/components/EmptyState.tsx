import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-black/60 border-2 border-red-900/40 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{title}</h3>
      {description && (
        <p className="text-sm text-gray-300 text-center max-w-md mb-6 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
