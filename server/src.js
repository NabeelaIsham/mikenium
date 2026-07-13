import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import 'dotenv/config';
import authRoutes from './routes/auth.js'; import dashboardRoutes from './routes/dashboard.js';
const app=express(); app.set('trust proxy',1); app.use(helmet()); app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173'})); app.use(express.json({limit:'1mb'}));
app.get('/api/health',(req,res)=>res.json({status:'ok'})); app.use('/api/auth',authRoutes); app.use('/api/admin/dashboard',dashboardRoutes);
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:'Unexpected server error'});});
app.listen(process.env.PORT||5000,()=>console.log(`Mikenium API running on port ${process.env.PORT||5000}`));
