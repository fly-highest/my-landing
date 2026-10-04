// Supabase 연결 설정 (공개해도 되는 값만 넣습니다)
const SUPABASE_URL = 'https://ccwjelsogvjswbawenyo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5EcuyDUJ60uxwTsKZ3Obcg_jIhuL4WS';

// 토스페이먼츠 결제위젯 공개 테스트 키 (테스트 모드: 실제 돈이 나가지 않음)
const TOSS_CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

const ADMIN_EMAIL = 'admin@admin.com';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
