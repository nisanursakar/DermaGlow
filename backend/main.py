from fastapi import FastAPI, HTTPException, Form, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import Depends
import os
import requests
import base64
import time
import json
import io
import re
from PIL import Image
from contextlib import asynccontextmanager
from ultralytics import YOLO
from datetime import date

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load YOLO model on startup
    model_path = os.path.join(os.path.dirname(__file__), "model", "best.pt")
    try:
        if os.path.exists(model_path):
            app.state.model = YOLO(model_path)
            print("✅ YOLO model loaded successfully.")
        else:
            app.state.model = None
            print("❌ YOLO model not found at", model_path)
    except Exception as e:
        app.state.model = None
        print(f"❌ Error loading YOLO model: {e}")
    yield
    # Cleanup
    app.state.model = None

app = FastAPI(title="DermaGlow Backend", description="FastAPI Backend connected to Supabase", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("=== DOCKER ENV DEBUG ===")
print(f"SUPABASE_URL: '{SUPABASE_URL}'")
print(f"SUPABASE_KEY: '{SUPABASE_KEY}'")
print("========================")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase configuration in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- YENİ EKLENEN LİMİT BEKÇİSİ (Doğrudan main.py içinde) ---
def check_premium_limit(user_id: str):
    try:
        # 1. Kullanıcının premium durumunu kontrol et
        profile_response = supabase.table("profiles").select("is_premium").eq("id", user_id).execute()
        if profile_response.data:
            is_premium = profile_response.data[0].get("is_premium", False)
            if is_premium:
                return True # Premium kullanıcı, sınır yok

        # 2. Premium değilse bugünkü analiz sayısını bul
        today = date.today().isoformat()
        res = supabase.table("analysis_results").select("id", count="exact").eq("user_id", user_id).gte("created_at", today).execute()

        count = res.count if res.count is not None else len(res.data)

        if count >= 3:
            raise HTTPException(status_code=403, detail="Günlük ücretsiz analiz limitinize ulaştınız.")

        return True
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print("Limit kontrol hatası:", e)
        raise HTTPException(status_code=500, detail="Limit kontrolü yapılamadı.")
# -----------------------------------------------------------

# Modeller
class User(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None

class Post(BaseModel):
    title: str
    content: str
    author_id: str | None = None

class AnalyzeRequest(BaseModel):
    user_id: str
    base64_image: str
    mode: str

class ChatRequest(BaseModel):
    message: str
    user_id: str | None = None
    routine_context: str | None = None

class Review(BaseModel):
    user_id: str
    rating: int
    comment: str | None = None

# ---- USERS ENDPOINTS ----

@app.get("/users")
def get_users():
    response = supabase.table("users").select("*").execute()
    return response.data

@app.get("/users/{user_id}")
def get_user(user_id: str):
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

@app.post("/users")
def create_user(user: User):
    response = supabase.table("users").insert(user.model_dump(exclude_none=True)).execute()
    return response.data

@app.put("/users/{user_id}")
def update_user(user_id: str, user: User):
    response = supabase.table("users").update(user.model_dump(exclude_none=True)).eq("id", user_id).execute()
    return response.data

@app.delete("/users/{user_id}")
def delete_user(user_id: str):
    response = supabase.table("users").delete().eq("id", user_id).execute()
    return response.data

# ---- POSTS ENDPOINTS ----

@app.get("/posts")
def get_posts():
    response = supabase.table("posts").select("*").order("id", desc=True).execute()
    return response.data

@app.get("/posts/{post_id}")
def get_post(post_id: int):
    response = supabase.table("posts").select("*").eq("id", post_id).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="Post not found")
    return response.data[0]

@app.post("/posts")
def create_post(post: Post):
    response = supabase.table("posts").insert(post.model_dump(exclude_none=True)).execute()
    return response.data

@app.put("/posts/{post_id}")
def update_post(post_id: int, post: Post):
    response = supabase.table("posts").update(post.model_dump(exclude_none=True)).eq("id", post_id).execute()
    return response.data

@app.delete("/posts/{post_id}")
def delete_post(post_id: int):
    response = supabase.table("posts").delete().eq("id", post_id).execute()
    return response.data

# ---- ANALYSIS ENDPOINTS ----

@app.get("/analysis-results/{user_id}")
def get_analysis_history(user_id: str):
    response = supabase.table("analysis_results").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    results = []
    for item in response.data:
        storage_path = item["image_url"]
        if storage_path.startswith('user_analysis_photos/'):
            storage_path = storage_path.replace('user_analysis_photos/', '', 1)
        public_url = supabase.storage.from_("user_analysis_photos").get_public_url(storage_path)

        results.append({
            "id": str(item["id"]),
            "type": item["analysis_type"],
            "score": item.get("ai_feedback", {}).get("score", 0),
            "issues": item.get("ai_feedback", {}).get("issues", []),
            "aiComment": item.get("ai_feedback", {}).get("aiComment", ""),
            "improvement": 0,
            "imageUri": public_url,
            "created_at": item["created_at"],
        })
    return results

@app.post("/analyze", dependencies=[Depends(check_premium_limit)])
def analyze_image(req: AnalyzeRequest, request: Request):
    # 1. Clean base64
    cleaned_base64 = req.base64_image
    if "base64," in cleaned_base64:
        cleaned_base64 = cleaned_base64.split("base64,")[1]

    # YOLO ANALYSIS & SUPABASE TREATMENTS
    condition_name = "Bilinmiyor"
    treatments_data = []
    ai_result = {
        "score": 80,
        "issues": [],
        "aiComment": "Görünürde belirgin bir sorun tespit edilemedi."
    }

    if request.app.state.model is not None:
        try:
            image_bytes = base64.b64decode(cleaned_base64)
            img = Image.open(io.BytesIO(image_bytes))

            # Predict
            results = request.app.state.model.predict(source=img, conf=0.25)
            condition_id = None

            if len(results) > 0:
                result = results[0]
                if result.probs is not None: # Classification
                    condition_id = int(result.probs.top1)
                    condition_name = result.names[condition_id]
                elif result.boxes is not None and len(result.boxes) > 0: # Detection
                    condition_id = int(result.boxes.cls[0].item())
                    condition_name = result.names[condition_id]

            if condition_id is not None:
                # Fetch treatments from Supabase based on condition_id
                treatment_res = supabase.table("treatments").select("*").eq("condition_id", condition_id).execute()
                if treatment_res.data:
                    treatments_data = treatment_res.data
                    t_data = treatments_data[0]
                    ai_result["score"] = 65
                    ai_result["issues"] = [{"name": condition_name, "impact": 85}]

                    # Gemini yerine veritabanındaki sabit tavsiyeleri kullanıyoruz.
                    ai_result["aiComment"] = t_data.get("lifestyle_tips") or t_data.get("description") or "Önerilen tedavi yöntemlerini inceleyebilirsiniz."
                else:
                    ai_result["score"] = 70
                    ai_result["issues"] = [{"name": condition_name, "impact": 50}]
                    ai_result["aiComment"] = f"{condition_name} tespit edildi, ancak veritabanında özel bir tavsiye bulunamadı."
        except Exception as e:
            print("YOLO Inference Error:", e)
            ai_result["aiComment"] = "Görüntü analiz edilirken bir hata oluştu."

    # 3. Upload to Supabase Storage
    file_bytes = base64.b64decode(cleaned_base64)
    file_name = f"{int(time.time() * 1000)}.jpg"
    file_path = f"{req.user_id}/{file_name}"

    try:
        supabase.storage.from_("user_analysis_photos").upload(
            file_path,
            file_bytes,
            file_options={"content-type": "image/jpeg"}
        )
    except Exception as e:
        print("Upload error", e)

    # 4. Insert into DB
    insert_data = {
        "user_id": req.user_id,
        "image_url": file_path,
        "analysis_type": req.mode,
        "ai_feedback": ai_result
    }
    db_res = supabase.table("analysis_results").insert(insert_data).execute()
    inserted_item = db_res.data[0]

    # 5. Respond
    public_url = supabase.storage.from_("user_analysis_photos").get_public_url(file_path)

    response_data = {
        "id": str(inserted_item["id"]),
        "type": inserted_item["analysis_type"],
        "score": ai_result.get("score", 0),
        "issues": ai_result.get("issues", []),
        "aiComment": ai_result.get("aiComment", ""),
        "improvement": 0,
        "imageUri": public_url,
        "created_at": inserted_item["created_at"],
    }

    if condition_name and condition_name != "Bilinmiyor":
        response_data["yolo_condition"] = condition_name
        response_data["yolo_treatments"] = treatments_data

    return response_data

# ---- PRODUCTS ENDPOINTS ----

@app.get("/products/search")
def search_products(q: str):
    search_term = f"%{q}%"

    req_name = supabase.table("products").select("*").ilike("name", search_term).execute()
    req_brand = supabase.table("products").select("*").ilike("brand", search_term).execute()

    merged_results = {}

    def add_to_dict(data):
        for item in data:
            key = item.get("id") or item.get("barcode") or item.get("name")
            merged_results[key] = item

    add_to_dict(req_name.data)
    add_to_dict(req_brand.data)

    return list(merged_results.values())

@app.get("/products/barcode/{code}", dependencies=[Depends(check_premium_limit)])
def get_product_by_barcode(code: str, user_id: str):
    response = supabase.table("products").select("*").eq("barcode", code).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return response.data[0]

@app.get("/products/{product_id}")
def get_product(product_id: str):
    response = supabase.table("products").select("*").eq("id", product_id).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="Product not found")
    return response.data[0]

