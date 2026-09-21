#!/usr/bin/env python3
import json, os, time, uuid, hashlib, secrets, hmac
from datetime import datetime, timezone, timedelta
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parent; DATA=ROOT/'data.json'; ARCHIVE=ROOT/'archive'; BACKUPS=ROOT/'backups'; PORT=int(os.environ.get('MECH_CLOCK_PORT','8787'))
def now(): return datetime.now(timezone.utc).isoformat()
def fresh():
 return {'version':6,'createdAt':now(),'updatedAt':now(),'users':{},'sessions':{},'techs':{},'presets':{'work':['Oil change','Rotate tires','Brakes','Alignment','Change tires','Flat repair','Replace bulbs','Replace filters','Torque tires','Diagnostic','Road test','Inspection','Battery','Wipers','Mount/balance','TPMS','Cleanup'],'downtime':['Wait for part','Wait for RO/approval','Advisor/customer','Drink','Snack','Bathroom','Tool run','Bay cleanup','Parts counter','Lift/setup wait','Double Torque'],'breaks':['Lunch','Break'],'book':{}}}
def fresh_tech():
 return {'activeShift':None,'days':{},'schedule':{},'lastArchive':None,'laborRate':0,'goals':{'targetEfficiencyPct':95}}
def day(): return datetime.now(timezone.utc).date().isoformat()

def hash_pw(password,salt_hex=None):
 salt=bytes.fromhex(salt_hex) if salt_hex else secrets.token_bytes(16)
 h=hashlib.pbkdf2_hmac('sha256',password.encode('utf-8'),salt,120000)
 return salt.hex(),h.hex()
def verify_pw(password,salt_hex,hash_hex):
 if not salt_hex or not hash_hex: return False
 _,h=hash_pw(password,salt_hex)
 return hmac.compare_digest(h,hash_hex)
def valid_username(u):
 return bool(u) and 2<=len(u)<=24 and all(c.isalnum() or c in '_-' for c in u)
def new_session(s,username):
 token=secrets.token_hex(24); s.setdefault('sessions',{})[token]={'username':username,'createdAt':now()}; return token
def session_username(s,token):
 if not token: return None
 rec=s.get('sessions',{}).get(token); return rec.get('username') if rec else None
def first_user_role(s): return 'admin' if not s.get('users') else 'tech'
def client_view(s,username):
 u=s.get('users',{}).get(username,{}); tech=s.get('techs',{}).get(username) or fresh_tech()
 return {'version':s.get('version'),'updatedAt':s.get('updatedAt'),'me':{'username':username,'role':u.get('role','tech'),'laborRate':tech.get('laborRate',0),'goals':tech.get('goals',{})},'activeShift':tech.get('activeShift'),'days':tech.get('days',{}),'schedule':tech.get('schedule',{}),'lastArchive':tech.get('lastArchive'),'presets':s.get('presets',{})}

def dur_ms(a,b):
 if not a: return 0
 try:
  aa=datetime.fromisoformat(str(a).replace('Z','+00:00')); bb=datetime.fromisoformat(str(b or now()).replace('Z','+00:00')); return max(0,int((bb-aa).total_seconds()*1000))
 except Exception: return 0
def month_key(ts=None):
 try:
  dt=datetime.fromisoformat((ts or now()).replace('Z','+00:00'))
 except Exception:
  dt=datetime.now(timezone.utc)
 return dt.strftime('%Y-%m')
