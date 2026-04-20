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
    # En yeni postları önce almak için id'ye göre veya create tarihine göre sıralayabiliriz.
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
    prompt = f"""Sen uzman bir dermatologsun. Ekteki {mode_text} fotoğrafını detaylıca incele. Lütfen bana tam olarak aşağıdaki JSON formatında, geçerli ve temiz bir çıktı ver. Başka hiçbir açıklama veya markdown tırnak işareti (```) kullanma. Sadece saf JSON objesi döndür:
      {{
        "score": <0 ile 100 arası genel sağlık skoru (sadece sayı)>,
        "issues": [
          {{ "name": "<Tespit ettiğin birinci sorunun adı (Örn: Sivilce)>", "impact": <0 ile 100 arası etki yüzdesi (sadece sayı)> }}
        ],
        "aiComment": "<Kullanıcıya Türkçe, samimi ve dermatolojik tavsiyeler içeren 2-3 cümlelik yorum>"
      }}"""

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inlineData": {"mimeType": "image/jpeg", "data": cleaned_base64}}
            ]
        }],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    gemini_res = requests.post(gemini_url, json=payload, headers={"Content-Type": "application/json"})
    
    if not gemini_res.ok:
        raise HTTPException(status_code=500, detail="Failed to analyze image with Gemini API")
    
    gemini_data = gemini_res.json()
    try:
        text_response = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
        text_response = text_response.replace("```json", "").replace("```", "").strip()
        ai_result = json.loads(text_response)
    except Exception as e:
        ai_result = {
            "score": 65, 
            "issues": [{"name": "Analiz Hatası", "impact": 0}], 
            "aiComment": "Görsel işlenemedi. Daha aydınlık bir fotoğraf deneyin."
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
    
    # Supabase Python istemcisinin .or_() string yapısı bazı durumlarda boş dizi döndürebildiği için,
    # doğrudan .ilike() fonksiyonuyla iki tablo sorgulanıp birleştirilir (OR mantığı)
    req_name = supabase.table("products").select("*").ilike("name", search_term).execute()
    req_brand = supabase.table("products").select("*").ilike("brand", search_term).execute()

    merged_results = {}
    
    def add_to_dict(data):
        for item in data:
            # Ürünün ID'si varsa ID ile eşleştir, ID yoksa eşsiz kimlik olarak barcode baz al
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
    # Supabase'de 'reviews' adında bir tablo olduğunu varsayıyoruz
    response = supabase.table("reviews").insert(insert_data).execute()
    return response.data
