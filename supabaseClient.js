// Cliente Global do Supabase
window.supabaseClientObj = null;

if (window.ENV && window.ENV.SUPABASE_URL && window.ENV.SUPABASE_ANON_KEY && !window.ENV.SUPABASE_URL.includes("COLE_SUA_URL_AQUI")) {
    window.supabaseClientObj = window.supabase.createClient(window.ENV.SUPABASE_URL, window.ENV.SUPABASE_ANON_KEY);
    console.log("Supabase Client Initialized.");
} else {
    console.warn("ATENÇÃO: Configuração do Supabase ausente. O sistema funcionará com os dados de demonstração locais até as chaves serem configuradas em env.js.");
}