def archive_snapshot(tech,book,username):
 mk=month_key(); folder=ARCHIVE/mk/username; folder.mkdir(parents=True,exist_ok=True)
 stamp=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H-%M-%SZ')
 snapshot=folder/(f'torqueclock-{stamp}.json'); summary=folder/'monthly-summary.json'
 jobs=[]; shifts=0; work_ms=wait_ms=break_ms=billed_ms=0; comebacks=0
 for dayrec in tech.get('days',{}).values():
  if not str(dayrec.get('date','')).startswith(mk): continue
  for sh in dayrec.get('shifts',[]):
   shifts+=1
   for b in sh.get('breaks',[]): break_ms+=dur_ms(b.get('start'),b.get('end'))
   for j in sh.get('jobs',[]):
    if j.get('comeback'): comebacks+=1
    js={'id':j.get('id'),'vehicle':j.get('vehicle'),'title':j.get('title'),'ro':j.get('ro'),'start':j.get('start'),'end':j.get('end'),'status':j.get('status'),'comeback':j.get('comeback',False),'tasks':[]}
    for t in j.get('tasks',[]):
     tms=sum(dur_ms(seg.get('start'),seg.get('end')) for seg in t.get('segments',[])); work_ms+=tms
     bms=int(float(book.get(t.get('label'),0) or 0)*3600000)
     if t.get('status')=='done' and bms: billed_ms+=bms
     js['tasks'].append({'label':t.get('label'),'status':t.get('status'),'ms':tms,'bookMs':bms})
    for w in j.get('waits',[]): wait_ms+=dur_ms(w.get('start'),w.get('end'))
    jobs.append(js)
 eff=round(billed_ms/work_ms*100,1) if work_ms else None
 payload={'exportedAt':now(),'month':mk,'source':'TorqueClock','tech':username,'state':{'days':tech.get('days',{})}}
 snapshot.write_text(json.dumps(payload,indent=2))
 summary.write_text(json.dumps({'updatedAt':now(),'month':mk,'tech':username,'shifts':shifts,'jobs':len(jobs),'comebacks':comebacks,'workMs':work_ms,'waitMs':wait_ms,'breakMs':break_ms,'billedMs':billed_ms,'laborRate':tech.get('laborRate',0),'dollarsBilled':round(billed_ms/3600000*tech.get('laborRate',0),2),'efficiencyPct':eff,'jobRows':jobs},indent=2))
 return {'month':mk,'snapshot':str(snapshot.relative_to(ROOT)),'summary':str(summary.relative_to(ROOT)),'jobs':len(jobs),'shifts':shifts}
def rotate_daily_backup(raw_text):
 try:
  BACKUPS.mkdir(exist_ok=True)
  dest=BACKUPS/f'data-{day()}.json'
  if not dest.exists(): dest.write_text(raw_text)
  cutoff=datetime.now(timezone.utc).date().toordinal()-14
  for f in BACKUPS.glob('data-*.json'):
   try:
    d=datetime.fromisoformat(f.stem.split('data-',1)[1]).date()
    if d.toordinal()<cutoff: f.unlink()
   except Exception: pass
 except Exception: pass
def save(s):
 s['updatedAt']=now()
 if DATA.exists():
  try:
   prev=DATA.read_text(); DATA.with_name('data.prev.json').write_text(prev); rotate_daily_backup(prev)
  except Exception: pass
 tmp=DATA.with_suffix('.tmp'); tmp.write_text(json.dumps(s,indent=2)); tmp.replace(DATA)
def normalize_job(j):
 j.setdefault('tasks',[]); j.setdefault('waits',[]); j.setdefault('notes',[]); j.setdefault('segments',[]); j.setdefault('status','active' if j.get('end') is None else 'done')
 j.setdefault('make',''); j.setdefault('model',''); j.setdefault('trim',''); j.setdefault('year','')
 j.setdefault('comeback',False); j.setdefault('comebackNote','')
 if not j.get('vehicle'):
  j['vehicle']=' '.join(str(x).strip() for x in [j.get('year'),j.get('make'),j.get('model'),j.get('trim')] if str(x).strip())
 if not j['tasks']:
  labels=[]
  for seg in j.get('segments',[]):
   if seg.get('type')=='work' and seg.get('label') not in labels: labels.append(seg.get('label') or 'Work')
  if not labels: labels=[j.get('title') or 'Shop job']
  j['tasks']=[{'id':str(uuid.uuid4()),'label':x,'status':'queued','segments':[]} for x in labels]
 return j
