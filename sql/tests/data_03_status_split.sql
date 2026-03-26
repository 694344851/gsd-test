begin;

do $$
declare
  split_row record;
begin
  with scoped_cases as (
    select
      encounter.encounter_id,
      case_row.evaluation_state
    from analytics.fact_outpatient_encounter encounter
    join analytics.mart_case_evaluation case_row
      on case_row.encounter_id = encounter.encounter_id
    where (encounter.encounter_at at time zone 'Asia/Shanghai')::date between date '2026-03-17' and date '2026-03-23'
  )
  select
    count(*)::bigint as outpatient_count,
    count(*) filter (where evaluation_state = 'not_triggered')::bigint as not_triggered_count,
    count(*) filter (where evaluation_state = 'success')::bigint as success_count,
    count(*) filter (where evaluation_state = 'failed')::bigint as failed_count,
    count(*) filter (where evaluation_state = 'timeout')::bigint as timeout_count
  into split_row
  from scoped_cases;

  if split_row.outpatient_count <> 4 then
    raise exception 'Expected outpatient_count=4, found %', split_row.outpatient_count;
  end if;

  if split_row.not_triggered_count <> 1 then
    raise exception 'Expected not_triggered_count=1, found %', split_row.not_triggered_count;
  end if;

  if split_row.success_count <> 1 then
    raise exception 'Expected success_count=1, found %', split_row.success_count;
  end if;

  if split_row.failed_count <> 1 then
    raise exception 'Expected failed_count=1, found %', split_row.failed_count;
  end if;

  if split_row.timeout_count <> 1 then
    raise exception 'Expected timeout_count=1, found %', split_row.timeout_count;
  end if;

  if split_row.not_triggered_count = split_row.not_triggered_count + split_row.failed_count + split_row.timeout_count then
    raise exception 'failed/timeout must not be folded into not_triggered_count';
  end if;
end $$;

rollback;
