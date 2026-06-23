/** Shared props for manipulable lesson interactions */
export type InteractionProps = {
  onCorrect: () => void
  onIncorrect?: () => void
  /** Clear incorrect feedback in parent when learner retries */
  onAttemptReset?: () => void
  disabled?: boolean
  /** Step was already solved before (e.g. user navigated back) */
  initialSolved?: boolean
  /** Show "Try again" after a wrong submit (skill checks disable this) */
  allowRetry?: boolean
}