def load():
 if not DATA.exists():
  s=fresh(); save(s); return s
 try: s=json.loads(DATA.read_text())
 except Exception:
  bak=DATA.with_suffix('.corrupt-%d.json'%int(time.time())); DATA.rename(bak); s=fresh(); s['recoveredFrom']=bak.name; save(s); return s
 base=fresh()
 s.setdefault('users',{}); s.setdefault('sessions',{}); s.setdefault('techs',{}); s.setdefault('presets',base['presets'])
 migrated=False
 for bucket in ('work','downtime','breaks'):
  s['presets'].setdefault(bucket,base['presets'][bucket])
 s['presets'].setdefault('book',{})
 for item in base['presets']['downtime']:
  if item not in s['presets']['downtime']:
   s['presets']['downtime'].append(item); migrated=True
 if not s['techs'] and ('days' in s or 'activeShift' in s or 'schedule' in s):
  s['techs']['CAK3D']={'activeShift':s.pop('activeShift',None),'days':s.pop('days',{}),'schedule':s.pop('schedule',{}),'lastArchive':s.pop('lastArchive',None),'laborRate':0,'goals':{'targetEfficiencyPct':95}}
  migrated=True
 s.pop('days',None); s.pop('activeShift',None); s.pop('schedule',None); s.pop('lastArchive',None)
 s['version']=6
 for uname,tech in s['techs'].items():
  tech.setdefault('activeShift',None); tech.setdefault('days',{}); tech.setdefault('schedule',{}); tech.setdefault('lastArchive',None); tech.setdefault('laborRate',0)
  tech.setdefault('goals',{}); tech['goals'].setdefault('targetEfficiencyPct',95)
  for k,rec in list(tech.get('schedule',{}).items()):
   if isinstance(rec,list): rec={'date':k,'status':'work','note':'','items':rec}; tech['schedule'][k]=rec
   rec.setdefault('date',k); rec.setdefault('status','work'); rec.setdefault('note',''); rec.setdefault('startTime','08:00'); rec.setdefault('endTime','17:00'); rec.setdefault('items',[])
  for d in tech['days'].values():
   for sh in d.get('shifts',[]):
    sh.setdefault('breaks',[]); sh.setdefault('lunches',[]); sh.setdefault('jobs',[]); sh.setdefault('notes',[])
    for j in sh.get('jobs',[]): normalize_job(j)
  if tech.get('activeShift') and tech['activeShift'].get('id'):
   aid=tech['activeShift']['id']
   for d in tech['days'].values():
    for i,sh in enumerate(d.get('shifts',[])):
     if sh.get('id')==aid:
      merged={**sh,**tech['activeShift']}; merged.setdefault('breaks',[])
      for j in merged.get('jobs',[]): normalize_job(j)
      d['shifts'][i]=merged; tech['activeShift']=merged
 if migrated: save(s)
 return s
def today(tech):
 k=day(); tech['days'].setdefault(k,{'date':k,'shifts':[],'notes':[]}); return tech['days'][k]
def clean_date(v):
 v=(v or day()).strip() if isinstance(v,str) else day()
 try:
  datetime.fromisoformat(v[:10]); return v[:10]
 except Exception: return day()
def clean_time(v,default=''):
 v=(v or default or '').strip() if isinstance(v,str) else (default or '')
 if not v: return ''
 try:
  datetime.strptime(v,'%H:%M'); return v
 except Exception: return default or ''
def today_schedule(tech,date_value=None):
 k=clean_date(date_value); tech.setdefault('schedule',{}); tech['schedule'].setdefault(k,{'date':k,'status':'work','note':'','startTime':'08:00','endTime':'17:00','items':[]}); return tech['schedule'][k]
def find_schedule_item(tech,item_id):
 for rec in tech.get('schedule',{}).values():
  for item in rec.get('items',[]):
   if item.get('id')==item_id: return item
 return None
def mark_schedule_done(tech,schedule_id,job_id=None):
 item=find_schedule_item(tech,schedule_id)
 if item:
  item['status']='done'; item['completedAt']=now()
  if job_id: item['jobId']=job_id
 return item
def active_job(sh):
 if not sh: return None
 for j in reversed(sh.get('jobs',[])):
  if j.get('end') is None and j.get('status','active')!='hold': return normalize_job(j)
def held_jobs(sh):
 if not sh: return []
 return [normalize_job(j) for j in sh.get('jobs',[]) if j.get('end') is None and j.get('status')=='hold']
def find_job(sh,jid):
 if not sh: return None
 for j in sh.get('jobs',[]):
  if j.get('id')==jid: return normalize_job(j)
def active_task(j):
 if not j: return None
 for t in j.get('tasks',[]):
  if t.get('segments') and t['segments'][-1].get('end') is None: return t
