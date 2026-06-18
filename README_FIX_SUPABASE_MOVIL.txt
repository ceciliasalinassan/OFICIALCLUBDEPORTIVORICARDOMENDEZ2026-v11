Corrección aplicada:
- En celular se fuerza conexión a Supabase.
- Se cargan tablas reales del sistema: settings, sponsors, news, gallery, fixture_images, presidents, directors, standings y results.
- Se guardan datos en localStorage y se re-renderiza la página.
- Función manual en consola: rmForzarSupabaseMovil().

{
  "fix_supabase_movil": true,
  "carga_forzada_movil": true,
  "incluye_supabase_cdn": true,
  "funcion_manual": "rmForzarSupabaseMovil",
  "app_js_ok": true,
  "admin_js_ok": true,
  "menos_de_100_archivos": true,
  "cantidad_archivos": 29,
  "sin_rutas_faltantes": true,
  "rutas_faltantes": {
    "index.html": [],
    "admin.html": [],
    "admin-simple.html": []
  }
}