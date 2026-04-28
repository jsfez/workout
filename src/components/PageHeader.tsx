import * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const PageHeader = ({ className, ...props }: PageHeaderProps) => {
  return (
    <div
      className={cn("pt-6", className)}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      {...props}
    />
  );
};

export const FixedPageHeader = ({
  className,
  children,
  ...props
}: PageHeaderProps) => {
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    const element = innerRef.current;

    if (!element) return;

    const updateHeight = () => {
      setHeaderHeight(element.getBoundingClientRect().height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <>
      <div aria-hidden="true" style={{ height: headerHeight }} />
      <div
        className={cn("bg-background fixed inset-x-0 top-0 z-30", className)}
        {...props}
      >
        <div
          ref={innerRef}
          className="mx-auto max-w-md px-5 pt-6 pb-2"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}
        >
          {children}
        </div>
      </div>
    </>
  );
};
