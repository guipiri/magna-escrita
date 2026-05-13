import * as React from 'react';
import { cn } from './utils';

type DataListProps = React.HTMLAttributes<HTMLDivElement>;

export function DataList({ className, ...props }: DataListProps) {
  return <div className={cn('space-y-3', className)} {...props} />;
}

type DataListItemProps = React.HTMLAttributes<HTMLElement>;

export function DataListItem({ className, ...props }: DataListItemProps) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5',
        className,
      )}
      {...props}
    />
  );
}

type DataListHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function DataListHeader({ className, ...props }: DataListHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-3', className)}
      {...props}
    />
  );
}

type DataListTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function DataListTitle({ className, ...props }: DataListTitleProps) {
  return (
    <h3
      className={cn('text-base font-semibold text-card-foreground', className)}
      {...props}
    />
  );
}

type DataListDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function DataListDescription({
  className,
  ...props
}: DataListDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

type DataListMetaProps = React.HTMLAttributes<HTMLDivElement>;

export function DataListMeta({ className, ...props }: DataListMetaProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}

type DataListContentProps = React.HTMLAttributes<HTMLDivElement>;

export function DataListContent({ className, ...props }: DataListContentProps) {
  return <div className={cn('grid gap-3', className)} {...props} />;
}

type DataListFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function DataListFooter({ className, ...props }: DataListFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    />
  );
}

type DataListActionsProps = React.HTMLAttributes<HTMLDivElement>;

export function DataListActions({ className, ...props }: DataListActionsProps) {
  return (
    <div
      className={cn('flex items-center gap-2 self-end', className)}
      {...props}
    />
  );
}
