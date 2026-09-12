/**
 * Özge & Edip — Düğün davetiyesi cevapları
 *
 * Kurulum (ayrıntı: README.md):
 * 1. Yeni bir Google Sheet açın, adını "Davetiye Cevapları" koyun.
 * 2. Uzantılar > Apps Script
 * 3. Bu dosyanın tamamını yapıştırın.
 * 4. İsteğe bağlı: BILDIRIM_EPOSTA satırına kendi e-postanızı yazın.
 * 5. Dağıt > Yeni dağıtım > Tür: Web uygulaması
 *      - Açıklama: Davetiye RSVP
 *      - Yürütme: Ben
 *      - Erişim: Herkes
 * 6. Çıkan .../exec adresini assets/js/config.js içindeki APPS_SCRIPT_URL'e yapıştırın.
 */

var SAYFA_ADI = "Cevaplar";
var BILDIRIM_EPOSTA = ""; // örn. "sizin@eposta.com" — boş bırakılırsa mail gitmez

var BASLIKLAR = [
  "Zaman",
  "Davetiye Tipi",
  "Ad",
  "Soyad",
  "Telefon",
  "Katılım",
  "Not",
  "Sayfa",
];

function doGet() {
  return jsonYanit({ ok: true, mesaj: "Davetiye formu hazır." });
}

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    var kayit = {
      zaman: new Date(),
      davetiyeTipi: metin(p.davetiyeTipi),
      ad: metin(p.ad),
      soyad: metin(p.soyad),
      telefon: metin(p.telefon),
      katilim: metin(p.katilim),
      notu: metin(p.notu),
      sayfa: metin(p.sayfa),
    };

    if (!kayit.ad || !kayit.soyad || !kayit.telefon || !kayit.katilim) {
      return jsonYanit({ ok: false, hata: "Eksik alan." });
    }

    var sayfa = sayfaAl();
    var satir = [
      kayit.zaman,
      kayit.davetiyeTipi,
      kayit.ad,
      kayit.soyad,
      kayit.telefon,
      kayit.katilim,
      kayit.notu,
      kayit.sayfa,
    ];

    var mevcut = telefonSatiri(sayfa, kayit.telefon);
    if (mevcut > 0) {
      sayfa.getRange(mevcut, 1, 1, BASLIKLAR.length).setValues([satir]);
    } else {
      sayfa.appendRow(satir);
    }

    bildirimGonder(kayit);

    return jsonYanit({ ok: true });
  } catch (hata) {
    return jsonYanit({ ok: false, hata: String(hata) });
  }
}

function sayfaAl() {
  var kitap = SpreadsheetApp.getActiveSpreadsheet();
  var sayfa = kitap.getSheetByName(SAYFA_ADI);
  if (!sayfa) {
    sayfa = kitap.getSheets()[0];
    sayfa.setName(SAYFA_ADI);
  }
  if (sayfa.getLastRow() === 0) {
    sayfa.appendRow(BASLIKLAR);
    sayfa.setFrozenRows(1);
    sayfa.getRange(1, 1, 1, BASLIKLAR.length).setFontWeight("bold");
    sayfa.setColumnWidth(1, 170);
    sayfa.setColumnWidth(7, 280);
    sayfa.setColumnWidth(8, 280);
  }
  return sayfa;
}

function telefonSatiri(sayfa, telefon) {
  if (!telefon) return 0;
  var son = sayfa.getLastRow();
  if (son < 2) return 0;
  var degerler = sayfa.getRange(2, 5, son - 1, 1).getValues();
  var aranan = sadeceRakam(telefon);
  for (var i = 0; i < degerler.length; i++) {
    if (sadeceRakam(degerler[i][0]) === aranan) return i + 2;
  }
  return 0;
}

function bildirimGonder(kayit) {
  if (!BILDIRIM_EPOSTA) return;
  var konu = "Davetiye cevabı: " + kayit.ad + " " + kayit.soyad + " — " + kayit.katilim;
  var govde = [
    "Yeni bir davetiye cevabı geldi.",
    "",
    "Davetiye: " + kayit.davetiyeTipi,
    "Ad Soyad: " + kayit.ad + " " + kayit.soyad,
    "Telefon: " + kayit.telefon,
    "Katılım: " + kayit.katilim,
    "Not: " + (kayit.notu || "—"),
    "",
    "Sheet'te satır güncellendi / eklendi.",
  ].join("\n");
  MailApp.sendEmail(BILDIRIM_EPOSTA, konu, govde);
}

function metin(deger) {
  return String(deger == null ? "" : deger).trim();
}

function sadeceRakam(deger) {
  return String(deger || "").replace(/\D/g, "");
}

function jsonYanit(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne)).setMimeType(
    ContentService.MimeType.JSON
  );
}
