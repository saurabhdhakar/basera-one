CREATE TABLE public.home_banners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 image_url text NOT NULL,
 link text NOT NULL DEFAULT '',
 alt text NOT NULL DEFAULT 'Basera banner',
 sort_order integer NOT NULL DEFAULT 0,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT home_banners_image_url CHECK (image_url ~ '^https://' OR image_url ~ '^/[^/]'),
 CONSTRAINT home_banners_link CHECK (link = '' OR link ~ '^https?://' OR link ~ '^/[^/]')
);
GRANT SELECT ON public.home_banners TO anon, authenticated;
GRANT ALL ON public.home_banners TO service_role;
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active home banners" ON public.home_banners FOR SELECT TO anon, authenticated USING (active = true);