import clsx from "clsx";
import { ReactNode } from "react";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={clsx("card", className)}>{children}</div>;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, sub, trend, className }: StatCardProps) {
  return (
    <Card className={clsx("flex flex-col gap-1", className)}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && (
        <p
          className={clsx("text-xs", {
            "text-accent-green": trend === "up",
            "text-accent-red": trend === "down",
            "text-text-tertiary": !trend || trend === "neutral",
          })}
        >
          {sub}
        </p>
      )}
    </Card>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {description && (
          <p className="text-sm text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── LoadingState ─────────────────────────────────────────────────────────────

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-text-tertiary text-sm">
      <span className="animate-pulse">{message}</span>
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-accent-red text-sm">
      {message ?? "Failed to load data"}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-text-tertiary text-sm">
      {message ?? "No data available"}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = "blue" | "red" | "amber" | "green" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const badgeVariants: Record<BadgeVariant, string> = {
  blue: "bg-accent-blue/15 text-accent-blue",
  red: "bg-accent-red/15 text-accent-red",
  amber: "bg-accent-amber/15 text-accent-amber",
  green: "bg-accent-green/15 text-accent-green",
  gray: "bg-border text-text-secondary",
};

export function Badge({ variant = "gray", children }: BadgeProps) {
  return <span className={clsx("badge", badgeVariants[variant])}>{children}</span>;
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider() {
  return <div className="border-t border-border my-4" />;
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}
