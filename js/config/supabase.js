import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const SUPABASE_URL = "https://shnnalvcztkeoqlxlueh.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_fewNAvh28cE5FMkb1vr_6Q_vQHH_a8E";


export const db = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);