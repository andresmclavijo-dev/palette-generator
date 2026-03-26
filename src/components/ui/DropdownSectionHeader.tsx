interface DropdownSectionHeaderProps {
  title: string
  subtitle: string
}

export default function DropdownSectionHeader({ title, subtitle }: DropdownSectionHeaderProps) {
  return (
    <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid hsl(var(--border))' }}>
      <div className="text-[13px] font-semibold text-foreground" style={{ lineHeight: 1.3 }}>{title}</div>
      <div className="text-[12px] text-muted-foreground" style={{ lineHeight: 1.4, marginTop: 2 }}>{subtitle}</div>
    </div>
  )
}
