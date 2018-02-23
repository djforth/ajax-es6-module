/* eslint-disable */
import _ from 'lodash';
import union from 'lodash/union';
/* eslint-enable */

class AjaxPromises {
  addRailsJSHeader() {
    /* eslint-disable */
    this.addHeaders([
      {header: 'Content-type', value: 'application/json'}
      , {
        header: 'accept'
        , value: '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript'
      }
    ]);
    /* eslint-enable */
  }

  // Stores headers
  addHeaders(token) {
    if (_.isArray(token)) {
      this.headers = union(token, this.headers);
    } else {
      this.headers.push(token);
    }
  }

  addID(id) {
    if (_.isUndefined(id)) {
      return this.uri;
    }

    if (this.uri.match(/.json/)) {
      return this.uri.replace('.json', `/${id}.json`);
    }

    return `${this.uri}/${id}`;
  }

  addUrl(url) {
    if (!_.isString(url)) {
      throw new Error('URL must be a string');
    }
    this.uri = url;
  }

  constructor(url) {
    this.uri = url || null;
    this.state = 'GET';
    this.data = [];
    this.headers = [];
    // if(document){
    //   this.getCSRF();
    // }
    // this.getCSRF();
  }

  create(data, progress) {
    this.state = 'POST';
    // let _that = this;
    return new Promise(
      function(resolve, reject) {
        this.getRequest(resolve, reject, progress, data);
      }.bind(this)
    );
  }

  // Rails Restful API - DESTROY
  destroy(id, progress) {
    // Destroy Record
    this.state = 'POST';
    let crsf = this.getCSRF();
    this.addRailsJSHeader();
    // Sets up response headers for Delete
    this.addHeaders({ header: 'X-Http-Method-Override', value: 'delete' });

    // Sets default params for DELETE
    let del = { _method: 'delete' };
    del[crsf.param] = crsf.token;
    return new Promise(
      function(resolve, reject) {
        this.getRequest(resolve, reject, progress, del, id);
      }.bind(this)
    );
  }

  // GET Request
  fetch(progress) {
    this.state = 'GET';
    return new Promise(
      function(resolve, reject) {
        this.getRequest(resolve, reject, progress);
      }.bind(this)
    );
  }

  // For Rails Authentication
  getCSRF() {
    let token = document.querySelector('meta[name=csrf-token]');
    let param = document.querySelector('meta[name=csrf-param]');
    if (token) {
      this.headers.push({ header: 'X-CSRF-Token', value: token.content });
    }

    return { token: token.content, param: param.content };
  }

  // Returns current data
  getData() {
    return this.data;
  }

  getID(data, id) {
    return id ? id : data.id;
  }

  // Get/Sends Request
  getRequest(resolve, reject, progress, send, id) {
    if (this.url) {
      throw new Error('URL not set');
    }
    const xhr = this.setRequest(resolve, reject, progress);
    let data = send ? JSON.stringify(send) : null;
    xhr.open(this.state, this.addID(id), true);
    // xhr.responseType = "text";
    this.setHeaders(xhr);
    xhr.send(data);
  }
  // Parses Data
  parseData(data) {
    if (!_.isUndefined(data)) {
      this.data = JSON.parse(data);
    }

    return this.data;
  }

  // Rails Restful PUT request
  update(data, id, progress) {
    this.state = 'PUT';
    // let _that = this;
    return new Promise(
      function(resolve, reject) {
        this.getRequest(resolve, reject, progress, data, this.getID(data, id));
      }.bind(this)
    );
  }

  // Ready state for success or error
  readyState(xhr, resolve, reject) {
    // console.log(xhr.responseText)
    // Error
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

  // Sets headers for request
  setHeaders(xhr, headers) {
    if (headers) {
      this.addHeaders(headers);
    }
    _.forEach(this.headers, function(h) {
      // console.log(h.header, h.value);
      xhr.setRequestHeader(h.header, h.value);
    });
  }

  // Progress check
  setProgress(evt, progress) {
    if (evt.lengthComputable) {
      progress({
        percent: evt.loaded / evt.total * 100,
        loaded: evt.loaded,
        total: evt.total,
      });
    } else {
      progress({
        percent: 100,
        loaded: evt.loaded,
        total: evt.loaded,
      });
    }
  }

  // Creates XMLHttpRequest
  setRequest(resolve, reject, progress) {
    const xhr = new XMLHttpRequest();

    if (_.isFunction(progress)) {
      // Set progress
      xhr.onprogress = function() {
        if (_.isFunction(progress)) {
          this.setProgress(xhr, progress);
        }
      }.bind(this);
    }

    xhr.onreadystatechange = function() {
      this.readyState(xhr, resolve, reject);
    }.bind(this);

    xhr.onerror = function() {
      // Network error
      reject(Error('Network Error'));
    };

    return xhr;
  }
}

export default AjaxPromises;
