interface ThreeColLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function ThreeColLayout({ left, center, right }: ThreeColLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Left: File area */}
      <div className="w-72 shrink-0 flex flex-col border-r border-bd bg-modal overflow-hidden">
        {left}
      </div>

      {/* Center: Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {center}
      </div>

      {/* Right: Chat */}
      <div className="w-80 shrink-0 flex flex-col border-l border-bd bg-modal overflow-hidden">
        {right}
      </div>
    </div>
  );
}
