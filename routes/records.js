const router=require('express').Router();
const db=require('../db');
const validate=require('../validation');
router.param('id',(req,res,next,value)=>{
 const id=Number(value);
 if(!/^\d+$/.test(value)||!Number.isSafeInteger(id)||id<1)return res.status(400).json({message:'ID must be a positive whole number.'});
 req.recordId=id;next();
});
function fields(req,res,next){
 try{req.fields=Object.values(validate(req.body));next();}
 catch(error){res.status(400).json({message:error.message});}
}
function found(res,row){return row?res.json(row):res.status(404).json({message:'Request not found.'});}
router.get('/',(req,res)=>res.json(db.prepare('SELECT * FROM records ORDER BY id').all()));
router.get('/:id',(req,res)=>found(res,db.prepare('SELECT * FROM records WHERE id=?').get(req.recordId)));
router.post('/',fields,(req,res)=>res.status(201).json(db.prepare('INSERT INTO records(title,category,description,status) VALUES (?,?,?,?) RETURNING *').get(...req.fields)));
router.put('/:id',fields,(req,res)=>found(res,db.prepare('UPDATE records SET title=?,category=?,description=?,status=? WHERE id=? RETURNING *').get(...req.fields,req.recordId)));
router.delete('/:id',(req,res)=>found(res,db.prepare('DELETE FROM records WHERE id=?').run(req.recordId).changes?{message:'Record deleted.'}:null));
module.exports=router;