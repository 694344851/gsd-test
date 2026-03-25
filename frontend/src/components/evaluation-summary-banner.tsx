export interface EvaluationSummaryBannerProps {
  status: 'loading' | 'success' | 'timeout' | 'error';
  assistiveNotice: string;
  elapsedMs?: number;
}

const STATUS_COPY: Record<EvaluationSummaryBannerProps['status'], string> = {
  loading: '系统正在整理当前病历的辅助评估，请稍候。',
  success: '本次诊鉴已返回结构化辅助评估结果，请结合临床判断审阅。',
  timeout: '本次诊鉴在时限内未返回完整结果，请医生决定是否稍后重试。',
  error: '本次诊鉴未能完成，请核对病历内容后再试。',
};

export function EvaluationSummaryBanner({
  status,
  assistiveNotice,
  elapsedMs,
}: EvaluationSummaryBannerProps) {
  const heading =
    status === 'loading'
      ? '诊鉴进行中'
      : status === 'success'
        ? '辅助评估结果'
        : status === 'timeout'
          ? '诊鉴响应超时'
          : '诊鉴执行失败';

  return (
    <div className="module-state" role="status" aria-live="polite">
      <h3 className="module-state__heading">{heading}</h3>
      <p className="module-state__body">{STATUS_COPY[status]}</p>
      <p className="module-state__body">{assistiveNotice}</p>
      {elapsedMs !== undefined ? <p className="module-state__body">返回耗时 {elapsedMs} ms</p> : null}
    </div>
  );
}
