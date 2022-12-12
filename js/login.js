// Kullanıcı giriş kısmına dair kodları bulundurur.

class User {
  constructor(json) {
    this.username = json.username;
    this.password = json.password;
    this.isLogined = false;
  }
}

class Authentication{
  constructor() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.sessionid = urlParams.get("sessionid");
    if (this.sessionid) {
      urlParams.delete("sessionid");
      this.isLogined(this.sessionid);
    }
  }
  login(username, password) {
    const params = new URLSearchParams(`userName=${username}&password=${password}`);
    fetch("http://netigmademo.netcad.com.tr/BELNET/gisapi/authentication/login", {
      body: params,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.json())
      .then((json) => {
        this.user = new User(json)
      });
  }

  isLogined(sessionid) {
    fetch("http://netigmademo.netcad.com.tr/BELNET/gisapi/authentication/IsLogined?sessionid=" + sessionid)
      .then((response) => response.json())
      .then((json) => {
        this.user.isLogined = json
      });
  }

  refresh(sessionid) {
    fetch("http://netigmademo.netcad.com.tr/BELNET/gisapi/authentication/refresh?sessionid=" + sessionid)
    .then((response) => response.json())
    .then((json) => {
      console.log('SessionID refreshed',json);
    });
  }

  logout(sessionid) {
    fetch("http://netigmademo.netcad.com.tr/BELNET/gisapi/authentication/logout?sessionid=" + sessionid)
    .then((response) => response.json())
    .then((json) => {
      console.log('User logged out',json);
    });
  }
}

class Login extends Authentication {
  constructor() {
    super();
    this.userNameInputElement = document.getElementById("usernameInput");
    this.passwordInputElement = document.getElementById("passwordInput");
    this.loginButtonElement = document.getElementById("loginButton");
    this.loginButtonElement.addEventListener("click", this.loginButtonEventHandler.bind(this));
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
