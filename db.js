const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
const filename=path.resolve(__dirname,process.env.DATABASE_PATH||'data/deskline.sqlite');
fs.mkdirSync(path.dirname(filename),{recursive:true});
const db=new DatabaseSync(filename);
db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
try {
 const script=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
 db.exec(script('schema.sql'));
 if(!db.prepare("SELECT 1 FROM migrations WHERE name='initial-demo'").get()){
   db.exec(script('seed.sql'));
   db.exec("INSERT INTO migrations VALUES ('initial-demo')");
 }
 db.exec('COMMIT');
} catch(error){db.exec('ROLLBACK');throw error;}
module.exports=db;