import pandas as pd
import os

def filter_products():
    input_file = "en.openbeautyfacts.org.products.csv.gz"
    output_file = "clean_products.csv"

    if not os.path.exists(input_file):
        print(f"Hata: '{input_file}' dosyası bulunamadı. Lütfen scripti dosyanın bulunduğu dizinde çalıştırdığınızdan emin olun.")
        return

    print(f"'{input_file}' okunuyor... (Dosya boyutu büyükse biraz zaman alabilir)")
    
    # OpenBeautyFacts verileri genellikle tab (\t) ile ayrılmış olur.
    # Eğer hata verirse, virgül (,) ile okumayı deneyeceğiz.
    try:
        df = pd.read_csv(input_file, sep='\t', compression='gzip', low_memory=False, on_bad_lines='skip')
    except Exception as e:
        print(f"Tab ayracı ile okuma başarısız oldu, virgül ayracı deneniyor... Hata: {e}")
        df = pd.read_csv(input_file, sep=',', compression='gzip', low_memory=False, on_bad_lines='skip')

    print("Dosya başarıyla yüklendi. Veriler filtreleniyor...")

    # İstenen markaların listesi
    target_brands = [
        'Isana', 'Watsons', 'Gratis', 'Kiko', 'Sephora', 
        'Rossmann', 'Rival de Loop', 'Bee Beauty', 'Benri', 'Pure Beauty'
    ]

    # 'brands' sütununu kontrol et ve filtrele
    if 'brands' in df.columns:
        df['brands'] = df['brands'].fillna('').astype(str)
        # Marka isimlerini büyük/küçük harf duyarsız olarak içerisinde arıyoruz
        pattern = '|'.join(target_brands)
        filtered_df = df[df['brands'].str.contains(pattern, case=False, na=False)]
    else:
        print("Hata: Verisetinde 'brands' sütunu bulunamadı.")
        return

    # Sütun isimlerini yeniden isimlendirme eşleştirmesi
    column_mapping = {
        'product_name': 'name',
        'brands': 'brand',
        'code': 'barcode',
        'categories': 'category',
        'image_url': 'image_url',
        'ingredients_text': 'ingredients'
    }

    # Sadece verisetinde gerçekten var olan ve istediğimiz sütunları alalım
    existing_columns = [col for col in column_mapping.keys() if col in filtered_df.columns]
    
    # Eksik sütunlar varsa bilgi ver
    missing_columns = set(column_mapping.keys()) - set(existing_columns)
    if missing_columns:
        print(f"Uyarı: Şu sütunlar veride bulunamadı ve atlanacak: {missing_columns}")

    # Sadece istediğimiz sütunları filtrele
    filtered_df = filtered_df[existing_columns]

    # Sütun isimlerini Supabase tablona uygun şekilde yeniden adlandır
    rename_mapping = {col: column_mapping[col] for col in existing_columns}
    filtered_df = filtered_df.rename(columns=rename_mapping)

    print(f"Filtrelenmiş {len(filtered_df)} kayıt '{output_file}' dosyasına kaydediliyor...")
    
    # Sonucu standart CSV formatında (virgülle ayrılmış) kaydet
    filtered_df.to_csv(output_file, index=False)
    
    print(f"İşlem tamamlandı! Veriler başarıyla '{output_file}' olarak kaydedildi.")

if __name__ == "__main__":
    filter_products()