@app.post("/products/{product_id}/review")
def add_product_review(product_id: str, review: Review):
    insert_data = {
        "product_id": product_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "comment": review.comment
    }
    response = supabase.table("reviews").insert(insert_data).execute()
    return response.data

# ---- CHAT ENDPOINT ----

CHAT_FALLBACK_REPLY = (
    "Seni tam anlayamadım, ancak genel cilt bakımı önerilerimiz için "
    "dermaglowiletisim@gmail.com adresinden destek alabilirsin"
)

CHAT_STOPWORDS = {
    "var", "bir", "için", "icin", "ne", "mi", "mı", "mu", "mü",
    "ve", "ile", "bu", "şu", "su", "o", "da", "de", "ben", "sen",
    "çok", "cok", "gibi", "olan", "ama", "the", "and", "for",
}


def _format_treatment_row(row: dict) -> str | None:
    rec = (row.get("recommended_ingredients") or "").strip()
    tips = (row.get("lifestyle_tips") or "").strip()
    parts = []
    if rec:
        parts.append(f"Önerilen içerikler: {rec}")
    if tips:
        parts.append(f"Yaşam tarzı ipuçları: {tips}")
    return "\n".join(parts) if parts else None


def _keyword_variants(word: str) -> list[str]:
    """Anahtar kelime + yaygın Türkçe ekleri kaldırılmış varyantlar (ör. Sivilcem -> Sivilce)."""
    variants = [word]
    lower = word.lower()
    for suffix in ("lerim", "larım", "lerim", "nim", "nım", "im", "ım", "um", "üm", "m"):
        if lower.endswith(suffix) and len(word) > len(suffix) + 2:
            root = word[: -len(suffix)]
            if root not in variants:
                variants.append(root)
            break
    return variants


