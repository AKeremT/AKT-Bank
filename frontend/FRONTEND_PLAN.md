# 🏦 AKT-Bank: Front-End Mimari Analiz ve Uygulama Planı

Bu doküman, `AKT-Bank` (Spring Boot 4 / Java 21 / PostgreSQL) çekirdek bankacılık backend projesinin uçtan uca incelenmesi sonucunda oluşturulmuş **Front-End Mimari ve Entegrasyon Planıdır**.

---

## 1. Backend Teknik Analizi ve Kritik Bulgular

### 1.1. Port ve CORS Yapılandırması
* **Mevcut Durum:** `backend/src/main/java/com/akt/banking_v1/config/SecurityConfig.java` içerisinde CORS izinleri yalnızca `http://localhost:4200` origin'i için tanımlanmıştır:
  ```java
  configuration.setAllowedOriginPatterns(List.of("http://localhost:4200"));
  ```
* **Front-End Kararı:** Geliştirme sunucusu (Vite) doğrudan **`4200` portunda** (`strictPort: true`) çalışacak şekilde ayarlanacaktır. Böylece backend konfigürasyonuna müdahale edilmeden tüm API istekleri CORS engeline takılmadan gerçekleşecektir.

---

### 1.2. Kimlik Doğrulama (JWT) ve Varsayılan Kullanıcılar
* **Endpoint:** `POST /api/v1/auth/login`
* **İstek Gövdesi (`LoginRequest`):** `{ "username": "...", "password": "..." }`
* **Yanıt Gövdesi (`AuthResponse`):** `{ "accessToken": "eyJ..." }`
* **JWT Token İçeriği (`JwtService.java`):**
  * `sub`: Kullanıcı adı (`username`)
  * `role`: Kullanıcının yetki rolü (`ROLE_SYSTEM`, `ROLE_TELLER`, `ROLE_CUSTOMER`)
  * `iss`, `aud`, `iat`, `exp`: Standart güvenlik claim'leri
* **Veritabanı Başlangıç Kullanıcıları (`DataInitializer.java`):**
  | Kullanıcı Adı | Şifre | Rol (`Role`) | Kullanım Amacı |
  | :--- | :--- | :--- | :--- |
  | `customer_user` | `customer_user` | `ROLE_CUSTOMER` | Müşteri sorgulama, hesap görüntüleme, ekstre inceleme |
  | `teller_user` | `teller_user` | `ROLE_TELLER` | Müşteri kaydı, yeni hesap açılışı, gişe nakit yatırma/çekme |
  | `system_admin` | `system_admin` | `ROLE_SYSTEM` | Hesaplar arası para transferi (`POST /api/v1/transfers`) ve Actuator metrikleri |

* **Merkez Kasa (System Vault) Hesabı:**
  * **TCKN / Kimlik No:** `00000000000` (`SYSTEM BANK_VAULT`)
  * **IBAN:** `TR000000000000000000000001` (`TRY`, Başlangıç Bakiyesi: `1,000,000,000.0000 TRY`)

---

### 1.3. Endpoint ve Rol Bazlı Yetkilendirme (RBAC) Matrisi

