import Link from 'next/link';
import clsx from 'clsx';

type Variant = 'default' | 'gold' | 'gold-solid';

interface BaseProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButton extends BaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  href?: undefined;
}

interface ButtonAsLink extends BaseProps {
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClass: Record<Variant, string> = {
  default: '',
  gold: 'btn-gold',
  'gold-solid': 'btn-gold-solid',
};

// Ports .btn-luxury verbatim — the bordered button with a fill-on-hover
// sweep, used across the static site for every primary/secondary action.
export function Button(props: ButtonProps) {
  const { variant = 'default', className, children } = props;
  const classes = clsx('btn-luxury', variantClass[variant], className);

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        <span>{children}</span>
      </Link>
    );
  }

  const { variant: _v, className: _c, children: _ch, href: _h, ...rest } = props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      <span>{children}</span>
    </button>
  );
}
