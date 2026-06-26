import { useEffect, useMemo, type ReactNode } from 'react'
import { auth } from '../firebase'
import { clearLocalBankroll } from '../bankroll'
import { clearClearedTables } from '../casinoProgress'
import { FirestoreProgressBackend } from './FirestoreProgressBackend'
import { ProgressStore } from './ProgressStore'
import { ProgressStoreContext } from './ProgressContext'

/**
 * Creates the single app-wide ProgressStore (Firestore-backed) and wires the H1
 * reset to also wipe casino table-clears + bankroll, plus the `auth.currentUser`
 * fallback uid for writes that race the auth sync.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const store = useMemo(
    () =>
      new ProgressStore({
        backend: new FirestoreProgressBackend(),
        onLocalReset: () => {
          clearClearedTables()
          clearLocalBankroll()
        },
        getFallbackUid: () => auth.currentUser?.uid ?? null,
      }),
    [],
  )

  // Keep the store connected (its cross-tab `storage` listener attached) for the
  // whole app lifetime, independent of which screens currently read progress.
  useEffect(() => store.subscribe(() => {}), [store])

  return <ProgressStoreContext.Provider value={store}>{children}</ProgressStoreContext.Provider>
}
