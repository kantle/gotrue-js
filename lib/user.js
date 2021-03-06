"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _microApiClient = require("micro-api-client");

var _microApiClient2 = _interopRequireDefault(_microApiClient);

var _admin = require("./admin");

var _admin2 = _interopRequireDefault(_admin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ExpiryMargin = 60 * 1000;
var storageKey = "gotrue.user";
var refreshPromises = {};
var currentUser = null;
var forbiddenUpdateAttributes = { api: 1, token: 1, audience: 1, url: 1 };
var forbiddenSaveAttributes = { api: 1 };

var User = function () {
  function User(api, tokenResponse, audience) {
    _classCallCheck(this, User);

    this.api = api;
    this.url = api.apiURL;
    this.audience = audience;
    this._processTokenResponse(tokenResponse);
    currentUser = this;
  }

  _createClass(User, [{
    key: "update",
    value: function update(attributes) {
      var _this = this;

      return this._request("/user", {
        method: "PUT",
        body: JSON.stringify(attributes)
      }).then(function (response) {
        return _this._saveUserData(response)._refreshSavedSession();
      });
    }
  }, {
    key: "jwt",
    value: function jwt(forceRefresh) {
      var _tokenDetails = this.tokenDetails(),
          expires_at = _tokenDetails.expires_at,
          refresh_token = _tokenDetails.refresh_token,
          access_token = _tokenDetails.access_token;

      if (forceRefresh || expires_at - ExpiryMargin < Date.now()) {
        return this._refreshToken(refresh_token);
      }
      return Promise.resolve(access_token);
    }
  }, {
    key: "logout",
    value: function logout() {
      return this._request("/logout", { method: "POST" }).then(this.clearSession.bind(this)).catch(this.clearSession.bind(this));
    }
  }, {
    key: "_refreshToken",
    value: function _refreshToken(refresh_token) {
      var _this2 = this;

      if (refreshPromises[refresh_token]) {
        return refreshPromises[refresh_token];
      }
      return refreshPromises[refresh_token] = this.api.request("/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=refresh_token&refresh_token=" + refresh_token
      }).then(function (response) {
        delete refreshPromises[refresh_token];
        _this2._processTokenResponse(response);
        _this2._refreshSavedSession();
        return _this2.token.access_token;
      }).catch(function (error) {
        delete refreshPromises[refresh_token];
        _this2.clearSession();
        return Promise.reject(error);
      });
    }
  }, {
    key: "_request",
    value: function _request(path) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options.headers = options.headers || {};

      var aud = options.audience || this.audience;
      if (aud) {
        options.headers["X-JWT-AUD"] = aud;
      }

      return this.jwt().then(function (token) {
        return _this3.api.request(path, _extends({
          headers: Object.assign(options.headers, {
            Authorization: "Bearer " + token
          })
        }, options)).catch(function (err) {
          if (err instanceof _microApiClient.JSONHTTPError && err.json) {
            if (err.json.msg) {
              err.message = err.json.msg;
            } else if (err.json.error) {
              err.message = err.json.error + ": " + err.json.error_description;
            }
          }
          return Promise.reject(err);
        });
      });
    }
  }, {
    key: "getUserData",
    value: function getUserData() {
      return this._request("/user").then(this._saveUserData.bind(this)).then(this._refreshSavedSession.bind(this));
    }
  }, {
    key: "_saveUserData",
    value: function _saveUserData(attributes, fromStorage) {
      for (var key in attributes) {
        if (key in User.prototype || key in forbiddenUpdateAttributes) {
          continue;
        }
        this[key] = attributes[key];
      }
      if (fromStorage) {
        this._fromStorage = true;
      }
      return this;
    }
  }, {
    key: "_processTokenResponse",
    value: function _processTokenResponse(tokenResponse) {
      this.token = tokenResponse;
      var claims = void 0;
      try {
        claims = JSON.parse(urlBase64Decode(tokenResponse.access_token.split(".")[1]));
        this.token.expires_at = claims.exp * 1000;
      } catch (e) {
        console.error(new Error("Gotrue-js: Failed to parse tokenResponse claims: " + tokenResponse));
      }
    }
  }, {
    key: "_refreshSavedSession",
    value: function _refreshSavedSession() {
      // only update saved session if we previously saved something
      if (localStorage.getItem(storageKey)) {
        this._saveSession();
      }
      return this;
    }
  }, {
    key: "_saveSession",
    value: function _saveSession() {
      localStorage.setItem(storageKey, JSON.stringify(this._details));
      return this;
    }
  }, {
    key: "tokenDetails",
    value: function tokenDetails() {
      return this.token;
    }
  }, {
    key: "clearSession",
    value: function clearSession() {
      User.removeSavedSession();
      this.token = null;
      currentUser = null;
    }
  }, {
    key: "admin",
    get: function get() {
      return new _admin2.default(this);
    }
  }, {
    key: "_details",
    get: function get() {
      var userCopy = {};
      for (var key in this) {
        if (key in User.prototype || key in forbiddenSaveAttributes) {
          continue;
        }
        userCopy[key] = this[key];
      }
      return userCopy;
    }
  }], [{
    key: "removeSavedSession",
    value: function removeSavedSession() {
      localStorage.removeItem(storageKey);
    }
  }, {
    key: "recoverSession",
    value: function recoverSession(apiInstance) {
      if (currentUser) {
        return currentUser;
      }

      var json = localStorage.getItem(storageKey);
      if (json) {
        try {
          var data = JSON.parse(json);
          var url = data.url,
              token = data.token,
              audience = data.audience;

          if (!url || !token) {
            return null;
          }

          var api = apiInstance || new _microApiClient2.default(url, {});
          return new User(api, token, audience)._saveUserData(data, true);
        } catch (ex) {
          console.error(new Error("Gotrue-js: Error recovering session: " + ex));
          return null;
        }
      }

      return null;
    }
  }]);

  return User;
}();

exports.default = User;


function urlBase64Decode(str) {
  // From https://jwt.io/js/jwt.js
  var output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw 'Illegal base64url string!';
  }
  var result = window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
  try {
    return decodeURIComponent(escape(result));
  } catch (err) {
    return result;
  }
}