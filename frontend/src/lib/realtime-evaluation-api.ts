import type { RealtimeEvaluationRequest, RealtimeEvaluationResponse } from './realtime-evaluation-contracts';

export async function runRealtimeEvaluation(
  request: RealtimeEvaluationRequest,
): Promise<RealtimeEvaluationResponse> {
  const response = await fetch('/api/realtime-evaluation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`realtime evaluation request failed: ${response.status}`);
  }

  return (await response.json()) as RealtimeEvaluationResponse;
}
