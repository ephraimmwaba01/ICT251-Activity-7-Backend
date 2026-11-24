const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {fork}=require('node:child_process');
const {once}=require('node:events');
test('API contract, database persistence and empty database restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'deskline-test-'));
 let child,base;
 async function start(){
  child=fork(path.join(__dirname,'fixture.cjs'),[],{env:{...process.env,DATABASE_PATH:path.join(dir,'test.db')},silent:true});
  const [[port]]=await Promise.all([once(child,'message')]);base='http://127.0.0.1:'+port;
 }
 async function stop(){if(child&&child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}child=null;}
 async function call(method,route,expected,body){
  const response=await fetch(base+route,{method,...(body!==undefined?{headers:{'Content-Type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)}:{})});
  assert.equal(response.status,expected,method+' '+route);const json=await response.json();if(expected>=400)assert.ok(json.message);return json;
 }
 try{
  await start();assert.equal((await call('GET','/health',200)).database,'ready');
  assert.equal((await call('GET','/api/records',200)).length,8);
  const data={id:999,title:'  Test monitor  ',description:'Screen flickers in lab.',category:'Hardware',status:'Pending'};
  const saved=await call('POST','/api/records',201,data);assert.notEqual(saved.id,999);assert.equal(saved.title,'Test monitor');
  const route='/api/records/'+saved.id;
  await stop();await start();assert.deepEqual(await call('GET',route,200),saved);
  const updated=await call('PUT',route,200,{...data,status:'Completed'});assert.equal(updated.id,saved.id);assert.equal(updated.status,'Completed');
  for(const invalid of [{...data,status:'Open'},{...data,title:'  '},{...data,title:5},{...data,description:'a'.repeat(301)},{...data,category:'x'},{title:'Missing fields'}])await call('POST','/api/records',400,invalid);
  await call('POST','/api/records',400,'{broken');
  for(const id of ['-1','0','1.5','abc'])await call('GET','/api/records/'+id,400);
  assert.equal((await call('DELETE',route,200)).message,'Record deleted.');
  for(const method of ['GET','PUT','DELETE'])await call(method,route,404,method==='PUT'?data:undefined);
  await call('GET','/unknown',404);
  const cors=await fetch(base+'/api/records',{method:'OPTIONS',headers:{Origin:'http://localhost:5500','Access-Control-Request-Method':'PUT'}});
  assert.equal(cors.headers.get('access-control-allow-origin'),'http://localhost:5500');
  for(const record of await call('GET','/api/records',200))await call('DELETE','/api/records/'+record.id,200);
  await stop();await start();assert.deepEqual(await call('GET','/api/records',200),[]);
 }finally{await stop();fs.rmSync(dir,{recursive:true,force:true});}
});