def _find_treatment_by_keyword(keyword: str) -> dict | None:
    """Tek bir anahtar kelimeyle lifestyle_tips, sonra description'da ilike arar."""
    for variant in _keyword_variants(keyword):
        for column in ("lifestyle_tips", "description"):
            response = (
                supabase.table("treatments")
                .select("recommended_ingredients, lifestyle_tips")
                .ilike(column, f"%{variant}%")
                .limit(1)
                .execute()
            )
            if response.data:
                return response.data[0]
    return None


@app.post("/chat")
def chat_with_ai(req: ChatRequest):
    message = req.message.strip()

    # Selamlama kontrolü
    greetings = ["merhaba", "selam", "hey", "hi", "başla", "hello", "selamlar"]
    if message.lower() in greetings or message == "":
        return {
            "reply": (
                "Merhaba! Ben DermaGlow asistanın. Cildin veya saç derinle ilgili bir sorun mu var? "
                "Belirt, sana özel analiz geçmişine ve anket verilerine dayanarak en uygun içerikleri önereyim."
            )
        }

    try:
        # Mesajı kelimelere böl; her kelimeyi ayrı anahtar kelime olarak ara
        words = message.split()
        seen_keywords: set[str] = set()

        for raw_word in words:
            keyword = re.sub(r"[^\w]", "", raw_word).strip()
            if len(keyword) < 3:
                continue
            if keyword.lower() in CHAT_STOPWORDS:
                continue
            if keyword.lower() in seen_keywords:
                continue
            seen_keywords.add(keyword.lower())

            row = _find_treatment_by_keyword(keyword)
            if row:
                reply = _format_treatment_row(row)
                if reply:
                    return {"reply": reply}

        return {"reply": CHAT_FALLBACK_REPLY}

    except Exception as e:
        print("Chat Search Error:", e)
        return {"reply": CHAT_FALLBACK_REPLY}

