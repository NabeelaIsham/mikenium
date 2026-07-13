import { Router } from 'express'; import { requireSuperAdmin } from '../middleware/auth.js';
const router=Router();
router.get('/',requireSuperAdmin,async(req,res)=>res.json({totals:{users:1248,clients:342,projects:156,products:72,blogs:48},system:{activeUsers:892,activeClients:245,runningProjects:78,supportTickets:16,messages:23}}));
export default router;
