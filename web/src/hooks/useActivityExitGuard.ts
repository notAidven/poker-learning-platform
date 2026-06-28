import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

type UseActivityExitGuardOptions = {
  when: boolean
  /**
   * Optional side effect to run when the user confirms leaving (e.g. a genuine
   * reset). A normal mid-lesson leave omits this so the saved session is kept
   * and the learner resumes where they left off.
   */
  onConfirmExit?: () => void
}

export function useActivityExitGuard({ when, onConfirmExit }: UseActivityExitGuardOptions) {
  const allowNavigationRef = useRef(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when &&
      !allowNavigationRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!when) return

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (allowNavigationRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [when])

  useEffect(() => {
    if (!when) {
      allowNavigationRef.current = false
    }
  }, [when])

  const allowNavigation = useCallback(() => {
    allowNavigationRef.current = true
  }, [])

  const stay = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const confirmExit = useCallback(() => {
    onConfirmExit?.()
    allowNavigationRef.current = true
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker, onConfirmExit])

  // The modal is open exactly while React Router is holding a blocked navigation.
  // `stay` (reset) and `confirmExit` (proceed) both clear that state, which closes it.
  return {
    modalOpen: blocker.state === 'blocked',
    stay,
    confirmExit,
    allowNavigation,
  }
}
