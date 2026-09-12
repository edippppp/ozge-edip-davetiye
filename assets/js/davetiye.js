/* =========================================================
   Özge & Edip — dijital davetiye
   Bölüm animasyonları, telefon maskesi, form doğrulama ve
   cevapların Google Sheet'e gönderilmesi.
   ========================================================= */
(function () {
  "use strict";

  var AYAR = window.DAVETIYE_AYAR || {};
  var KISI = document.body.dataset.kisi === "2" ? "2 Kişilik" : "1 Kişilik";
  var DEPO_ANAHTARI = "davetiye-cevap-" + (document.body.dataset.kisi || "1");

  /* ---------------------------------------------------------
     Bölümler görünüme girdikçe yumuşak açılma
     --------------------------------------------------------- */
  var acilanlar = document.querySelectorAll(".acilan");

  if ("IntersectionObserver" in window) {
    var gozlemci = new IntersectionObserver(
      function (girisler) {
        girisler.forEach(function (giris) {
          if (giris.isIntersecting) {
            giris.target.classList.add("gorunur");
            gozlemci.unobserve(giris.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    acilanlar.forEach(function (el) {
      gozlemci.observe(el);
    });
  } else {
    acilanlar.forEach(function (el) {
      el.classList.add("gorunur");
    });
  }

  /* ---------------------------------------------------------
     Telefon maskesi: 0(5xx) xxx xx xx
     --------------------------------------------------------- */
  var telefon = document.getElementById("telefon");

  function rakamlar(deger) {
    return (deger || "").replace(/\D/g, "");
  }

  function telefonBicimle(deger) {
    var d = rakamlar(deger);

    // Ülke kodu veya baştaki sıfır temizlenir, 10 haneye indirilir
    if (d.indexOf("90") === 0 && d.length > 10) d = d.slice(2);
    if (d.indexOf("0") === 0) d = d.slice(1);
    d = d.slice(0, 10);

    if (!d) return "";

    var s = "0(" + d.slice(0, 3);
    if (d.length >= 3) s += ")";
    if (d.length > 3) s += " " + d.slice(3, 6);
    if (d.length > 6) s += " " + d.slice(6, 8);
    if (d.length > 8) s += " " + d.slice(8, 10);
    return s;
  }

  if (telefon) {
    telefon.addEventListener("input", function () {
      var oncekiUzunluk = this.value.length;
      var imlecSonda = this.selectionStart === oncekiUzunluk;
      this.value = telefonBicimle(this.value);
      if (imlecSonda) {
        this.selectionStart = this.selectionEnd = this.value.length;
      }
    });
  }

  function telefonGecerliMi(deger) {
    var d = rakamlar(deger);
    if (d.indexOf("0") === 0) d = d.slice(1);
    return d.length === 10 && d.charAt(0) === "5";
  }

  /* ---------------------------------------------------------
     Form doğrulama
     --------------------------------------------------------- */
  var form = document.getElementById("katilimFormu");
  if (!form) return;

  var dugme = document.getElementById("gonderDugmesi");
  var durum = document.getElementById("formDurumu");
  var tesekkur = document.getElementById("tesekkurKarti");
  var tesekkurMetin = document.getElementById("tesekkurMetin");
  var yenidenDugmesi = document.getElementById("yenidenGonder");

  function hataAlani(ad) {
    return form.querySelector('[data-hata-for="' + ad + '"]');
  }

  function hataGoster(ad, mesaj) {
    var kutu = hataAlani(ad);
    if (kutu) kutu.textContent = mesaj || "";
    var alan = kutu ? kutu.closest(".alan") : null;
    if (alan) alan.classList.toggle("alan--hatali", Boolean(mesaj));
  }

  function hatalariTemizle() {
    ["ad", "soyad", "telefon", "katilim"].forEach(function (ad) {
      hataGoster(ad, "");
    });
    if (durum) durum.textContent = "";
  }

  function dogrula(veri) {
    var hatalar = [];

    if (veri.ad.length < 2) {
      hataGoster("ad", "Lütfen adınızı yazın.");
      hatalar.push("ad");
    }
    if (veri.soyad.length < 2) {
      hataGoster("soyad", "Lütfen soyadınızı yazın.");
      hatalar.push("soyad");
    }
    if (!telefonGecerliMi(veri.telefon)) {
      hataGoster("telefon", "Telefon numaranızı 0(5xx) xxx xx xx biçiminde yazın.");
      hatalar.push("telefon");
    }
    if (!veri.katilim) {
      hataGoster("katilim", "Katılım durumunuzu seçin.");
      hatalar.push("katilim");
    }
    return hatalar;
  }

  function formVerisi() {
    var secili = form.querySelector('input[name="katilim"]:checked');
    return {
      ad: form.elements.ad.value.trim(),
      soyad: form.elements.soyad.value.trim(),
      telefon: form.elements.telefon.value.trim(),
      katilim: secili ? secili.value : "",
      notu: form.elements.notu.value.trim(),
      davetiyeTipi: KISI,
    };
  }

  /* ---------------------------------------------------------
     Gönderim: Apps Script'e urlencoded POST (preflight yok)
     --------------------------------------------------------- */
  function gonder(veri) {
    var url = (AYAR.APPS_SCRIPT_URL || "").trim();

    if (!url) {
      var eksikAyar = new Error("APPS_SCRIPT_URL tanımlı değil (assets/js/config.js).");
      eksikAyar.kullaniciMesaji =
        "Davetiye henüz cevap almaya hazır değil. Lütfen bizimle doğrudan iletişime geçin.";
      return Promise.reject(eksikAyar);
    }

    var govde = new URLSearchParams();
    Object.keys(veri).forEach(function (anahtar) {
      govde.append(anahtar, veri[anahtar]);
    });
    govde.append("sayfa", location.href);

    return fetch(url, { method: "POST", body: govde })
      .then(function (yanit) {
        if (!yanit.ok) throw new Error("Sunucu yanıtı: " + yanit.status);
        return yanit.json().catch(function () {
          return { ok: true };
        });
      })
      .then(function (sonuc) {
        if (sonuc && sonuc.ok === false) {
          throw new Error(sonuc.hata || "Cevap kaydedilemedi.");
        }
        return sonuc;
      })
      .catch(function (hata) {
        // Yalnızca ağ / CORS hatasında (TypeError) gizli iframe ile klasik
        // form POST'u denenir. Kod.gs telefon numarasına göre "varsa güncelle"
        // çalıştığı için bu yedek yol mükerrer satır oluşturmaz.
        if (!(hata instanceof TypeError)) throw hata;
        return iframeIleGonder(url, veri).catch(function () {
          throw hata;
        });
      });
  }

  function iframeIleGonder(url, veri) {
    return new Promise(function (cozumle, reddet) {
      var ad = "davetiyeGonderim" + Date.now();
      var iframe = document.createElement("iframe");
      iframe.name = ad;
      iframe.style.display = "none";

      var gizliForm = document.createElement("form");
      gizliForm.action = url;
      gizliForm.method = "POST";
      gizliForm.target = ad;
      gizliForm.style.display = "none";

      Object.keys(veri).forEach(function (anahtar) {
        var girdi = document.createElement("input");
        girdi.type = "hidden";
        girdi.name = anahtar;
        girdi.value = veri[anahtar];
        gizliForm.appendChild(girdi);
      });

      var zamanAsimi = setTimeout(function () {
        temizle();
        reddet(new Error("Gönderim zaman aşımına uğradı."));
      }, 15000);

      function temizle() {
        clearTimeout(zamanAsimi);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        if (gizliForm.parentNode) gizliForm.parentNode.removeChild(gizliForm);
      }

      iframe.addEventListener("load", function () {
        temizle();
        cozumle({ ok: true, yol: "iframe" });
      });

      document.body.appendChild(iframe);
      document.body.appendChild(gizliForm);
      gizliForm.submit();
    });
  }

  /* ---------------------------------------------------------
     Teşekkür kartı
     --------------------------------------------------------- */
  function tesekkurGoster(veri) {
    var metin =
      veri.katilim === "Katılacağım"
        ? "CEVABINIZ BİZE ULAŞTI. SİZİ ARAMIZDA GÖRMEK BİZİ ÇOK MUTLU EDECEK."
        : "CEVABINIZ BİZE ULAŞTI. BİZİ HATIRLADIĞINIZ İÇİN TEŞEKKÜR EDERİZ, YOLUNUZ AÇIK OLSUN.";

    if (tesekkurMetin) tesekkurMetin.textContent = metin;
    form.hidden = true;
    if (tesekkur) tesekkur.hidden = false;
  }

  function kaydedilmisCevap() {
    try {
      var kayit = localStorage.getItem(DEPO_ANAHTARI);
      return kayit ? JSON.parse(kayit) : null;
    } catch (e) {
      return null;
    }
  }

  function cevabiKaydet(veri) {
    try {
      localStorage.setItem(DEPO_ANAHTARI, JSON.stringify(veri));
    } catch (e) {
      /* özel sekmede localStorage kapalı olabilir */
    }
  }

  var oncekiCevap = kaydedilmisCevap();
  if (oncekiCevap) tesekkurGoster(oncekiCevap);

  if (yenidenDugmesi) {
    yenidenDugmesi.addEventListener("click", function () {
      var kayit = kaydedilmisCevap();
      if (kayit) {
        form.elements.ad.value = kayit.ad || "";
        form.elements.soyad.value = kayit.soyad || "";
        form.elements.telefon.value = kayit.telefon || "";
        form.elements.notu.value = kayit.notu || "";
        var secili = form.querySelector(
          'input[name="katilim"][value="' + kayit.katilim + '"]'
        );
        if (secili) secili.checked = true;
      }
      if (tesekkur) tesekkur.hidden = true;
      form.hidden = false;
      form.elements.ad.focus();
    });
  }

  /* ---------------------------------------------------------
     Gönder
     --------------------------------------------------------- */
  form.addEventListener("submit", function (olay) {
    olay.preventDefault();
    hatalariTemizle();

    var veri = formVerisi();
    var hatalar = dogrula(veri);

    if (hatalar.length) {
      var ilk = form.querySelector('[name="' + hatalar[0] + '"]');
      if (ilk && ilk.focus) ilk.focus();
      return;
    }

    dugme.disabled = true;
    dugme.classList.add("dugme--bekliyor");

    gonder(veri)
      .then(function () {
        cevabiKaydet(veri);
        tesekkurGoster(veri);
      })
      .catch(function (hata) {
        if (durum) {
          durum.textContent =
            hata && hata.kullaniciMesaji
              ? hata.kullaniciMesaji
              : "Cevabınız gönderilemedi. Lütfen birazdan tekrar deneyin.";
        }
      })
      .then(function () {
        dugme.disabled = false;
        dugme.classList.remove("dugme--bekliyor");
      });
  });

  // Kullanıcı yazmaya başlayınca ilgili hata mesajı silinsin
  ["ad", "soyad", "telefon"].forEach(function (ad) {
    var alan = form.elements[ad];
    if (alan) {
      alan.addEventListener("input", function () {
        hataGoster(ad, "");
      });
    }
  });

  form.querySelectorAll('input[name="katilim"]').forEach(function (girdi) {
    girdi.addEventListener("change", function () {
      hataGoster("katilim", "");
    });
  });
})();
