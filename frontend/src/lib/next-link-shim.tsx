import React from "react";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href = "/", onClick, children, ...props },
  ref
) {
  return (
    <a
      ref={ref}
      href={href.startsWith("/") ? `#${href}` : href}
      onClick={(e) => {
        if (href.startsWith("/") || href.startsWith("#")) {
          e.preventDefault();
          const normalized = href.startsWith("#") ? href : `#${href}`;
          if (window.location.hash !== normalized) {
            window.history.replaceState(null, "", normalized);
          }
          window.dispatchEvent(new CustomEvent("veraxis:nav", { detail: href }));
        }
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
});

export default Link;
