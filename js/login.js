// Kullanıcı giriş kısmına dair kodları bulundurur.

class User {
  constructor() {
    this.isLogined = false;
  }
  setParameters(json){
    this.username = json.username;
    this.password = json.password;
    this.isLogined = true;
  }
}

class Authentication{
  constructor() {
    this.user = new User();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.sessionid = urlParams.get("sessionid");
    if (this.sessionid) {
      urlParams.delete("sessionid");
      // this.isLogined(this.sessionid);
    }
  }
  login(username, password) {
    const params = new URLSearchParams(`userName=${username}&password=${password}`);
    fetch(`${APP.netigma}/gisapi/authentication/login`, {
      body: params,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.json())
      .then((json) => {
        this.user.setParameters(json)
      });
  }

  isLogined() {
    fetch(`${APP.netigma}/gisapi/authentication/IsLogined?sessionid=` + this.sessionid)
      .then((response) => response.json())
      .then((json) => {
        this.user.isLogined = json
        // set_session()
      });
  }

  refresh() {
    fetch(`${APP.netigma}/gisapi/authentication/refresh?sessionid=` + this.sessionid)
    .then((response) => response.json())
    .then((json) => {
      console.log('SessionID refreshed',json);
    });
  }

  logout() {
    fetch(`${APP.netigma}/gisapi/authentication/logout?sessionid=` + this.sessionid)
    .then((response) => response.json())
    .then((json) => {
      console.log('User logged out',json);
    });
  }

}

class Login extends Authentication {
  constructor() {
    super();
    
    // this.userNameInputElement = document.getElementById("usernameInput");
    // this.passwordInputElement = document.getElementById("passwordInput");
    // this.loginButtonElement = document.getElementById("loginButton");
    // this.loginButtonElement.addEventListener("click", this.loginButtonEventHandler.bind(this));
  }

  loginButtonEventHandler() {
    if (this.userNameInputElement.value && this.passwordInputElement.value) {
      this.login(this.userNameInputElement.value, this.passwordInputElement.value);
    } else {
      alert("Lütfen geçerli bir değer giriniz.");
      return;
    }
  }

  new_session() {}

  refresh_session() {}
}
