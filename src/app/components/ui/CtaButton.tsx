import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface CtaButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  backgroundColor?: string;
  textColor?: string;
  showArrow?: boolean;
  fontSize?: string;
}

export function CtaButton({
  href,
  onClick,
  children,
  backgroundColor,
  textColor = 'text-white',
  showArrow = true,
  fontSize = 'var(--text-btn)'
}: CtaButtonProps) {
  const hoverClasses = backgroundColor === 'white' ? 'hover:bg-white/90' : '';
  const className = `self-start inline-flex items-center justify-center gap-2 font-['sofia-pro',sans-serif] font-semibold px-[24px] py-[11px] rounded-lg transition-all hover:scale-[1.02] ${textColor} ${hoverClasses}`;
  const style = {
    fontSize,
    ...(backgroundColor && { backgroundColor })
  };

  if (href) {
    return (
      <a href={href} className={className} style={style}>
        {children}
        {showArrow && <ArrowRight size={15} />}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {children}
      {showArrow && <ArrowRight size={15} />}
    </button>
  );
}
