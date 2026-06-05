-- =====================================================
-- Wastra — seed data
-- Dijalankan setelah semua migration. Idempotent.
-- =====================================================

-- Singleton row untuk ai_agent_settings.
-- Kolom lain pakai default dari definisi tabel (gpt-4o-mini, 1024, 0.7).
insert into public.ai_agent_settings (id) values (1)
  on conflict (id) do nothing;

-- Seed default prompt + suggested prompts untuk row singleton.
-- Idempotent: pakai coalesce supaya nilai yang sudah di-set admin tidak ditimpa.
update public.ai_agent_settings
set
  greeting_message = coalesce(
    greeting_message,
    'Halo! Saya Wastra AI. Tanyakan apa saja soal wisata Bali — saya punya data kepadatan real-time dan bisa bantu rekomendasi waktu terbaik berkunjung.'
  ),
  fallback_message = coalesce(
    fallback_message,
    'Maaf, saya tidak bisa memberikan respons saat ini. Coba tanyakan lagi dengan kata lain ya.'
  ),
  suggested_prompts = case
    when array_length(suggested_prompts, 1) is null or array_length(suggested_prompts, 1) = 0 then array[
      'Destinasi mana yang paling sepi sekarang?',
      'Rekomendasi pantai untuk sunset yang tidak ramai',
      'Kapan waktu terbaik ke Uluwatu minggu ini?',
      'Bandingkan Tanah Lot vs Uluwatu',
      'Tempat tersembunyi (hidden gem) di Bali',
      'Prediksi kepadatan weekend ini'
    ]
    else suggested_prompts
  end
where id = 1;

-- =====================================================
-- Bootstrap admin pertama (MANUAL, bukan bagian dari seed otomatis)
-- =====================================================
-- 1. Daftar akun di app lewat /auth (email + password).
-- 2. Ambil UUID-mu:
--      select id, email from auth.users where email = 'EMAIL_KAMU';
-- 3. Masukkan sebagai admin:
--      insert into public.admins (user_id) values ('UUID_DARI_STEP_2');
