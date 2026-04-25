import Button from './Button'

type Tab = { label: string; value: string }

export default function TabBar({ tabs, activeTab, onChange }: { tabs: Tab[]; activeTab: string; onChange: (tab: string) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          variant={activeTab === tab.value ? 'primary' : 'secondary'}
          className={`font-medium ${
            activeTab === tab.value
              ? ''
              : 'text-slate-600'
          }`}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
