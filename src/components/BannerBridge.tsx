import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Public banners remain independent of the legacy Firebase marketplace session. */
export function BannerBridge({ document: embeddedDocument }: { document: Document }) {
  useEffect(() => {
    let active = true;
    let latest: unknown[] | null = null;
    const send = () => {
      if (active && latest) embeddedDocument.dispatchEvent(new CustomEvent('basera-banners-updated', { detail: latest }));
    };
    const refresh = async () => {
      const { data, error } = await supabase.from('home_banners')
        .select('id,image_url,link,alt,sort_order,active')
        .eq('active', true).order('sort_order').order('created_at');
      if (!active || error) return;
      latest = data;
      send();
    };
    embeddedDocument.addEventListener('basera-banners-ready', send);
    void refresh();
    const timer = window.setInterval(() => { if (!window.document.hidden) void refresh(); }, 30000);
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      embeddedDocument.removeEventListener('basera-banners-ready', send);
    };
  }, [embeddedDocument]);
  return null;
}