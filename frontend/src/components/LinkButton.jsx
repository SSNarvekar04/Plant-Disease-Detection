import { Link } from 'react-router-dom';

/**
 * Wrapper around react-router's `Link` that applies the app's button styles.
 *
 * @param {{ to: string, variant?: 'primary'|'secondary'|'danger'|'ghost',
 *           size?: 'sm'|'md', className?: string, children: React.ReactNode }} props
 */
export default function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };

  const sizes = { sm: 'btn-sm', md: '' };

  return (
    <Link to={to} className={`${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}