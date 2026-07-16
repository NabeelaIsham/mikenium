import { Router } from 'express';
import { pool } from '../config/db.js';
const router=Router();
const serialize=row=>({id:row.id,title:row.title,slug:row.slug,excerpt:row.excerpt,category:row.category,authorName:row.author_name,authorTitle:row.author_title,authorBio:row.author_bio,authorAvatarUrl:row.author_avatar_url||'',coverImageUrl:row.cover_image_url||'',coverCaption:row.cover_caption,readingMinutes:Number(row.reading_minutes),tags:row.tags||[],blocks:row.content_blocks||[],seoTitle:row.seo_title,seoDescription:row.seo_description,featured:row.is_featured,publishedAt:row.published_at||row.scheduled_at,views:Number(row.views)});
const publicCondition=`(status='PUBLISHED' OR (status='SCHEDULED' AND scheduled_at<=now()))`;
router.get('/',async(req,res)=>{const {rows}=await pool.query(`SELECT * FROM blog_posts WHERE ${publicCondition} ORDER BY is_featured DESC,COALESCE(published_at,scheduled_at,created_at) DESC`);res.set('Cache-Control','no-store').json({blogs:rows.map(serialize)});});
router.get('/:slug',async(req,res)=>{const {rows}=await pool.query(`UPDATE blog_posts SET views=views+1 WHERE lower(slug)=lower($1) AND ${publicCondition} RETURNING *`,[req.params.slug]);if(!rows[0])return res.status(404).json({message:'Blog post not found'});res.set('Cache-Control','no-store').json({blog:serialize(rows[0])});});
export default router;
