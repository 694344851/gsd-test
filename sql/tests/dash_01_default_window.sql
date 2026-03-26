begin;

do $$
declare
  resolved record;
  am_count bigint;
  pm_count bigint;
  label_count bigint;
  mapped_label text;
begin
  select *
    into resolved
  from analytics.resolve_time_window('last_3_months', date '2026-03-24');

  if resolved.range_start_date <> date '2025-12-22'
     or resolved.range_end_date <> date '2026-03-23'
     or resolved.bucket_grain <> 'week' then
    raise exception
      'Expected last_3_months window 2025-12-22..2026-03-23/week, got %..%/%',
      resolved.range_start_date,
      resolved.range_end_date,
      resolved.bucket_grain;
  end if;

  select case
           when (sample_ts at time zone 'Asia/Shanghai')::time < time '12:00:00' then 'AM'
           else 'PM'
         end
    into mapped_label
  from (values (timestamptz '2026-03-20 00:00:00+08')) as sample(sample_ts);
  if mapped_label <> 'AM' then
    raise exception '00:00:00 should map to AM, found %', mapped_label;
  end if;

  select case
           when (sample_ts at time zone 'Asia/Shanghai')::time < time '12:00:00' then 'AM'
           else 'PM'
         end
    into mapped_label
  from (values (timestamptz '2026-03-20 11:59:59+08')) as sample(sample_ts);
  if mapped_label <> 'AM' then
    raise exception '11:59:59 should map to AM, found %', mapped_label;
  end if;

  select case
           when (sample_ts at time zone 'Asia/Shanghai')::time < time '12:00:00' then 'AM'
           else 'PM'
         end
    into mapped_label
  from (values (timestamptz '2026-03-20 12:00:00+08')) as sample(sample_ts);
  if mapped_label <> 'PM' then
    raise exception '12:00:00 should map to PM, found %', mapped_label;
  end if;

  select case
           when (sample_ts at time zone 'Asia/Shanghai')::time < time '12:00:00' then 'AM'
           else 'PM'
         end
    into mapped_label
  from (values (timestamptz '2026-03-20 23:59:59+08')) as sample(sample_ts);
  if mapped_label <> 'PM' then
    raise exception '23:59:59 should map to PM, found %', mapped_label;
  end if;

  select count(*)
    into am_count
  from analytics.get_trend_series('last_7_days', date '2026-03-24')
  where "bucketLabel" = '2026-03-20 AM'
    and "outpatientCount" = 1;
  if am_count <> 1 then
    raise exception 'Expected 2026-03-20 AM bucket with outpatientCount=1, found % rows', am_count;
  end if;

  select count(*)
    into pm_count
  from analytics.get_trend_series('last_7_days', date '2026-03-24')
  where "bucketLabel" = '2026-03-21 PM'
    and "outpatientCount" = 1;
  if pm_count <> 1 then
    raise exception 'Expected 2026-03-21 PM bucket with outpatientCount=1, found % rows', pm_count;
  end if;

  select count(*)
    into label_count
  from analytics.get_trend_series('last_7_days', date '2026-03-24')
  where "bucketLabel" in ('2026-03-20 AM', '2026-03-21 PM');
  if label_count <> 2 then
    raise exception 'Expected deterministic shift labels in trend output, found % matching rows', label_count;
  end if;
end $$;

rollback;
