const PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Culinary Step 7E final verification</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:42rem;margin:3rem auto;padding:0 1rem;line-height:1.5}
    button{padding:.65rem 1rem;margin:.5rem .5rem .5rem 0}
    pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f4f4;padding:1rem;border-radius:.5rem}
  </style>
</head>
<body>
<main>
  <h1>Step 7E final verification</h1>
  <p>Short verifier for the already-materialized protected 500-record pilot. This page cannot run the 50-chunk bootstrap loop.</p>
  <div id="google-button"></div>
  <button id="copy-status" type="button">Copy result</button>
  <pre id="status" aria-live="polite">Loading…</pre>
</main>
<script>
const statusNode=document.getElementById('status');
const show=v=>{statusNode.textContent=typeof v==='string'?v:JSON.stringify(v,null,2)};
let terminalStarted=false;
async function requestJson(url,options={},timeoutMs=10000){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const response=await fetch(url,{...options,signal:controller.signal});const body=await response.json().catch(()=>({error:'NON_JSON_RESPONSE'}));return{status:response.status,...body};}
  catch(error){return{status:0,ok:false,error:error?.name==='AbortError'?'STEP7E_REQUEST_TIMEOUT':'STEP7E_NETWORK_ERROR'};}
  finally{clearTimeout(timer)}
}
function fail(code,detail){const error=new Error(code);error.detail=detail;throw error}
async function copyStatus(){const text=statusNode.textContent||'';if(!text)return;try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}const b=document.getElementById('copy-status');b.textContent='Copied';setTimeout(()=>b.textContent='Copy result',1200)}
async function runFinal(){
  if(terminalStarted)return;terminalStarted=true;
  const evidence={step:'7E',target:'PROTECTED_500_FORKRECIPE_SOURCE_PILOT_FINAL'};
  try{
    show('Step 7E: verifying authenticated session…');
    const preflight=await requestJson('/api/protected-canary',{cache:'no-store',credentials:'same-origin'});
    evidence.sessionPreflight={status:preflight.status,ok:preflight.ok,authenticated:preflight.authenticated===true,error:preflight.error||null,reason:preflight.reason||null};
    if(!(preflight.status===200&&preflight.ok===true&&preflight.authenticated===true))fail('STEP7E_AUTHENTICATED_SESSION_PREFLIGHT_FAILED',evidence.sessionPreflight);

    show('Step 7E: auditing existing 500-record pilot…');
    const audit=await requestJson('/api/step7e-pilot',{cache:'no-store',credentials:'same-origin'});
    evidence.audit={status:audit.status,ok:audit.ok,ready:audit.ready,error:audit.error||null,bootstrapRequired:audit.bootstrapRequired===true,recipeCount:audit.recipeCount??null,expectedRecipeCount:audit.expectedRecipeCount??500,chunkCount:audit.chunkCount??null,expectedChunkCount:audit.expectedChunkCount??50,totalBodyBytes:audit.totalBodyBytes??null,expectedTotalBodyBytes:audit.expectedTotalBodyBytes??5115695,fingerprint:audit.fingerprint??null,expectedFingerprint:audit.expectedFingerprint??'2aa8106f7521f9cf3f6c2f9ece13d328272f8400f90f4ae79b8cdc4750b5d8b6',metadataValidation:audit.metadataValidation??null,metrics:audit.metrics??null};
    if(!(audit.status===200&&audit.ok===true&&audit.ready===true&&audit.recipeCount===500&&audit.chunkCount===50&&audit.fingerprint==='2aa8106f7521f9cf3f6c2f9ece13d328272f8400f90f4ae79b8cdc4750b5d8b6'&&audit.terminalCandidate==='STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS'))fail('STEP7E_FINAL_AUDIT_FAILED',evidence.audit);

    show('Step 7E: verifying protected sample…');
    const sample=await requestJson('/api/step7e-pilot?sample=1',{cache:'no-store',credentials:'same-origin'});
    if(!(sample.status===200&&sample.ok===true&&sample.protectedDataReturned===true))fail('STEP7E_PROTECTED_SAMPLE_FAILED',{status:sample.status,error:sample.error||null});
    const boundaries=sample.sample?.packet?.boundaries||{};
    if(!(boundaries.recommendationEligible===false&&boundaries.publicRuntimeActivationAuthorized===false&&boundaries.sourceNutritionImportedAsAuthority===false))fail('STEP7E_PROTECTED_BOUNDARY_WEAKENED',boundaries);
    evidence.sample={status:sample.status,protectedDataReturned:true,sourceItemId:sample.sample?.sourceItemId,bodyBytes:sample.sample?.bodyBytes,packetSha256:sample.sample?.packetSha256,boundaries,metrics:sample.metrics};

    show('Step 7E: verifying Free-limit fail-closed behavior…');
    const limited=await requestJson('/api/step7e-pilot?simulate=free-limit',{cache:'no-store',credentials:'same-origin'});
    evidence.freeLimit={status:limited.status,ok:limited.ok,error:limited.error,protectedDataReturned:limited.protectedDataReturned,pilotQueries:limited.metrics?.pilotQueries??null};
    if(!(limited.status===503&&limited.ok===false&&limited.error==='STEP7E_FREE_LIMIT_FAIL_CLOSED'&&limited.protectedDataReturned===false&&limited.metrics?.pilotQueries===0))fail('STEP7E_FREE_LIMIT_DID_NOT_FAIL_CLOSED',evidence.freeLimit);

    show('Step 7E: verifying unauthenticated denial…');
    const unauth=await requestJson('/api/step7e-pilot',{cache:'no-store',credentials:'omit'});
    evidence.unauthenticated={status:unauth.status,error:unauth.error,reason:unauth.reason};
    if(!(unauth.status===401&&unauth.ok===false))fail('STEP7E_UNAUTHENTICATED_ROUTE_DID_NOT_FAIL_CLOSED',evidence.unauthenticated);

    evidence.canaryPass=true;evidence.terminalState='STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS';show(evidence);
  }catch(error){evidence.canaryPass=false;evidence.error=error?.message||'STEP7E_FINAL_VERIFICATION_FAILED';evidence.detail=error?.detail||null;show(evidence)}
}
function handleGoogleCredential(response){
  const credential=typeof response?.credential==='string'?response.credential:'';
  if(!credential){show({status:400,authenticated:false,error:'INVALID_CREDENTIAL'});return}
  show('Verifying Google identity and committing the session…');
  const form=document.createElement('form');form.method='POST';form.action='/api/auth/google-redirect';form.enctype='application/x-www-form-urlencoded';form.style.display='none';
  const c=document.createElement('input');c.type='hidden';c.name='credential';c.value=credential;form.appendChild(c);
  const i=document.createElement('input');i.type='hidden';i.name='intent';i.value='step7e';form.appendChild(i);
  document.body.appendChild(form);form.submit();
}
async function initializeGoogle(){
  if(terminalStarted)return;
  const session=await requestJson('/api/auth/session',{cache:'no-store',credentials:'same-origin'});
  if(session.status===200&&session.authenticated===true){await runFinal();return}
  const config=await requestJson('/api/auth/config',{cache:'no-store',credentials:'same-origin'});
  if(!config.ok){show(config);return}
  google.accounts.id.initialize({client_id:config.clientId,callback:handleGoogleCredential,auto_select:false,cancel_on_tap_outside:true});
  google.accounts.id.renderButton(document.getElementById('google-button'),{type:'standard',theme:'outline',size:'large',text:'signin_with'});
  show({status:401,authenticated:false,action:'SIGN_IN_WITH_GOOGLE_ONCE'});
}
document.getElementById('copy-status').addEventListener('click',copyStatus);
window.initializeGoogle=initializeGoogle;
</script>
<script src="https://accounts.google.com/gsi/client" async defer onload="initializeGoogle()"></script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(PAGE, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'cross-origin-opener-policy': 'same-origin-allow-popups',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff'
    }
  });
}
