-- Split legacy "contacted" into invite_sent / message_sent pipeline columns.

-- Companies with a sent/replied LinkedIn message → message_sent
update public.companies c
set stage = 'message_sent'
where c.stage in ('contacted', 'found', 'qualified', 'invite_sent')
  and exists (
    select 1 from public.outreach o
    where o.company_id = c.id
      and o.kind = 'message'
      and o.status in ('sent', 'replied')
  )
  and c.stage not in ('replied', 'call', 'opportunity', 'proposal', 'client', 'lost');

-- Companies with a pending/accepted invite (and no sent message) → invite_sent
update public.companies c
set stage = 'invite_sent'
where c.stage in ('contacted', 'found', 'qualified')
  and exists (
    select 1 from public.outreach o
    where o.company_id = c.id
      and o.kind = 'invite'
      and o.status in ('pending', 'accepted', 'queued')
  )
  and not exists (
    select 1 from public.outreach o
    where o.company_id = c.id
      and o.kind = 'message'
      and o.status in ('sent', 'replied')
  );

-- Any remaining legacy "contacted" rows → invite_sent
update public.companies
set stage = 'invite_sent'
where stage = 'contacted';
