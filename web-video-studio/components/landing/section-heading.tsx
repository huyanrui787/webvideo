interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * Shared section heading: bold H2 with optional subtitle.
 * Used across all landing page sections for visual consistency.
 */
export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-12 md:mb-16 ${align === "center" ? "text-center" : "text-left"} ${className}`}
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-t1">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base md:text-lg text-t2 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
