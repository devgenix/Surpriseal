import { cn } from "@/lib/utils";

export default function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-12 md:py-24", className)}>
      {children}
    </section>
  );
}