def find_task(j,tid):
 if not j: return None
 for t in j.get('tasks',[]):
  if t.get('id')==tid: return t
def close_task(t,at):
 if t and t.get('segments') and t['segments'][-1].get('end') is None: t['segments'][-1]['end']=at
def close_wait(j,at):
 if j and j.get('waits') and j['waits'][-1].get('end') is None: j['waits'][-1]['end']=at
def close_break(sh,at):
 if sh and sh.get('breaks') and sh['breaks'][-1].get('end') is None: sh['breaks'][-1]['end']=at
def resume_task(j,tid,at):
 if not j or not tid: return False
 t=find_task(j,tid)
 if not t or t.get('status')=='done': return False
 close_wait(j,at); close_task(active_task(j),at); t['status']='running'; t.setdefault('segments',[]).append({'id':str(uuid.uuid4()),'start':at,'end':None}); return True
def mutate(s,p,username):
 tech=s['techs'].setdefault(username,fresh_tech())
 a=p.get('action'); at=now(); d=today(tech); sched=today_schedule(tech,p.get('date')); sh=tech.get('activeShift')
 if a=='startShift':
  if sh: return False,'Shift already running'
  sh={'id':str(uuid.uuid4()),'start':at,'end':None,'breaks':[],'lunches':[],'jobs':[],'notes':[],'label':p.get('label','Work shift')}; tech['activeShift']=sh; d['shifts'].append(sh)
 elif a=='stopShift':
  if not sh: return False,'No active shift'
  close_break(sh,at)
  for j in sh.get('jobs',[]):
   if j.get('end') is None:
    close_wait(j,at); close_task(active_task(j),at); j['end']=at; j['status']='done'
    if j.get('scheduleId'): mark_schedule_done(tech,j.get('scheduleId'),j.get('id'))
  sh['end']=at; tech['activeShift']=None
  info=archive_snapshot(tech,s['presets'].get('book',{}),username); tech['lastArchive']=info
 elif a in ('startLunch','startBreak'):
  if not sh: return False,'Start work first'
  kind='Lunch' if a=='startLunch' else ((p.get('label') or 'Break').strip() or 'Break')
  j=active_job(sh); t=active_task(j); sh['resumeJobId']=j.get('id') if j else ''; sh['resumeTaskId']=t.get('id') if t else ''; close_wait(j,at); close_task(t,at)
  rec={'id':str(uuid.uuid4()),'label':kind,'start':at,'end':None}; sh.setdefault('breaks',[]).append(rec)
  if kind=='Lunch': sh.setdefault('lunches',[]).append({'id':rec['id'],'start':at,'end':None})
 elif a in ('endLunch','endBreak'):
  if not sh: return False,'No active shift'
  open_break=None
  for b in reversed(sh.get('breaks',[])):
   if b.get('end') is None: open_break=b; break
  if not open_break: return False,'No break/lunch running'
  open_break['end']=at
  for l in sh.get('lunches',[]):
   if l.get('id')==open_break.get('id') and l.get('end') is None: l['end']=at
  j=find_job(sh,sh.get('resumeJobId')) or active_job(sh); resume_task(j,sh.get('resumeTaskId'),at); sh['resumeJobId']=''; sh['resumeTaskId']=''
 elif a=='startJob':
  if not sh: return False,'Start work first'
  old=active_job(sh); oldt=active_task(old); close_wait(old,at); close_task(oldt,at)
  if old:
   if len(held_jobs(sh))>=3: return False,'Hold/finish one of the 3 parked vehicles first'
   old['resumeTaskId']=oldt.get('id') if oldt else old.get('resumeTaskId',''); old['status']='hold'; old['heldAt']=at
  title=(p.get('title') or '').strip() or 'Shop job'; items=[x.strip() for x in p.get('items',[]) if str(x).strip()]
  if not items: items=[title]
  make=(p.get('make') or '').strip(); model=(p.get('model') or '').strip(); trim=(p.get('trim') or '').strip(); year=(p.get('year') or '').strip(); vehicle=(p.get('vehicle') or '').strip() or ' '.join(x for x in [year,make,model,trim] if x)
  tasks=[{'id':str(uuid.uuid4()),'label':x,'status':'queued','segments':[]} for x in items]
  j={'id':str(uuid.uuid4()),'vehicle':vehicle,'make':make,'model':model,'trim':trim,'year':year,'ro':(p.get('ro') or '').strip(),'title':title,'category':(p.get('category') or '').strip(),'scheduleId':(p.get('scheduleId') or '').strip(),'start':at,'end':None,'status':'active','tasks':tasks,'waits':[],'segments':[],'notes':[]}; sh['jobs'].append(j)
  if j.get('scheduleId'):
   item=find_schedule_item(tech,j.get('scheduleId'))
   if item: item['status']='active'; item['startedAt']=at; item['jobId']=j['id']
 elif a=='setScheduleDay':
  rec=today_schedule(tech,p.get('date')); rec['status']=(p.get('status') or 'work').strip() or 'work'; rec['note']=(p.get('note') or '').strip(); rec['startTime']=clean_time(p.get('startTime'),rec.get('startTime','08:00')); rec['endTime']=clean_time(p.get('endTime'),rec.get('endTime','17:00'))
 elif a=='addRecurringSchedule':
  status=(p.get('status') or 'work').strip() or 'work'; note=(p.get('note') or '').strip(); start_time=clean_time(p.get('startTime'),'08:00'); end_time=clean_time(p.get('endTime'),'17:00'); weeks=max(1,min(104,int(p.get('weeks') or 26))); weekdays=set(int(x) for x in p.get('weekdays',[]) if str(x).isdigit())
  start=datetime.fromisoformat(clean_date(p.get('startDate'))).date()
  for i in range(weeks*7):
   dd=start+timedelta(days=i)
   if dd.weekday() in weekdays:
    rec=today_schedule(tech,dd.isoformat())
    if rec.get('status') not in ('holiday','vacation','time off'):
     rec['status']=status; rec['note']=note; rec['startTime']=start_time; rec['endTime']=end_time
 elif a=='addScheduledWorkOrder':
  items=[x.strip() for x in p.get('items',[]) if str(x).strip()]
  title=(p.get('title') or '').strip() or (items[0] if items else 'Shop job')
  if not items: items=[title]
  category=(p.get('category') or 'General Service').strip() or 'General Service'
  make=(p.get('make') or '').strip(); model=(p.get('model') or '').strip(); trim=(p.get('trim') or '').strip(); year=(p.get('year') or '').strip(); vehicle=(p.get('vehicle') or '').strip() or ' '.join(x for x in [year,make,model,trim] if x) or 'Vehicle TBD'
  item={'id':str(uuid.uuid4()),'date':clean_date(p.get('date')),'category':category,'vehicle':vehicle,'year':year,'make':make,'model':model,'trim':trim,'ro':(p.get('ro') or '').strip(),'title':title,'items':items,'notes':(p.get('notes') or '').strip(),'status':'queued','createdAt':at}
  sched.setdefault('items',[]).append(item)
 elif a=='deleteScheduledWorkOrder':
  item_id=p.get('itemId'); removed=False
  for rec in tech.get('schedule',{}).values():
   before=len(rec.get('items',[])); rec['items']=[x for x in rec.get('items',[]) if x.get('id')!=item_id]; removed=removed or len(rec['items'])!=before
  if not removed: return False,'Scheduled W/O not found'
 elif a=='startScheduledWorkOrder':
  if not sh: return False,'Start work first'
  item=find_schedule_item(tech,p.get('itemId'))
  if not item: return False,'Scheduled W/O not found'
  if item.get('status')=='done': return False,'Scheduled W/O already finished'
  old=active_job(sh); oldt=active_task(old); close_wait(old,at); close_task(oldt,at)
  if old:
   if len(held_jobs(sh))>=3: return False,'Hold/finish one of the 3 parked vehicles first'
   old['resumeTaskId']=oldt.get('id') if oldt else old.get('resumeTaskId',''); old['status']='hold'; old['heldAt']=at
  items=[x.strip() for x in item.get('items',[]) if str(x).strip()] or [item.get('title') or 'Shop job']
  tasks=[{'id':str(uuid.uuid4()),'label':x,'status':'queued','segments':[]} for x in items]
  j={'id':str(uuid.uuid4()),'vehicle':item.get('vehicle') or 'Vehicle','make':item.get('make',''),'model':item.get('model',''),'trim':item.get('trim',''),'year':item.get('year',''),'ro':item.get('ro',''),'title':item.get('title') or 'Shop job','category':item.get('category',''),'scheduleId':item.get('id'),'start':at,'end':None,'status':'active','tasks':tasks,'waits':[],'segments':[],'notes':[]}
  sh['jobs'].append(j); item['status']='active'; item['startedAt']=at; item['jobId']=j['id']
 elif a=='holdJob':
  if not sh: return False,'Start work first'
  j=active_job(sh)
  if not j: return False,'No active job to hold'
  if len(held_jobs(sh))>=3: return False,'Already holding 3 vehicles'
  t=active_task(j); j['resumeTaskId']=t.get('id') if t else j.get('resumeTaskId',''); close_wait(j,at); close_task(t,at); j['status']='hold'; j['heldAt']=at
 elif a=='resumeJob':
  if not sh: return False,'Start work first'
  target=find_job(sh,p.get('jobId'))
  if not target or target.get('status')!='hold' or target.get('end') is not None: return False,'Held vehicle not found'
  old=active_job(sh); close_wait(old,at); close_task(active_task(old),at)
  if old: old['status']='hold'; old['heldAt']=at
  target['status']='active'; target['resumedAt']=at; resume_task(target,target.get('resumeTaskId'),at); target['resumeTaskId']=''
 elif a=='endJob':
  j=active_job(sh)
  if not j: return False,'No active job'
  close_wait(j,at); close_task(active_task(j),at); j['end']=at; j['status']='done'
  if j.get('scheduleId'): mark_schedule_done(tech,j.get('scheduleId'),j.get('id'))
 elif a=='startTask':
  j=active_job(sh); t=find_task(j,p.get('taskId'))
  if not t: return False,'Pick a job item first'
  close_wait(j,at); close_task(active_task(j),at); t['status']='running'; t.setdefault('segments',[]).append({'id':str(uuid.uuid4()),'start':at,'end':None})
 elif a=='pauseTask':
  j=active_job(sh); t=find_task(j,p.get('taskId')) or active_task(j)
  if not t: return False,'No running item to pause'
  close_task(t,at); t['status']='paused'
 elif a=='continueTask':
  j=active_job(sh); t=find_task(j,p.get('taskId'))
  if not t: return False,'Pick an item to continue'
  close_wait(j,at); close_task(active_task(j),at); t['status']='running'; t.setdefault('segments',[]).append({'id':str(uuid.uuid4()),'start':at,'end':None})
 elif a=='stopTask':
  j=active_job(sh); t=find_task(j,p.get('taskId')) or active_task(j)
  if not t: return False,'No item to stop'
  close_task(t,at); t['status']='done'
 elif a=='startWait':
  j=active_job(sh)
  if not j: return False,'Start a job first'
  t=active_task(j); close_task(t,at); close_wait(j,at); label=(p.get('label') or 'Wait').strip() or 'Wait'; j.setdefault('waits',[]).append({'id':str(uuid.uuid4()),'label':label,'start':at,'end':None,'resumeTaskId':t.get('id') if t else ''})
 elif a=='deleteTask':
  j=active_job(sh) or find_job(sh,p.get('jobId'))
  if not j and sh:
   for jj in sh.get('jobs',[]):
    if find_task(jj,p.get('taskId')): j=jj; break
  if not j: return False,'No job found'
  tid=p.get('taskId'); before=len(j.get('tasks',[])); j['tasks']=[t for t in j.get('tasks',[]) if t.get('id')!=tid]
  if len(j['tasks'])==before: return False,'W/O item not found'
 elif a=='deleteJob':
  jid=p.get('jobId'); pools=[]
  for dd in tech.get('days',{}).values(): pools.extend(dd.get('shifts',[]))
  before=sum(len(x.get('jobs',[])) for x in pools if x)
  for x in pools:
   if x: x['jobs']=[j for j in x.get('jobs',[]) if j.get('id')!=jid]
  after=sum(len(x.get('jobs',[])) for x in pools if x)
  if after==before: return False,'Vehicle/job not found'
 elif a=='setComeback':
  jid=p.get('jobId'); found=None
  for dd in tech.get('days',{}).values():
   for shx in dd.get('shifts',[]):
    for j in shx.get('jobs',[]):
     if j.get('id')==jid: found=j
  if not found: return False,'Job not found'
  found['comeback']=bool(p.get('comeback')); found['comebackNote']=(p.get('note') or '').strip()
 elif a=='editShift':
  sid=p.get('shiftId'); target=None
  for dd in tech.get('days',{}).values():
   for x in dd.get('shifts',[]):
    if x.get('id')==sid: target=x
  if not target: return False,'Clock record not found'
  start=(p.get('start') or '').strip(); end=(p.get('end') or '').strip()
  if start: target['start']=start
  target['end']=end or None
  if tech.get('activeShift') and tech['activeShift'].get('id')==sid:
   tech['activeShift']=target if target.get('end') is None else None
  target['status']='active' if target.get('end') is None else 'done'
 elif a=='deleteShift':
  sid=p.get('shiftId'); removed=False
  for dd in tech.get('days',{}).values():
   before=len(dd.get('shifts',[])); dd['shifts']=[x for x in dd.get('shifts',[]) if x.get('id')!=sid]; removed=removed or len(dd.get('shifts',[]))!=before
  if tech.get('activeShift') and tech['activeShift'].get('id')==sid: tech['activeShift']=None
  if not removed: return False,'Clock record not found'
 elif a=='endWait':
  j=active_job(sh)
  if not j or not j.get('waits') or j['waits'][-1].get('end') is not None: return False,'No wait running'
  tid=j['waits'][-1].get('resumeTaskId'); close_wait(j,at); resume_task(j,tid,at)
 elif a=='startSegment':
  j=active_job(sh)
  if not j: return False,'Start a job first'
  typ=p.get('type','work'); label=(p.get('label') or '').strip() or 'Work'
  if typ=='downtime':
   close_task(active_task(j),at); close_wait(j,at); j.setdefault('waits',[]).append({'id':str(uuid.uuid4()),'label':label,'start':at,'end':None})
  else:
   t={'id':str(uuid.uuid4()),'label':label,'status':'running','segments':[{'id':str(uuid.uuid4()),'start':at,'end':None}]}; close_task(active_task(j),at); j.setdefault('tasks',[]).append(t)
 elif a=='setBookRate':
  label=(p.get('label') or '').strip()
  if not label: return False,'No operation label'
  try: hrs=float(p.get('hours'))
  except (TypeError,ValueError): hrs=0
  book=s['presets'].setdefault('book',{})
  if hrs>0: book[label]=round(hrs,2)
  else: book.pop(label,None)
 elif a=='setLaborRate':
  try: rate=float(p.get('rate'))
  except (TypeError,ValueError): rate=0
  tech['laborRate']=max(0,round(rate,2))
 elif a=='setGoal':
  try: pct=float(p.get('targetEfficiencyPct'))
  except (TypeError,ValueError): pct=0
  tech.setdefault('goals',{})['targetEfficiencyPct']=max(0,round(pct,1))
 elif a=='changePassword':
  cur=p.get('current') or ''; new=p.get('new') or ''
  u=s['users'].get(username)
  if not u or not verify_pw(cur,u.get('passSalt',''),u.get('passHash','')): return False,'Current password is incorrect'
  if len(new)<6: return False,'New password must be at least 6 characters'
  u['passSalt'],u['passHash']=hash_pw(new)
 elif a=='archiveSnapshot':
  info=archive_snapshot(tech,s['presets'].get('book',{}),username); tech['lastArchive']=info
 elif a=='addNote':
  txt=(p.get('text') or '').strip()
  if not txt: return False,'Empty note'
  note={'id':str(uuid.uuid4()),'at':at,'text':txt}; j=active_job(sh)
  (j.setdefault('notes',[]) if p.get('target')=='job' and j else sh.setdefault('notes',[]) if sh else d.setdefault('notes',[])).append(note)
 else: return False,'Unknown action'
 save(s); return True,'ok'
