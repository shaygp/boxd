import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { raceHighlights2024, raceHighlights2023, type RaceHighlight } from "@/data/raceHighlights2024";

interface RaceHighlightsDialogProps {
  year: number;
  round: number;
  raceName: string;
}

export const RaceHighlightsDialog = ({ year, round, raceName }: RaceHighlightsDialogProps) => {
  const [open, setOpen] = useState(false);

  // Combine all race highlights
  const allHighlights = [...raceHighlights2024, ...raceHighlights2023];

  // Find the matching race highlights
  const highlights = allHighlights.find(
    (h) => h.year === year && h.round === round && h.raceName === raceName
  );

  // Only show for races that have highlights data
  if (!highlights) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-2 border-red-900/50 bg-black/60 text-gray-300 hover:bg-racing-red/20 hover:border-racing-red hover:text-white font-bold uppercase tracking-wider text-xs transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
        >
          <HelpCircle className="w-3.5 h-3.5 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
          <span className="hidden sm:inline">What even happened? I can't remember</span>
          <span className="sm:hidden">What happened?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full bg-black/95 border-2 border-racing-red backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-wider text-racing-red">
            {highlights.raceName} {highlights.year}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key Moments */}
          <div className="space-y-3">
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              🏁 Where's your attention span?
            </h3>
            <ul className="space-y-3">
              {highlights.highlights.map((highlight, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-sm sm:text-base leading-relaxed"
                >
                  <span className="text-racing-red font-bold flex-shrink-0 mt-1">•</span>
                  <span
                    className="text-gray-200"
                    dangerouslySetInnerHTML={{ __html: highlight }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
