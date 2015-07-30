"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require("lodash");

var AjaxPromises = (function () {
  function AjaxPromises(url) {
    _classCallCheck(this, AjaxPromises);

    this.uri = url || null;
    this.state = "GET";
    this.data = [];
    this.headers = [];
    // if(document){
    //   this.getCSRF();
    // }
    // this.getCSRF();
  }

  _createClass(AjaxPromises, [{
    key: "addRailsJSHeader",
    value: function addRailsJSHeader() {
      this.addHeaders([{ header: "Content-type", value: "application/json" }, { header: "accept", value: "*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" }]);
    }
  }, {
    key: "addHeaders",

    // Stores headers
    value: function addHeaders(token) {

      if (_.isArray(token)) {
        this.headers = _.union(token, this.headers);
      } else {
        this.headers.push(token);
      }
    }
  }, {
    key: "addID",
    value: function addID(id) {
      if (_.isUndefined(id)) {
        return this.uri;
      }

      if (this.uri.match(/.json/)) {
        return this.uri.replace(".json", "/" + id + ".json");
      }

      return this.uri + "/" + id;
    }
  }, {
    key: "addUrl",
    value: function addUrl(url) {
      if (!_.isString(url)) {
        throw new Error("URL must be a string");
      }
      this.uri = url;
    }
  }, {
    key: "create",
    value: function create(data, progress) {
      this.state = "POST";
      // let _that = this;
      return new Promise((function (resolve, reject) {
        this.getRequest(resolve, reject, progress, data);
      }).bind(this));
    }
  }, {
    key: "destroy",

    // Rails Restful API - DESTROY
    value: function destroy(id, progress) {
      //Destroy Record
      this.state = "POST";
      var crsf = this.getCSRF();
      this.addRailsJSHeader();
      //Sets up response headers for Delete
      this.addHeaders({ header: "X-Http-Method-Override", value: "delete" });

      //Sets default params for DELETE
      var del = { _method: "delete" };
      del[crsf.param] = crsf.token;
      return new Promise((function (resolve, reject) {
        this.getRequest(resolve, reject, progress, del, id);
      }).bind(this));
    }
  }, {
    key: "fetch",

    // GET Request
    value: function fetch(progress) {
      this.state = "GET";
      return new Promise((function (resolve, reject) {
        this.getRequest(resolve, reject, progress);
      }).bind(this));
    }
  }, {
    key: "getCSRF",

    // For Rails Authentication
    value: function getCSRF() {
      var token = document.querySelector("meta[name=csrf-token]");
      var param = document.querySelector("meta[name=csrf-param]");
      if (token) {
        this.headers.push({ header: "X-CSRF-Token", value: token.content });
      }

      return { token: token.content, param: param.content };
    }
  }, {
    key: "getData",

    // Returns current data
    value: function getData() {
      return this.data;
    }
  }, {
    key: "getID",
    value: function getID(data, id) {
      return id ? id : data.id;
    }
  }, {
    key: "getRequest",

    // Get/Sends Request
    value: function getRequest(resolve, reject, progress, send, id) {
      if (this.url) {
        throw new Error("URL not set");
      }
      var xhr = this.setRequest(resolve, reject, progress);
      var data = send ? JSON.stringify(send) : null;
      xhr.open(this.state, this.addID(id), true);
      // xhr.responseType = "text";
      this.setHeaders(xhr);
      xhr.send(data);
    }
  }, {
    key: "parseData",

    // Parses Data
    value: function parseData(data) {
      if (!_.isUndefined(data)) {
        this.data = JSON.parse(data);
      }

      return this.data;
    }
  }, {
    key: "update",

    // Rails Restful PUT request
    value: function update(data, id, progress) {
      this.state = "PUT";
      // let _that = this;
      return new Promise((function (resolve, reject) {
        this.getRequest(resolve, reject, progress, data, this.getID(data, id));
      }).bind(this));
    }
  }, {
    key: "readyState",

    // Ready state for success or error
    value: function readyState(xhr, resolve, reject) {
      // console.log(xhr.responseText)
      //Error
      if (xhr.status !== 200 && xhr.status !== 0) {
        // console.log("Error", xhr.status);
        reject(new Error(xhr.statusText));
      }

      // all is well
      if (xhr.readyState === 4) {
        this.parseData(xhr.responseText);
        resolve(this.getData());
      }
    }
  }, {
    key: "setHeaders",

    // Sets headers for request
    value: function setHeaders(xhr, headers) {
      if (headers) {
        this.addHeaders(headers);
      }
      _.forEach(this.headers, function (h) {
        // console.log(h.header, h.value);
        xhr.setRequestHeader(h.header, h.value);
      });
    }
  }, {
    key: "setProgress",

    // Progress check
    value: function setProgress(evt, progress) {
      if (evt.lengthComputable) {
        progress({
          percent: evt.loaded / evt.total * 100,
          loaded: evt.loaded,
          total: evt.total
        });
      } else {
        progress({
          percent: 100,
          loaded: evt.loaded,
          total: evt.loaded
        });
      }
    }
  }, {
    key: "setRequest",

    // Creates XMLHttpRequest
    value: function setRequest(resolve, reject, progress) {
      var xhr = new XMLHttpRequest();

      if (_.isFunction(progress)) {
        //Set progress
        xhr.onprogress = (function () {
          if (_.isFunction(progress)) {
            this.setProgress(xhr, progress);
          }
        }).bind(this);
      }

      xhr.onreadystatechange = (function () {

        this.readyState(xhr, resolve, reject);
      }).bind(this);

      xhr.onerror = function () {
        //Network error
        reject(Error("Network Error"));
      };

      return xhr;
    }
  }]);

  return AjaxPromises;
})();

module.exports = AjaxPromises;

//# sourceMappingURL=index.js.map