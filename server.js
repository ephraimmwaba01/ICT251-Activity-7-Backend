const express=require('express');
const path=require('node:path');
const db=require('./db');
const app=express();
const allowed=(process.env.CLIENT_ORIGINS||'http://localhost:5500,http://127.0.0.1:5500').split(',').map(s=>s.trim());
app.use((req,res,next)=>{
 res.vary('Origin');
 if(allowed.includes(req.headers.origin)){
   res.set('Access-Control-Allow-Origin',req.headers.origin);
   res.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
   res.set('Access-Control-Allow-Headers','Content-Type');
 }
 if(req.method==='OPTIONS')return res.sendStatus(204);
 next();
});
app.use(express.json({limit:'16kb'}));
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'guide.html')));
app.get('/health',(req,res)=>{try{db.prepare('SELECT id FROM records LIMIT 1').get();res.json({status:'ok',database:'ready'});}catch{res.status(503).json({message:'Database unavailable.'});}});
app.use('/api/records',require('./routes/records'));
app.use('/demo',express.static(path.join(__dirname,'../activity6-frontend')));
app.use('/desk',express.static(path.join(__dirname,'../activity8-integrated')));
app.use((req,res)=>res.status(404).json({message:'Route not found.'}));
app.use((error,req,res,next)=>{
 if(error.type==='entity.parse.failed'||error.type==='entity.too.large')return res.status(400).json({message:'Send a valid JSON record of the expected size.'});
 console.error(error);res.status(500).json({message:'The server could not complete the request.'});
});
module.exports=app;
if(require.main===module)app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('IT Support Desk running on port '+(process.env.PORT||3000)));