from fastapi import HTTPException, status, Depends
from datetime import datetime, timezone

# Kendi projendeki Supabase bağlantısını buraya import etmeyi unutma!
# Örnek: from database import supabase

async def check_premium_limit(user_id: str):
    """
    Kullanıcının premium olup olmadığını kontrol eder.
    Premium değilse günlük analiz limitini sorgular.
    """

    # 1. Kullanıcının profilinden is_premium durumunu kontrol et
    profile_response = supabase.table("profiles").select("is_premium").eq("id", user_id).single().execute()

    is_premium = profile_response.data.get("is_premium", False) if profile_response.data else False

    # Kullanıcı premium ise limiti hiç kontrol etme, kapıları aç!
    if is_premium:
        return True

    # 2. Premium değilse, bugünün başlangıç saatini (gece 00:00) al
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    # 3. analysis_history tablosunda kullanıcının bugünkü kayıtlarını sadece "say"
    scans_response = supabase.table("analysis_history") \
        .select("id", count="exact") \
        .eq("user_id", user_id) \
        .gte("created_at", today_start) \
        .execute()

    daily_count = scans_response.count or 0

    # 4. Limite ulaşıldıysa HTTP 403 hatası fırlat
    FREE_LIMIT = 3
    if daily_count >= FREE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Günlük ücretsiz analiz limitinize ulaştınız. Sınırsız kullanım için DermaGlow Premium'a geçin!"
        )

    return True