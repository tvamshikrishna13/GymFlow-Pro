require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "Public")));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});
const asyncRoute = fn => (req,res)=>Promise.resolve(fn(req,res)).catch(err=>res.status(500).json({error:err.code==="ER_DUP_ENTRY"?"That email already exists.":err.message}));

app.get("/api/dashboard", asyncRoute(async(req,res)=>{
 const [[m]]=await pool.query("SELECT COUNT(*) total FROM members");
 const [[t]]=await pool.query("SELECT COUNT(*) total FROM trainers");
 const [[p]]=await pool.query("SELECT COUNT(*) total FROM membership_plans");
 const [[s]]=await pool.query("SELECT COUNT(*) total FROM subscriptions WHERE end_date>=CURDATE() AND payment_status='Paid'");
 const [recent]=await pool.query(`SELECT s.subscription_id,m.name member_name,p.plan_name,s.start_date,s.end_date,s.payment_status FROM subscriptions s JOIN members m ON m.member_id=s.member_id JOIN membership_plans p ON p.plan_id=s.plan_id ORDER BY s.subscription_id DESC LIMIT 6`);
 const [[revenue]]=await pool.query(`SELECT COALESCE(SUM(p.fee),0) total FROM subscriptions s JOIN membership_plans p ON p.plan_id=s.plan_id WHERE s.payment_status='Paid'`);
 const [expiring]=await pool.query(`SELECT m.name member_name,p.plan_name,s.end_date FROM subscriptions s JOIN members m ON m.member_id=s.member_id JOIN membership_plans p ON p.plan_id=s.plan_id WHERE s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) ORDER BY s.end_date LIMIT 5`);
 res.json({members:m.total,trainers:t.total,plans:p.total,active:s.total,recent,revenue:revenue.total,expiring});
}));

const configs={
 members:{table:"members",pk:"member_id",fields:["name","email","phone","join_date","status","trainer_id"],select:`SELECT m.*,t.trainer_name FROM members m LEFT JOIN trainers t ON t.trainer_id=m.trainer_id`,order:"m.member_id",joins:true},
 trainers:{table:"trainers",pk:"trainer_id",fields:["trainer_name","email","phone","specialization"]},
 plans:{table:"membership_plans",pk:"plan_id",fields:["plan_name","duration_months","fee","description"]},
 subscriptions:{table:"subscriptions",pk:"subscription_id",fields:["member_id","plan_id","start_date","end_date","payment_status"],select:`SELECT s.*,m.name member_name,p.plan_name FROM subscriptions s JOIN members m ON m.member_id=s.member_id JOIN membership_plans p ON p.plan_id=s.plan_id`,order:"s.subscription_id",joins:true}
};
for(const [resource,c] of Object.entries(configs)){
 const baseSelect=c.select||`SELECT * FROM ${c.table}`;
 app.get(`/api/${resource}`,asyncRoute(async(req,res)=>{
   const [rows]=await pool.query(`${baseSelect} ORDER BY ${c.order||c.pk} DESC`);res.json(rows);
 }));
 app.get(`/api/${resource}/:id`,asyncRoute(async(req,res)=>{
   const [rows]=await pool.query(`${baseSelect} WHERE ${c.joins?c.pk.replace(/^/,'') : c.pk}=?`,[req.params.id]);
   if(!rows.length)return res.status(404).json({error:"Record not found."});res.json(rows[0]);
 }));
 app.post(`/api/${resource}`,asyncRoute(async(req,res)=>{
   const vals=c.fields.map(f=>req.body[f]??null);
   if(c.fields.some((f,i)=>["name","trainer_name","plan_name","member_id","plan_id","start_date","end_date","duration_months","fee"].includes(f)&& (vals[i]===null||vals[i]==="")))return res.status(400).json({error:"Please complete all required fields."});
   const [r]=await pool.query(`INSERT INTO ${c.table} (${c.fields.join(",")}) VALUES (${c.fields.map(()=>"?").join(",")})`,vals);
   res.status(201).json({message:"Record added successfully.",id:r.insertId});
 }));
 app.put(`/api/${resource}/:id`,asyncRoute(async(req,res)=>{
   const vals=c.fields.map(f=>req.body[f]??null);
   const [r]=await pool.query(`UPDATE ${c.table} SET ${c.fields.map(f=>`${f}=?`).join(",")} WHERE ${c.pk}=?`,[...vals,req.params.id]);
   if(!r.affectedRows)return res.status(404).json({error:"Record not found."});
   res.json({message:"Record updated successfully."});
 }));
 app.delete(`/api/${resource}/:id`,asyncRoute(async(req,res)=>{
   const [r]=await pool.query(`DELETE FROM ${c.table} WHERE ${c.pk}=?`,[req.params.id]);
   if(!r.affectedRows)return res.status(404).json({error:"Record not found."});
   res.json({message:"Record deleted successfully."});
 }));
}
app.get("/api/options",asyncRoute(async(req,res)=>{
 const [[members],[trainers],[plans]]=await Promise.all([
  pool.query("SELECT member_id id,name label FROM members ORDER BY name"),
  pool.query("SELECT trainer_id id,trainer_name label FROM trainers ORDER BY trainer_name"),
  pool.query("SELECT plan_id id,plan_name label FROM membership_plans ORDER BY plan_name")
 ]);
 res.json({members,trainers,plans});
}));
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"Public","index.html")));
const PORT=3000;
app.listen(PORT,()=>console.log(`GymFlow running at http://localhost:${PORT}`));
