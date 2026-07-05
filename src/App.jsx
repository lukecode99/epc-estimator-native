import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import Home from './screens/Home'
import Questionnaire from './screens/Questionnaire'
import Results from './screens/Results'
import SavedEstimates from './screens/SavedEstimates'
import Privacy from './screens/Privacy'
import BottomNav from './BottomNav'
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
  // Which bottom-nav tab owns the current screen. Results reached from the
  // Saved list stays under the Saved tab; everything else is the flow.
  const [tab, setTab] = useState('new')
  // Where the estimate flow was left when the user switched to the Saved
  // tab, so tabbing back resumes (mid-questionnaire included) rather than
  // restarting.
  const [flowReturn, setFlowReturn] = useState('home')
  // Live questionnaire position — a tab switch mid-quiz keeps the answers
  // (synced via onProgress) and this step, so the quiz picks up where it was.
  const [quizStep, setQuizStep] = useState(0)

  useEffect(() => {
    if (screen === 'results' || screen === 'saved') showBanner()
    else hideBanner()
  }, [screen])

  function goTo(s) { setScreen(s); setTab('new') }

  function openSavedTab() {
    if (tab === 'new') setFlowReturn(screen)
    setTab('saved')
    setScreen('saved')
  }

  function openFlowTab() {
    setTab('new')
    setScreen(flowReturn)
  }

  // Start a brand-new estimate: clear any viewed entry, single-question edit
  // and quiz position before opening the questionnaire.
  function startFreshQuiz() {
    setAnswers({})
    setViewing(null)
    setEditKey(null)
    setQuizStep(0)
    goTo('quiz')
  }

  let body
  if (screen === 'privacy') body = <Privacy onBack={() => goTo('home')} />
  else if (screen === 'home') body = (
    <Home
      onStart={startFreshQuiz}
      onPrivacy={() => goTo('privacy')}
    />
  )
  else if (screen === 'quiz') body = (
    <Questionnaire
      initialAnswers={answers}
      initialStep={quizStep}
      singleKey={editKey}
      onProgress={(a, s) => { setAnswers(a); setQuizStep(s) }}
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
  else if (screen === 'saved') body = (
    <SavedEstimates
      onStartNew={startFreshQuiz}
      onView={entry => {
        setAnswers(entry.answers)
        setViewing(entry)
        setEditKey(null)
        // The viewed estimate becomes the current flow context.
        setFlowReturn('results')
        setScreen('results')
      }}
    />
  )
  else body = (
    <Results
      answers={answers}
      savedEntry={viewing}
      onBack={() => { setViewing(null); goTo('home') }}
      onEdit={() => { setQuizStep(0); goTo('quiz') }}
      onEditQuestion={key => { setEditKey(key); goTo('quiz') }}
      onOpenSaved={openSavedTab}
    />
  )

  return (
    <>
      {body}
      <BottomNav
        active={tab}
        aboveBanner={Capacitor.isNativePlatform() && (screen === 'results' || screen === 'saved')}
        onNewTab={() => {
          // Mid-quiz the tab resumes progress; from anywhere else it starts
          // a fresh estimate — never reopens a previously viewed result.
          if (screen === 'quiz') return
          if (tab === 'saved' && flowReturn === 'quiz') openFlowTab()
          else startFreshQuiz()
        }}
        onSavedTab={() => { if (screen !== 'saved') openSavedTab() }}
      />
    </>
  )
}
