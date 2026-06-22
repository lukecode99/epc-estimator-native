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

  useEffect(() => {
    if (screen === 'results') showBanner()
    else hideBanner()
  }, [screen])

  function goTo(s) { setScreen(s) }

  if (screen === 'privacy') return <Privacy onBack={() => goTo('home')} />

  if (screen === 'home') return (
    <Home
      onStart={() => { setAnswers({}); goTo('quiz') }}
      onSaved={() => goTo('saved')}
      onPrivacy={() => goTo('privacy')}
    />
  )
  if (screen === 'quiz') return (
    <Questionnaire
      initialAnswers={answers}
      onComplete={a => { setAnswers(a); goTo('results') }}
      onBack={() => goTo('home')}
    />
  )
  if (screen === 'saved') return (
    <SavedEstimates
      onBack={() => goTo('home')}
      onView={entry => { setAnswers(entry.answers); goTo('results') }}
    />
  )
  return (
    <Results
      answers={answers}
      onBack={() => goTo('home')}
      onEdit={() => goTo('quiz')}
    />
  )
}
