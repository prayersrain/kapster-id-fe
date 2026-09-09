import type { ReactNode } from 'react';
import { Icon } from './Icon';

type ButtonProps = {
  children: ReactNode;
  variant?: 'gold' | 'outline' | 'ghost';
  className?: string;
  href?: string;
  ariaLabel?: string;
  target?: '_blank' | '_self';
  rel?: string;
};

export function Button({ children, variant = 'gold', className = '', href, ariaLabel, target, rel }: ButtonProps) {
  const classes = `btn btn-${variant} ${className}`.trim();
  const content = <>{children}<Icon name="arrow" size={16}/></>;

  if (href) {
    return <a className={classes} href={href} aria-label={ariaLabel} target={target} rel={rel}>{content}</a>;
  }

  return <button type="button" className={classes} aria-label={ariaLabel}>{content}</button>;
}
