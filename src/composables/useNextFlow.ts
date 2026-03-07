import { computed } from 'vue'

import flowsData from '../data/flows.json'
import type { Flow } from '../types/data'

import { useLog } from './useLog'

const flows = flowsData as Flow[]

/**
 * Returns the next flow to practice based on the round-robin rule:
 * find the flow_id of the most recent execution and return the next flow in order.
 * Wraps around to the first flow if the last execution was on the last flow.
 * Returns the first flow when there are no executions.
 */
export function useNextFlow() {
  const log = useLog()

  const nextFlow = computed<Flow | null>(() => {
    if (flows.length === 0) return null

    const { executions } = log.value
    if (executions.length === 0) return flows[0] ?? null

    const lastExecution = executions.at(-1)!
    const lastFlowIndex = flows.findIndex((f) => f.flow_id === lastExecution.flow_id)

    if (lastFlowIndex === -1) return flows[0] ?? null

    const nextIndex = (lastFlowIndex + 1) % flows.length
    return flows[nextIndex] ?? null
  })

  return nextFlow
}
