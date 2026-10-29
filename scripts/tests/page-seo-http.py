import argparse,concurrent.futures,json,urllib.request,urllib.error
args=argparse.ArgumentParser(description='Read-only production HTML SEO verification')
args.add_argument('--base-url',default='http://127.0.0.1:3100')
args.add_argument('--output')
options=args.parse_args()
from html.parser import HTMLParser
class Parser(HTMLParser):
 def __init__(self):
  super().__init__();self.result={'titles':[],'descriptions':[],'canonicals':[],'alternates':[],'robots':[],'h1':[],'schemas':[]};self.capture=None;self.buf='';self.in_head=False;self.head_metadata={'titles':[],'descriptions':[],'canonicals':[],'alternates':[]}
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='head':self.in_head=True
  if t in ('title','h1'):self.capture=t;self.buf=''
  if t=='script' and a.get('type')=='application/ld+json':self.capture='schema';self.buf=''
  if t=='meta' and a.get('name')=='description':
   self.result['descriptions'].append(a.get('content'))
   if self.in_head:self.head_metadata['descriptions'].append(a.get('content'))
  if t=='meta' and a.get('name')=='robots':self.result['robots'].append(a.get('content'))
  if t=='link' and a.get('rel')=='canonical':
   self.result['canonicals'].append(a.get('href'))
   if self.in_head:self.head_metadata['canonicals'].append(a.get('href'))
  if t=='link' and a.get('rel')=='alternate':
   entry={'language':a.get('hreflang'),'url':a.get('href')}
   self.result['alternates'].append(entry)
   if self.in_head:self.head_metadata['alternates'].append(entry)
 def handle_data(self,d):
  if self.capture:self.buf+=d
 def handle_endtag(self,t):
  if t=='head':self.in_head=False
  if t=='title' and self.capture=='title' and self.in_head:self.head_metadata['titles'].append(self.buf.strip())
  if t==self.capture:
   self.result['titles' if t=='title' else 'h1'].append(self.buf.strip());self.capture=None
  if t=='script' and self.capture=='schema':
   try:self.result['schemas'].append(json.loads(self.buf))
   except ValueError:self.result['schemas'].append('INVALID JSON')
   self.capture=None
paths=['catalog','catalog?category=aparate-cardio','catalog?category=aparate-cardio&subcategory=banda-alergat','catalog?category=nonexistent-seo-audit','brands/insportline','brands/nonexistent-seo-audit','about','contacts','turnkey-solutions','maintenance-service','terms-of-cooperation','delivery-terms','privacy-policy','catalog?category=aparate-cardio&brand=inSPORTline','brands/insportline?page=2','brands/insportline?page=99999','catalog?page=99999']
def check(path):
 try:
  r=urllib.request.urlopen(options.base_url.rstrip('/')+path,timeout=60);status=r.status
 except urllib.error.HTTPError as e:r=e;status=e.code
 p=Parser();p.feed(r.read().decode());return {'path':path,'status':status,**p.result,'head_metadata':p.head_metadata}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 results=list(pool.map(check,['/'+lang+'/'+p for lang in ['ro','ru'] for p in paths]))
if options.output:open(options.output,'w').write(json.dumps(results,ensure_ascii=False,indent=2))
for result in results:
 if result['status']==200:
  assert all(len(result[key])==1 for key in ['titles','descriptions','canonicals','h1']),result['path']
  assert len(result['alternates'])==3,result['path']
  assert result['descriptions'][0] and result['descriptions'][0].strip(),result['path']
  assert all(result['head_metadata'][key]==result[key] for key in result['head_metadata']),result['path']
 else:assert result['status']==404 and any('noindex' in value for value in result['robots']),result

for r in results:print(json.dumps({k:r[k] for k in ['path','status','titles','canonicals','robots','h1']},ensure_ascii=False))
