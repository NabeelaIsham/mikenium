UPDATE site_settings
SET social = COALESCE(social,'{}'::jsonb)
  - CASE WHEN social->>'facebook'='https://www.facebook.com/' THEN 'facebook' ELSE '' END
  - CASE WHEN social->>'instagram'='https://www.instagram.com/' THEN 'instagram' ELSE '' END
  - CASE WHEN social->>'linkedin'='https://www.linkedin.com/' THEN 'linkedin' ELSE '' END
  - CASE WHEN social->>'tiktok'='https://www.tiktok.com/' THEN 'tiktok' ELSE '' END
  - CASE WHEN social->>'youtube'='https://www.youtube.com/' THEN 'youtube' ELSE '' END,
    others = jsonb_set(COALESCE(others,'{}'::jsonb),'{showSystemStatus}','false'::jsonb,true),
    updated_at = now()
WHERE id=1;
