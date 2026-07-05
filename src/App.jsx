import { useState, useEffect } from 'react'
import Home from './screens/Home'
import Questionnaire from './screens/Questionnaire'
import Results from './screens/Results'
import SavedEstimates from './screens/SavedEstimates'
import Privacy from './screens/Privacy'
import './App.css'
import { showBanner, hideBanner } from './admob.js'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [answers, setAnswers] = useState({})
  // The saved entry being viewed. A full entry means Results shows the
  // STORED score/band/cost; after an edit only {id, name} survives so the
  // recomputed result still saves back to the same entry (no duplicates).
  const [viewing, setViewing] = useState(null)
  // Set when the user taps an input row on Results: the questionnaire opens
  // on just that question and returns straight to Results.
  const [editKey, setEditKey] = useState(null)

  useEffect(() => {
    if (screen === 'results' || screen === 'saved') showBanner()
    else hideBanner()
  }, [screen])

  function goTo(s) { setScreen(s) }

  if (screen === 'privacy') return <Privacy onBack={() => goTo('home')} />

  if (screen === 'home') return (
    <Home
      onStart={() => { setAnswers({}); setViewing(null); goTo('quiz') }}
      onSaved={() => goTo('saved')}
      onPrivacy={() => goTo('privacy')}
    />
  )
  if (screen === 'quiz') return (
    <Questionnaire
      initialAnswers={answers}
      singleKey={editKey}
      onComplete={a => {
        setAnswers(a)
        setViewing(v => (v ? { id: v.id, name: v.name } : null))
        setEditKey(null)
        goTo('results')
      }}
      onBack={() => {
        if (editKey) { setEditKey(null); goTo('results') }
        else goTo('home')
      }}
    />
  )
  if (screen === 'saved') return (
    <SavedEstimates
      onBack={() => goTo('home')}
      onView={entry => { setAnswers(entry.answers); setViewing(entry); goTo('results') }}
    />
  )
  return (
    <Results
      answers={answers}
      savedEntry={viewing}
      onBack={() => { setViewing(null); goTo('home') }}
      onEdit={() => goTo('quiz')}
      onEditQuestion={key => { setEditKey(key); goTo('quiz') }}
    />
  )
}
