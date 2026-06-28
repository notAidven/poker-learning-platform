import { describe, expect, it } from 'vitest'
import { gradeCardDeck, gradeCardSelection } from './cardDeck'
import { cardsBySuit, type CardId } from '../../../types/lesson'

const HEARTS: CardId[] = cardsBySuit('H')

describe('gradeCardSelection', () => {
  it('is an exact set match (order-independent, no extras or omissions)', () => {
    expect(gradeCardSelection(HEARTS, HEARTS)).toBe(true)
    expect(gradeCardSelection(new Set(HEARTS), HEARTS)).toBe(true)
    expect(gradeCardSelection(HEARTS.slice(1), HEARTS)).toBe(false)
    expect(gradeCardSelection([...HEARTS, 'AS'], HEARTS)).toBe(false)
  })
})

describe('gradeCardDeck', () => {
  it('grades selection + count + probability together', () => {
    const answer = { cards: HEARTS, count: 13, probability: { num: 1, den: 4 } }
    expect(
      gradeCardDeck(answer, { selected: HEARTS, countInput: '13', fractionNum: '13', fractionDen: '52' }),
    ).toBe(true)
    // Wrong count fails even with a correct selection + fraction.
    expect(
      gradeCardDeck(answer, { selected: HEARTS, countInput: '12', fractionNum: '1', fractionDen: '4' }),
    ).toBe(false)
    // Wrong selection fails even with the right count + fraction.
    expect(
      gradeCardDeck(answer, { selected: HEARTS.slice(1), countInput: '13', fractionNum: '1', fractionDen: '4' }),
    ).toBe(false)
  })

  it('skips count/probability when the answer omits them', () => {
    expect(
      gradeCardDeck({ cards: HEARTS }, { selected: HEARTS, countInput: '', fractionNum: '', fractionDen: '' }),
    ).toBe(true)
  })
})
