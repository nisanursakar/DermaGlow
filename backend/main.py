from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import requests
import base64
import time
import json
load_dotenv()

app = FastAPI(title="DermaGlow Backend", description="FastAPI Backend connected to Supabase")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("=== DOCKER ENV DEBUG ===")
print(f"SUPABASE_URL: '{SUPABASE_URL}'")
print(f"SUPABASE_KEY: '{SUPABASE_KEY}'")
print("========================")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase configuration in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

@app.post("/analyze")
def analyze_image(req: AnalyzeRequest):
    # 1. Clean base64
    cleaned_base64 = req.base64_image
    if "base64," in cleaned_base64:
        cleaned_base64 = cleaned_base64.split("base64,")[1]

    # 2. Call Gemini
    mode_text = "yüz/cilt" if req.mode == "skin" else "saç derisi"
    example_issue = "Sivilce, Siyah Nokta, Leke" if req.mode == "skin" else "Kepek, Saç Dökülmesi/Seyrelme, Yağlanma"
    
    prompt = f"""Sen uzman bir dermatologsun. Öncelikle ekteki fotoğrafın gerçekten bir insan {mode_text} (cilt/yüz/saç) fotoğrafı olup olmadığını kontrol et.
Eğer fotoğrafta belirgin bir insan {mode_text} yoksa (örneğin tavan, eşya, duvar, bilgisayar vb. alakasız bir nesneyse), sadece şu JSON'u döndür:
{{
  "score": 0,
  "issues": [
    {{ "name": "Geçersiz Görsel", "impact": 100 }}
  ],
  "aiComment": "Bu fotoğrafta analiz edilebilecek bir cilt veya saç derisi tespit edilemedi. Lütfen kamerayı kendinize çevirip net bir fotoğraf çekin."
}}

Eğer fotoğraf GERÇEKTEN bir insan {mode_text} fotoğrafıysa, detaylıca incele ve bana tam olarak aşağıdaki JSON formatında, geçerli ve temiz bir çıktı ver. Başka hiçbir açıklama veya markdown tırnak işareti (```) kullanma. Sadece saf JSON objesi döndür:
{{
  "score": <0 ile 100 arası genel sağlık skoru (sadece sayı)>,
  "issues": [
    {{ "name": "<Tespit ettiğin birinci sorunun adı (Örn: {example_issue})>", "impact": <0 ile 100 arası etki yüzdesi (sadece sayı)> }}
  ],
  "aiComment": "<Kullanıcıya Türkçe, samimi ve dermatolojik tavsiyeler içeren 2-3 cümlelik yorum>"
}}"""

    # ÇÖZÜM: BLOCK_NONE API'de yasak olduğu için BLOCK_ONLY_HIGH yaptık.
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inlineData": {"mimeType": "image/jpeg", "data": cleaned_base64}}
            ]
        }],
        "generationConfig": {"responseMimeType": "application/json"},
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"}
        ]
    }

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    gemini_res = requests.post(gemini_url, json=payload, headers={"Content-Type": "application/json"})

    if not gemini_res.ok:
        # Gemini kızarsa diye gerçek nedeni Docker terminaline basıyoruz!
        print("GEMINI API ERROR:", gemini_res.text)
        if gemini_res.status_code == 429:
             raise HTTPException(status_code=429, detail="Yapay Zeka sunucuları şu an çok yoğun. Lütfen 1 dakika bekleyip tekrar deneyin.")
        # Telefondaki hata mesajında da hatanın detayını gösterecek
        raise HTTPException(status_code=500, detail=f"Gemini API Hatası: {gemini_res.text}")

    gemini_data = gemini_res.json()
    try:
        text_response = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
        text_response = text_response.replace("```json", "").replace("```", "").strip()
        ai_result = json.loads(text_response)
    except Exception as e:
        print("JSON PARSE ERROR:", e)
        ai_result = {
            "score": 65,
            "issues": [{"name": "Analiz Hatası", "impact": 0}],
            "aiComment": "Görsel işlenemedi. Daha net bir fotoğraf deneyin."
        }

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

    return {
        "id": str(inserted_item["id"]),
        "type": inserted_item["analysis_type"],
        "score": ai_result.get("score", 0),
        "issues": ai_result.get("issues", []),
        "aiComment": ai_result.get("aiComment", ""),
        "improvement": 0,
        "imageUri": public_url,
        "created_at": inserted_item["created_at"],
    }

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

@app.get("/products/barcode/{code}")
def get_product_by_barcode(code: str):
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

@app.post("/chat")
def chat_with_ai(req: ChatRequest):
    system_prompt = """Senin adın DermAI. DermaGlow uygulamasının uzman, profesyonel ancak aynı zamanda samimi ve yardımsever cilt bakım asistanısın. 
Kullanıcının konuşma tarzına uyum sağla: 
- Eğer kullanıcı sadece selam veriyorsa, sıcak ve profesyonel bir şekilde karşıla ve cilt sağlığı konusunda nasıl yardımcı olabileceğini sor. Durduk yere uzun rutin analizleri yapma.
- Eğer kullanıcı cilt bakımı, ürünler veya sorunları hakkında bir soru soruyorsa; uzman, güvenilir, dermatolojik prensiplere uygun ve net bir dille profesyonel tavsiyeler ver.
Cevapların anlaşılır olsun, çok uzun destanlar yazmaktan kaçın. Gerektiğinde bilgileri maddeler halinde veya kalın yazarak formatla."""
    
    if req.routine_context:
        system_prompt += f"\n\nKullanıcının mevcut cilt bakım rutini aşağıdadır. (ÖNEMLİ: Bu rutini SADECE kullanıcı cilt bakımıyla ilgili bir soru sorduğunda veya tavsiye istediğinde göz önünde bulundur. Durduk yere bu rutinden bahsetme.):\n{req.routine_context}"
    
    payload = {
        "contents": [{
            "parts": [
                {"text": req.message}
            ]
        }],
        "systemInstruction": {
            "parts": [
                {"text": system_prompt}
            ]
        },
        "generationConfig": {"responseMimeType": "text/plain"},
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"}
        ]
    }

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    gemini_res = requests.post(gemini_url, json=payload, headers={"Content-Type": "application/json"})

    if not gemini_res.ok:
        print("GEMINI API ERROR (Chat):", gemini_res.text)
        if gemini_res.status_code == 429:
            return {"reply": "Şu an çok fazla istek alıyorum, lütfen 1 dakika kadar bekleyip tekrar yaz. ⏳"}
        raise HTTPException(status_code=500, detail="Gemini API Hatası")

    gemini_data = gemini_res.json()
    try:
        reply_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
        return {"reply": reply_text}
    except Exception as e:
        print("CHAT PARSE ERROR:", e)
        return {"reply": "Üzgünüm, şu an bağlantıda bir sorun yaşıyorum. Lütfen birazdan tekrar dene."}
