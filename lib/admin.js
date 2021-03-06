"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Admin = function () {
  function Admin(user) {
    _classCallCheck(this, Admin);

    this.user = user;
  }

  // Return a list of all users in an audience


  _createClass(Admin, [{
    key: "listUsers",
    value: function listUsers(aud) {
      return this.user._request("/admin/users", {
        method: "GET",
        audience: aud
      });
    }
  }, {
    key: "getUser",
    value: function getUser(user) {
      return this.user._request("/admin/users/" + user.id);
    }
  }, {
    key: "updateUser",
    value: function updateUser(user) {
      var attributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.user._request("/admin/users/" + user.id, {
        method: "PUT",
        body: JSON.stringify(attributes)
      });
    }
  }, {
    key: "createUser",
    value: function createUser(email, password) {
      var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      attributes.email = email;
      attributes.password = password;
      return this.user._request("/admin/users", {
        method: "POST",
        body: JSON.stringify(attributes)
      });
    }
  }, {
    key: "deleteUser",
    value: function deleteUser(user) {
      return this.user._request("/admin/users/" + user.id, {
        method: "DELETE"
      });
    }
  }]);

  return Admin;
}();

exports.default = Admin;