import { Icon } from './Icon'

type TabItem = {
  id: string
  label: string
  icon?: string
}

type TabsProps = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div
      style={{
        background: '#f1eafb',
        padding: '4px',
        borderRadius: '999px',
        display: 'inline-flex',
        gap: '2px',
      }}
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontFamily: 'Figtree, sans-serif',
              transition: 'all .15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: active ? '#fff' : 'transparent',
              color: active ? '#5b3fb0' : '#6c6379',
              fontWeight: active ? 600 : 400,
              boxShadow: active ? '0 4px 14px rgba(96,64,160,0.08)' : 'none',
            }}
          >
            {item.icon && <Icon name={item.icon} size={14} />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
