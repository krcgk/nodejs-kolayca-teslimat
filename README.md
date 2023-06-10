# Kolayca Teslimat NodeJS Engine

### Setup

- Install NodeJS
  [https://nodejs.org/en](https://nodejs.org/en)

### Installation

```bash
# 1. adim - .env adinda bir dosya olusturup icerigini .env.example dosyasindan kopyala
cp .env.example .env

# 2. adim - .env dosyasi icerisinde GOOGLE_MAPS_API_KEY degerine Google Cloud Console'dan aldigin key'i ekle

# 3. adim - node paketlerini yukle
npm install

# 4. adim - http://localhost:3000/api adresinden butun servislere erisebileceksin
npm run start

# opsiyonel - eger kodda degisiklik yapip test edeceksen npm run start yerine npm run dev ile baslatmalisin
npm run dev
```
