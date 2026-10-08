import { Palette, Shirt, Sparkles, Layers } from 'lucide-react'
import { useState } from 'react'
import { Capsule } from './components/Capsule'
import { Looks } from './components/Looks'
import { Onboarding } from './components/Onboarding'
import { Profile } from './components/Profile'
import { Wardrobe } from './components/Wardrobe'
import { useStore } from './store'

type Tab = 'profile' | 'wardrobe' | 'looks' | 'capsule'
const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: 'profile', label: 'Me', icon: Palette },
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'looks', label: 'Looks', icon: Sparkles },
  { id: 'capsule', label: 'Capsule', icon: Layers },
]

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('profile')
  const [retaking, setRetaking] = useState(false)

  if (!store.profile.completed || retaking) {
    return <Onboarding store={store} onDone={() => { setRetaking(false); setTab('wardrobe') }} />
  }
  return (
    <>
      {tab === 'profile' && <Profile store={store} retake={() => setRetaking(true)} />}
      {tab === 'wardrobe' && <Wardrobe store={store} />}
      {tab === 'looks' && <Looks store={store} goWardrobe={() => setTab('wardrobe')} />}
      {tab === 'capsule' && <Capsule store={store} goWardrobe={() => setTab('wardrobe')} />}
      <nav className="tabbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); window.scrollTo(0, 0) }}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
