// Erencan Taşbaş
// 2022-12-07
// v0.1
let APP; // Uygulama bu class üzerinden dönmektedir.

// Config dosyası okunarak ilk adım atılıyor.
fetch("../vendor/config.json")
  .then((response) => response.json())
  .then((json) => {
    APP = new App(json);
    APP.init();
  });

class App {
  constructor(configJson) {
    this.appConfig = configJson;
  }

  parse_config() {
    // Config parametreleri işlenir
    this.netigma =
      (this.appConfig.domain[this.appConfig.domain.length - 1] === "/" && this.appConfig.domain + this.appConfig.netigma) ||
      this.appConfig.domain + "/" + this.appConfig.netigma;
    this.domain = this.appConfig.domain[this.appConfig.domain.length - 1] === "/" && this.appConfig.domain;

  }

  set_html_document() {
    // HTML içerisindeki meta kısmına ait düzenlemeler
    document.getElementById("appTitle").innerText = this.appConfig.appName;
  }

  check_session(){

  }

  init(){
    this.parse_config(this.appConfig);
    this.set_html_document();
    // this.login = new Login();
    this.login = new Authentication();
    this.dashboard = new Dashboard();
    // this.login.set_session(this)
  }
}


  