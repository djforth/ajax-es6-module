# ajax-es6-module

An ajax module using es2015 promises and designed to work with rails restful backend

[![Build Status](https://semaphoreci.com/api/v1/projects/4318e3e8-ebd7-4a85-b5ba-e9069d560223/474906/badge.svg)](https://semaphoreci.com/djforth/ajax-es6-module)

## Install

Please to not load this way, not set up as of yet, please install via github

Install via NPM

``` bash

npm install ajax-es6-module

```

or via bower

``` bash

bower install ajax-es6-module

```

## Setup

To setup the ajax module:

``` javascript
 var ajaxRequest = new AjaxES6Promise("/my/api/path");

 // If your not using rails
 var ajaxRequest = new AjaxES6Promise("/my/api/path", false);

```

## Methods

Add Url