| Modül | Endpoint | HTTP | Zorunlu Header | Yetkili Roller (`@PreAuthorize`) | Açıklama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/login` | `POST` | - | Herkese Açık (`permitAll`) | JWT Access Token üretir |
| **Customer** | `/api/v1/customers` | `POST` | `Authorization` | `ROLE_TELLER` | Yeni müşteri kaydı (Onboarding) |
| **Customer** | `/api/v1/customers/{id}` | `GET` | `Authorization` | `ROLE_CUSTOMER`, `ROLE_TELLER` | Müşteri ID ile detay sorgulama |
| **Customer** | `/api/v1/customers/identity/{identityNumber}` | `GET` | `Authorization` | `ROLE_CUSTOMER`, `ROLE_TELLER` | 10-11 haneli TCKN/VKN ile müşteri sorgulama |
| **Account** | `/api/v1/accounts` | `POST` | `Authorization` | `ROLE_TELLER` | Müşteriye yeni banka hesabı (IBAN) açma |
| **Account** | `/api/v1/accounts/{accountNumber}` | `GET` | `Authorization` | `ROLE_CUSTOMER`, `ROLE_TELLER` | IBAN ile tekil hesap ve bakiye sorgulama |
| **Account** | `/api/v1/accounts/customer/{customerId}` | `GET` | `Authorization` | `ROLE_CUSTOMER`, `ROLE_TELLER` | Müşteriye ait tüm hesapları listeleme |
| **Statement** | `/api/v1/accounts/{accountNumber}/statement` | `GET` | `Authorization` | `ROLE_CUSTOMER`, `ROLE_TELLER` | Tarih aralığına göre hesap ekstresi ve analiz (`startDate`, `endDate`) |
| **Transfer** | `/api/v1/transfers` | `POST` | `Authorization`, `Idempotency-Key` | `ROLE_SYSTEM` | İki hesap arası çift taraflı (Double-Entry) para transferi |
| **Transfer** | `/api/v1/transfers/deposit` | `POST` | `Authorization`, `Idempotency-Key` | `ROLE_TELLER` | Gişeden hesaba nakit para yatırma (Kasa -> Müşteri) |
| **Transfer** | `/api/v1/transfers/withdraw` | `POST` | `Authorization`, `Idempotency-Key` | `ROLE_TELLER` | Gişeden hesaptan nakit para çekme (Müşteri -> Kasa) |

> **Mimari Not:** Backend'de farklı işlemler farklı roller (`CUSTOMER`, `TELLER`, `SYSTEM`) gerektirdiği için Front-End'de üst navigasyon barında **"Hızlı Rol/Oturum Değiştirici (Quick Role Switcher)"** yer alacaktır. Böylece test sırasında tek tıkla `customer_user`, `teller_user` ve `system_admin` arasında geçiş yapılabilecektir.

---

### 1.4. İstemci Taraflı Idempotency-Key (Çift İşlem Kalkanı)
* Backend'deki tüm finansal mutasyon istekleri (`transfer`, `deposit`, `withdraw`) `Idempotency-Key` HTTP başlığını zorunlu tutmaktadır.
* Front-end'de her işlem formu için otomatik bir `UUID v4` (`crypto.randomUUID()`) üretilecektir.
* Ağ kopması veya zaman aşımı durumunda aynı `Idempotency-Key` ile güvenli yeniden deneme (retry) yapılabilecek; ayrıca arayüzde backend'in idempotency korumasını test etmek için **"Aynı Anahtarla Tekrar Gönder (Idempotency Test)"** özelliği bulunacaktır.

---

## 2. Veri Modelleri (TypeScript & DTO Eşleşmesi)

### Enum Tipleri
* **`Currency`:** `'TRY' | 'USD' | 'EUR'`
* **`AccountType`:** `'CHECKING' | 'SAVINGS'`
* **`AccountStatus`:** `'ACTIVE' | 'SUSPENDED' | 'CLOSED'`
* **`TransactionType`:** `'INTERNAL_TRANSFER' | 'DEPOSIT' | 'WITHDRAW'`
* **`TransactionStatus`:** `'PENDING' | 'COMPLETED' | 'FAILED'`
* **`EntryType`:** `'DEBIT' | 'CREDIT'`
* **`Role`:** `'CUSTOMER' | 'TELLER' | 'SYSTEM'`

### DTO Şemaları
* **`CustomerResponse`:** `{ id, identityNumber, firstName, lastName, email, createdAt }`
* **`AccountResponse`:** `{ id, accountNumber, balance, currency, status, accountType, customerId, createdAt }`
* **`TransferResponse`:** `{ transactionId, referenceNumber, status, senderAccountNumber, receiverAccountNumber, amount, currency, createdAt }`
* **`AccountStatementResponse`:** `{ accountNumber, currency, currentBalance, startDate, endDate, totalCredit, totalDebit, netChange, summaryByType, items: StatementItemResponse[] }`
* **`StatementItemResponse`:** `{ referenceNumber, entryType, transactionType, amount, description, createdAt }`
* **`ErrorResponse`:** `{ timestamp, status, error, message, path, validationErrors?: Record<string, string> }`

---

## 3. Front-End Sayfa ve Fonksiyon Planı

1. **Giriş ve Oturum Yönetimi (`/login`):**
   * Kullanıcı adı ve şifre ile giriş formu.
   * Test kolaylığı için `customer_user`, `teller_user` ve `system_admin` hızlı giriş butonları.
   * JWT token'ın çözümlenerek aktif kullanıcı ve rol bilgisinin saklanması.

2. **Müşteri ve Hesap Yönetimi Paneli (`/dashboard` & `/customers`):**
   * **Müşteri Sorgulama:** Müşteri ID veya 11 haneli TCKN ile arama.
   * **Yeni Müşteri Kaydı (`TELLER`):** Ad, Soyad, TCKN, E-posta ile müşteri oluşturma ve validasyon hatalarını (`validationErrors`) alan bazlı gösterme.
   * **Hesap Listesi ve Yeni Hesap Açılışı (`TELLER`):** Seçili müşterinin tüm hesaplarını listeleme, tek tıkla IBAN kopyalama, döviz (`TRY`, `USD`, `EUR`) ve hesap türü (`CHECKING`, `SAVINGS`) seçerek yeni IBAN hesabı açma.

3. **Finansal İşlemler Merkezi (`/transfers`):**
   * **Hesaplar Arası Transfer (`SYSTEM`):** Gönderen IBAN, Alıcı IBAN, Tutar ve Açıklama ile atomik transfer.
   * **Nakit Yatırma (`TELLER`):** Hedef IBAN, Tutar ve Açıklama ile Merkez Kasa'dan para yatırma.
   * **Nakit Çekme (`TELLER`):** Kaynak IBAN, Tutar ve Açıklama ile para çekme.
   * **Idempotency Yönetimi & Dijital Dekont:** İşlem sonunda `TransferResponse` verileriyle (Referans No, İşlem UUID, Zaman Damgası, Tutar) detaylı dekont gösterimi.

4. **Hesap Ekstresi ve Çift Taraflı Muhasebe Defteri (`/statements`):**
   * IBAN ve Tarih Aralığı (`startDate`, `endDate` ISO-8601) seçimi.
   * **Özet Metrikler:** Güncel Bakiye (`currentBalance`), Toplam Alacak (`totalCredit`), Toplam Borç (`totalDebit`), Net Değişim (`netChange`) ve İşlem Tipine Göre Dağılım (`summaryByType`).
   * **Ledger Tablosu:** Her bir hareketin `DEBIT` (Borç / Çıkış) ve `CREDIT` (Alacak / Giriş) yönüyle, referans numarası ve açıklamasıyla listelenmesi.

---

## 4. Klasör Yapısı ve Teknoloji Yığını

* **Teknolojiler:** React + TypeScript + Vite (Port `4200`), Tailwind CSS, Axios, React Router, Lucide Icons.
* **Klasör Mimarisi:**
  ```text
  frontend/
  ├── .env                      # Google Stitch API Key (STITCH_API_KEY - Git ignore kapsamında)
  ├── FRONTEND_PLAN.md          # Mimari analiz ve uygulama planı
  ├── src/
  │   ├── api/                  # Axios instance, JWT & ErrorResponse interceptor, servisler
  │   ├── types/                # Backend DTO ve Enum TypeScript tanımları
  │   ├── context/              # AuthContext (Token, kullanıcı, rol ve hızlı rol geçişi)
  │   ├── components/           # Layout, Navbar, RoleSwitcher, Dekont Modalı, Hata Bildirimleri
  │   └── pages/                # LoginPage, DashboardPage, TransferPage, StatementPage
  ├── package.json
  └── vite.config.ts
  ```

---

## 5. Uygulama Fazları

* **Faz 1 — Altyapı ve İşlevsel Kodlama:**
  * Vite + React + TypeScript kurulumu (`localhost:4200`),
  * Tüm DTO tiplerinin, Axios API katmanının ve JWT/Rol yönetiminin yazılması,
  * Tüm ekranların (Auth, Müşteri, Hesap, Transfer/Yatırma/Çekme, Ekstre) fonksiyonel olarak kodlanması ve backend ile uçtan uca bağlanması.
* **Faz 2 — Google Stitch ile Modern Tasarım Uygulaması:**
  * Fonksiyonel kodlama tamamlandıktan sonra `frontend/.env` içerisindeki `STITCH_API_KEY` kullanılarak Google Stitch üzerinden kurumsal bankacılık tasarım sistemi ve modern arayüz tasarımlarının üretilmesi ve sisteme giydirilmesi.


---

## 6. Faz 2 Planı: Google Stitch ile Modern, Sade ve Herkes İçin Anlaşılır Tasarım (100% English UI)

### 6.1. Marka Kimliği ve Slogan (Brand & Slogan)
* **Marka Adı:** **AKT Bank**
* **Ana Slogan:** *"Simplicity in Every Step. Precision in Every Transaction."*  
  *(Alternatif Sloganlar: "Smart Banking, Made Effortless for Everyone." / "Your Trusted Digital Bank — Simple, Fast, Secure.")*
* **Dil:** Tüm arayüz, butonlar, yönlendirmeler, dekontlar ve rehber metinleri **%100 İngilizce (English)** olacaktır.

### 6.2. Google Stitch Tasarım Sistemi (Modern, Clean & Accessible)
* **Stil Yaklaşımı:** Karmaşık teknik terimleri arka plana gizleyen, ferah boşluklara (whitespace), yüksek okunabilirliğe ve net görsel hiyerarşiye sahip **Modern Consumer Fintech** (Revolut / Wise / Apple Card sadeliğinde) tasarım dili.
* **Renk Paleti (Light/Soft-Dark Dengeli, Yüksek Kontrastlı):**
  * Ana Vurgu (Primary): Güven veren Kraliyet Mavisi / İndigo (`#2563EB` / `#4F46E5`)
  * Pozitif / Para Girişi (Success / Credit): Zümrüt Yeşili (`#10B981`)
  * Para Çıkışı / Uyarı (Debit / Danger): Yumuşak Mercan (`#F43F5E`)
  * Yüzeyler: Göz yormayan temiz kartlar, büyük okunaklı butonlar ve net adım numaraları (`Step 1`, `Step 2`, `Step 3`).

