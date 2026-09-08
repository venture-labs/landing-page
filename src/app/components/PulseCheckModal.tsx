import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { useLocale } from "@/app/locale";
import { COPY, PulseQuiz } from "@/app/components/PulseQuiz";

const ACCENT = "#8129ff";

export function PulseCheckModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lang } = useLocale();
  const copy = COPY[lang];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181620] border-white/10 text-white sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogTitle
          className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight"
          style={{ fontSize: "var(--text-h2)" }}
        >
          {copy.quizHeading}
        </DialogTitle>
        <DialogDescription className="sr-only">{copy.quizIntro}</DialogDescription>
        <PulseQuiz copy={copy} accent={ACCENT} />
      </DialogContent>
    </Dialog>
  );
}
