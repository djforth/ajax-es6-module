// require("babelify/polyfill");

import Ajax from '../src/ajaxApi';
import {createHolder, createElement} from './utils/createElements';
import _ from 'lodash';

const mockdata = [
    { "id": 1, "test": "test data" }
  ];

describe('Ajax calls', function() {

  let ajaxCall, server, xhr;
  let success, error, progress;

  beforeEach(function() {
    success  = jasmine.createSpy('success');
    error    = jasmine.createSpy('error');
    progress = jasmine.createSpy('progress');

    ajaxCall = new Ajax("/api/test.json");

  });

  it("should exist", function() {
    expect(ajaxCall).toBeDefined();
  });

  it("should set defaults", function() {
    expect(ajaxCall.uri).toEqual("/api/test.json");
    expect(ajaxCall.state).toEqual('GET');
    expect(ajaxCall.data).toEqual([]);
    expect(ajaxCall.headers).toEqual([]);
  });

  describe('parseData', function() {
    it('should parse json string', function () {
      let json = ajaxCall.parseData(JSON.stringify(mockdata));
      expect(json).toEqual(mockdata);
    });

    it('should return empty array if undefined', function () {
      let json = ajaxCall.parseData();
      expect(json).toEqual([]);
    });
  });

  describe('getData', function() {
    it('should return the data', function () {
      ajaxCall.data = ['test', 'data'];
      expect(ajaxCall.getData()).toEqual(['test', 'data']);
    });
  });

  // describe('setProgress', function() {

  // });

  describe('addID', function() {
    it("should return correct url if no id", function() {
      let url = ajaxCall.addID();
      expect(url).toEqual("/api/test.json");
    });

    it("should return correct url if id & .json", function() {
      let url = ajaxCall.addID(12);
      expect(url).toEqual("/api/test/12.json");
    });

    it("should return correct url if id & no .json", function() {
      ajaxCall.uri = "/api/test";
      let url = ajaxCall.addID(12);
      expect(url).toEqual("/api/test/12");
    });
  });

  describe('getID', function() {
    it("return id if sent", function() {
      let id = ajaxCall.getID(mockdata[0], 22);
      expect(id).toEqual(22);
    });

    it("return id from data if sent", function() {
      let id = ajaxCall.getID(mockdata[0]);
      expect(id).toEqual(1);
    });
  });


  describe('getRequest', function() {
    let xhr;
    beforeEach(function() {
      xhr = new XMLHttpRequest();
      spyOn(xhr, "open");
      spyOn(xhr, "send");
      server = sinon.fakeServer.create();
      spyOn(ajaxCall, "setHeaders");
      spyOn(ajaxCall, "setRequest").and.returnValue(xhr);
    });

    afterEach(function(done) {
      done();
    }, 1);

    afterEach(function(){
      server.restore();
    });

    it("should set request", function() {
      ajaxCall.getRequest(success, error, progress);
      expect(ajaxCall.setRequest).toHaveBeenCalledWith(success, error, progress);
    });

    it("should call open", function() {
      ajaxCall.getRequest(success, error, progress);
      expect(xhr.open).toHaveBeenCalledWith("GET", '/api/test.json', true);
    });

    it("should call send", function() {

      ajaxCall.getRequest(success, error, progress, {foo:"bar"});
      expect(xhr.send).toHaveBeenCalledWith(JSON.stringify({foo:"bar"}));

      ajaxCall.getRequest(success, error, progress);
      expect(xhr.send).toHaveBeenCalledWith(null);

    });

  });

  describe('setRequest', function() {
    let xhr, resolve, reject, progress;
    beforeEach(function() {
      resolve  = jasmine.createSpy('resolve');
      reject   = jasmine.createSpy('reject');
      progress = jasmine.createSpy('progress');
      spyOn(ajaxCall, "readyState");

      xhr = ajaxCall.setRequest(resolve, reject, progress);
    });

    it("should return an XMLHttpRequest", function() {
      expect(Object.prototype.toString.call(xhr)).toEqual("[object XMLHttpRequest]");
    });

    it("should have onprogress", function() {
      expect(_.isFunction(xhr.onprogress)).toBeTruthy();
      xhr.onprogress();
      expect(progress).toHaveBeenCalled();
    });

    it("should have onreadystatechange ", function() {
      expect(_.isFunction(xhr.onreadystatechange )).toBeTruthy();
      xhr.onreadystatechange();
      expect(ajaxCall.readyState).toHaveBeenCalled();
    });


  });

  describe('setProgress', function() {

    it('should return loading data if computable', function () {
      ajaxCall.setProgress({
        lengthComputable:true,
        loaded:100,
        total:200
      }, progress);

      expect(progress).toHaveBeenCalledWith({
        percent:50,
        loaded:100,
        total:200
      });
    });

    it('should return total data if not computable', function () {
      ajaxCall.setProgress({
        lengthComputable:false,
        loaded:200,
        total:0
      }, progress);

      expect(progress).toHaveBeenCalledWith({
        percent:100,
        loaded:200,
        total:200
      });
    });
  });

  describe('readyState', function() {
    let xhr, resolve, reject;
    beforeEach(function(){
      resolve  = jasmine.createSpy('resolve');
      reject   = jasmine.createSpy('reject');
      spyOn(ajaxCall, "parseData");
      spyOn(ajaxCall, "getData").and.returnValue("Parsed Data");
    });

    it("should respond if there is an error ", function() {
      ajaxCall.readyState({status:500, statusText:"It's Broken"}, resolve, reject);

      expect(reject).toHaveBeenCalledWith(new Error("It's Broken"));
    });

    it("should respond if there is success ", function() {
      ajaxCall.readyState({readyState:4, responseText:"Some Content"}, resolve, reject);

      expect(ajaxCall.parseData).toHaveBeenCalledWith("Some Content");
      expect(ajaxCall.getData).toHaveBeenCalled();
      expect(resolve).toHaveBeenCalledWith("Parsed Data");
    });
  });

  describe('Setting headers', function() {
    describe('when adding headers', function() {
      let meta;
      beforeEach(function () {
        meta = createElement(document.head, {name:"csrf-param", content:"param-data"}, "meta");
        meta = createElement(document.head, {name:"csrf-token", content:"token-data"}, "meta");

        ajaxCall.headers = [];
      });

      it('should get meta CSRF token', function () {

        ajaxCall.getCSRF();
        expect(ajaxCall.headers.length).toEqual(1);
        expect(ajaxCall.headers).toContain({header:'X-CSRF-Token', value:"token-data"});
      });

      it("should add other header if object", function() {
        ajaxCall.addHeaders({header:'a-header', value:"token-data"});
        expect(ajaxCall.headers.length).toEqual(1);
        expect(ajaxCall.headers).toContain({header:'a-header', value:"token-data"});
      });

      it("should add headers if array", function() {
        ajaxCall.addHeaders([{header:'a-header', value:"token-data"}, {header:'another-header', value:"token-data"}]);
        expect(ajaxCall.headers.length).toEqual(2);
        expect(ajaxCall.headers).toContain({header:'a-header', value:"token-data"});
        expect(ajaxCall.headers).toContain({header:'another-header', value:"token-data"});

      });

      it("should add to array if data already in header", function() {
        ajaxCall.addHeaders({header:'a-header', value:"token-data"});
        expect(ajaxCall.headers.length).toEqual(1);
         ajaxCall.addHeaders([{header:'more-headers', value:"token-data"}, {header:'another-header', value:"token-data"}]);
        expect(ajaxCall.headers.length).toEqual(3);
      });
    });


    describe('when adding header to request', function() {
      let xhr;

      beforeEach(function() {
        ajaxCall.headers = [{header:'a-header', value:"token-data"}, {header:'another-header', value:"token-data"}];

        xhr = jasmine.createSpyObj('XMLHttpRequest', ['setRequestHeader']);

        spyOn(ajaxCall, "addHeaders").and.callThrough();

      });

      it("should set headers if headers added", function() {

        ajaxCall.setHeaders(xhr);

        expect(xhr.setRequestHeader).toHaveBeenCalled();
        expect(xhr.setRequestHeader.calls.count()).toEqual(2);
        expect(xhr.setRequestHeader.calls.argsFor(0)).toEqual(['a-header', "token-data"]);
        expect(xhr.setRequestHeader.calls.argsFor(1)).toEqual(['another-header', "token-data"]);
      });


      it("should set headers if headers are passed", function() {
        ajaxCall.headers = [];
        let header = {header:'a-header', value:"token-data"};
        ajaxCall.setHeaders(xhr, header);
        expect(ajaxCall.addHeaders).toHaveBeenCalledWith(header);
        expect(xhr.setRequestHeader.calls.count()).toEqual(1);
        expect(xhr.setRequestHeader.calls.argsFor(0)).toEqual(['a-header', "token-data"]);
      });
    });
  });

  describe('when FETCH request is called', function(){
      let xhr, resolve, reject, progress;
      // let progress;
      beforeEach(function(){
        progress = jasmine.createSpy('progress');
      });

      it("should set the correct request", function() {
        spyOn(ajaxCall, "getRequest");
        let promise = ajaxCall.fetch(progress);
        expect(ajaxCall.getRequest).toHaveBeenCalled();
        expect(ajaxCall.getRequest.calls.first().args).toContain(progress);
        expect(promise).toBeDefined();

      });

      describe('check ajax response for fetch (Full stack test)', function() {
        beforeEach(function() {
          server = sinon.fakeServer.create();
        });

        afterEach(function(done) {
          done();
        }, 1);

        afterEach(function(){
          server.restore();
        });

        it("should call a get request correctly if success", function(done) {

          server.respondWith("GET", '/api/test.json',
                [200, { "Content-Type": "application/json" },
                 JSON.stringify(mockdata)]);

          ajaxCall.fetch(progress).then(function(data){
            expect(data).toEqual(mockdata);
          });

          server.respond();

          setTimeout(function() {
            done();
          }, 100);

        });


        it("should call a get request correctly if error", function(done) {

          server.respondWith("GET", '/api/test.json',
                [500, { "Content-Type": "application/json" },
                 JSON.stringify("Error")]);

          ajaxCall.fetch(progress).then(function(data){
            // This should not be called
            expect(data).not.toEqual(mockdata);
          }).catch(function(err){
            expect(err).toEqual(new Error("Internal Server Error"));
          });

          server.respond();

          setTimeout(function() {
            done();
          }, 100);

        });

      });
  });


  describe('when Create request is called ', function() {
    let xhr, resolve, reject, progress;
    // let progress;
    beforeEach(function(){
      progress = jasmine.createSpy('progress');
    });

    it("should set the correct request", function() {
      spyOn(ajaxCall, "getRequest");
      let promise = ajaxCall.create(mockdata, progress);

      expect(ajaxCall.getRequest).toHaveBeenCalled();
      expect(ajaxCall.getRequest.calls.first().args).toContain(progress);
      expect(ajaxCall.getRequest.calls.first().args).toContain(mockdata);
      expect(promise).toBeDefined();

    });


    describe('check ajax response for create (Full stack test)', function() {
      beforeEach(function() {
        server = sinon.fakeServer.create();
      });

      afterEach(function(done) {
        done();
      }, 1);

      afterEach(function(){
        server.restore();
      });

      it("should call a get request correctly if success", function(done) {

        server.respondWith("POST", '/api/test.json',
              [200, { "Content-Type": "application/json" },
               JSON.stringify("created")]);

        ajaxCall.create(mockdata, progress).then(function(data){
          expect(data).toEqual("created");
        });

        server.respond();

        setTimeout(function() {
          done();
        }, 100);

        expect( server.requests[0].requestBody).toEqual(JSON.stringify(mockdata));

      });


      it("should call a get request correctly if error", function(done) {

        server.respondWith("POST", '/api/test.json',
              [500, { "Content-Type": "application/json" },
               JSON.stringify("Error")]);


        let mdata = null;
        ajaxCall.create(mockdata, progress).then(function(data){
          // This should not be called
          expect(data).not.toEqual(mockdata);
        }).catch(function(err){
          expect(err).toEqual(new Error("Internal Server Error"));
        });

        server.respond();

        setTimeout(function() {
          done();
        }, 100);

        // expect(server.requests[0].requestBody).toEqual(JSON.stringify(mockdata))

      });

    });
  });

  describe('when Update request is called ', function() {
    let xhr, resolve, reject, progress;
    // let progress;
    beforeEach(function(){
      progress = jasmine.createSpy('progress');
    });

    it("should set the correct request", function() {
      spyOn(ajaxCall, "getRequest");
      spyOn(ajaxCall, "getID").and.returnValue(1);
      let promise = ajaxCall.update(mockdata, 1, progress);

      expect(ajaxCall.getRequest).toHaveBeenCalled();
      expect(ajaxCall.getRequest.calls.first().args).toContain(progress);
      expect(ajaxCall.getRequest.calls.first().args).toContain(mockdata);
      expect(ajaxCall.getRequest.calls.first().args).toContain(1);
      expect(promise).toBeDefined();

    });


    describe('check ajax response for update (Full stack test)', function() {
      beforeEach(function() {
        spyOn(ajaxCall, "addID").and.returnValue('/api/test/1.json');
        ajaxCall.param = "data-param";
        ajaxCall.token = "data-token";
        server = sinon.fakeServer.create();
      });

      afterEach(function(done) {
        done();
      }, 1);

      afterEach(function(){
        server.restore();
      });

      it("should call a get request correctly if success", function(done) {

        server.respondWith("PUT", '/api/test/1.json',
              [200, { "Content-Type": "application/json" },
               JSON.stringify("success")]);

        ajaxCall.update(mockdata, 1, progress).then(function(data){
          expect(data).toEqual("success");
        });

        server.respond();

        setTimeout(function() {
          done();
        }, 100);

        expect( server.requests[0].requestBody).toEqual(JSON.stringify(mockdata));
        // expect( server.requests[0].url).toEqual('/api/test/1.json')

      });


      it("should call a get request correctly if error", function(done) {

        server.respondWith("PUT", '/api/test/1.json',
              [500, { "Content-Type": "application/json" },
               JSON.stringify("Error")]);


        let mdata = null;
        ajaxCall.update(mockdata, 1, progress).then(function(data){
          // This should not be called
          expect(data).not.toEqual(mockdata);
        }).catch(function(err){
          expect(err).toEqual(new Error("Internal Server Error"));
        });

        server.respond();

        setTimeout(function() {
          done();
        }, 100);

        expect(server.requests[0].requestBody).toEqual(JSON.stringify(mockdata));

      });

    });
  });

  describe('when Destroy request is called ', function() {
    let xhr, resolve, reject, progress, promise;
    // let progress;
    beforeEach(function(){
      spyOn(ajaxCall, "getCSRF").and.returnValue({param:"foo", token:"bar"});
      spyOn(ajaxCall, "addRailsJSHeader");
      spyOn(ajaxCall, "addHeaders");
      progress = jasmine.createSpy('progress');


    });

    describe('set up', function() {
      beforeEach(()=>{
        spyOn(ajaxCall, "getRequest");
        spyOn(ajaxCall, "getID").and.returnValue(1);
        promise = ajaxCall.destroy(1, progress);
      });

      it("should return promise", function() {
        expect(promise).toBeDefined();
      });

      it("should set state", function() {
        expect(ajaxCall.state).toEqual("POST");
      });

      it("should set headers", function() {
        expect(ajaxCall.getCSRF).toHaveBeenCalled();
        expect(ajaxCall.addRailsJSHeader).toHaveBeenCalled();
        expect(ajaxCall.addHeaders).toHaveBeenCalledWith({header:"X-Http-Method-Override", value:"delete"});
      });

      it("should set progress", function() {
        expect(ajaxCall.getRequest).toHaveBeenCalled();
        expect(ajaxCall.getRequest.calls.first().args).toContain(progress);
      });

      it("should pass the the right ID to the request", function() {
        expect(ajaxCall.getRequest.calls.first().args).toContain(1);
      });

      it("should set the correct data", function() {
        let data = ajaxCall.getRequest.calls.first().args[3];
        expect(data._method).toEqual("delete");
        expect(data.foo).toEqual("bar");
      });

    });

    // Need to fix
    xdescribe('check ajax response for destroy (Full stack test)', function() {
      beforeEach(function() {
        spyOn(ajaxCall, "addID").and.returnValue('/api/test/1.json');
        spyOn(ajaxCall, "setHeaders");
        server = sinon.fakeServer.create();
      });

      afterEach(function(done) {
        done();
      }, 1);

      afterEach(function(){
        server.restore();
      });

      xit("should call a get request correctly if success", function(done) {

        server.respondWith("DELETE", '/api/test/1.json',
              [200, {
                "Content-Type": "application/json",
                "accept": "*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
                "X-Http-Method-Override":"delete"
              },
               JSON.stringify("destroyed")]);

        ajaxCall.destroy(1, progress).then(function(data){
          expect(data).toEqual("destroyed");
        });

        server.respond();

        setTimeout(function() {
          done();
        }, 100);


        expect( server.requests[0].url).toEqual('/api/test/1.json');

      });


      it("should call a get request correctly if error", function(done) {

        server.respondWith("DELETE", '/api/test/1.json',
              [500, { "Content-Type": "application/json" ,
                "accept": "*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
                "X-Http-Method-Override":"delete"},
               JSON.stringify("Error")]);


        ajaxCall.destroy(1, progress).then(function(data){
          // This should not be called
          expect(data).not.toEqual(mockdata);
        }).catch(function(err){
          expect(err).toEqual(new Error("Internal Server Error"));
        });

        server.respond();

        setTimeout(function() {
          done();
        }, 100);

        expect( server.requests[0].url).toEqual('/api/test/1.json');

      });

    });
  });

});