# ---- SURVEY & SKIN ANALYSIS ENDPOINTS ----

class SaveSurveyRequest(BaseModel):
    user_id: str
    answers: dict

@app.post("/api/save-survey")
def save_survey(req: SaveSurveyRequest):
    try:
        data = {
            "user_id": req.user_id,
            "answers": req.answers
        }
        response = supabase.table("user_surveys").upsert(data).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Survey save error: {str(e)}")

@app.post("/api/upgrade-premium")
async def upgrade_to_premium(user_id: str = Form(...)):
    try:
        # Supabase'e gidip o kullanıcının profilini buluyor ve is_premium = True yapıyor
        supabase.table("profiles").update({"is_premium": True}).eq("id", user_id).execute()
        return {"status": "success", "message": "DermaGlow Premium başarıyla aktif edildi!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Premium yükseltme hatası: {str(e)}")


@app.post("/api/analyze-skin", dependencies=[Depends(check_premium_limit)])
async def analyze_skin(request: Request, user_id: str = Form(...), image: UploadFile = File(...)):
    # 1. Fetch user survey
    try:
        survey_res = supabase.table("user_surveys").select("answers").eq("user_id", user_id).execute()
        answers = survey_res.data[0]["answers"] if survey_res.data else {}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 2. Read image
    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image read error: {str(e)}")

    # 3. YOLO Processing
    condition_name = "Bilinmiyor"
    treatments_data = []
    ai_result = {
        "score": 80,
        "issues": [],
        "aiComment": "Görünürde belirgin bir sorun tespit edilemedi."
    }

    if request.app.state.model is not None:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            results = request.app.state.model.predict(source=img, conf=0.25)
            condition_id = None

            if len(results) > 0:
                result = results[0]
                if result.probs is not None:
                    condition_id = int(result.probs.top1)
                    condition_name = result.names[condition_id]
                elif result.boxes is not None and len(result.boxes) > 0:
                    condition_id = int(result.boxes.cls[0].item())
                    condition_name = result.names[condition_id]

            if condition_id is not None:
                treatment_res = supabase.table("treatments").select("*").eq("condition_id", condition_id).execute()
                if treatment_res.data:
                    treatments_data = treatment_res.data
                    t_data = treatments_data[0]
                    ai_result["score"] = 65
                    ai_result["issues"] = [{"name": condition_name, "impact": 85}]
                    ai_result["aiComment"] = t_data.get("lifestyle_tips") or t_data.get("description") or "Önerilen tedavi yöntemlerini inceleyebilirsiniz."
                else:
                    ai_result["score"] = 70
                    ai_result["issues"] = [{"name": condition_name, "impact": 50}]
                    ai_result["aiComment"] = f"{condition_name} tespit edildi, ancak veritabanında özel bir tavsiye bulunamadı."
        except Exception as e:
            print("YOLO Inference Error:", e)
            ai_result["aiComment"] = "Görüntü analiz edilirken bir hata oluştu."

    try:
        supabase.table("analysis_history").insert({"user_id": user_id, "analysis_text": json.dumps(ai_result, ensure_ascii=False)}).execute()
    except Exception as e:
        print("History insert error:", e)

    # Return result
    if condition_name and condition_name != "Bilinmiyor":
        ai_result["yolo_condition"] = condition_name
        ai_result["yolo_treatments"] = treatments_data

    return ai_result