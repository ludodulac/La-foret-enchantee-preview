'use strict';
/*
 * STUDIO-035 — smoke test EXACT files deployed by GitHub Pages.
 * The microphone is a browser-generated oscillator. No real phone mic, no
 * Supabase connection, no account, no publication and no outgoing requests.
 * A fresh Chromium browser context leaves existing browser files untouched.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),
 path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../studio-v46');
function serve(req,res){
 const name=new URL(req.url||'/', 'http://127.0.0.1').pathname;
 if(name!=='/studio.html'&&!/^\/js\/[a-z0-9-]+\.js$/.test(name)){
   res.writeHead(404);res.end('not found');return;
 }
 const filepath=path.resolve(ROOT,name.slice(1));
 if(!filepath.startsWith(ROOT+path.sep)||!fs.existsSync(filepath)){
   res.writeHead(404);res.end('missing');return;
 }
 res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8','Cache-Control':'no-store'});
 res.end(fs.readFileSync(filepath));
}
const server=http.createServer(serve);
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.__studioFakeMedia=[];
    navigator.mediaDevices.getUserMedia=async()=>{
      const ctx=new AudioContext(),tone=ctx.createOscillator(),dest=ctx.createMediaStreamDestination();
      tone.frequency.value=523.25;tone.connect(dest);tone.start();await ctx.resume();
      window.__studioFakeMedia.push({stream:dest.stream,ctx});
      return dest.stream;
    };
  });
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1'&&url.port===String(port))return route.continue();
    throw Error('STUDIO-035 forbids external network: '+url.origin);
  });
  await page.goto('http://127.0.0.1:'+port+'/studio.html',{waitUntil:'load'});
  await page.waitForFunction(()=>/Crée ton premier projet/.test(document.querySelector('#project-library-status')?.textContent||''),null,{timeout:12000});
  assert.match(await page.title(),/STUDIO ESSAI 046/);
  await page.locator('#create-local-project').click();
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  assert.equal(await page.locator('#export-forest-ready').isDisabled(),true,'No publication possible');
  await page.locator('#record').click();
  await page.waitForFunction(()=>secureCaptureState==='recording',null,{timeout:12000});
  assert.equal(await page.locator('#recording-state').isVisible(),true);
  assert.equal(await page.locator('#play').isDisabled(),true);
  await page.waitForTimeout(2600);
  const capture=await page.evaluate(()=>({seconds:liveRec?.len,peaks:secureWavePeaks.length,clock:document.querySelector('#clock')?.textContent}));
  assert(capture.seconds>2&&capture.peaks>=40,JSON.stringify(capture));
  await page.locator('#stop').click();
  assert.equal(await page.evaluate(()=>window.__studioFakeMedia[0].stream.getAudioTracks()[0].readyState),'ended',
    'STOP must return actual microphone resource before finalizing');
  await page.waitForFunction(()=>secureCaptureState==='idle'&&clips.length===1,null,{timeout:18000});
  assert.equal(await page.locator('#tracks .clip').count(),1);
  await page.locator('#back-projects').click();
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#local-project-list .local-project-card'),null,{timeout:12000});
  await page.locator('#local-project-list .local-project-card').first().click();
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  assert.equal(await page.locator('#tracks .clip').count(),1,'A WAV clip survives reload');

  // Verify exact, deployed HTML, not just source PR: a 1-second delayed WAV
  // decode must finish BEFORE microphone acquisition and guide playback must
  // be scheduled in the same turn as capture activation.
  await page.locator('#addtrack').click();
  await page.locator('#track-controls [data-arm]').nth(1).click();
  await page.evaluate(()=>{
    setCursor(0,true);decodedSourceCache.clear();
    window.__previewMicOriginal=navigator.mediaDevices.getUserMedia;
    window.__previewMicRequests=0;
    navigator.mediaDevices.getUserMedia=(...args)=>{
      window.__previewMicRequests++;
      return window.__previewMicOriginal(...args);
    };
    const decode=ctx.decodeAudioData.bind(ctx);
    ctx.decodeAudioData=async(...args)=>{
      window.__previewDecodeStart=performance.now();
      await new Promise(resolve=>setTimeout(resolve,1100));
      window.__previewDecodeEnd=performance.now();
      return decode(...args);
    };
  });
  await page.locator('#record').click();
  await page.waitForTimeout(280);
  const preparation=await page.evaluate(()=>({
    status:secureOverdubPreparing,requests:window.__previewMicRequests,clips:clips.length
  }));
  assert.equal(preparation.status,true,'Guide must decode before mic acquisition');
  assert.equal(preparation.requests,0,'No mic request during guide decode');
  await page.waitForFunction(()=>secureCaptureState==='recording',null,{timeout:14000});
  const sync=await page.evaluate(()=>({
    requests:window.__previewMicRequests,
    decoderDurationMs:window.__previewDecodeEnd-window.__previewDecodeStart,
    sync:secureOverdubSync,monitorPlaying:playing,sources:sources.length
  }));
  assert.equal(sync.requests,1);
  assert(sync.decoderDurationMs>=900,'Delayed decoding was actually performed');
  assert(sync.sync?.guidePreparedBeforeMic===true);
  assert(sync.sync.monitorStartDelayMs<80,'Monitor source starts together with capture, not late');
  assert(sync.monitorPlaying&&sync.sources>0,'Existing track is audible during overdub');
  await page.waitForTimeout(2300);
  await page.locator('#stop').click();
  assert.equal(await page.evaluate(()=>window.__studioFakeMedia.at(-1).stream.getAudioTracks()[0].readyState),'ended');
  await page.waitForFunction(()=>secureCaptureState==='idle'&&clips.length===2,null,{timeout:16000});
  const starts=await page.evaluate(()=>clips.map(c=>({track:c.track,start:c.start,len:c.len})));
  assert.equal(starts[0].start,0);
  assert.equal(starts[1].start,0);
  assert.notEqual(starts[0].track,starts[1].track);
  await page.locator('#back-projects').click();
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#local-project-list .local-project-card'),null,{timeout:12000});
  await page.locator('#local-project-list .local-project-card').first().click();
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  assert.equal(await page.locator('#tracks .clip').count(),2,'Both synchronized WAV clips persist after reload');
  console.log('STUDIO-035 PREVIEW OVERDUB SYNC PASS '+JSON.stringify({preparation,sync,starts}));

  assert.deepEqual(errors,[],'No JavaScript runtime errors');
  console.log('STUDIO-035 PASS — deployed preview: no external network, real WebAudio synthetic mic, visible WAV, immediate STOP release, OPFS+IndexedDB persistence, synchronous overdub, no remote publication '+JSON.stringify(capture));
 }finally{
  try{await browser?.close()}catch{}
  if(server.listening)await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error('STUDIO-035 FAIL',e);process.exitCode=1});