### 6.3. "Hiç Bilmeyen Biri Bile Kullanabilsin" UX Yenilikleri
1. **26 Haneli IBAN Ezberleme/Kopyalama Zorunluluğuna Son (Visual Account Picker):**
   * Kullanıcı para yatırırken veya gönderirken uzun `TR...` IBAN numaralarını yazmak zorunda kalmayacak.
   * Ekranda **"Select Account"** altında görsel banka kartları çıkacak (`Ahmet's TRY Account — $1,500.00`). Kullanıcı sadece karta tıklayarak hesabı seçecek (IBAN otomatik dolacak).
2. **Akıllı Yetki Asistanı (Smart Role Auto-Pilot):**
   * Teknik olmayan bir kullanıcının `ROLE_TELLER` veya `ROLE_SYSTEM` ayrımını bilmesine gerek kalmaması için **"Smart Assisted Mode"** varsayılan olarak açık olacak.
   * Kullanıcı *"Create Account"*, *"Add Money (Deposit)"* veya *"Send Money"* butonuna bastığında, sistem arka planda gereken yetki anahtarını (`teller_user` veya `system_admin`) otomatik kullanarak işlemi hatasız tamamlayacak (geliştirici testleri için manuel rol seçici de isteğe bağlı görünür kalacak).
3. **Otomatik Güvenlik (Invisible Idempotency):**
   * `Idempotency-Key` UUID üretimi tamamen otomatik çalışacak; yeni başlayan kullanıcıyı korkutmamak için teknik detaylar *"Advanced Technical Details"* açılır kutusu içinde saklanacak.
