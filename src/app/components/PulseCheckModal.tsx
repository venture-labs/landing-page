import { useState } from "react";
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
  // The result step is the one step where the booking CTA has to be visible
  // without scrolling; the title keeps being the dialog's accessible name
  // but drops its visible footprint there, the same sr-only treatment
  // quizIntro's DialogDescription already uses below.
  const [step, setStep] = useState<"intro" | "question" | "result">("intro");
  const isResultStep = step === "result";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181620] border-white/10 text-white sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogTitle
          className={isResultStep ? "sr-only" : "font-semibold text-white leading-tight"}
          style={isResultStep ? undefined : { fontSize: "var(--text-h2)" }}
        >
          {copy.quizHeading}
        </DialogTitle>
        <DialogDescription className="sr-only">{copy.quizIntro}</DialogDescription>
        <PulseQuiz copy={copy} accent={ACCENT} onStepChange={setStep} />
      </DialogContent>
    </Dialog>
  );
}
