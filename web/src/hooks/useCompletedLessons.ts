import { useCallback, useEffect, useState } from 'react'
import { getCompletedLessonIds } from '../lib/lessonProgress'
import { isProgressSyncReady } from '../lib/progressSync'

export function useCompletedLessons() {
  const [completedIds, setCompletedIds] = useState<string[]>(() => getCompletedLessonIds())
  const [syncReady, setSyncReady] = useState(isProgressSyncReady)

  const refresh = useCallback(() => {
    setCompletedIds(getCompletedLessonIds())
    setSyncReady(isProgressSyncReady())
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'completed-lesson-ids' ||
        e.key === 'lesson-stats' ||
        e.key === null
      ) {
        refresh()
      }
    }
    const onComplete = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('lesson-completed', onComplete)
    window.addEventListener('lesson-progress-updated', onComplete)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('lesson-completed', onComplete)
      window.removeEventListener('lesson-progress-updated', onComplete)
    }
  }, [refresh])

  return { completedIds, syncReady, refresh }
}
