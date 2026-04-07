import * as React from "react";
import { cn } from "@/lib/utils";

type TextOwnProps<C extends React.ElementType> = {
  as?: C;
  className?: string;
};

type TextProps<C extends React.ElementType> = TextOwnProps<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof TextOwnProps<C>>;

export function Text<C extends React.ElementType = "p">({
  as,
  className,
  ...props
}: TextProps<C>) {
  const Component = as || "p";

  return <Component className={cn(className)} {...props} />;
}
