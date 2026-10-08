import { useState } from 'react'
import { ACTIVITIES } from '../data/activities'
import { COLOR_QUESTIONS, ESSENCE_QUESTIONS, STYLE_QUESTIONS } from '../data/quiz'
import { scoreColorAxes, scoreStyles, scoreYin } from '../lib/analysis'
import { RETAILERS } from '../lib/shopping'
import type { Store } from '../store'
import type { Frequency } from '../types'
import { Chip } from './ui'

type Q = { id: string; q: string; options: { label: string }[] }
const STEPS: { title: string; sub: string; qs: Q[] | null }[] = [
  { title: 'Your colouring', sub: 'Use natural light and no makeup if you can.', qs: COLOR_QUESTIONS },
  { title: 'Your style taste', sub: 'Go with your gut.', qs: STYLE_QUESTIONS },
  { title: 'Your feminine essence', sub: 'How your lines and presence read — soft & curved (yin) to sharp & angular (yang).', qs: ESSENCE_QUESTIONS },
  { title: 'Your lifestyle', sub: 'How often do you do each? Add your own later.', qs: null },
]
const FREQ: { v: Frequency; l: string }[] = [{ v: 0, l: 'Never' }, { v: 1, l: 'Rarely' }, { v: 2, l: 'Often' }, { v: 3, l: 'Daily' }]

export function Onboarding({ store, onDone }: { store: Store; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState<Record<string, number>>({})
  const [freq, setFreq] = useState<Record<string, Frequency>>(store.profile.frequencies)
  const [shops, setShops] = useState<string[]>(store.profile.retailers)
  const s = STEPS[step]
  const complete = s.qs ? s.qs.every((q) => ans[q.id] !== undefined) : true

  const finish = () => {
    store.setProfile({
      ...store.profile, completed: true,
      ...scoreColorAxes(ans), styleScores: scoreStyles(ans), yin: scoreYin(ans),
      frequencies: freq, retailers: shops,
    })
    onDone()
  }

  return (
    <main className="page">
      <div className="progress"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <h1>{s.title}</h1>
      <p className="muted">{s.sub}</p>

      {s.qs?.map((q) => (
        <fieldset key={q.id} className="q">
          <legend>{q.q}</legend>
          <div className="chips">
            {q.options.map((o, i) => (
              <Chip key={o.label} active={ans[q.id] === i} onClick={() => setAns({ ...ans, [q.id]: i })}>{o.label}</Chip>
            ))}
          </div>
        </fieldset>
      ))}

      {!s.qs && (
        <>
          {ACTIVITIES.map((a) => (
            <div key={a.id} className="q">
              <div>{a.emoji} {a.label}</div>
              <div className="chips">
                {FREQ.map((f) => (
                  <Chip key={f.v} active={(freq[a.id] ?? 0) === f.v} onClick={() => setFreq({ ...freq, [a.id]: f.v })}>{f.l}</Chip>
                ))}
              </div>
            </div>
          ))}
          <fieldset className="q">
            <legend>Where do you like to shop?</legend>
            <div className="chips">
              {RETAILERS.map((r) => (
                <Chip key={r.id} active={shops.includes(r.id)}
                  onClick={() => setShops(shops.includes(r.id) ? shops.filter((x) => x !== r.id) : [...shops, r.id])}>{r.name}</Chip>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <div className="row between nav">
        <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        {step < STEPS.length - 1
          ? <button className="btn" disabled={!complete} onClick={() => { setStep(step + 1); window.scrollTo(0, 0) }}>Next</button>
          : <button className="btn" onClick={finish}>See my analysis</button>}
      </div>
    </main>
  )
}
