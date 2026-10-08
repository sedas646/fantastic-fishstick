import type { ActivityDef } from '../types'

const a = (
  id: string, label: string, emoji: string, formality: number, comfort: number,
  tip: string, o: Partial<ActivityDef> = {},
): ActivityDef => ({
  id, label, emoji, formality, comfort, tip,
  outdoor: false, mobileOnly: false, secureFootOnly: false, noLoose: false, noKinds: [],
  ...o,
})

export const ACTIVITIES: ActivityDef[] = [
  a('wfh', 'Working from home', '💻', 2, 3,
    'Keep your most flattering colour near your face for video calls; comfort comes first.'),
  a('dog', 'Dog walk', '🐕', 1, 3,
    'Closed, grippy shoes and layers you can peel off. Dark or mid tones hide mud.',
    { outdoor: true, mobileOnly: true, secureFootOnly: true, noKinds: ['heels', 'heelboots', 'clutch', 'eveningdress'] }),
  a('shopping', 'Shopping', '🛍️', 2, 3,
    'Comfortable shoes and easy on/off layers for fitting rooms. A crossbody keeps hands free.',
    { noKinds: ['heels', 'eveningdress', 'clutch'] }),
  a('karting', 'Indoor karting', '🏎️', 1, 3,
    'Trousers, closed shoes and fitted sleeves. Nothing loose or dangling that can catch on the kart.',
    { mobileOnly: true, secureFootOnly: true, noLoose: true,
      noKinds: ['casualdress', 'shirtdress', 'maxidress', 'wrapdress', 'eveningdress', 'littleblackdress', 'midiskirt', 'miniskirt', 'scarf', 'clutch', 'heels', 'heelboots', 'sandals'] }),
  a('goingout', 'Going out', '🥂', 4, 1,
    'Dress up your best colour and add one statement piece.',
    { noKinds: ['sweatshirt', 'sporttop', 'joggers', 'leggings', 'shorts', 'puffer', 'wellies', 'backpack', 'beltbag', 'cap'] }),
  a('office', 'Office / meeting', '💼', 4, 2,
    'Structure and clean lines read as polished.',
    { noKinds: ['sweatshirt', 'sporttop', 'joggers', 'leggings', 'shorts', 'wellies', 'sneakers', 'cap', 'beltbag'] }),
  a('date', 'Date night', '🌹', 4, 1, 'Wear a colour from your palette that you feel amazing in.',
    { noKinds: ['sweatshirt', 'sporttop', 'joggers', 'leggings', 'shorts', 'puffer', 'wellies', 'backpack', 'beltbag', 'cap'] }),
  a('brunch', 'Brunch / coffee', '🥐', 3, 2, 'Smart-casual: relaxed but put together.',
    { noKinds: ['sporttop', 'joggers', 'wellies', 'beltbag'] }),
  a('gym', 'Gym / workout', '🏋️', 1, 3, 'Stretch, breathable and secure.',
    { mobileOnly: true, secureFootOnly: true, noLoose: true,
      noKinds: ['jeans', 'widejeans', 'trousers', 'blazer', 'trench', 'wooolcoat', 'heels', 'heelboots', 'clutch', 'casualdress'] }),
  a('travel', 'Travel day', '✈️', 2, 3, 'Layers, stretch and a bag with zips.',
    { noKinds: ['heels', 'heelboots', 'clutch', 'eveningdress'] }),
]

export const makeCustomActivity = (
  label: string, formality: number, comfort: number, outdoor: boolean, active: boolean,
): ActivityDef => ({
  id: `custom-${Date.now().toString(36)}`,
  label, emoji: '✨', formality, comfort, outdoor,
  mobileOnly: active, secureFootOnly: active, noLoose: false, noKinds: [],
  tip: 'Custom activity — looks are tuned to the formality and comfort you picked.',
  custom: true,
})
