# Özge & Edip — Dijital Düğün Davetiyesi

07 Kasım 2026 · Address Hotel Emaar, İstanbul

Fiziksel trifold davetiyenin dijital karşılığı. İki ayrı paylaşılabilir sayfa vardır; tasarım ve içerik birebir aynıdır, tek fark kişi sayısı satırıdır.

- Tek kişilik: `tek-kisi/`
- İki kişilik: `iki-kisi/`

Kök sayfa (`index.html`) yalnızca sizin içindir: iki linki kopyalayıp WhatsApp’tan göndermenizi sağlar. Misafirlere kök sayfayı değil, ilgili davetiye linkini atın.

## Yerelde açmak

Proje klasöründe:

```bash
python3 -m http.server 8080
```

Tarayıcıda:

- http://localhost:8080
- http://localhost:8080/tek-kisi/
- http://localhost:8080/iki-kisi/

## Cevapların Google Sheet’e düşmesi

Form, Google Apps Script web uygulamasına gider. Cevaplar bir Google Sheet’te satır satır birikir (Google Form hissi).

### 1. Sheet oluşturun

1. [sheets.new](https://sheets.new) adresine gidin.
2. Dosya adını `Davetiye Cevapları` yapın.
3. İlk sayfa boş kalabilir; script başlıkları kendisi yazar:
   `Zaman | Davetiye Tipi | Ad | Soyad | Telefon | Katılım | Not | Sayfa`

### 2. Apps Script’i bağlayın

1. Sheet’te **Uzantılar → Apps Script**.
2. Açılan editördeki varsayılan kodu silin.
3. Bu projedeki [`apps-script/Kod.gs`](apps-script/Kod.gs) dosyasının tamamını yapıştırın.
4. İsterseniz `BILDIRIM_EPOSTA` satırına kendi e-postanızı yazın (her cevapta mail gelir). Boş bırakırsanız yalnızca Sheet’e yazılır.
5. Disk ikonuna basıp projeyi kaydedin (ad: `Davetiye RSVP`).

### 3. Web uygulaması olarak dağıtın

1. Sağ üstte **Dağıt → Yeni dağıtım**.
2. Dişli ikonundan türü **Web uygulaması** seçin.
3. Ayarlar:
   - Açıklama: `Davetiye RSVP`
   - Yürütme: **Ben**
   - Erişim: **Herkes**
4. **Dağıt**. Google izin isterse hesabınızı seçip **İzin ver** deyin (ilk seferde “güvenli değil” uyarısı çıkarsa **Gelişmiş → …(güvenli olmayan) git**).
5. Çıkan adres `https://script.google.com/macros/s/...../exec` ile biter. Bunu kopyalayın.

### 4. Adresi siteye yazın

[`assets/js/config.js`](assets/js/config.js) içinde:

```js
APPS_SCRIPT_URL: "https://script.google.com/macros/s/BURAYA_YAPISTIRIN/exec",
```

Dosyayı kaydedip siteyi yeniden yayınlayın. Bundan sonra **Gönder** Sheet’e yeni satır ekler. Aynı telefon numarasıyla gelen ikinci cevap eski satırı günceller.

Kod veya Sheet kolonlarını değiştirdiyseniz Apps Script’te **Dağıt → Dağıtımları yönet → Düzenle → Yeni sürüm → Dağıt** yapın.

## GitHub Pages ile yayınlamak

1. Terminalde GitHub’a giriş:

   ```bash
   gh auth login -h github.com
   ```

2. Repoyu oluşturup yayınlayın (bir kez):

   ```bash
   git init
   git add .
   git commit -m "Özge ve Edip dijital düğün davetiyesi"
   gh repo create ozge-edip-davetiye --public --source . --push
   gh api -X PUT repos/:owner/ozge-edip-davetiye/pages -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/"
   ```

3. Birkaç dakika sonra paylaşılacak adresler:

   - Tek kişilik: `https://KULLANICI.github.io/ozge-edip-davetiye/tek-kisi/`
   - İki kişilik: `https://KULLANICI.github.io/ozge-edip-davetiye/iki-kisi/`

WhatsApp önizlemesi için `og:image` mutlak adres ister. Yayınlandıktan sonra `tek-kisi/index.html` ve `iki-kisi/index.html` içindeki `og:image` / `twitter:image` değerlerini şu tam adrese çevirin:

`https://KULLANICI.github.io/ozge-edip-davetiye/assets/img/og.jpg`

## Klasörler

```
index.html              paylaşım paneli
tek-kisi/               1 kişilik davetiye
iki-kisi/               2 kişilik davetiye
assets/css/             ortak stil
assets/js/              form + panel
assets/svg/             ginkgo, monogram, program ikonları
apps-script/Kod.gs      Google Sheet köprüsü
```