4. **Tek Tıkla "Demo Müşteri & Hesap Doldur" (1-Click Quick Fill):**
   * Form doldurmak istemeyen kullanıcılar için *"Fill Sample Data"* butonu ile örnek müşteri ve tutar bilgileri tek tıkla doldurulabilecek.

### 6.4. Yeni Sekme: "How It Works / Interactive Tutorial" (`/tutorial`)
Site içinde adım adım resimli/ikonlu ve etkileşimli bir **Rehber Sekmesi (Interactive Guide)** yer alacak:
* **Step 1: Create a Customer Profile** — *"First, register your name and ID number in 10 seconds."* (`[Go to Step 1 ->]` butonu ile)
* **Step 2: Open Your Free Bank Account** — *"Choose your currency (TRY, USD, or EUR) and click 'Open Account'. Your IBAN is created instantly!"* (`[Go to Step 2 ->]` butonu ile)
* **Step 3: Add Money to Your Account (Deposit)** — *"Select your new account card, enter an amount like 1,000, and click 'Add Money'."* (`[Go to Step 3 ->]` butonu ile)
* **Step 4: Send Money & Track History** — *"Transfer money to another account and view your clean receipt and statement."* (`[Go to Step 4 ->]` butonu ile)

### 6.5. Uygulama Adımları (Faz 2 İş Akışı)
1. **Adım 1:** `frontend/.env` içindeki `STITCH_API_KEY` kullanılarak Google Stitch üzerinde **AKT Bank** projesinin ve ekran tasarımlarının (`DESIGN.md` + modern sade ekranların) üretilmesi.
2. **Adım 2:** Stitch'ten alınan modern tasarım sisteminin ve %100 İngilizce, adım adım yönlendirmeli arayüzün (`Login`, `Home / Accounts`, `Add & Send Money`, `Account Activity`, `Interactive Tutorial`) React bileşenlerine uygulanması.
3. **Adım 3:** Docker imajının (`akt_bank_frontend`) yeniden derlenip `http://localhost:4200` üzerinde canlıya alınması.
