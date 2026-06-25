import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface CtaButtonProps {
  href: string;
  children: ReactNode;
  backgroundColor?: string;
  textColor?: string;
  showArrow?: boolean;
  fontSize?: string;
}

export function CtaButton({
  href,
  children,
  backgroundColor,
  textColor = 'text-white',
  showArrow = true,
  fontSize = 'var(--text-btn)'
}: CtaButtonProps) {
  const hoverClasses = backgroundColor === 'white' ? 'hover:bg-white/90' : '';

  return (
    <a
      href={href}
      className={`self-start inline-flex items-center justify-center gap-2 font-['sofia-pro',sans-serif] font-semibold px-[24px] py-[11px] rounded-lg transition-all hover:scale-[1.02] ${textColor} ${hoverClasses}`}
      style={{
        fontSize,
        ...(backgroundColor && { backgroundColor })
      }}
    >
      {children}
      {showArrow && <ArrowRight size={15} />}
    </a>
  );
}