class H(BaseHTTPRequestHandler):
 def log_message(self,format,*args): print('%s - %s'%(self.address_string(),format%args),flush=True)
 def sendx(self,code,body,ctype='application/json',head=False):
  raw=body if isinstance(body,bytes) else (json.dumps(body).encode() if ctype=='application/json' else str(body).encode()); self.send_response(code); self.send_header('Content-Type',ctype); self.send_header('Cache-Control','no-store' if ctype=='application/json' else 'public, max-age=60'); self.send_header('Content-Length',str(len(raw))); self.end_headers();
  if not head: self.wfile.write(raw)
 def token(self): return self.headers.get('X-Session-Token','')
 def read_json(self):
  try: return json.loads(self.rfile.read(int(self.headers.get('Content-Length','0') or 0)) or b'{}')
  except Exception: return None
 def state_response(self,head=False):
  s=load(); username=session_username(s,self.token())
  if not username: return self.sendx(401,{'ok':False,'message':'Not logged in'},head=head)
  return self.sendx(200,client_view(s,username),head=head)
 def static_response(self,p,head=False):
  if p.startswith('/api/state'): return self.state_response(head=head)
  if p.startswith('/health'): return self.sendx(200,{'ok':True,'port':PORT},head=head)
  if p=='/': p='/index.html'
  f=(ROOT/'public'/p.lstrip('/')).resolve(); base=(ROOT/'public').resolve()
  if not str(f).startswith(str(base)) or not f.exists(): return self.sendx(404,'Not found','text/plain',head=head)
  c={'html':'text/html','css':'text/css','js':'application/javascript','svg':'image/svg+xml','webmanifest':'application/manifest+json'}.get(f.name.split('.')[-1],'text/plain')
  self.sendx(200,f.read_bytes(),c,head=head)
 def do_HEAD(self): return self.static_response(urlparse(self.path).path,head=True)
 def do_GET(self): return self.static_response(urlparse(self.path).path)
 def do_POST(self):
  path=urlparse(self.path).path
  body=self.read_json()
  if body is None: return self.sendx(400,{'ok':False,'error':'bad json'})
  if path=='/api/register':
   u=(body.get('username') or '').strip(); pw=body.get('password') or ''
   if not valid_username(u): return self.sendx(400,{'ok':False,'message':'Username must be 2-24 letters, numbers, - or _'})
   if len(pw)<6: return self.sendx(400,{'ok':False,'message':'Password must be at least 6 characters'})
   s=load()
   if any(k.upper()==u.upper() for k in s.get('users',{})): return self.sendx(400,{'ok':False,'message':'Username already taken'})
   role=first_user_role(s); salt,h=hash_pw(pw); s.setdefault('users',{})[u]={'passSalt':salt,'passHash':h,'role':role,'createdAt':now()}
   s.setdefault('techs',{}).setdefault(u,fresh_tech())
   token=new_session(s,u); save(s)
   return self.sendx(200,{'ok':True,'token':token,'username':u,'state':client_view(s,u)})
  if path=='/api/login':
   u=(body.get('username') or '').strip(); pw=body.get('password') or ''
   s=load(); match=next((k for k in s.get('users',{}) if k.upper()==u.upper()),None)
   rec=s.get('users',{}).get(match) if match else None
   if not rec or not verify_pw(pw,rec.get('passSalt',''),rec.get('passHash','')): return self.sendx(401,{'ok':False,'message':'Wrong username or password'})
   token=new_session(s,match); save(s)
   return self.sendx(200,{'ok':True,'token':token,'username':match,'state':client_view(s,match)})
  if path=='/api/logout':
   s=load(); s.get('sessions',{}).pop(self.token(),None); save(s)
   return self.sendx(200,{'ok':True})
  if path=='/api/action':
   s=load(); username=session_username(s,self.token())
   if not username: return self.sendx(401,{'ok':False,'message':'Not logged in'})
   ok,msg=mutate(s,body,username)
   return self.sendx(200 if ok else 400,{'ok':ok,'message':msg,'state':client_view(load(),username)})
  return self.sendx(404,{'ok':False,'error':'not found'})
if __name__=='__main__':
 print(f'TorqueClock listening on 0.0.0.0:{PORT}',flush=True); ThreadingHTTPServer(('0.0.0.0',PORT),H).serve_forever()
