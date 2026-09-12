/* Davetiye paylaşım paneli — link kopyala / WhatsApp */
(function () {
  "use strict";

  function tamAdres(yol) {
    return new URL(yol, location.href).href;
  }

  document.querySelectorAll("[data-yol]").forEach(function (el) {
    el.textContent = tamAdres(el.getAttribute("data-yol"));
  });

  document.querySelectorAll("[data-whatsapp]").forEach(function (el) {
    var adres = tamAdres(el.getAttribute("data-whatsapp"));
    var metin =
      "Özge ve Edip'in düğün davetiyesi:\n07 Kasım 2026 · Address Hotel Emaar, İstanbul\n\n" +
      adres;
    el.href = "https://wa.me/?text=" + encodeURIComponent(metin);
  });

  var durum = document.getElementById("kopyaDurumu");

  document.querySelectorAll("[data-kopyala]").forEach(function (dugme) {
    dugme.addEventListener("click", function () {
      var adres = tamAdres(dugme.getAttribute("data-kopyala"));
      var soyle = function () {
        if (durum) durum.textContent = "LİNK KOPYALANDI";
        dugme.textContent = "KOPYALANDI";
        setTimeout(function () {
          dugme.textContent = "KOPYALA";
          if (durum) durum.textContent = "";
        }, 2200);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(adres).then(soyle).catch(function () {
          pencereIleKopyala(adres, soyle);
        });
      } else {
        pencereIleKopyala(adres, soyle);
      }
    });
  });

  function pencereIleKopyala(metin, sonra) {
    var alan = document.createElement("textarea");
    alan.value = metin;
    alan.setAttribute("readonly", "");
    alan.style.position = "fixed";
    alan.style.left = "-9999px";
    document.body.appendChild(alan);
    alan.select();
    try {
      document.execCommand("copy");
      sonra();
    } finally {
      document.body.removeChild(alan);
    }
  }
})();
