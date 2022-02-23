var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0;
      while (position !== part.size) {
        const chunk = part.slice(position, Math.min(part.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    length += isBlob(value) ? value.size : Buffer.byteLength(String(value));
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = import_stream.default.Readable.from(body.stream());
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error2 = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(error2);
        throw error2;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    const error_ = error2 instanceof FetchBaseError ? error2 : new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index, array) => {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error2) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error2.message}`, "system", error2));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error2) => {
      response.body.destroy(error2);
    });
    if (process.version < "v14") {
      request_.on("socket", (s2) => {
        let endedWithEventsCount;
        s2.prependListener("end", () => {
          endedWithEventsCount = s2._eventsCount;
        });
        s2.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error2 = new Error("Premature close");
            error2.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error2);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              headers.set("Location", locationURL);
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
        raw.once("data", (chunk) => {
          body = (chunk[0] & 15) === 8 ? (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), reject) : (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), reject);
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error2 = new Error("Premature close");
        error2.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error2);
      }
    };
    socket.prependListener("close", onSocketClose);
    request.on("abort", () => {
      socket.removeListener("close", onSocketClose);
    });
    socket.on("data", (buf) => {
      properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    });
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, commonjsGlobal, src, dataUriToBuffer$1, ponyfill_es2018, POOL_SIZE$1, POOL_SIZE, _Blob, Blob2, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ponyfill_es2018 = { exports: {} };
    (function(module2, exports) {
      (function(global2, factory) {
        factory(exports);
      })(commonjsGlobal, function(exports2) {
        const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
        function noop2() {
          return void 0;
        }
        function getGlobals() {
          if (typeof self !== "undefined") {
            return self;
          } else if (typeof window !== "undefined") {
            return window;
          } else if (typeof commonjsGlobal !== "undefined") {
            return commonjsGlobal;
          }
          return void 0;
        }
        const globals = getGlobals();
        function typeIsObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        const rethrowAssertionErrorRejection = noop2;
        const originalPromise = Promise;
        const originalPromiseThen = Promise.prototype.then;
        const originalPromiseResolve = Promise.resolve.bind(originalPromise);
        const originalPromiseReject = Promise.reject.bind(originalPromise);
        function newPromise(executor) {
          return new originalPromise(executor);
        }
        function promiseResolvedWith(value) {
          return originalPromiseResolve(value);
        }
        function promiseRejectedWith(reason) {
          return originalPromiseReject(reason);
        }
        function PerformPromiseThen(promise, onFulfilled, onRejected) {
          return originalPromiseThen.call(promise, onFulfilled, onRejected);
        }
        function uponPromise(promise, onFulfilled, onRejected) {
          PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
        }
        function uponFulfillment(promise, onFulfilled) {
          uponPromise(promise, onFulfilled);
        }
        function uponRejection(promise, onRejected) {
          uponPromise(promise, void 0, onRejected);
        }
        function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
          return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
        }
        function setPromiseIsHandledToTrue(promise) {
          PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
        }
        const queueMicrotask = (() => {
          const globalQueueMicrotask = globals && globals.queueMicrotask;
          if (typeof globalQueueMicrotask === "function") {
            return globalQueueMicrotask;
          }
          const resolvedPromise = promiseResolvedWith(void 0);
          return (fn) => PerformPromiseThen(resolvedPromise, fn);
        })();
        function reflectCall(F, V, args) {
          if (typeof F !== "function") {
            throw new TypeError("Argument is not a function");
          }
          return Function.prototype.apply.call(F, V, args);
        }
        function promiseCall(F, V, args) {
          try {
            return promiseResolvedWith(reflectCall(F, V, args));
          } catch (value) {
            return promiseRejectedWith(value);
          }
        }
        const QUEUE_MAX_ARRAY_SIZE = 16384;
        class SimpleQueue {
          constructor() {
            this._cursor = 0;
            this._size = 0;
            this._front = {
              _elements: [],
              _next: void 0
            };
            this._back = this._front;
            this._cursor = 0;
            this._size = 0;
          }
          get length() {
            return this._size;
          }
          push(element) {
            const oldBack = this._back;
            let newBack = oldBack;
            if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
              newBack = {
                _elements: [],
                _next: void 0
              };
            }
            oldBack._elements.push(element);
            if (newBack !== oldBack) {
              this._back = newBack;
              oldBack._next = newBack;
            }
            ++this._size;
          }
          shift() {
            const oldFront = this._front;
            let newFront = oldFront;
            const oldCursor = this._cursor;
            let newCursor = oldCursor + 1;
            const elements = oldFront._elements;
            const element = elements[oldCursor];
            if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
              newFront = oldFront._next;
              newCursor = 0;
            }
            --this._size;
            this._cursor = newCursor;
            if (oldFront !== newFront) {
              this._front = newFront;
            }
            elements[oldCursor] = void 0;
            return element;
          }
          forEach(callback) {
            let i = this._cursor;
            let node = this._front;
            let elements = node._elements;
            while (i !== elements.length || node._next !== void 0) {
              if (i === elements.length) {
                node = node._next;
                elements = node._elements;
                i = 0;
                if (elements.length === 0) {
                  break;
                }
              }
              callback(elements[i]);
              ++i;
            }
          }
          peek() {
            const front = this._front;
            const cursor = this._cursor;
            return front._elements[cursor];
          }
        }
        function ReadableStreamReaderGenericInitialize(reader, stream) {
          reader._ownerReadableStream = stream;
          stream._reader = reader;
          if (stream._state === "readable") {
            defaultReaderClosedPromiseInitialize(reader);
          } else if (stream._state === "closed") {
            defaultReaderClosedPromiseInitializeAsResolved(reader);
          } else {
            defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
          }
        }
        function ReadableStreamReaderGenericCancel(reader, reason) {
          const stream = reader._ownerReadableStream;
          return ReadableStreamCancel(stream, reason);
        }
        function ReadableStreamReaderGenericRelease(reader) {
          if (reader._ownerReadableStream._state === "readable") {
            defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          } else {
            defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          }
          reader._ownerReadableStream._reader = void 0;
          reader._ownerReadableStream = void 0;
        }
        function readerLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released reader");
        }
        function defaultReaderClosedPromiseInitialize(reader) {
          reader._closedPromise = newPromise((resolve2, reject) => {
            reader._closedPromise_resolve = resolve2;
            reader._closedPromise_reject = reject;
          });
        }
        function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseReject(reader, reason);
        }
        function defaultReaderClosedPromiseInitializeAsResolved(reader) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseResolve(reader);
        }
        function defaultReaderClosedPromiseReject(reader, reason) {
          if (reader._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(reader._closedPromise);
          reader._closedPromise_reject(reason);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        function defaultReaderClosedPromiseResetToRejected(reader, reason) {
          defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
        }
        function defaultReaderClosedPromiseResolve(reader) {
          if (reader._closedPromise_resolve === void 0) {
            return;
          }
          reader._closedPromise_resolve(void 0);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
        const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
        const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
        const PullSteps = SymbolPolyfill("[[PullSteps]]");
        const NumberIsFinite = Number.isFinite || function(x) {
          return typeof x === "number" && isFinite(x);
        };
        const MathTrunc = Math.trunc || function(v) {
          return v < 0 ? Math.ceil(v) : Math.floor(v);
        };
        function isDictionary(x) {
          return typeof x === "object" || typeof x === "function";
        }
        function assertDictionary(obj, context) {
          if (obj !== void 0 && !isDictionary(obj)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertFunction(x, context) {
          if (typeof x !== "function") {
            throw new TypeError(`${context} is not a function.`);
          }
        }
        function isObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        function assertObject(x, context) {
          if (!isObject(x)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertRequiredArgument(x, position, context) {
          if (x === void 0) {
            throw new TypeError(`Parameter ${position} is required in '${context}'.`);
          }
        }
        function assertRequiredField(x, field, context) {
          if (x === void 0) {
            throw new TypeError(`${field} is required in '${context}'.`);
          }
        }
        function convertUnrestrictedDouble(value) {
          return Number(value);
        }
        function censorNegativeZero(x) {
          return x === 0 ? 0 : x;
        }
        function integerPart(x) {
          return censorNegativeZero(MathTrunc(x));
        }
        function convertUnsignedLongLongWithEnforceRange(value, context) {
          const lowerBound = 0;
          const upperBound = Number.MAX_SAFE_INTEGER;
          let x = Number(value);
          x = censorNegativeZero(x);
          if (!NumberIsFinite(x)) {
            throw new TypeError(`${context} is not a finite number`);
          }
          x = integerPart(x);
          if (x < lowerBound || x > upperBound) {
            throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
          }
          if (!NumberIsFinite(x) || x === 0) {
            return 0;
          }
          return x;
        }
        function assertReadableStream(x, context) {
          if (!IsReadableStream(x)) {
            throw new TypeError(`${context} is not a ReadableStream.`);
          }
        }
        function AcquireReadableStreamDefaultReader(stream) {
          return new ReadableStreamDefaultReader(stream);
        }
        function ReadableStreamAddReadRequest(stream, readRequest) {
          stream._reader._readRequests.push(readRequest);
        }
        function ReadableStreamFulfillReadRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readRequest = reader._readRequests.shift();
          if (done) {
            readRequest._closeSteps();
          } else {
            readRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadRequests(stream) {
          return stream._reader._readRequests.length;
        }
        function ReadableStreamHasDefaultReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamDefaultReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamDefaultReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("read"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: () => resolvePromise({ value: void 0, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamDefaultReaderRead(this, readRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamDefaultReader(this)) {
              throw defaultReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamDefaultReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultReader",
            configurable: true
          });
        }
        function IsReadableStreamDefaultReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readRequests")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultReader;
        }
        function ReadableStreamDefaultReaderRead(reader, readRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "closed") {
            readRequest._closeSteps();
          } else if (stream._state === "errored") {
            readRequest._errorSteps(stream._storedError);
          } else {
            stream._readableStreamController[PullSteps](readRequest);
          }
        }
        function defaultReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
        }
        const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
        }).prototype);
        class ReadableStreamAsyncIteratorImpl {
          constructor(reader, preventCancel) {
            this._ongoingPromise = void 0;
            this._isFinished = false;
            this._reader = reader;
            this._preventCancel = preventCancel;
          }
          next() {
            const nextSteps = () => this._nextSteps();
            this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
            return this._ongoingPromise;
          }
          return(value) {
            const returnSteps = () => this._returnSteps(value);
            return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
          }
          _nextSteps() {
            if (this._isFinished) {
              return Promise.resolve({ value: void 0, done: true });
            }
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("iterate"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => {
                this._ongoingPromise = void 0;
                queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
              },
              _closeSteps: () => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                resolvePromise({ value: void 0, done: true });
              },
              _errorSteps: (reason) => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                rejectPromise(reason);
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promise;
          }
          _returnSteps(value) {
            if (this._isFinished) {
              return Promise.resolve({ value, done: true });
            }
            this._isFinished = true;
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("finish iterating"));
            }
            if (!this._preventCancel) {
              const result = ReadableStreamReaderGenericCancel(reader, value);
              ReadableStreamReaderGenericRelease(reader);
              return transformPromiseWith(result, () => ({ value, done: true }));
            }
            ReadableStreamReaderGenericRelease(reader);
            return promiseResolvedWith({ value, done: true });
          }
        }
        const ReadableStreamAsyncIteratorPrototype = {
          next() {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
            }
            return this._asyncIteratorImpl.next();
          },
          return(value) {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
            }
            return this._asyncIteratorImpl.return(value);
          }
        };
        if (AsyncIteratorPrototype !== void 0) {
          Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
        }
        function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
          const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
          iterator._asyncIteratorImpl = impl;
          return iterator;
        }
        function IsReadableStreamAsyncIterator(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_asyncIteratorImpl")) {
            return false;
          }
          try {
            return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
          } catch (_a) {
            return false;
          }
        }
        function streamAsyncIteratorBrandCheckException(name) {
          return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
        }
        const NumberIsNaN = Number.isNaN || function(x) {
          return x !== x;
        };
        function CreateArrayFromList(elements) {
          return elements.slice();
        }
        function CopyDataBlockBytes(dest, destOffset, src2, srcOffset, n) {
          new Uint8Array(dest).set(new Uint8Array(src2, srcOffset, n), destOffset);
        }
        function TransferArrayBuffer(O) {
          return O;
        }
        function IsDetachedBuffer(O) {
          return false;
        }
        function ArrayBufferSlice(buffer, begin, end) {
          if (buffer.slice) {
            return buffer.slice(begin, end);
          }
          const length = end - begin;
          const slice = new ArrayBuffer(length);
          CopyDataBlockBytes(slice, 0, buffer, begin, length);
          return slice;
        }
        function IsNonNegativeNumber(v) {
          if (typeof v !== "number") {
            return false;
          }
          if (NumberIsNaN(v)) {
            return false;
          }
          if (v < 0) {
            return false;
          }
          return true;
        }
        function CloneAsUint8Array(O) {
          const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
          return new Uint8Array(buffer);
        }
        function DequeueValue(container) {
          const pair = container._queue.shift();
          container._queueTotalSize -= pair.size;
          if (container._queueTotalSize < 0) {
            container._queueTotalSize = 0;
          }
          return pair.value;
        }
        function EnqueueValueWithSize(container, value, size) {
          if (!IsNonNegativeNumber(size) || size === Infinity) {
            throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
          }
          container._queue.push({ value, size });
          container._queueTotalSize += size;
        }
        function PeekQueueValue(container) {
          const pair = container._queue.peek();
          return pair.value;
        }
        function ResetQueue(container) {
          container._queue = new SimpleQueue();
          container._queueTotalSize = 0;
        }
        class ReadableStreamBYOBRequest {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get view() {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("view");
            }
            return this._view;
          }
          respond(bytesWritten) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respond");
            }
            assertRequiredArgument(bytesWritten, 1, "respond");
            bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(this._view.buffer))
              ;
            ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
          }
          respondWithNewView(view) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respondWithNewView");
            }
            assertRequiredArgument(view, 1, "respondWithNewView");
            if (!ArrayBuffer.isView(view)) {
              throw new TypeError("You can only respond with array buffer views");
            }
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
          }
        }
        Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
          respond: { enumerable: true },
          respondWithNewView: { enumerable: true },
          view: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBRequest",
            configurable: true
          });
        }
        class ReadableByteStreamController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get byobRequest() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("byobRequest");
            }
            return ReadableByteStreamControllerGetBYOBRequest(this);
          }
          get desiredSize() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("desiredSize");
            }
            return ReadableByteStreamControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("close");
            }
            if (this._closeRequested) {
              throw new TypeError("The stream has already been closed; do not close it again!");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
            }
            ReadableByteStreamControllerClose(this);
          }
          enqueue(chunk) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("enqueue");
            }
            assertRequiredArgument(chunk, 1, "enqueue");
            if (!ArrayBuffer.isView(chunk)) {
              throw new TypeError("chunk must be an array buffer view");
            }
            if (chunk.byteLength === 0) {
              throw new TypeError("chunk must have non-zero byteLength");
            }
            if (chunk.buffer.byteLength === 0) {
              throw new TypeError(`chunk's buffer must have non-zero byteLength`);
            }
            if (this._closeRequested) {
              throw new TypeError("stream is closed or draining");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
            }
            ReadableByteStreamControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("error");
            }
            ReadableByteStreamControllerError(this, e);
          }
          [CancelSteps](reason) {
            ReadableByteStreamControllerClearPendingPullIntos(this);
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableByteStreamControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableByteStream;
            if (this._queueTotalSize > 0) {
              const entry = this._queue.shift();
              this._queueTotalSize -= entry.byteLength;
              ReadableByteStreamControllerHandleQueueDrain(this);
              const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
              readRequest._chunkSteps(view);
              return;
            }
            const autoAllocateChunkSize = this._autoAllocateChunkSize;
            if (autoAllocateChunkSize !== void 0) {
              let buffer;
              try {
                buffer = new ArrayBuffer(autoAllocateChunkSize);
              } catch (bufferE) {
                readRequest._errorSteps(bufferE);
                return;
              }
              const pullIntoDescriptor = {
                buffer,
                bufferByteLength: autoAllocateChunkSize,
                byteOffset: 0,
                byteLength: autoAllocateChunkSize,
                bytesFilled: 0,
                elementSize: 1,
                viewConstructor: Uint8Array,
                readerType: "default"
              };
              this._pendingPullIntos.push(pullIntoDescriptor);
            }
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableByteStreamControllerCallPullIfNeeded(this);
          }
        }
        Object.defineProperties(ReadableByteStreamController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          byobRequest: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableByteStreamController",
            configurable: true
          });
        }
        function IsReadableByteStreamController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableByteStream")) {
            return false;
          }
          return x instanceof ReadableByteStreamController;
        }
        function IsReadableStreamBYOBRequest(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_associatedReadableByteStreamController")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBRequest;
        }
        function ReadableByteStreamControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableByteStreamControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableByteStreamControllerError(controller, e);
          });
        }
        function ReadableByteStreamControllerClearPendingPullIntos(controller) {
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          controller._pendingPullIntos = new SimpleQueue();
        }
        function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
          let done = false;
          if (stream._state === "closed") {
            done = true;
          }
          const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
          if (pullIntoDescriptor.readerType === "default") {
            ReadableStreamFulfillReadRequest(stream, filledView, done);
          } else {
            ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
          }
        }
        function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
          const bytesFilled = pullIntoDescriptor.bytesFilled;
          const elementSize = pullIntoDescriptor.elementSize;
          return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
        }
        function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
          controller._queue.push({ buffer, byteOffset, byteLength });
          controller._queueTotalSize += byteLength;
        }
        function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
          const elementSize = pullIntoDescriptor.elementSize;
          const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
          const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
          const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
          const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
          let totalBytesToCopyRemaining = maxBytesToCopy;
          let ready = false;
          if (maxAlignedBytes > currentAlignedBytes) {
            totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
            ready = true;
          }
          const queue = controller._queue;
          while (totalBytesToCopyRemaining > 0) {
            const headOfQueue = queue.peek();
            const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
            const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
            if (headOfQueue.byteLength === bytesToCopy) {
              queue.shift();
            } else {
              headOfQueue.byteOffset += bytesToCopy;
              headOfQueue.byteLength -= bytesToCopy;
            }
            controller._queueTotalSize -= bytesToCopy;
            ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
            totalBytesToCopyRemaining -= bytesToCopy;
          }
          return ready;
        }
        function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
          pullIntoDescriptor.bytesFilled += size;
        }
        function ReadableByteStreamControllerHandleQueueDrain(controller) {
          if (controller._queueTotalSize === 0 && controller._closeRequested) {
            ReadableByteStreamControllerClearAlgorithms(controller);
            ReadableStreamClose(controller._controlledReadableByteStream);
          } else {
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }
        function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
          if (controller._byobRequest === null) {
            return;
          }
          controller._byobRequest._associatedReadableByteStreamController = void 0;
          controller._byobRequest._view = null;
          controller._byobRequest = null;
        }
        function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
          while (controller._pendingPullIntos.length > 0) {
            if (controller._queueTotalSize === 0) {
              return;
            }
            const pullIntoDescriptor = controller._pendingPullIntos.peek();
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
          const stream = controller._controlledReadableByteStream;
          let elementSize = 1;
          if (view.constructor !== DataView) {
            elementSize = view.constructor.BYTES_PER_ELEMENT;
          }
          const ctor = view.constructor;
          const buffer = TransferArrayBuffer(view.buffer);
          const pullIntoDescriptor = {
            buffer,
            bufferByteLength: buffer.byteLength,
            byteOffset: view.byteOffset,
            byteLength: view.byteLength,
            bytesFilled: 0,
            elementSize,
            viewConstructor: ctor,
            readerType: "byob"
          };
          if (controller._pendingPullIntos.length > 0) {
            controller._pendingPullIntos.push(pullIntoDescriptor);
            ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
            return;
          }
          if (stream._state === "closed") {
            const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
            readIntoRequest._closeSteps(emptyView);
            return;
          }
          if (controller._queueTotalSize > 0) {
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
              ReadableByteStreamControllerHandleQueueDrain(controller);
              readIntoRequest._chunkSteps(filledView);
              return;
            }
            if (controller._closeRequested) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              readIntoRequest._errorSteps(e);
              return;
            }
          }
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
          const stream = controller._controlledReadableByteStream;
          if (ReadableStreamHasBYOBReader(stream)) {
            while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
              const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
          if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
            return;
          }
          ReadableByteStreamControllerShiftPendingPullInto(controller);
          const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
          if (remainderSize > 0) {
            const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
          }
          pullIntoDescriptor.bytesFilled -= remainderSize;
          ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        }
        function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            ReadableByteStreamControllerRespondInClosedState(controller);
          } else {
            ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerShiftPendingPullInto(controller) {
          const descriptor = controller._pendingPullIntos.shift();
          return descriptor;
        }
        function ReadableByteStreamControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return false;
          }
          if (controller._closeRequested) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableByteStreamControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
        }
        function ReadableByteStreamControllerClose(controller) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          if (controller._queueTotalSize > 0) {
            controller._closeRequested = true;
            return;
          }
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (firstPendingPullInto.bytesFilled > 0) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              throw e;
            }
          }
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
        function ReadableByteStreamControllerEnqueue(controller, chunk) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          const buffer = chunk.buffer;
          const byteOffset = chunk.byteOffset;
          const byteLength = chunk.byteLength;
          const transferredBuffer = TransferArrayBuffer(buffer);
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (IsDetachedBuffer(firstPendingPullInto.buffer))
              ;
            firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
          }
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          if (ReadableStreamHasDefaultReader(stream)) {
            if (ReadableStreamGetNumReadRequests(stream) === 0) {
              ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            } else {
              const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
              ReadableStreamFulfillReadRequest(stream, transferredView, false);
            }
          } else if (ReadableStreamHasBYOBReader(stream)) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
          } else {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerError(controller, e) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return;
          }
          ReadableByteStreamControllerClearPendingPullIntos(controller);
          ResetQueue(controller);
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableByteStreamControllerGetBYOBRequest(controller) {
          if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
            const firstDescriptor = controller._pendingPullIntos.peek();
            const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
            const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
            SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
            controller._byobRequest = byobRequest;
          }
          return controller._byobRequest;
        }
        function ReadableByteStreamControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableByteStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableByteStreamControllerRespond(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (bytesWritten !== 0) {
              throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
            }
          } else {
            if (bytesWritten === 0) {
              throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
            }
            if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
              throw new RangeError("bytesWritten out of range");
            }
          }
          firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
          ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
        }
        function ReadableByteStreamControllerRespondWithNewView(controller, view) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (view.byteLength !== 0) {
              throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
            }
          } else {
            if (view.byteLength === 0) {
              throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
            }
          }
          if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
            throw new RangeError("The region specified by view does not match byobRequest");
          }
          if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
            throw new RangeError("The buffer of view has different capacity than byobRequest");
          }
          if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
            throw new RangeError("The region specified by view is larger than byobRequest");
          }
          firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
          ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
        }
        function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
          controller._controlledReadableByteStream = stream;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._byobRequest = null;
          controller._queue = controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._closeRequested = false;
          controller._started = false;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          controller._autoAllocateChunkSize = autoAllocateChunkSize;
          controller._pendingPullIntos = new SimpleQueue();
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableByteStreamControllerError(controller, r);
          });
        }
        function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
          const controller = Object.create(ReadableByteStreamController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingByteSource.start !== void 0) {
            startAlgorithm = () => underlyingByteSource.start(controller);
          }
          if (underlyingByteSource.pull !== void 0) {
            pullAlgorithm = () => underlyingByteSource.pull(controller);
          }
          if (underlyingByteSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
          }
          const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
          if (autoAllocateChunkSize === 0) {
            throw new TypeError("autoAllocateChunkSize must be greater than 0");
          }
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
        }
        function SetUpReadableStreamBYOBRequest(request, controller, view) {
          request._associatedReadableByteStreamController = controller;
          request._view = view;
        }
        function byobRequestBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
        }
        function byteStreamControllerBrandCheckException(name) {
          return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
        }
        function AcquireReadableStreamBYOBReader(stream) {
          return new ReadableStreamBYOBReader(stream);
        }
        function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
          stream._reader._readIntoRequests.push(readIntoRequest);
        }
        function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readIntoRequest = reader._readIntoRequests.shift();
          if (done) {
            readIntoRequest._closeSteps(chunk);
          } else {
            readIntoRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadIntoRequests(stream) {
          return stream._reader._readIntoRequests.length;
        }
        function ReadableStreamHasBYOBReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamBYOBReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamBYOBReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            if (!IsReadableByteStreamController(stream._readableStreamController)) {
              throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readIntoRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read(view) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("read"));
            }
            if (!ArrayBuffer.isView(view)) {
              return promiseRejectedWith(new TypeError("view must be an array buffer view"));
            }
            if (view.byteLength === 0) {
              return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
            }
            if (view.buffer.byteLength === 0) {
              return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readIntoRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamBYOBReader(this)) {
              throw byobReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readIntoRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamBYOBReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBReader",
            configurable: true
          });
        }
        function IsReadableStreamBYOBReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readIntoRequests")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBReader;
        }
        function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "errored") {
            readIntoRequest._errorSteps(stream._storedError);
          } else {
            ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
          }
        }
        function byobReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
        }
        function ExtractHighWaterMark(strategy, defaultHWM) {
          const { highWaterMark } = strategy;
          if (highWaterMark === void 0) {
            return defaultHWM;
          }
          if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
            throw new RangeError("Invalid highWaterMark");
          }
          return highWaterMark;
        }
        function ExtractSizeAlgorithm(strategy) {
          const { size } = strategy;
          if (!size) {
            return () => 1;
          }
          return size;
        }
        function convertQueuingStrategy(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          const size = init2 === null || init2 === void 0 ? void 0 : init2.size;
          return {
            highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
            size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
          };
        }
        function convertQueuingStrategySize(fn, context) {
          assertFunction(fn, context);
          return (chunk) => convertUnrestrictedDouble(fn(chunk));
        }
        function convertUnderlyingSink(original, context) {
          assertDictionary(original, context);
          const abort = original === null || original === void 0 ? void 0 : original.abort;
          const close = original === null || original === void 0 ? void 0 : original.close;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          const write = original === null || original === void 0 ? void 0 : original.write;
          return {
            abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
            close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
            write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
            type
          };
        }
        function convertUnderlyingSinkAbortCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSinkCloseCallback(fn, original, context) {
          assertFunction(fn, context);
          return () => promiseCall(fn, original, []);
        }
        function convertUnderlyingSinkStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertUnderlyingSinkWriteCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        function assertWritableStream(x, context) {
          if (!IsWritableStream(x)) {
            throw new TypeError(`${context} is not a WritableStream.`);
          }
        }
        function isAbortSignal2(value) {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          try {
            return typeof value.aborted === "boolean";
          } catch (_a) {
            return false;
          }
        }
        const supportsAbortController = typeof AbortController === "function";
        function createAbortController() {
          if (supportsAbortController) {
            return new AbortController();
          }
          return void 0;
        }
        class WritableStream {
          constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
            if (rawUnderlyingSink === void 0) {
              rawUnderlyingSink = null;
            } else {
              assertObject(rawUnderlyingSink, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
            InitializeWritableStream(this);
            const type = underlyingSink.type;
            if (type !== void 0) {
              throw new RangeError("Invalid type is specified");
            }
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
          }
          get locked() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("locked");
            }
            return IsWritableStreamLocked(this);
          }
          abort(reason = void 0) {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("abort"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
            }
            return WritableStreamAbort(this, reason);
          }
          close() {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("close"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
            }
            if (WritableStreamCloseQueuedOrInFlight(this)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamClose(this);
          }
          getWriter() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("getWriter");
            }
            return AcquireWritableStreamDefaultWriter(this);
          }
        }
        Object.defineProperties(WritableStream.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          getWriter: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStream",
            configurable: true
          });
        }
        function AcquireWritableStreamDefaultWriter(stream) {
          return new WritableStreamDefaultWriter(stream);
        }
        function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(WritableStream.prototype);
          InitializeWritableStream(stream);
          const controller = Object.create(WritableStreamDefaultController.prototype);
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function InitializeWritableStream(stream) {
          stream._state = "writable";
          stream._storedError = void 0;
          stream._writer = void 0;
          stream._writableStreamController = void 0;
          stream._writeRequests = new SimpleQueue();
          stream._inFlightWriteRequest = void 0;
          stream._closeRequest = void 0;
          stream._inFlightCloseRequest = void 0;
          stream._pendingAbortRequest = void 0;
          stream._backpressure = false;
        }
        function IsWritableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_writableStreamController")) {
            return false;
          }
          return x instanceof WritableStream;
        }
        function IsWritableStreamLocked(stream) {
          if (stream._writer === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamAbort(stream, reason) {
          var _a;
          if (stream._state === "closed" || stream._state === "errored") {
            return promiseResolvedWith(void 0);
          }
          stream._writableStreamController._abortReason = reason;
          (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseResolvedWith(void 0);
          }
          if (stream._pendingAbortRequest !== void 0) {
            return stream._pendingAbortRequest._promise;
          }
          let wasAlreadyErroring = false;
          if (state === "erroring") {
            wasAlreadyErroring = true;
            reason = void 0;
          }
          const promise = newPromise((resolve2, reject) => {
            stream._pendingAbortRequest = {
              _promise: void 0,
              _resolve: resolve2,
              _reject: reject,
              _reason: reason,
              _wasAlreadyErroring: wasAlreadyErroring
            };
          });
          stream._pendingAbortRequest._promise = promise;
          if (!wasAlreadyErroring) {
            WritableStreamStartErroring(stream, reason);
          }
          return promise;
        }
        function WritableStreamClose(stream) {
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
          }
          const promise = newPromise((resolve2, reject) => {
            const closeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._closeRequest = closeRequest;
          });
          const writer = stream._writer;
          if (writer !== void 0 && stream._backpressure && state === "writable") {
            defaultWriterReadyPromiseResolve(writer);
          }
          WritableStreamDefaultControllerClose(stream._writableStreamController);
          return promise;
        }
        function WritableStreamAddWriteRequest(stream) {
          const promise = newPromise((resolve2, reject) => {
            const writeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._writeRequests.push(writeRequest);
          });
          return promise;
        }
        function WritableStreamDealWithRejection(stream, error2) {
          const state = stream._state;
          if (state === "writable") {
            WritableStreamStartErroring(stream, error2);
            return;
          }
          WritableStreamFinishErroring(stream);
        }
        function WritableStreamStartErroring(stream, reason) {
          const controller = stream._writableStreamController;
          stream._state = "erroring";
          stream._storedError = reason;
          const writer = stream._writer;
          if (writer !== void 0) {
            WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
          }
          if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
            WritableStreamFinishErroring(stream);
          }
        }
        function WritableStreamFinishErroring(stream) {
          stream._state = "errored";
          stream._writableStreamController[ErrorSteps]();
          const storedError = stream._storedError;
          stream._writeRequests.forEach((writeRequest) => {
            writeRequest._reject(storedError);
          });
          stream._writeRequests = new SimpleQueue();
          if (stream._pendingAbortRequest === void 0) {
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const abortRequest = stream._pendingAbortRequest;
          stream._pendingAbortRequest = void 0;
          if (abortRequest._wasAlreadyErroring) {
            abortRequest._reject(storedError);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
          uponPromise(promise, () => {
            abortRequest._resolve();
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          }, (reason) => {
            abortRequest._reject(reason);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          });
        }
        function WritableStreamFinishInFlightWrite(stream) {
          stream._inFlightWriteRequest._resolve(void 0);
          stream._inFlightWriteRequest = void 0;
        }
        function WritableStreamFinishInFlightWriteWithError(stream, error2) {
          stream._inFlightWriteRequest._reject(error2);
          stream._inFlightWriteRequest = void 0;
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamFinishInFlightClose(stream) {
          stream._inFlightCloseRequest._resolve(void 0);
          stream._inFlightCloseRequest = void 0;
          const state = stream._state;
          if (state === "erroring") {
            stream._storedError = void 0;
            if (stream._pendingAbortRequest !== void 0) {
              stream._pendingAbortRequest._resolve();
              stream._pendingAbortRequest = void 0;
            }
          }
          stream._state = "closed";
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseResolve(writer);
          }
        }
        function WritableStreamFinishInFlightCloseWithError(stream, error2) {
          stream._inFlightCloseRequest._reject(error2);
          stream._inFlightCloseRequest = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._reject(error2);
            stream._pendingAbortRequest = void 0;
          }
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamCloseQueuedOrInFlight(stream) {
          if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamHasOperationMarkedInFlight(stream) {
          if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamMarkCloseRequestInFlight(stream) {
          stream._inFlightCloseRequest = stream._closeRequest;
          stream._closeRequest = void 0;
        }
        function WritableStreamMarkFirstWriteRequestInFlight(stream) {
          stream._inFlightWriteRequest = stream._writeRequests.shift();
        }
        function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
          if (stream._closeRequest !== void 0) {
            stream._closeRequest._reject(stream._storedError);
            stream._closeRequest = void 0;
          }
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseReject(writer, stream._storedError);
          }
        }
        function WritableStreamUpdateBackpressure(stream, backpressure) {
          const writer = stream._writer;
          if (writer !== void 0 && backpressure !== stream._backpressure) {
            if (backpressure) {
              defaultWriterReadyPromiseReset(writer);
            } else {
              defaultWriterReadyPromiseResolve(writer);
            }
          }
          stream._backpressure = backpressure;
        }
        class WritableStreamDefaultWriter {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
            assertWritableStream(stream, "First parameter");
            if (IsWritableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive writing by another writer");
            }
            this._ownerWritableStream = stream;
            stream._writer = this;
            const state = stream._state;
            if (state === "writable") {
              if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
                defaultWriterReadyPromiseInitialize(this);
              } else {
                defaultWriterReadyPromiseInitializeAsResolved(this);
              }
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "erroring") {
              defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "closed") {
              defaultWriterReadyPromiseInitializeAsResolved(this);
              defaultWriterClosedPromiseInitializeAsResolved(this);
            } else {
              const storedError = stream._storedError;
              defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
              defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
            }
          }
          get closed() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          get desiredSize() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("desiredSize");
            }
            if (this._ownerWritableStream === void 0) {
              throw defaultWriterLockException("desiredSize");
            }
            return WritableStreamDefaultWriterGetDesiredSize(this);
          }
          get ready() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
            }
            return this._readyPromise;
          }
          abort(reason = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("abort"));
            }
            return WritableStreamDefaultWriterAbort(this, reason);
          }
          close() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("close"));
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("close"));
            }
            if (WritableStreamCloseQueuedOrInFlight(stream)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamDefaultWriterClose(this);
          }
          releaseLock() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("releaseLock");
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return;
            }
            WritableStreamDefaultWriterRelease(this);
          }
          write(chunk = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("write"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("write to"));
            }
            return WritableStreamDefaultWriterWrite(this, chunk);
          }
        }
        Object.defineProperties(WritableStreamDefaultWriter.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          releaseLock: { enumerable: true },
          write: { enumerable: true },
          closed: { enumerable: true },
          desiredSize: { enumerable: true },
          ready: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultWriter",
            configurable: true
          });
        }
        function IsWritableStreamDefaultWriter(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_ownerWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultWriter;
        }
        function WritableStreamDefaultWriterAbort(writer, reason) {
          const stream = writer._ownerWritableStream;
          return WritableStreamAbort(stream, reason);
        }
        function WritableStreamDefaultWriterClose(writer) {
          const stream = writer._ownerWritableStream;
          return WritableStreamClose(stream);
        }
        function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          return WritableStreamDefaultWriterClose(writer);
        }
        function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error2) {
          if (writer._closedPromiseState === "pending") {
            defaultWriterClosedPromiseReject(writer, error2);
          } else {
            defaultWriterClosedPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error2) {
          if (writer._readyPromiseState === "pending") {
            defaultWriterReadyPromiseReject(writer, error2);
          } else {
            defaultWriterReadyPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterGetDesiredSize(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (state === "errored" || state === "erroring") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
        }
        function WritableStreamDefaultWriterRelease(writer) {
          const stream = writer._ownerWritableStream;
          const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
          WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
          stream._writer = void 0;
          writer._ownerWritableStream = void 0;
        }
        function WritableStreamDefaultWriterWrite(writer, chunk) {
          const stream = writer._ownerWritableStream;
          const controller = stream._writableStreamController;
          const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
          if (stream !== writer._ownerWritableStream) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          const state = stream._state;
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
          }
          if (state === "erroring") {
            return promiseRejectedWith(stream._storedError);
          }
          const promise = WritableStreamAddWriteRequest(stream);
          WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
          return promise;
        }
        const closeSentinel = {};
        class WritableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get abortReason() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("abortReason");
            }
            return this._abortReason;
          }
          get signal() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("signal");
            }
            if (this._abortController === void 0) {
              throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
            }
            return this._abortController.signal;
          }
          error(e = void 0) {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("error");
            }
            const state = this._controlledWritableStream._state;
            if (state !== "writable") {
              return;
            }
            WritableStreamDefaultControllerError(this, e);
          }
          [AbortSteps](reason) {
            const result = this._abortAlgorithm(reason);
            WritableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [ErrorSteps]() {
            ResetQueue(this);
          }
        }
        Object.defineProperties(WritableStreamDefaultController.prototype, {
          error: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultController",
            configurable: true
          });
        }
        function IsWritableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultController;
        }
        function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledWritableStream = stream;
          stream._writableStreamController = controller;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._abortReason = void 0;
          controller._abortController = createAbortController();
          controller._started = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._writeAlgorithm = writeAlgorithm;
          controller._closeAlgorithm = closeAlgorithm;
          controller._abortAlgorithm = abortAlgorithm;
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
          const startResult = startAlgorithm();
          const startPromise = promiseResolvedWith(startResult);
          uponPromise(startPromise, () => {
            controller._started = true;
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (r) => {
            controller._started = true;
            WritableStreamDealWithRejection(stream, r);
          });
        }
        function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(WritableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let writeAlgorithm = () => promiseResolvedWith(void 0);
          let closeAlgorithm = () => promiseResolvedWith(void 0);
          let abortAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSink.start !== void 0) {
            startAlgorithm = () => underlyingSink.start(controller);
          }
          if (underlyingSink.write !== void 0) {
            writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
          }
          if (underlyingSink.close !== void 0) {
            closeAlgorithm = () => underlyingSink.close();
          }
          if (underlyingSink.abort !== void 0) {
            abortAlgorithm = (reason) => underlyingSink.abort(reason);
          }
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function WritableStreamDefaultControllerClearAlgorithms(controller) {
          controller._writeAlgorithm = void 0;
          controller._closeAlgorithm = void 0;
          controller._abortAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function WritableStreamDefaultControllerClose(controller) {
          EnqueueValueWithSize(controller, closeSentinel, 0);
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
          try {
            return controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
            return 1;
          }
        }
        function WritableStreamDefaultControllerGetDesiredSize(controller) {
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
            return;
          }
          const stream = controller._controlledWritableStream;
          if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
          const stream = controller._controlledWritableStream;
          if (!controller._started) {
            return;
          }
          if (stream._inFlightWriteRequest !== void 0) {
            return;
          }
          const state = stream._state;
          if (state === "erroring") {
            WritableStreamFinishErroring(stream);
            return;
          }
          if (controller._queue.length === 0) {
            return;
          }
          const value = PeekQueueValue(controller);
          if (value === closeSentinel) {
            WritableStreamDefaultControllerProcessClose(controller);
          } else {
            WritableStreamDefaultControllerProcessWrite(controller, value);
          }
        }
        function WritableStreamDefaultControllerErrorIfNeeded(controller, error2) {
          if (controller._controlledWritableStream._state === "writable") {
            WritableStreamDefaultControllerError(controller, error2);
          }
        }
        function WritableStreamDefaultControllerProcessClose(controller) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkCloseRequestInFlight(stream);
          DequeueValue(controller);
          const sinkClosePromise = controller._closeAlgorithm();
          WritableStreamDefaultControllerClearAlgorithms(controller);
          uponPromise(sinkClosePromise, () => {
            WritableStreamFinishInFlightClose(stream);
          }, (reason) => {
            WritableStreamFinishInFlightCloseWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkFirstWriteRequestInFlight(stream);
          const sinkWritePromise = controller._writeAlgorithm(chunk);
          uponPromise(sinkWritePromise, () => {
            WritableStreamFinishInFlightWrite(stream);
            const state = stream._state;
            DequeueValue(controller);
            if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
              const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
              WritableStreamUpdateBackpressure(stream, backpressure);
            }
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (reason) => {
            if (stream._state === "writable") {
              WritableStreamDefaultControllerClearAlgorithms(controller);
            }
            WritableStreamFinishInFlightWriteWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerGetBackpressure(controller) {
          const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
          return desiredSize <= 0;
        }
        function WritableStreamDefaultControllerError(controller, error2) {
          const stream = controller._controlledWritableStream;
          WritableStreamDefaultControllerClearAlgorithms(controller);
          WritableStreamStartErroring(stream, error2);
        }
        function streamBrandCheckException$2(name) {
          return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
        }
        function defaultControllerBrandCheckException$2(name) {
          return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
        }
        function defaultWriterBrandCheckException(name) {
          return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
        }
        function defaultWriterLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released writer");
        }
        function defaultWriterClosedPromiseInitialize(writer) {
          writer._closedPromise = newPromise((resolve2, reject) => {
            writer._closedPromise_resolve = resolve2;
            writer._closedPromise_reject = reject;
            writer._closedPromiseState = "pending";
          });
        }
        function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseReject(writer, reason);
        }
        function defaultWriterClosedPromiseInitializeAsResolved(writer) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseResolve(writer);
        }
        function defaultWriterClosedPromiseReject(writer, reason) {
          if (writer._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._closedPromise);
          writer._closedPromise_reject(reason);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "rejected";
        }
        function defaultWriterClosedPromiseResetToRejected(writer, reason) {
          defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterClosedPromiseResolve(writer) {
          if (writer._closedPromise_resolve === void 0) {
            return;
          }
          writer._closedPromise_resolve(void 0);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "resolved";
        }
        function defaultWriterReadyPromiseInitialize(writer) {
          writer._readyPromise = newPromise((resolve2, reject) => {
            writer._readyPromise_resolve = resolve2;
            writer._readyPromise_reject = reject;
          });
          writer._readyPromiseState = "pending";
        }
        function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseReject(writer, reason);
        }
        function defaultWriterReadyPromiseInitializeAsResolved(writer) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseResolve(writer);
        }
        function defaultWriterReadyPromiseReject(writer, reason) {
          if (writer._readyPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._readyPromise);
          writer._readyPromise_reject(reason);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "rejected";
        }
        function defaultWriterReadyPromiseReset(writer) {
          defaultWriterReadyPromiseInitialize(writer);
        }
        function defaultWriterReadyPromiseResetToRejected(writer, reason) {
          defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterReadyPromiseResolve(writer) {
          if (writer._readyPromise_resolve === void 0) {
            return;
          }
          writer._readyPromise_resolve(void 0);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "fulfilled";
        }
        const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
        function isDOMExceptionConstructor(ctor) {
          if (!(typeof ctor === "function" || typeof ctor === "object")) {
            return false;
          }
          try {
            new ctor();
            return true;
          } catch (_a) {
            return false;
          }
        }
        function createDOMExceptionPolyfill() {
          const ctor = function DOMException2(message, name) {
            this.message = message || "";
            this.name = name || "Error";
            if (Error.captureStackTrace) {
              Error.captureStackTrace(this, this.constructor);
            }
          };
          ctor.prototype = Object.create(Error.prototype);
          Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
          return ctor;
        }
        const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
        function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
          const reader = AcquireReadableStreamDefaultReader(source);
          const writer = AcquireWritableStreamDefaultWriter(dest);
          source._disturbed = true;
          let shuttingDown = false;
          let currentWrite = promiseResolvedWith(void 0);
          return newPromise((resolve2, reject) => {
            let abortAlgorithm;
            if (signal !== void 0) {
              abortAlgorithm = () => {
                const error2 = new DOMException$1("Aborted", "AbortError");
                const actions = [];
                if (!preventAbort) {
                  actions.push(() => {
                    if (dest._state === "writable") {
                      return WritableStreamAbort(dest, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                if (!preventCancel) {
                  actions.push(() => {
                    if (source._state === "readable") {
                      return ReadableStreamCancel(source, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error2);
              };
              if (signal.aborted) {
                abortAlgorithm();
                return;
              }
              signal.addEventListener("abort", abortAlgorithm);
            }
            function pipeLoop() {
              return newPromise((resolveLoop, rejectLoop) => {
                function next(done) {
                  if (done) {
                    resolveLoop();
                  } else {
                    PerformPromiseThen(pipeStep(), next, rejectLoop);
                  }
                }
                next(false);
              });
            }
            function pipeStep() {
              if (shuttingDown) {
                return promiseResolvedWith(true);
              }
              return PerformPromiseThen(writer._readyPromise, () => {
                return newPromise((resolveRead, rejectRead) => {
                  ReadableStreamDefaultReaderRead(reader, {
                    _chunkSteps: (chunk) => {
                      currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                      resolveRead(false);
                    },
                    _closeSteps: () => resolveRead(true),
                    _errorSteps: rejectRead
                  });
                });
              });
            }
            isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
              if (!preventAbort) {
                shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesClosed(source, reader._closedPromise, () => {
              if (!preventClose) {
                shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
              } else {
                shutdown();
              }
            });
            if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
              const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
              } else {
                shutdown(true, destClosed);
              }
            }
            setPromiseIsHandledToTrue(pipeLoop());
            function waitForWritesToFinish() {
              const oldCurrentWrite = currentWrite;
              return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
            }
            function isOrBecomesErrored(stream, promise, action) {
              if (stream._state === "errored") {
                action(stream._storedError);
              } else {
                uponRejection(promise, action);
              }
            }
            function isOrBecomesClosed(stream, promise, action) {
              if (stream._state === "closed") {
                action();
              } else {
                uponFulfillment(promise, action);
              }
            }
            function shutdownWithAction(action, originalIsError, originalError) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), doTheRest);
              } else {
                doTheRest();
              }
              function doTheRest() {
                uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
              }
            }
            function shutdown(isError, error2) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error2));
              } else {
                finalize(isError, error2);
              }
            }
            function finalize(isError, error2) {
              WritableStreamDefaultWriterRelease(writer);
              ReadableStreamReaderGenericRelease(reader);
              if (signal !== void 0) {
                signal.removeEventListener("abort", abortAlgorithm);
              }
              if (isError) {
                reject(error2);
              } else {
                resolve2(void 0);
              }
            }
          });
        }
        class ReadableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("desiredSize");
            }
            return ReadableStreamDefaultControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("close");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits close");
            }
            ReadableStreamDefaultControllerClose(this);
          }
          enqueue(chunk = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("enqueue");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits enqueue");
            }
            return ReadableStreamDefaultControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("error");
            }
            ReadableStreamDefaultControllerError(this, e);
          }
          [CancelSteps](reason) {
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableStream;
            if (this._queue.length > 0) {
              const chunk = DequeueValue(this);
              if (this._closeRequested && this._queue.length === 0) {
                ReadableStreamDefaultControllerClearAlgorithms(this);
                ReadableStreamClose(stream);
              } else {
                ReadableStreamDefaultControllerCallPullIfNeeded(this);
              }
              readRequest._chunkSteps(chunk);
            } else {
              ReadableStreamAddReadRequest(stream, readRequest);
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
          }
        }
        Object.defineProperties(ReadableStreamDefaultController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultController",
            configurable: true
          });
        }
        function IsReadableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableStream")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultController;
        }
        function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableStreamDefaultControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableStreamDefaultControllerError(controller, e);
          });
        }
        function ReadableStreamDefaultControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableStream;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableStreamDefaultControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function ReadableStreamDefaultControllerClose(controller) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          controller._closeRequested = true;
          if (controller._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(controller);
            ReadableStreamClose(stream);
          }
        }
        function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            ReadableStreamFulfillReadRequest(stream, chunk, false);
          } else {
            let chunkSize;
            try {
              chunkSize = controller._strategySizeAlgorithm(chunk);
            } catch (chunkSizeE) {
              ReadableStreamDefaultControllerError(controller, chunkSizeE);
              throw chunkSizeE;
            }
            try {
              EnqueueValueWithSize(controller, chunk, chunkSize);
            } catch (enqueueE) {
              ReadableStreamDefaultControllerError(controller, enqueueE);
              throw enqueueE;
            }
          }
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }
        function ReadableStreamDefaultControllerError(controller, e) {
          const stream = controller._controlledReadableStream;
          if (stream._state !== "readable") {
            return;
          }
          ResetQueue(controller);
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableStreamDefaultControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableStreamDefaultControllerHasBackpressure(controller) {
          if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
            return false;
          }
          return true;
        }
        function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
          const state = controller._controlledReadableStream._state;
          if (!controller._closeRequested && state === "readable") {
            return true;
          }
          return false;
        }
        function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledReadableStream = stream;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._started = false;
          controller._closeRequested = false;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableStreamDefaultControllerError(controller, r);
          });
        }
        function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSource.start !== void 0) {
            startAlgorithm = () => underlyingSource.start(controller);
          }
          if (underlyingSource.pull !== void 0) {
            pullAlgorithm = () => underlyingSource.pull(controller);
          }
          if (underlyingSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
          }
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function defaultControllerBrandCheckException$1(name) {
          return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
        }
        function ReadableStreamTee(stream, cloneForBranch2) {
          if (IsReadableByteStreamController(stream._readableStreamController)) {
            return ReadableByteStreamTee(stream);
          }
          return ReadableStreamDefaultTee(stream);
        }
        function ReadableStreamDefaultTee(stream, cloneForBranch2) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function pullAlgorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  const chunk2 = chunk;
                  if (!canceled1) {
                    ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableStreamDefaultControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerClose(branch2._readableStreamController);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
          }
          branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
          branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
          uponRejection(reader._closedPromise, (r) => {
            ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
            ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
          return [branch1, branch2];
        }
        function ReadableByteStreamTee(stream) {
          let reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function forwardReaderError(thisReader) {
            uponRejection(thisReader._closedPromise, (r) => {
              if (thisReader !== reader) {
                return;
              }
              ReadableByteStreamControllerError(branch1._readableStreamController, r);
              ReadableByteStreamControllerError(branch2._readableStreamController, r);
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            });
          }
          function pullWithDefaultReader() {
            if (IsReadableStreamBYOBReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamDefaultReader(stream);
              forwardReaderError(reader);
            }
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  let chunk2 = chunk;
                  if (!canceled1 && !canceled2) {
                    try {
                      chunk2 = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                  }
                  if (!canceled1) {
                    ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableByteStreamControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerClose(branch2._readableStreamController);
                }
                if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
                }
                if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
          }
          function pullWithBYOBReader(view, forBranch2) {
            if (IsReadableStreamDefaultReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamBYOBReader(stream);
              forwardReaderError(reader);
            }
            const byobBranch = forBranch2 ? branch2 : branch1;
            const otherBranch = forBranch2 ? branch1 : branch2;
            const readIntoRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const byobCanceled = forBranch2 ? canceled2 : canceled1;
                  const otherCanceled = forBranch2 ? canceled1 : canceled2;
                  if (!otherCanceled) {
                    let clonedChunk;
                    try {
                      clonedChunk = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                    if (!byobCanceled) {
                      ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                    }
                    ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                  } else if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                });
              },
              _closeSteps: (chunk) => {
                reading = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!byobCanceled) {
                  ReadableByteStreamControllerClose(byobBranch._readableStreamController);
                }
                if (!otherCanceled) {
                  ReadableByteStreamControllerClose(otherBranch._readableStreamController);
                }
                if (chunk !== void 0) {
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                    ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                  }
                }
                if (!byobCanceled || !otherCanceled) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
          }
          function pull1Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, false);
            }
            return promiseResolvedWith(void 0);
          }
          function pull2Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, true);
            }
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
            return;
          }
          branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
          branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
          forwardReaderError(reader);
          return [branch1, branch2];
        }
        function convertUnderlyingDefaultOrByteSource(source, context) {
          assertDictionary(source, context);
          const original = source;
          const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
          const cancel = original === null || original === void 0 ? void 0 : original.cancel;
          const pull = original === null || original === void 0 ? void 0 : original.pull;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          return {
            autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
            cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
            pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
            type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
          };
        }
        function convertUnderlyingSourceCancelCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSourcePullCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertUnderlyingSourceStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertReadableStreamType(type, context) {
          type = `${type}`;
          if (type !== "bytes") {
            throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
          }
          return type;
        }
        function convertReaderOptions(options2, context) {
          assertDictionary(options2, context);
          const mode = options2 === null || options2 === void 0 ? void 0 : options2.mode;
          return {
            mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
          };
        }
        function convertReadableStreamReaderMode(mode, context) {
          mode = `${mode}`;
          if (mode !== "byob") {
            throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
          }
          return mode;
        }
        function convertIteratorOptions(options2, context) {
          assertDictionary(options2, context);
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          return { preventCancel: Boolean(preventCancel) };
        }
        function convertPipeOptions(options2, context) {
          assertDictionary(options2, context);
          const preventAbort = options2 === null || options2 === void 0 ? void 0 : options2.preventAbort;
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          const preventClose = options2 === null || options2 === void 0 ? void 0 : options2.preventClose;
          const signal = options2 === null || options2 === void 0 ? void 0 : options2.signal;
          if (signal !== void 0) {
            assertAbortSignal(signal, `${context} has member 'signal' that`);
          }
          return {
            preventAbort: Boolean(preventAbort),
            preventCancel: Boolean(preventCancel),
            preventClose: Boolean(preventClose),
            signal
          };
        }
        function assertAbortSignal(signal, context) {
          if (!isAbortSignal2(signal)) {
            throw new TypeError(`${context} is not an AbortSignal.`);
          }
        }
        function convertReadableWritablePair(pair, context) {
          assertDictionary(pair, context);
          const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
          assertRequiredField(readable, "readable", "ReadableWritablePair");
          assertReadableStream(readable, `${context} has member 'readable' that`);
          const writable3 = pair === null || pair === void 0 ? void 0 : pair.writable;
          assertRequiredField(writable3, "writable", "ReadableWritablePair");
          assertWritableStream(writable3, `${context} has member 'writable' that`);
          return { readable, writable: writable3 };
        }
        class ReadableStream2 {
          constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
            if (rawUnderlyingSource === void 0) {
              rawUnderlyingSource = null;
            } else {
              assertObject(rawUnderlyingSource, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
            InitializeReadableStream(this);
            if (underlyingSource.type === "bytes") {
              if (strategy.size !== void 0) {
                throw new RangeError("The strategy for a byte stream cannot have a size function");
              }
              const highWaterMark = ExtractHighWaterMark(strategy, 0);
              SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
            } else {
              const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
              const highWaterMark = ExtractHighWaterMark(strategy, 1);
              SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
            }
          }
          get locked() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("locked");
            }
            return IsReadableStreamLocked(this);
          }
          cancel(reason = void 0) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("cancel"));
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
            }
            return ReadableStreamCancel(this, reason);
          }
          getReader(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("getReader");
            }
            const options2 = convertReaderOptions(rawOptions, "First parameter");
            if (options2.mode === void 0) {
              return AcquireReadableStreamDefaultReader(this);
            }
            return AcquireReadableStreamBYOBReader(this);
          }
          pipeThrough(rawTransform, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("pipeThrough");
            }
            assertRequiredArgument(rawTransform, 1, "pipeThrough");
            const transform = convertReadableWritablePair(rawTransform, "First parameter");
            const options2 = convertPipeOptions(rawOptions, "Second parameter");
            if (IsReadableStreamLocked(this)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
            }
            if (IsWritableStreamLocked(transform.writable)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
            }
            const promise = ReadableStreamPipeTo(this, transform.writable, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
            setPromiseIsHandledToTrue(promise);
            return transform.readable;
          }
          pipeTo(destination, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
            }
            if (destination === void 0) {
              return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
            }
            if (!IsWritableStream(destination)) {
              return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
            }
            let options2;
            try {
              options2 = convertPipeOptions(rawOptions, "Second parameter");
            } catch (e) {
              return promiseRejectedWith(e);
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
            }
            if (IsWritableStreamLocked(destination)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
            }
            return ReadableStreamPipeTo(this, destination, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
          }
          tee() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("tee");
            }
            const branches = ReadableStreamTee(this);
            return CreateArrayFromList(branches);
          }
          values(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("values");
            }
            const options2 = convertIteratorOptions(rawOptions, "First parameter");
            return AcquireReadableStreamAsyncIterator(this, options2.preventCancel);
          }
        }
        Object.defineProperties(ReadableStream2.prototype, {
          cancel: { enumerable: true },
          getReader: { enumerable: true },
          pipeThrough: { enumerable: true },
          pipeTo: { enumerable: true },
          tee: { enumerable: true },
          values: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStream",
            configurable: true
          });
        }
        if (typeof SymbolPolyfill.asyncIterator === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
            value: ReadableStream2.prototype.values,
            writable: true,
            configurable: true
          });
        }
        function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableByteStreamController.prototype);
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
          return stream;
        }
        function InitializeReadableStream(stream) {
          stream._state = "readable";
          stream._reader = void 0;
          stream._storedError = void 0;
          stream._disturbed = false;
        }
        function IsReadableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readableStreamController")) {
            return false;
          }
          return x instanceof ReadableStream2;
        }
        function IsReadableStreamLocked(stream) {
          if (stream._reader === void 0) {
            return false;
          }
          return true;
        }
        function ReadableStreamCancel(stream, reason) {
          stream._disturbed = true;
          if (stream._state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (stream._state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          ReadableStreamClose(stream);
          const reader = stream._reader;
          if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._closeSteps(void 0);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
          const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
          return transformPromiseWith(sourceCancelPromise, noop2);
        }
        function ReadableStreamClose(stream) {
          stream._state = "closed";
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseResolve(reader);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._closeSteps();
            });
            reader._readRequests = new SimpleQueue();
          }
        }
        function ReadableStreamError(stream, e) {
          stream._state = "errored";
          stream._storedError = e;
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseReject(reader, e);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._errorSteps(e);
            });
            reader._readRequests = new SimpleQueue();
          } else {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._errorSteps(e);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
        }
        function streamBrandCheckException$1(name) {
          return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
        }
        function convertQueuingStrategyInit(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
          return {
            highWaterMark: convertUnrestrictedDouble(highWaterMark)
          };
        }
        const byteLengthSizeFunction = (chunk) => {
          return chunk.byteLength;
        };
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class ByteLengthQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "ByteLengthQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._byteLengthQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("highWaterMark");
            }
            return this._byteLengthQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("size");
            }
            return byteLengthSizeFunction;
          }
        }
        Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "ByteLengthQueuingStrategy",
            configurable: true
          });
        }
        function byteLengthBrandCheckException(name) {
          return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
        }
        function IsByteLengthQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_byteLengthQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof ByteLengthQueuingStrategy;
        }
        const countSizeFunction = () => {
          return 1;
        };
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class CountQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "CountQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._countQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("highWaterMark");
            }
            return this._countQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("size");
            }
            return countSizeFunction;
          }
        }
        Object.defineProperties(CountQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "CountQueuingStrategy",
            configurable: true
          });
        }
        function countBrandCheckException(name) {
          return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
        }
        function IsCountQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_countQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof CountQueuingStrategy;
        }
        function convertTransformer(original, context) {
          assertDictionary(original, context);
          const flush = original === null || original === void 0 ? void 0 : original.flush;
          const readableType = original === null || original === void 0 ? void 0 : original.readableType;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const transform = original === null || original === void 0 ? void 0 : original.transform;
          const writableType = original === null || original === void 0 ? void 0 : original.writableType;
          return {
            flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
            readableType,
            start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
            transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
            writableType
          };
        }
        function convertTransformerFlushCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertTransformerStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertTransformerTransformCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        class TransformStream {
          constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
            if (rawTransformer === void 0) {
              rawTransformer = null;
            }
            const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
            const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
            const transformer = convertTransformer(rawTransformer, "First parameter");
            if (transformer.readableType !== void 0) {
              throw new RangeError("Invalid readableType specified");
            }
            if (transformer.writableType !== void 0) {
              throw new RangeError("Invalid writableType specified");
            }
            const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
            const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
            const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
            const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
            let startPromise_resolve;
            const startPromise = newPromise((resolve2) => {
              startPromise_resolve = resolve2;
            });
            InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
            SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
            if (transformer.start !== void 0) {
              startPromise_resolve(transformer.start(this._transformStreamController));
            } else {
              startPromise_resolve(void 0);
            }
          }
          get readable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("readable");
            }
            return this._readable;
          }
          get writable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("writable");
            }
            return this._writable;
          }
        }
        Object.defineProperties(TransformStream.prototype, {
          readable: { enumerable: true },
          writable: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStream",
            configurable: true
          });
        }
        function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
          function startAlgorithm() {
            return startPromise;
          }
          function writeAlgorithm(chunk) {
            return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
          }
          function abortAlgorithm(reason) {
            return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
          }
          function closeAlgorithm() {
            return TransformStreamDefaultSinkCloseAlgorithm(stream);
          }
          stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
          function pullAlgorithm() {
            return TransformStreamDefaultSourcePullAlgorithm(stream);
          }
          function cancelAlgorithm(reason) {
            TransformStreamErrorWritableAndUnblockWrite(stream, reason);
            return promiseResolvedWith(void 0);
          }
          stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          stream._backpressure = void 0;
          stream._backpressureChangePromise = void 0;
          stream._backpressureChangePromise_resolve = void 0;
          TransformStreamSetBackpressure(stream, true);
          stream._transformStreamController = void 0;
        }
        function IsTransformStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_transformStreamController")) {
            return false;
          }
          return x instanceof TransformStream;
        }
        function TransformStreamError(stream, e) {
          ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
          TransformStreamErrorWritableAndUnblockWrite(stream, e);
        }
        function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
          TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
          WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);
          if (stream._backpressure) {
            TransformStreamSetBackpressure(stream, false);
          }
        }
        function TransformStreamSetBackpressure(stream, backpressure) {
          if (stream._backpressureChangePromise !== void 0) {
            stream._backpressureChangePromise_resolve();
          }
          stream._backpressureChangePromise = newPromise((resolve2) => {
            stream._backpressureChangePromise_resolve = resolve2;
          });
          stream._backpressure = backpressure;
        }
        class TransformStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("desiredSize");
            }
            const readableController = this._controlledTransformStream._readable._readableStreamController;
            return ReadableStreamDefaultControllerGetDesiredSize(readableController);
          }
          enqueue(chunk = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("enqueue");
            }
            TransformStreamDefaultControllerEnqueue(this, chunk);
          }
          error(reason = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("error");
            }
            TransformStreamDefaultControllerError(this, reason);
          }
          terminate() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("terminate");
            }
            TransformStreamDefaultControllerTerminate(this);
          }
        }
        Object.defineProperties(TransformStreamDefaultController.prototype, {
          enqueue: { enumerable: true },
          error: { enumerable: true },
          terminate: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStreamDefaultController",
            configurable: true
          });
        }
        function IsTransformStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledTransformStream")) {
            return false;
          }
          return x instanceof TransformStreamDefaultController;
        }
        function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
          controller._controlledTransformStream = stream;
          stream._transformStreamController = controller;
          controller._transformAlgorithm = transformAlgorithm;
          controller._flushAlgorithm = flushAlgorithm;
        }
        function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
          const controller = Object.create(TransformStreamDefaultController.prototype);
          let transformAlgorithm = (chunk) => {
            try {
              TransformStreamDefaultControllerEnqueue(controller, chunk);
              return promiseResolvedWith(void 0);
            } catch (transformResultE) {
              return promiseRejectedWith(transformResultE);
            }
          };
          let flushAlgorithm = () => promiseResolvedWith(void 0);
          if (transformer.transform !== void 0) {
            transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
          }
          if (transformer.flush !== void 0) {
            flushAlgorithm = () => transformer.flush(controller);
          }
          SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
        }
        function TransformStreamDefaultControllerClearAlgorithms(controller) {
          controller._transformAlgorithm = void 0;
          controller._flushAlgorithm = void 0;
        }
        function TransformStreamDefaultControllerEnqueue(controller, chunk) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
            throw new TypeError("Readable side is not in a state that permits enqueue");
          }
          try {
            ReadableStreamDefaultControllerEnqueue(readableController, chunk);
          } catch (e) {
            TransformStreamErrorWritableAndUnblockWrite(stream, e);
            throw stream._readable._storedError;
          }
          const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
          if (backpressure !== stream._backpressure) {
            TransformStreamSetBackpressure(stream, true);
          }
        }
        function TransformStreamDefaultControllerError(controller, e) {
          TransformStreamError(controller._controlledTransformStream, e);
        }
        function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
          const transformPromise = controller._transformAlgorithm(chunk);
          return transformPromiseWith(transformPromise, void 0, (r) => {
            TransformStreamError(controller._controlledTransformStream, r);
            throw r;
          });
        }
        function TransformStreamDefaultControllerTerminate(controller) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          ReadableStreamDefaultControllerClose(readableController);
          const error2 = new TypeError("TransformStream terminated");
          TransformStreamErrorWritableAndUnblockWrite(stream, error2);
        }
        function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
          const controller = stream._transformStreamController;
          if (stream._backpressure) {
            const backpressureChangePromise = stream._backpressureChangePromise;
            return transformPromiseWith(backpressureChangePromise, () => {
              const writable3 = stream._writable;
              const state = writable3._state;
              if (state === "erroring") {
                throw writable3._storedError;
              }
              return TransformStreamDefaultControllerPerformTransform(controller, chunk);
            });
          }
          return TransformStreamDefaultControllerPerformTransform(controller, chunk);
        }
        function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
          TransformStreamError(stream, reason);
          return promiseResolvedWith(void 0);
        }
        function TransformStreamDefaultSinkCloseAlgorithm(stream) {
          const readable = stream._readable;
          const controller = stream._transformStreamController;
          const flushPromise = controller._flushAlgorithm();
          TransformStreamDefaultControllerClearAlgorithms(controller);
          return transformPromiseWith(flushPromise, () => {
            if (readable._state === "errored") {
              throw readable._storedError;
            }
            ReadableStreamDefaultControllerClose(readable._readableStreamController);
          }, (r) => {
            TransformStreamError(stream, r);
            throw readable._storedError;
          });
        }
        function TransformStreamDefaultSourcePullAlgorithm(stream) {
          TransformStreamSetBackpressure(stream, false);
          return stream._backpressureChangePromise;
        }
        function defaultControllerBrandCheckException(name) {
          return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
        }
        function streamBrandCheckException(name) {
          return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
        }
        exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
        exports2.CountQueuingStrategy = CountQueuingStrategy;
        exports2.ReadableByteStreamController = ReadableByteStreamController;
        exports2.ReadableStream = ReadableStream2;
        exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
        exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
        exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
        exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
        exports2.TransformStream = TransformStream;
        exports2.TransformStreamDefaultController = TransformStreamDefaultController;
        exports2.WritableStream = WritableStream;
        exports2.WritableStreamDefaultController = WritableStreamDefaultController;
        exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
        Object.defineProperty(exports2, "__esModule", { value: true });
      });
    })(ponyfill_es2018, ponyfill_es2018.exports);
    POOL_SIZE$1 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("node:process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("node:stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error2) {
          process2.emitWarning = emitWarning;
          throw error2;
        }
      } catch (error2) {
        Object.assign(globalThis, ponyfill_es2018.exports);
      }
    }
    try {
      const { Blob: Blob3 } = require("buffer");
      if (Blob3 && !Blob3.prototype.stream) {
        Blob3.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error2) {
    }
    POOL_SIZE = 65536;
    _Blob = class Blob {
      #parts = [];
      #type = "";
      #size = 0;
      constructor(blobParts = [], options2 = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options2 !== "object" && typeof options2 !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options2 === null)
          options2 = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(element);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        const type = options2.type === void 0 ? "" : String(options2.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      get size() {
        return this.#size;
      }
      get type() {
        return this.#type;
      }
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        const it = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it.return();
          }
        });
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    Blob$1 = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (error_) => {
            const error2 = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        import_stream.default.Readable.from(body.stream()).pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const error2 = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw error2;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const error2 = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_CHAR" });
        throw error2;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback, thisArg = void 0) {
        for (const name of this.keys()) {
          Reflect.apply(callback, thisArg, [this.get(name), name, this]);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status != null ? options2.status : 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          type: "default",
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get type() {
        return this[INTERNALS$1].type;
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          type: this.type,
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      static error() {
        const response = new Response(null, { status: 0, statusText: "" });
        response[INTERNALS$1].type = "error";
        return response;
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      type: { enumerable: true },
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports, module2) {
    init_shims();
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    function log(message) {
      console.log(`[dotenv][DEBUG] ${message}`);
    }
    var NEWLINE = "\n";
    var RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/;
    var RE_NEWLINES = /\\n/g;
    var NEWLINES_MATCH = /\r\n|\n|\r/;
    function parse(src2, options2) {
      const debug = Boolean(options2 && options2.debug);
      const obj = {};
      src2.toString().split(NEWLINES_MATCH).forEach(function(line, idx) {
        const keyValueArr = line.match(RE_INI_KEY_VAL);
        if (keyValueArr != null) {
          const key = keyValueArr[1];
          let val = keyValueArr[2] || "";
          const end = val.length - 1;
          const isDoubleQuoted = val[0] === '"' && val[end] === '"';
          const isSingleQuoted = val[0] === "'" && val[end] === "'";
          if (isSingleQuoted || isDoubleQuoted) {
            val = val.substring(1, end);
            if (isDoubleQuoted) {
              val = val.replace(RE_NEWLINES, NEWLINE);
            }
          } else {
            val = val.trim();
          }
          obj[key] = val;
        } else if (debug) {
          log(`did not match key and value when parsing line ${idx + 1}: ${line}`);
        }
      });
      return obj;
    }
    function resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function config(options2) {
      let dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let debug = false;
      if (options2) {
        if (options2.path != null) {
          dotenvPath = resolveHome(options2.path);
        }
        if (options2.encoding != null) {
          encoding = options2.encoding;
        }
        if (options2.debug != null) {
          debug = true;
        }
      }
      try {
        const parsed = parse(fs.readFileSync(dotenvPath, { encoding }), { debug });
        Object.keys(parsed).forEach(function(key) {
          if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
            process.env[key] = parsed[key];
          } else if (debug) {
            log(`"${key}" is already defined in \`process.env\` and will not be overwritten`);
          }
        });
        return { parsed };
      } catch (e) {
        return { error: e };
      }
    }
    module2.exports.config = config;
    module2.exports.parse = parse;
  }
});

// node_modules/prismic-dom/dist/prismic-dom.min.js
var require_prismic_dom_min = __commonJS({
  "node_modules/prismic-dom/dist/prismic-dom.min.js"(exports, module2) {
    init_shims();
    !function(e, t) {
      typeof exports == "object" && typeof module2 == "object" ? module2.exports = t() : typeof define == "function" && define.amd ? define("PrismicDOM", [], t) : typeof exports == "object" ? exports.PrismicDOM = t() : e.PrismicDOM = t();
    }(typeof self != "undefined" ? self : exports, function() {
      return function(e) {
        var t = {};
        function n(r) {
          if (t[r])
            return t[r].exports;
          var o = t[r] = { i: r, l: false, exports: {} };
          return e[r].call(o.exports, o, o.exports, n), o.l = true, o.exports;
        }
        return n.m = e, n.c = t, n.d = function(e2, t2, r) {
          n.o(e2, t2) || Object.defineProperty(e2, t2, { enumerable: true, get: r });
        }, n.r = function(e2) {
          typeof Symbol != "undefined" && Symbol.toStringTag && Object.defineProperty(e2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e2, "__esModule", { value: true });
        }, n.t = function(e2, t2) {
          if (1 & t2 && (e2 = n(e2)), 8 & t2)
            return e2;
          if (4 & t2 && typeof e2 == "object" && e2 && e2.__esModule)
            return e2;
          var r = Object.create(null);
          if (n.r(r), Object.defineProperty(r, "default", { enumerable: true, value: e2 }), 2 & t2 && typeof e2 != "string")
            for (var o in e2)
              n.d(r, o, function(t3) {
                return e2[t3];
              }.bind(null, o));
          return r;
        }, n.n = function(e2) {
          var t2 = e2 && e2.__esModule ? function() {
            return e2.default;
          } : function() {
            return e2;
          };
          return n.d(t2, "a", t2), t2;
        }, n.o = function(e2, t2) {
          return Object.prototype.hasOwnProperty.call(e2, t2);
        }, n.p = "", n(n.s = 1);
      }([function(e, t, n) {
        typeof self != "undefined" && self, e.exports = function(e2) {
          var t2 = {};
          function n2(r) {
            if (t2[r])
              return t2[r].exports;
            var o = t2[r] = { i: r, l: false, exports: {} };
            return e2[r].call(o.exports, o, o.exports, n2), o.l = true, o.exports;
          }
          return n2.m = e2, n2.c = t2, n2.d = function(e3, t3, r) {
            n2.o(e3, t3) || Object.defineProperty(e3, t3, { enumerable: true, get: r });
          }, n2.r = function(e3) {
            typeof Symbol != "undefined" && Symbol.toStringTag && Object.defineProperty(e3, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e3, "__esModule", { value: true });
          }, n2.t = function(e3, t3) {
            if (1 & t3 && (e3 = n2(e3)), 8 & t3)
              return e3;
            if (4 & t3 && typeof e3 == "object" && e3 && e3.__esModule)
              return e3;
            var r = Object.create(null);
            if (n2.r(r), Object.defineProperty(r, "default", { enumerable: true, value: e3 }), 2 & t3 && typeof e3 != "string")
              for (var o in e3)
                n2.d(r, o, function(t4) {
                  return e3[t4];
                }.bind(null, o));
            return r;
          }, n2.n = function(e3) {
            var t3 = e3 && e3.__esModule ? function() {
              return e3.default;
            } : function() {
              return e3;
            };
            return n2.d(t3, "a", t3), t3;
          }, n2.o = function(e3, t3) {
            return Object.prototype.hasOwnProperty.call(e3, t3);
          }, n2.p = "", n2(n2.s = 0);
        }([function(e2, t2, n2) {
          e2.exports = n2(1);
        }, function(e2, t2, n2) {
          var r = n2(2), o = n2(3);
          e2.exports = { Link: r, Date: o };
        }, function(e2, t2, n2) {
          e2.exports = { url: function(e3, t3) {
            var n3 = e3 && e3.value ? e3.value.document : e3;
            if (e3 && [e3.type, e3.link_type, e3._linkType, e3.linkType].some(function(e4) {
              return e4 && ["Document", "Link.Document", "Link.document"].includes(e4);
            }) && t3 && typeof t3 == "function") {
              var r = t3(n3);
              if (r)
                return r;
            }
            return n3 && n3.url ? n3.url : "";
          } };
        }, function(e2, t2) {
          e2.exports = function(e3) {
            if (!e3)
              return null;
            var t3 = e3.length == 24 ? "".concat(e3.substring(0, 22), ":").concat(e3.substring(22, 24)) : e3;
            return new Date(t3);
          };
        }]);
      }, function(e, t, n) {
        e.exports = n(2);
      }, function(e, t, n) {
        var r = n(0), o = n(3), i = r.Date, u = r.Link;
        e.exports = { Date: i, Link: u, RichText: o };
      }, function(e, t, n) {
        var r = n(4), o = n(0).Link, i = n(5), u = r.Elements;
        function c(e2, t2, n2, r2, c2) {
          switch (t2) {
            case u.heading1:
              return l("h1", n2, c2);
            case u.heading2:
              return l("h2", n2, c2);
            case u.heading3:
              return l("h3", n2, c2);
            case u.heading4:
              return l("h4", n2, c2);
            case u.heading5:
              return l("h5", n2, c2);
            case u.heading6:
              return l("h6", n2, c2);
            case u.paragraph:
              return l("p", n2, c2);
            case u.preformatted:
              return function(e3) {
                return "<pre".concat(a(e3), ">").concat(i(e3.text), "</pre>");
              }(n2);
            case u.strong:
              return l("strong", n2, c2);
            case u.em:
              return l("em", n2, c2);
            case u.listItem:
            case u.oListItem:
              return l("li", n2, c2);
            case u.list:
              return l("ul", n2, c2);
            case u.oList:
              return l("ol", n2, c2);
            case u.image:
              return function(e3, t3) {
                var n3 = t3.linkTo ? o.url(t3.linkTo, e3) : null, r3 = t3.linkTo && t3.linkTo.target ? 'target="'.concat(t3.linkTo.target, '" rel="noopener"') : "", u2 = [t3.label || "", "block-img"], c3 = '<img src="'.concat(t3.url, '" alt="').concat(t3.alt ? i(t3.alt) : "", '" copyright="').concat(t3.copyright ? i(t3.copyright) : "", '" />');
                return '\n    <p class="'.concat(u2.join(" "), '">\n      ').concat(n3 ? "<a ".concat(r3, ' href="').concat(n3, '">').concat(c3, "</a>") : c3, "\n    </p>\n  ");
              }(e2, n2);
            case u.embed:
              return function(e3) {
                return '\n    <div data-oembed="'.concat(e3.oembed.embed_url, '"\n      data-oembed-type="').concat(e3.oembed.type, '"\n      data-oembed-provider="').concat(e3.oembed.provider_name, '"\n      ').concat(a(e3), ">\n\n      ").concat(e3.oembed.html, "\n    </div>\n  ");
              }(n2);
            case u.hyperlink:
              return function(e3, t3, n3) {
                var r3 = t3.data.target ? 'target="'.concat(t3.data.target, '" rel="noopener"') : "", u2 = i(o.url(t3.data, e3));
                return "<a ".concat(r3, ' href="').concat(u2, '">').concat(n3.join(""), "</a>");
              }(e2, n2, c2);
            case u.label:
              return function(e3, t3) {
                return "<span ".concat(a(e3.data), ">").concat(t3.join(""), "</span>");
              }(n2, c2);
            case u.span:
              return function(e3) {
                return e3 ? i(e3).replace(/\n/g, "<br />") : "";
              }(r2);
            default:
              return "";
          }
        }
        function a(e2) {
          return e2.label ? ' class="'.concat(e2.label, '"') : "";
        }
        function l(e2, t2, n2) {
          return "<".concat(e2).concat(a(t2), ">").concat(n2.join(""), "</").concat(e2, ">");
        }
        e.exports = { asText: function(e2, t2) {
          return r.asText(e2, t2);
        }, asHtml: function(e2, t2, n2) {
          return r.serialize(e2, c.bind(null, t2), n2).join("");
        }, Elements: u };
      }, function(e, t, n) {
        typeof self != "undefined" && self, e.exports = function(e2) {
          var t2 = {};
          function n2(r) {
            if (t2[r])
              return t2[r].exports;
            var o = t2[r] = { i: r, l: false, exports: {} };
            return e2[r].call(o.exports, o, o.exports, n2), o.l = true, o.exports;
          }
          return n2.m = e2, n2.c = t2, n2.d = function(e3, t3, r) {
            n2.o(e3, t3) || Object.defineProperty(e3, t3, { enumerable: true, get: r });
          }, n2.r = function(e3) {
            typeof Symbol != "undefined" && Symbol.toStringTag && Object.defineProperty(e3, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e3, "__esModule", { value: true });
          }, n2.t = function(e3, t3) {
            if (1 & t3 && (e3 = n2(e3)), 8 & t3)
              return e3;
            if (4 & t3 && typeof e3 == "object" && e3 && e3.__esModule)
              return e3;
            var r = Object.create(null);
            if (n2.r(r), Object.defineProperty(r, "default", { enumerable: true, value: e3 }), 2 & t3 && typeof e3 != "string")
              for (var o in e3)
                n2.d(r, o, function(t4) {
                  return e3[t4];
                }.bind(null, o));
            return r;
          }, n2.n = function(e3) {
            var t3 = e3 && e3.__esModule ? function() {
              return e3.default;
            } : function() {
              return e3;
            };
            return n2.d(t3, "a", t3), t3;
          }, n2.o = function(e3, t3) {
            return Object.prototype.hasOwnProperty.call(e3, t3);
          }, n2.p = "", n2(n2.s = 4);
        }([function(e2, t2, n2) {
          "use strict";
          var r;
          function o(e3, t3, n3) {
            return t3 in e3 ? Object.defineProperty(e3, t3, { value: n3, enumerable: true, configurable: true, writable: true }) : e3[t3] = n3, e3;
          }
          Object.defineProperty(t2, "__esModule", { value: true }), t2.PRIORITIES = t2.NODE_TYPES = void 0;
          var i = { heading1: "heading1", heading2: "heading2", heading3: "heading3", heading4: "heading4", heading5: "heading5", heading6: "heading6", paragraph: "paragraph", preformatted: "preformatted", strong: "strong", em: "em", listItem: "list-item", oListItem: "o-list-item", list: "group-list-item", oList: "group-o-list-item", image: "image", embed: "embed", hyperlink: "hyperlink", label: "label", span: "span" };
          t2.NODE_TYPES = i;
          var u = (o(r = {}, i.heading1, 4), o(r, i.heading2, 4), o(r, i.heading3, 4), o(r, i.heading4, 4), o(r, i.heading5, 4), o(r, i.heading6, 4), o(r, i.paragraph, 3), o(r, i.preformatted, 5), o(r, i.strong, 6), o(r, i.em, 6), o(r, i.oList, 1), o(r, i.list, 1), o(r, i.listItem, 1), o(r, i.oListItem, 1), o(r, i.image, 1), o(r, i.embed, 1), o(r, i.hyperlink, 3), o(r, i.label, 4), o(r, i.span, 7), r);
          t2.PRIORITIES = u;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = void 0;
          var r, o = n2(7), i = n2(2), u = n2(8), c = n2(0), a = (r = n2(3)) && r.__esModule ? r : { default: r };
          function l(e3, t3) {
            for (var n3 = 0; n3 < t3.length; n3++) {
              var r2 = t3[n3];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          function s2(e3) {
            if (e3.length === 0)
              throw new Error("Unable to elect node on empty list");
            var t3 = function(e4) {
              return function(e5) {
                if (Array.isArray(e5))
                  return e5;
              }(e4) || function(e5) {
                if (Symbol.iterator in Object(e5) || Object.prototype.toString.call(e5) === "[object Arguments]")
                  return Array.from(e5);
              }(e4) || function() {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
              }();
            }(e3.sort(function(e4, t4) {
              if (e4.isParentOf(t4))
                return -1;
              if (t4.isParentOf(e4))
                return 1;
              var n3 = c.PRIORITIES[e4.type] - c.PRIORITIES[t4.type];
              return n3 === 0 ? e4.text.length - t4.text.length : n3;
            }));
            return { elected: t3[0], others: t3.slice(1) };
          }
          function f(e3, t3, n3) {
            if (t3.length > 0)
              return function(e4, t4, n4) {
                return t4.reduce(function(r3, o2, u2) {
                  var c2 = [], a2 = u2 === 0 && o2.start > n4.lower, l2 = u2 === t4.length - 1 && n4.upper > o2.end;
                  if (a2) {
                    var s3 = new i.TextNode(n4.lower, o2.start, e4.slice(n4.lower, o2.start));
                    c2 = c2.concat(s3);
                  } else {
                    var f2 = t4[u2 - 1];
                    if (f2 && o2.start > f2.end) {
                      var d3 = e4.slice(f2.end, o2.start), p2 = new i.TextNode(f2.end, o2.start, d3);
                      c2 = c2.concat(p2);
                    }
                  }
                  if (c2 = c2.concat(o2), l2) {
                    var y = new i.TextNode(o2.end, n4.upper, e4.slice(o2.end, n4.upper));
                    c2 = c2.concat(y);
                  }
                  return r3.concat(c2);
                }, []);
              }(e3, d2(e3, t3), n3);
            var r2 = e3.slice(n3.lower, n3.upper);
            return [new i.TextNode(n3.lower, n3.upper, r2)];
          }
          function d2(e3, t3) {
            var n3 = function(e4) {
              return function(e5, t4) {
                return t4.reduce(function(e6, t5) {
                  var n4 = (0, o.last)(e6);
                  if (n4) {
                    if (n4.some(function(e7) {
                      return e7.isParentOf(t5);
                    }))
                      return (0, o.init)(e6).concat([n4.concat(t5)]);
                    var r3 = (0, o.last)(n4);
                    return r3 && function(e7, t6) {
                      return e7.end >= t6.start;
                    }(r3, t5) ? (0, o.init)(e6).concat([n4.concat(t5)]) : e6.concat([[t5]]);
                  }
                  return [[t5]];
                }, []);
              }(0, (0, o.sort)(e4, function(e5, t4) {
                return n4 = t4, e5.start - n4.start || function(e6, t5) {
                  return e6.end - t5.end;
                }(e5, t4);
                var n4;
              }));
            }((0, o.sort)(t3, function(e4, t4) {
              return e4.start - t4.start;
            })).map(s2), r2 = (0, o.flatten)(n3.map(function(t4) {
              return function(e4, t5) {
                var n4 = t5.others.reduce(function(n5, r4) {
                  var o3 = n5.inner, u2 = n5.outer, c2 = function(e5, t6, n6) {
                    return n6.start < t6.start ? { inner: i.SpanNode.slice(n6, t6.start, n6.end, e5), outer: i.SpanNode.slice(n6, n6.start, t6.start, e5) } : n6.end > t6.end ? { inner: i.SpanNode.slice(n6, n6.start, t6.end, e5), outer: i.SpanNode.slice(n6, t6.end, n6.end, e5) } : { inner: n6 };
                  }(e4, t5.elected, r4);
                  return { inner: o3.concat(c2.inner), outer: c2.outer ? u2.concat(c2.outer) : u2 };
                }, { inner: [], outer: [] }), r3 = n4.inner, o2 = n4.outer;
                return [t5.elected.setChildren(f(e4, r3, t5.elected.boundaries()))].concat(d2(e4, o2));
              }(e3, t4);
            }));
            return (0, o.sort)(r2, function(e4, t4) {
              return e4.start - t4.start;
            });
          }
          var p = function() {
            function e3() {
              !function(e4, t4) {
                if (!(e4 instanceof t4))
                  throw new TypeError("Cannot call a class as a function");
              }(this, e3);
            }
            var t3, n3;
            return t3 = e3, (n3 = [{ key: "fromRichText", value: function(e4) {
              return { key: (0, a.default)(), children: e4.reduce(function(e5, t4, n4) {
                if (u.RichTextBlock.isEmbedBlock(t4.type) || u.RichTextBlock.isImageBlock(t4.type))
                  return e5.concat(new i.BlockNode(t4.type, t4));
                var r2 = function(e6) {
                  var t5 = (e6.spans || []).map(function(t6) {
                    var n6 = e6.text.slice(t6.start, t6.end);
                    return new i.SpanNode(t6.start, t6.end, t6.type, n6, [], t6);
                  }), n5 = { lower: 0, upper: e6.text.length };
                  return f(e6.text, t5, n5);
                }(t4), c2 = e5[e5.length - 1];
                if (u.RichTextBlock.isListItem(t4.type) && c2 && c2 instanceof i.ListBlockNode) {
                  var a2 = new i.ListItemBlockNode(t4, r2), l2 = c2.addChild(a2);
                  return (0, o.init)(e5).concat(l2);
                }
                if (u.RichTextBlock.isOrderedListItem(t4.type) && c2 && c2 instanceof i.OrderedListBlockNode) {
                  var s3 = new i.OrderedListItemBlockNode(t4, r2), d3 = c2.addChild(s3);
                  return (0, o.init)(e5).concat(d3);
                }
                if (u.RichTextBlock.isListItem(t4.type)) {
                  var p2 = new i.ListItemBlockNode(t4, r2), y = new i.ListBlockNode(u.RichTextBlock.emptyList(), [p2]);
                  return e5.concat(y);
                }
                if (u.RichTextBlock.isOrderedListItem(t4.type)) {
                  var h = new i.OrderedListItemBlockNode(t4, r2), v = new i.OrderedListBlockNode(u.RichTextBlock.emptyOrderedList(), [h]);
                  return e5.concat(v);
                }
                return e5.concat(new i.BlockNode(t4.type, t4, r2));
              }, []) };
            } }]) && l(t3, n3), e3;
          }();
          t2.default = p;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.ListBlockNode = t2.OrderedListBlockNode = t2.OrderedListItemBlockNode = t2.ListItemBlockNode = t2.BlockNode = t2.TextNode = t2.SpanNode = t2.Node = void 0;
          var r, o = (r = n2(3)) && r.__esModule ? r : { default: r }, i = n2(0);
          function u(e3) {
            return (u = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e4) {
              return typeof e4;
            } : function(e4) {
              return e4 && typeof Symbol == "function" && e4.constructor === Symbol && e4 !== Symbol.prototype ? "symbol" : typeof e4;
            })(e3);
          }
          function c(e3, t3) {
            for (var n3 = 0; n3 < t3.length; n3++) {
              var r2 = t3[n3];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          function a(e3, t3, n3) {
            return t3 && c(e3.prototype, t3), n3 && c(e3, n3), e3;
          }
          function l(e3, t3) {
            if (typeof t3 != "function" && t3 !== null)
              throw new TypeError("Super expression must either be null or a function");
            e3.prototype = Object.create(t3 && t3.prototype, { constructor: { value: e3, writable: true, configurable: true } }), t3 && function(e4, t4) {
              (Object.setPrototypeOf || function(e5, t5) {
                return e5.__proto__ = t5, e5;
              })(e4, t4);
            }(e3, t3);
          }
          function s2(e3) {
            return function() {
              var t3, n3 = f(e3);
              if (function() {
                if (typeof Reflect == "undefined" || !Reflect.construct)
                  return false;
                if (Reflect.construct.sham)
                  return false;
                if (typeof Proxy == "function")
                  return true;
                try {
                  return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
                  })), true;
                } catch (e4) {
                  return false;
                }
              }()) {
                var r2 = f(this).constructor;
                t3 = Reflect.construct(n3, arguments, r2);
              } else
                t3 = n3.apply(this, arguments);
              return function(e4, t4) {
                return !t4 || u(t4) !== "object" && typeof t4 != "function" ? function(e5) {
                  if (e5 === void 0)
                    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                  return e5;
                }(e4) : t4;
              }(this, t3);
            };
          }
          function f(e3) {
            return (f = Object.setPrototypeOf ? Object.getPrototypeOf : function(e4) {
              return e4.__proto__ || Object.getPrototypeOf(e4);
            })(e3);
          }
          function d2(e3, t3) {
            if (!(e3 instanceof t3))
              throw new TypeError("Cannot call a class as a function");
          }
          var p = function e3(t3, n3, r2) {
            d2(this, e3), this.key = (0, o.default)(), this.type = t3, this.element = n3, this.children = r2;
          };
          t2.Node = p;
          var y = function(e3) {
            l(n3, p);
            var t3 = s2(n3);
            function n3(e4, r2, o2, i2, u2, c2) {
              var a2;
              return d2(this, n3), (a2 = t3.call(this, o2, c2, u2)).start = e4, a2.end = r2, a2.text = i2, a2.children = u2, a2;
            }
            return a(n3, [{ key: "boundaries", value: function() {
              return { lower: this.start, upper: this.end };
            } }, { key: "isParentOf", value: function(e4) {
              return this.start <= e4.start && this.end >= e4.end;
            } }, { key: "setChildren", value: function(e4) {
              return new n3(this.start, this.end, this.type, this.text, e4, this.element);
            } }], [{ key: "slice", value: function(e4, t4, r2, o2) {
              return new n3(t4, r2, e4.type, o2.slice(t4, r2), e4.children, e4.element);
            } }]), n3;
          }();
          t2.SpanNode = y;
          var h = function(e3) {
            l(n3, y);
            var t3 = s2(n3);
            function n3(e4, r2, o2) {
              d2(this, n3);
              var u2 = { type: i.NODE_TYPES.span, start: e4, end: r2, text: o2 };
              return t3.call(this, e4, r2, i.NODE_TYPES.span, o2, [], u2);
            }
            return n3;
          }();
          t2.TextNode = h;
          var v = function(e3) {
            l(n3, p);
            var t3 = s2(n3);
            function n3(e4, r2) {
              var o2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
              return d2(this, n3), t3.call(this, e4, r2, o2);
            }
            return n3;
          }();
          t2.BlockNode = v;
          var m = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d2(this, n3), t3.call(this, i.NODE_TYPES.listItem, e4, r2);
            }
            return n3;
          }();
          t2.ListItemBlockNode = m;
          var b = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d2(this, n3), t3.call(this, i.NODE_TYPES.oListItem, e4, r2);
            }
            return n3;
          }();
          t2.OrderedListItemBlockNode = b;
          var g = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d2(this, n3), t3.call(this, i.NODE_TYPES.oList, e4, r2);
            }
            return a(n3, [{ key: "addChild", value: function(e4) {
              var t4 = this.children.concat(e4);
              return new n3(this.element, t4);
            } }]), n3;
          }();
          t2.OrderedListBlockNode = g;
          var x = function(e3) {
            l(n3, v);
            var t3 = s2(n3);
            function n3(e4, r2) {
              return d2(this, n3), t3.call(this, i.NODE_TYPES.list, e4, r2);
            }
            return a(n3, [{ key: "addChild", value: function(e4) {
              var t4 = this.children.concat(e4);
              return new n3(this.element, t4);
            } }]), n3;
          }();
          t2.ListBlockNode = x;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = function() {
            var e3 = new Date().getTime();
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(t3) {
              var n3 = (e3 + 16 * Math.random()) % 16 | 0;
              return e3 = Math.floor(e3 / 16), (t3 == "x" ? n3 : 3 & n3 | 8).toString(16);
            });
          };
        }, function(e2, t2, n2) {
          e2.exports = n2(5);
        }, function(e2, t2, n2) {
          "use strict";
          var r = c(n2(6)), o = c(n2(1)), i = c(n2(9)), u = n2(0);
          function c(e3) {
            return e3 && e3.__esModule ? e3 : { default: e3 };
          }
          e2.exports = { asText: r.default, asTree: o.default.fromRichText, serialize: i.default, Elements: u.NODE_TYPES };
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = void 0, t2.default = function(e3, t3) {
            var n3 = typeof t3 == "string" ? t3 : " ";
            return e3.map(function(e4) {
              return e4.text;
            }).join(n3);
          };
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.init = function(e3) {
            return e3.slice(0, -1);
          }, t2.last = function(e3) {
            return e3[e3.length - 1];
          }, t2.flatten = function(e3) {
            var t3 = [], n3 = true, r = false, o = void 0;
            try {
              for (var i, u = e3[Symbol.iterator](); !(n3 = (i = u.next()).done); n3 = true) {
                var c = i.value;
                Array.isArray(c) ? t3.push.apply(t3, c) : t3.push(c);
              }
            } catch (e4) {
              r = true, o = e4;
            } finally {
              try {
                n3 || u.return == null || u.return();
              } finally {
                if (r)
                  throw o;
              }
            }
            return t3;
          }, t2.sort = function(e3, t3) {
            return function(e4) {
              return function(e5) {
                if (Array.isArray(e5)) {
                  for (var t4 = 0, n3 = new Array(e5.length); t4 < e5.length; t4++)
                    n3[t4] = e5[t4];
                  return n3;
                }
              }(e4) || function(e5) {
                if (Symbol.iterator in Object(e5) || Object.prototype.toString.call(e5) === "[object Arguments]")
                  return Array.from(e5);
              }(e4) || function() {
                throw new TypeError("Invalid attempt to spread non-iterable instance");
              }();
            }(e3).sort(t3);
          };
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.RichTextBlock = void 0;
          var r = n2(0);
          function o(e3, t3) {
            for (var n3 = 0; n3 < t3.length; n3++) {
              var r2 = t3[n3];
              r2.enumerable = r2.enumerable || false, r2.configurable = true, "value" in r2 && (r2.writable = true), Object.defineProperty(e3, r2.key, r2);
            }
          }
          var i = function() {
            function e3(t4, n4, r2) {
              !function(e4, t5) {
                if (!(e4 instanceof t5))
                  throw new TypeError("Cannot call a class as a function");
              }(this, e3), this.type = t4, this.text = n4, this.spans = r2;
            }
            var t3, n3;
            return t3 = e3, (n3 = [{ key: "isEmbedBlock", value: function(e4) {
              return e4 === r.NODE_TYPES.embed;
            } }, { key: "isImageBlock", value: function(e4) {
              return e4 === r.NODE_TYPES.image;
            } }, { key: "isList", value: function(e4) {
              return e4 === r.NODE_TYPES.list;
            } }, { key: "isOrderedList", value: function(e4) {
              return e4 === r.NODE_TYPES.oList;
            } }, { key: "isListItem", value: function(e4) {
              return e4 === r.NODE_TYPES.listItem;
            } }, { key: "isOrderedListItem", value: function(e4) {
              return e4 === r.NODE_TYPES.oListItem;
            } }, { key: "emptyList", value: function() {
              return { type: r.NODE_TYPES.list, spans: [], text: "" };
            } }, { key: "emptyOrderedList", value: function() {
              return { type: r.NODE_TYPES.oList, spans: [], text: "" };
            } }]) && o(t3, n3), e3;
          }();
          t2.RichTextBlock = i;
        }, function(e2, t2, n2) {
          "use strict";
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = void 0;
          var r, o = (r = n2(1)) && r.__esModule ? r : { default: r }, i = n2(2);
          t2.default = function(e3, t3, n3) {
            return o.default.fromRichText(e3).children.map(function(e4, r2) {
              return function(e5, t4, n4, r3) {
                return function e6(n5, o2) {
                  var u = n5 instanceof i.SpanNode ? n5.text : null, c = n5.children.reduce(function(t5, n6, r4) {
                    return t5.concat([e6(n6, r4)]);
                  }, []);
                  return r3 && r3(n5.type, n5.element, u, c, o2) || t4(n5.type, n5.element, u, c, o2);
                }(e5, n4);
              }(e4, t3, r2, n3);
            });
          };
        }]);
      }, function(e, t, n) {
        "use strict";
        var r = /["'&<>]/;
        e.exports = function(e2) {
          var t2, n2 = "" + e2, o = r.exec(n2);
          if (!o)
            return n2;
          var i = "", u = 0, c = 0;
          for (u = o.index; u < n2.length; u++) {
            switch (n2.charCodeAt(u)) {
              case 34:
                t2 = "&quot;";
                break;
              case 38:
                t2 = "&amp;";
                break;
              case 39:
                t2 = "&#39;";
                break;
              case 60:
                t2 = "&lt;";
                break;
              case 62:
                t2 = "&gt;";
                break;
              default:
                continue;
            }
            c !== u && (i += n2.substring(c, u)), c = u + 1, i += t2;
          }
          return c !== u ? i + n2.substring(c, u) : i;
        };
      }]);
    });
  }
});

// node_modules/node-fetch/lib/index.js
var require_lib = __commonJS({
  "node_modules/node-fetch/lib/index.js"(exports, module2) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var Stream2 = _interopDefault(require("stream"));
    var http2 = _interopDefault(require("http"));
    var Url = _interopDefault(require("url"));
    var https2 = _interopDefault(require("https"));
    var zlib2 = _interopDefault(require("zlib"));
    var Readable = Stream2.Readable;
    var BUFFER = Symbol("buffer");
    var TYPE = Symbol("type");
    var Blob3 = class {
      constructor() {
        this[TYPE] = "";
        const blobParts = arguments[0];
        const options2 = arguments[1];
        const buffers = [];
        let size = 0;
        if (blobParts) {
          const a = blobParts;
          const length = Number(a.length);
          for (let i = 0; i < length; i++) {
            const element = a[i];
            let buffer;
            if (element instanceof Buffer) {
              buffer = element;
            } else if (ArrayBuffer.isView(element)) {
              buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
            } else if (element instanceof ArrayBuffer) {
              buffer = Buffer.from(element);
            } else if (element instanceof Blob3) {
              buffer = element[BUFFER];
            } else {
              buffer = Buffer.from(typeof element === "string" ? element : String(element));
            }
            size += buffer.length;
            buffers.push(buffer);
          }
        }
        this[BUFFER] = Buffer.concat(buffers);
        let type = options2 && options2.type !== void 0 && String(options2.type).toLowerCase();
        if (type && !/[^\u0020-\u007E]/.test(type)) {
          this[TYPE] = type;
        }
      }
      get size() {
        return this[BUFFER].length;
      }
      get type() {
        return this[TYPE];
      }
      text() {
        return Promise.resolve(this[BUFFER].toString());
      }
      arrayBuffer() {
        const buf = this[BUFFER];
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        return Promise.resolve(ab);
      }
      stream() {
        const readable = new Readable();
        readable._read = function() {
        };
        readable.push(this[BUFFER]);
        readable.push(null);
        return readable;
      }
      toString() {
        return "[object Blob]";
      }
      slice() {
        const size = this.size;
        const start = arguments[0];
        const end = arguments[1];
        let relativeStart, relativeEnd;
        if (start === void 0) {
          relativeStart = 0;
        } else if (start < 0) {
          relativeStart = Math.max(size + start, 0);
        } else {
          relativeStart = Math.min(start, size);
        }
        if (end === void 0) {
          relativeEnd = size;
        } else if (end < 0) {
          relativeEnd = Math.max(size + end, 0);
        } else {
          relativeEnd = Math.min(end, size);
        }
        const span = Math.max(relativeEnd - relativeStart, 0);
        const buffer = this[BUFFER];
        const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
        const blob = new Blob3([], { type: arguments[2] });
        blob[BUFFER] = slicedBuffer;
        return blob;
      }
    };
    Object.defineProperties(Blob3.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Object.defineProperty(Blob3.prototype, Symbol.toStringTag, {
      value: "Blob",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function FetchError2(message, type, systemError) {
      Error.call(this, message);
      this.message = message;
      this.type = type;
      if (systemError) {
        this.code = this.errno = systemError.code;
      }
      Error.captureStackTrace(this, this.constructor);
    }
    FetchError2.prototype = Object.create(Error.prototype);
    FetchError2.prototype.constructor = FetchError2;
    FetchError2.prototype.name = "FetchError";
    var convert;
    try {
      convert = require("encoding").convert;
    } catch (e) {
    }
    var INTERNALS2 = Symbol("Body internals");
    var PassThrough2 = Stream2.PassThrough;
    function Body2(body) {
      var _this = this;
      var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$size = _ref.size;
      let size = _ref$size === void 0 ? 0 : _ref$size;
      var _ref$timeout = _ref.timeout;
      let timeout = _ref$timeout === void 0 ? 0 : _ref$timeout;
      if (body == null) {
        body = null;
      } else if (isURLSearchParams(body)) {
        body = Buffer.from(body.toString());
      } else if (isBlob2(body))
        ;
      else if (Buffer.isBuffer(body))
        ;
      else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        body = Buffer.from(body);
      } else if (ArrayBuffer.isView(body)) {
        body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
      } else if (body instanceof Stream2)
        ;
      else {
        body = Buffer.from(String(body));
      }
      this[INTERNALS2] = {
        body,
        disturbed: false,
        error: null
      };
      this.size = size;
      this.timeout = timeout;
      if (body instanceof Stream2) {
        body.on("error", function(err) {
          const error2 = err.name === "AbortError" ? err : new FetchError2(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, "system", err);
          _this[INTERNALS2].error = error2;
        });
      }
    }
    Body2.prototype = {
      get body() {
        return this[INTERNALS2].body;
      },
      get bodyUsed() {
        return this[INTERNALS2].disturbed;
      },
      arrayBuffer() {
        return consumeBody2.call(this).then(function(buf) {
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        });
      },
      blob() {
        let ct = this.headers && this.headers.get("content-type") || "";
        return consumeBody2.call(this).then(function(buf) {
          return Object.assign(new Blob3([], {
            type: ct.toLowerCase()
          }), {
            [BUFFER]: buf
          });
        });
      },
      json() {
        var _this2 = this;
        return consumeBody2.call(this).then(function(buffer) {
          try {
            return JSON.parse(buffer.toString());
          } catch (err) {
            return Body2.Promise.reject(new FetchError2(`invalid json response body at ${_this2.url} reason: ${err.message}`, "invalid-json"));
          }
        });
      },
      text() {
        return consumeBody2.call(this).then(function(buffer) {
          return buffer.toString();
        });
      },
      buffer() {
        return consumeBody2.call(this);
      },
      textConverted() {
        var _this3 = this;
        return consumeBody2.call(this).then(function(buffer) {
          return convertBody(buffer, _this3.headers);
        });
      }
    };
    Object.defineProperties(Body2.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    Body2.mixIn = function(proto) {
      for (const name of Object.getOwnPropertyNames(Body2.prototype)) {
        if (!(name in proto)) {
          const desc = Object.getOwnPropertyDescriptor(Body2.prototype, name);
          Object.defineProperty(proto, name, desc);
        }
      }
    };
    function consumeBody2() {
      var _this4 = this;
      if (this[INTERNALS2].disturbed) {
        return Body2.Promise.reject(new TypeError(`body used already for: ${this.url}`));
      }
      this[INTERNALS2].disturbed = true;
      if (this[INTERNALS2].error) {
        return Body2.Promise.reject(this[INTERNALS2].error);
      }
      let body = this.body;
      if (body === null) {
        return Body2.Promise.resolve(Buffer.alloc(0));
      }
      if (isBlob2(body)) {
        body = body.stream();
      }
      if (Buffer.isBuffer(body)) {
        return Body2.Promise.resolve(body);
      }
      if (!(body instanceof Stream2)) {
        return Body2.Promise.resolve(Buffer.alloc(0));
      }
      let accum = [];
      let accumBytes = 0;
      let abort = false;
      return new Body2.Promise(function(resolve2, reject) {
        let resTimeout;
        if (_this4.timeout) {
          resTimeout = setTimeout(function() {
            abort = true;
            reject(new FetchError2(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, "body-timeout"));
          }, _this4.timeout);
        }
        body.on("error", function(err) {
          if (err.name === "AbortError") {
            abort = true;
            reject(err);
          } else {
            reject(new FetchError2(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, "system", err));
          }
        });
        body.on("data", function(chunk) {
          if (abort || chunk === null) {
            return;
          }
          if (_this4.size && accumBytes + chunk.length > _this4.size) {
            abort = true;
            reject(new FetchError2(`content size at ${_this4.url} over limit: ${_this4.size}`, "max-size"));
            return;
          }
          accumBytes += chunk.length;
          accum.push(chunk);
        });
        body.on("end", function() {
          if (abort) {
            return;
          }
          clearTimeout(resTimeout);
          try {
            resolve2(Buffer.concat(accum, accumBytes));
          } catch (err) {
            reject(new FetchError2(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, "system", err));
          }
        });
      });
    }
    function convertBody(buffer, headers) {
      if (typeof convert !== "function") {
        throw new Error("The package `encoding` must be installed to use the textConverted() function");
      }
      const ct = headers.get("content-type");
      let charset = "utf-8";
      let res, str;
      if (ct) {
        res = /charset=([^;]*)/i.exec(ct);
      }
      str = buffer.slice(0, 1024).toString();
      if (!res && str) {
        res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
      }
      if (!res && str) {
        res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
        if (!res) {
          res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
          if (res) {
            res.pop();
          }
        }
        if (res) {
          res = /charset=(.*)/i.exec(res.pop());
        }
      }
      if (!res && str) {
        res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
      }
      if (res) {
        charset = res.pop();
        if (charset === "gb2312" || charset === "gbk") {
          charset = "gb18030";
        }
      }
      return convert(buffer, "UTF-8", charset).toString();
    }
    function isURLSearchParams(obj) {
      if (typeof obj !== "object" || typeof obj.append !== "function" || typeof obj.delete !== "function" || typeof obj.get !== "function" || typeof obj.getAll !== "function" || typeof obj.has !== "function" || typeof obj.set !== "function") {
        return false;
      }
      return obj.constructor.name === "URLSearchParams" || Object.prototype.toString.call(obj) === "[object URLSearchParams]" || typeof obj.sort === "function";
    }
    function isBlob2(obj) {
      return typeof obj === "object" && typeof obj.arrayBuffer === "function" && typeof obj.type === "string" && typeof obj.stream === "function" && typeof obj.constructor === "function" && typeof obj.constructor.name === "string" && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
    }
    function clone2(instance) {
      let p1, p2;
      let body = instance.body;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof Stream2 && typeof body.getBoundary !== "function") {
        p1 = new PassThrough2();
        p2 = new PassThrough2();
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS2].body = p1;
        body = p2;
      }
      return body;
    }
    function extractContentType2(body) {
      if (body === null) {
        return null;
      } else if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      } else if (isURLSearchParams(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      } else if (isBlob2(body)) {
        return body.type || null;
      } else if (Buffer.isBuffer(body)) {
        return null;
      } else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        return null;
      } else if (ArrayBuffer.isView(body)) {
        return null;
      } else if (typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      } else if (body instanceof Stream2) {
        return null;
      } else {
        return "text/plain;charset=UTF-8";
      }
    }
    function getTotalBytes2(instance) {
      const body = instance.body;
      if (body === null) {
        return 0;
      } else if (isBlob2(body)) {
        return body.size;
      } else if (Buffer.isBuffer(body)) {
        return body.length;
      } else if (body && typeof body.getLengthSync === "function") {
        if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || body.hasKnownLength && body.hasKnownLength()) {
          return body.getLengthSync();
        }
        return null;
      } else {
        return null;
      }
    }
    function writeToStream2(dest, instance) {
      const body = instance.body;
      if (body === null) {
        dest.end();
      } else if (isBlob2(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    }
    Body2.Promise = global.Promise;
    var invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
    var invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
    function validateName(name) {
      name = `${name}`;
      if (invalidTokenRegex.test(name) || name === "") {
        throw new TypeError(`${name} is not a legal HTTP header name`);
      }
    }
    function validateValue(value) {
      value = `${value}`;
      if (invalidHeaderCharRegex.test(value)) {
        throw new TypeError(`${value} is not a legal HTTP header value`);
      }
    }
    function find(map, name) {
      name = name.toLowerCase();
      for (const key in map) {
        if (key.toLowerCase() === name) {
          return key;
        }
      }
      return void 0;
    }
    var MAP = Symbol("map");
    var Headers2 = class {
      constructor() {
        let init2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        this[MAP] = Object.create(null);
        if (init2 instanceof Headers2) {
          const rawHeaders = init2.raw();
          const headerNames = Object.keys(rawHeaders);
          for (const headerName of headerNames) {
            for (const value of rawHeaders[headerName]) {
              this.append(headerName, value);
            }
          }
          return;
        }
        if (init2 == null)
          ;
        else if (typeof init2 === "object") {
          const method = init2[Symbol.iterator];
          if (method != null) {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            const pairs = [];
            for (const pair of init2) {
              if (typeof pair !== "object" || typeof pair[Symbol.iterator] !== "function") {
                throw new TypeError("Each header pair must be iterable");
              }
              pairs.push(Array.from(pair));
            }
            for (const pair of pairs) {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              this.append(pair[0], pair[1]);
            }
          } else {
            for (const key of Object.keys(init2)) {
              const value = init2[key];
              this.append(key, value);
            }
          }
        } else {
          throw new TypeError("Provided initializer must be an object");
        }
      }
      get(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key === void 0) {
          return null;
        }
        return this[MAP][key].join(", ");
      }
      forEach(callback) {
        let thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
        let pairs = getHeaders(this);
        let i = 0;
        while (i < pairs.length) {
          var _pairs$i = pairs[i];
          const name = _pairs$i[0], value = _pairs$i[1];
          callback.call(thisArg, value, name, this);
          pairs = getHeaders(this);
          i++;
        }
      }
      set(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        this[MAP][key !== void 0 ? key : name] = [value];
      }
      append(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          this[MAP][key].push(value);
        } else {
          this[MAP][name] = [value];
        }
      }
      has(name) {
        name = `${name}`;
        validateName(name);
        return find(this[MAP], name) !== void 0;
      }
      delete(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          delete this[MAP][key];
        }
      }
      raw() {
        return this[MAP];
      }
      keys() {
        return createHeadersIterator(this, "key");
      }
      values() {
        return createHeadersIterator(this, "value");
      }
      [Symbol.iterator]() {
        return createHeadersIterator(this, "key+value");
      }
    };
    Headers2.prototype.entries = Headers2.prototype[Symbol.iterator];
    Object.defineProperty(Headers2.prototype, Symbol.toStringTag, {
      value: "Headers",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Headers2.prototype, {
      get: { enumerable: true },
      forEach: { enumerable: true },
      set: { enumerable: true },
      append: { enumerable: true },
      has: { enumerable: true },
      delete: { enumerable: true },
      keys: { enumerable: true },
      values: { enumerable: true },
      entries: { enumerable: true }
    });
    function getHeaders(headers) {
      let kind = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key+value";
      const keys = Object.keys(headers[MAP]).sort();
      return keys.map(kind === "key" ? function(k) {
        return k.toLowerCase();
      } : kind === "value" ? function(k) {
        return headers[MAP][k].join(", ");
      } : function(k) {
        return [k.toLowerCase(), headers[MAP][k].join(", ")];
      });
    }
    var INTERNAL = Symbol("internal");
    function createHeadersIterator(target, kind) {
      const iterator = Object.create(HeadersIteratorPrototype);
      iterator[INTERNAL] = {
        target,
        kind,
        index: 0
      };
      return iterator;
    }
    var HeadersIteratorPrototype = Object.setPrototypeOf({
      next() {
        if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
          throw new TypeError("Value of `this` is not a HeadersIterator");
        }
        var _INTERNAL = this[INTERNAL];
        const target = _INTERNAL.target, kind = _INTERNAL.kind, index = _INTERNAL.index;
        const values = getHeaders(target, kind);
        const len = values.length;
        if (index >= len) {
          return {
            value: void 0,
            done: true
          };
        }
        this[INTERNAL].index = index + 1;
        return {
          value: values[index],
          done: false
        };
      }
    }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
    Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
      value: "HeadersIterator",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function exportNodeCompatibleHeaders(headers) {
      const obj = Object.assign({ __proto__: null }, headers[MAP]);
      const hostHeaderKey = find(headers[MAP], "Host");
      if (hostHeaderKey !== void 0) {
        obj[hostHeaderKey] = obj[hostHeaderKey][0];
      }
      return obj;
    }
    function createHeadersLenient(obj) {
      const headers = new Headers2();
      for (const name of Object.keys(obj)) {
        if (invalidTokenRegex.test(name)) {
          continue;
        }
        if (Array.isArray(obj[name])) {
          for (const val of obj[name]) {
            if (invalidHeaderCharRegex.test(val)) {
              continue;
            }
            if (headers[MAP][name] === void 0) {
              headers[MAP][name] = [val];
            } else {
              headers[MAP][name].push(val);
            }
          }
        } else if (!invalidHeaderCharRegex.test(obj[name])) {
          headers[MAP][name] = [obj[name]];
        }
      }
      return headers;
    }
    var INTERNALS$12 = Symbol("Response internals");
    var STATUS_CODES = http2.STATUS_CODES;
    var Response2 = class {
      constructor() {
        let body = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        let opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        Body2.call(this, body, opts);
        const status = opts.status || 200;
        const headers = new Headers2(opts.headers);
        if (body != null && !headers.has("Content-Type")) {
          const contentType = extractContentType2(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$12] = {
          url: opts.url,
          status,
          statusText: opts.statusText || STATUS_CODES[status],
          headers,
          counter: opts.counter
        };
      }
      get url() {
        return this[INTERNALS$12].url || "";
      }
      get status() {
        return this[INTERNALS$12].status;
      }
      get ok() {
        return this[INTERNALS$12].status >= 200 && this[INTERNALS$12].status < 300;
      }
      get redirected() {
        return this[INTERNALS$12].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$12].statusText;
      }
      get headers() {
        return this[INTERNALS$12].headers;
      }
      clone() {
        return new Response2(clone2(this), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected
        });
      }
    };
    Body2.mixIn(Response2.prototype);
    Object.defineProperties(Response2.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    Object.defineProperty(Response2.prototype, Symbol.toStringTag, {
      value: "Response",
      writable: false,
      enumerable: false,
      configurable: true
    });
    var INTERNALS$22 = Symbol("Request internals");
    var parse_url = Url.parse;
    var format_url = Url.format;
    var streamDestructionSupported = "destroy" in Stream2.Readable.prototype;
    function isRequest2(input) {
      return typeof input === "object" && typeof input[INTERNALS$22] === "object";
    }
    function isAbortSignal2(signal) {
      const proto = signal && typeof signal === "object" && Object.getPrototypeOf(signal);
      return !!(proto && proto.constructor.name === "AbortSignal");
    }
    var Request2 = class {
      constructor(input) {
        let init2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        let parsedURL;
        if (!isRequest2(input)) {
          if (input && input.href) {
            parsedURL = parse_url(input.href);
          } else {
            parsedURL = parse_url(`${input}`);
          }
          input = {};
        } else {
          parsedURL = parse_url(input.url);
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest2(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        let inputBody = init2.body != null ? init2.body : isRequest2(input) && input.body !== null ? clone2(input) : null;
        Body2.call(this, inputBody, {
          timeout: init2.timeout || input.timeout || 0,
          size: init2.size || input.size || 0
        });
        const headers = new Headers2(init2.headers || input.headers || {});
        if (inputBody != null && !headers.has("Content-Type")) {
          const contentType = extractContentType2(inputBody);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest2(input) ? input.signal : null;
        if ("signal" in init2)
          signal = init2.signal;
        if (signal != null && !isAbortSignal2(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS$22] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow !== void 0 ? init2.follow : input.follow !== void 0 ? input.follow : 20;
        this.compress = init2.compress !== void 0 ? init2.compress : input.compress !== void 0 ? input.compress : true;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
      }
      get method() {
        return this[INTERNALS$22].method;
      }
      get url() {
        return format_url(this[INTERNALS$22].parsedURL);
      }
      get headers() {
        return this[INTERNALS$22].headers;
      }
      get redirect() {
        return this[INTERNALS$22].redirect;
      }
      get signal() {
        return this[INTERNALS$22].signal;
      }
      clone() {
        return new Request2(this);
      }
    };
    Body2.mixIn(Request2.prototype);
    Object.defineProperty(Request2.prototype, Symbol.toStringTag, {
      value: "Request",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Request2.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    function getNodeRequestOptions2(request) {
      const parsedURL = request[INTERNALS$22].parsedURL;
      const headers = new Headers2(request[INTERNALS$22].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      if (!parsedURL.protocol || !parsedURL.hostname) {
        throw new TypeError("Only absolute URLs are supported");
      }
      if (!/^https?:$/.test(parsedURL.protocol)) {
        throw new TypeError("Only HTTP(S) protocols are supported");
      }
      if (request.signal && request.body instanceof Stream2.Readable && !streamDestructionSupported) {
        throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");
      }
      let contentLengthValue = null;
      if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body != null) {
        const totalBytes = getTotalBytes2(request);
        if (typeof totalBytes === "number") {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate");
      }
      let agent = request.agent;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      return Object.assign({}, parsedURL, {
        method: request.method,
        headers: exportNodeCompatibleHeaders(headers),
        agent
      });
    }
    function AbortError2(message) {
      Error.call(this, message);
      this.type = "aborted";
      this.message = message;
      Error.captureStackTrace(this, this.constructor);
    }
    AbortError2.prototype = Object.create(Error.prototype);
    AbortError2.prototype.constructor = AbortError2;
    AbortError2.prototype.name = "AbortError";
    var PassThrough$1 = Stream2.PassThrough;
    var resolve_url = Url.resolve;
    function fetch2(url, opts) {
      if (!fetch2.Promise) {
        throw new Error("native promise missing, set fetch.Promise to your favorite alternative");
      }
      Body2.Promise = fetch2.Promise;
      return new fetch2.Promise(function(resolve2, reject) {
        const request = new Request2(url, opts);
        const options2 = getNodeRequestOptions2(request);
        const send = (options2.protocol === "https:" ? https2 : http2).request;
        const signal = request.signal;
        let response = null;
        const abort = function abort2() {
          let error2 = new AbortError2("The user aborted a request.");
          reject(error2);
          if (request.body && request.body instanceof Stream2.Readable) {
            request.body.destroy(error2);
          }
          if (!response || !response.body)
            return;
          response.body.emit("error", error2);
        };
        if (signal && signal.aborted) {
          abort();
          return;
        }
        const abortAndFinalize = function abortAndFinalize2() {
          abort();
          finalize();
        };
        const req = send(options2);
        let reqTimeout;
        if (signal) {
          signal.addEventListener("abort", abortAndFinalize);
        }
        function finalize() {
          req.abort();
          if (signal)
            signal.removeEventListener("abort", abortAndFinalize);
          clearTimeout(reqTimeout);
        }
        if (request.timeout) {
          req.once("socket", function(socket) {
            reqTimeout = setTimeout(function() {
              reject(new FetchError2(`network timeout at: ${request.url}`, "request-timeout"));
              finalize();
            }, request.timeout);
          });
        }
        req.on("error", function(err) {
          reject(new FetchError2(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
          finalize();
        });
        req.on("response", function(res) {
          clearTimeout(reqTimeout);
          const headers = createHeadersLenient(res.headers);
          if (fetch2.isRedirect(res.statusCode)) {
            const location = headers.get("Location");
            const locationURL = location === null ? null : resolve_url(request.url, location);
            switch (request.redirect) {
              case "error":
                reject(new FetchError2(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
                finalize();
                return;
              case "manual":
                if (locationURL !== null) {
                  try {
                    headers.set("Location", locationURL);
                  } catch (err) {
                    reject(err);
                  }
                }
                break;
              case "follow":
                if (locationURL === null) {
                  break;
                }
                if (request.counter >= request.follow) {
                  reject(new FetchError2(`maximum redirect reached at: ${request.url}`, "max-redirect"));
                  finalize();
                  return;
                }
                const requestOpts = {
                  headers: new Headers2(request.headers),
                  follow: request.follow,
                  counter: request.counter + 1,
                  agent: request.agent,
                  compress: request.compress,
                  method: request.method,
                  body: request.body,
                  signal: request.signal,
                  timeout: request.timeout,
                  size: request.size
                };
                if (res.statusCode !== 303 && request.body && getTotalBytes2(request) === null) {
                  reject(new FetchError2("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
                  finalize();
                  return;
                }
                if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === "POST") {
                  requestOpts.method = "GET";
                  requestOpts.body = void 0;
                  requestOpts.headers.delete("content-length");
                }
                resolve2(fetch2(new Request2(locationURL, requestOpts)));
                finalize();
                return;
            }
          }
          res.once("end", function() {
            if (signal)
              signal.removeEventListener("abort", abortAndFinalize);
          });
          let body = res.pipe(new PassThrough$1());
          const response_options = {
            url: request.url,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers,
            size: request.size,
            timeout: request.timeout,
            counter: request.counter
          };
          const codings = headers.get("Content-Encoding");
          if (!request.compress || request.method === "HEAD" || codings === null || res.statusCode === 204 || res.statusCode === 304) {
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          const zlibOptions = {
            flush: zlib2.Z_SYNC_FLUSH,
            finishFlush: zlib2.Z_SYNC_FLUSH
          };
          if (codings == "gzip" || codings == "x-gzip") {
            body = body.pipe(zlib2.createGunzip(zlibOptions));
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          if (codings == "deflate" || codings == "x-deflate") {
            const raw = res.pipe(new PassThrough$1());
            raw.once("data", function(chunk) {
              if ((chunk[0] & 15) === 8) {
                body = body.pipe(zlib2.createInflate());
              } else {
                body = body.pipe(zlib2.createInflateRaw());
              }
              response = new Response2(body, response_options);
              resolve2(response);
            });
            return;
          }
          if (codings == "br" && typeof zlib2.createBrotliDecompress === "function") {
            body = body.pipe(zlib2.createBrotliDecompress());
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          response = new Response2(body, response_options);
          resolve2(response);
        });
        writeToStream2(req, request);
      });
    }
    fetch2.isRedirect = function(code) {
      return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
    };
    fetch2.Promise = global.Promise;
    module2.exports = exports = fetch2;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = exports;
    exports.Headers = Headers2;
    exports.Request = Request2;
    exports.Response = Response2;
    exports.FetchError = FetchError2;
  }
});

// node_modules/cross-fetch/dist/node-ponyfill.js
var require_node_ponyfill = __commonJS({
  "node_modules/cross-fetch/dist/node-ponyfill.js"(exports, module2) {
    init_shims();
    var nodeFetch = require_lib();
    var realFetch = nodeFetch.default || nodeFetch;
    var fetch2 = function(url, options2) {
      if (/^\/\//.test(url)) {
        url = "https:" + url;
      }
      return realFetch.call(this, url, options2);
    };
    fetch2.ponyfill = true;
    module2.exports = exports = fetch2;
    exports.fetch = fetch2;
    exports.Headers = nodeFetch.Headers;
    exports.Request = nodeFetch.Request;
    exports.Response = nodeFetch.Response;
    exports.default = fetch2;
  }
});

// node_modules/@prismicio/client/cjs/@prismicio/client.js
var require_client = __commonJS({
  "node_modules/@prismicio/client/cjs/@prismicio/client.js"(exports, module2) {
    init_shims();
    "use strict";
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var crossFetch = _interopDefault(require_node_ponyfill());
    var extendStatics = function(d2, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b2) {
        d3.__proto__ = b2;
      } || function(d3, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d3[p] = b2[p];
      };
      return extendStatics(d2, b);
    };
    function __extends(d2, b) {
      extendStatics(d2, b);
      function __() {
        this.constructor = d2;
      }
      d2.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function() {
      __assign = Object.assign || function __assign2(t) {
        for (var s2, i = 1, n = arguments.length; i < n; i++) {
          s2 = arguments[i];
          for (var p in s2)
            if (Object.prototype.hasOwnProperty.call(s2, p))
              t[p] = s2[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var Variation = function() {
      function Variation2(data) {
        this.data = {};
        this.data = data;
      }
      Variation2.prototype.id = function() {
        return this.data.id;
      };
      Variation2.prototype.ref = function() {
        return this.data.ref;
      };
      Variation2.prototype.label = function() {
        return this.data.label;
      };
      return Variation2;
    }();
    var Experiment = function() {
      function Experiment2(data) {
        this.data = {};
        this.data = data;
        this.variations = (data.variations || []).map(function(v) {
          return new Variation(v);
        });
      }
      Experiment2.prototype.id = function() {
        return this.data.id;
      };
      Experiment2.prototype.googleId = function() {
        return this.data.googleId;
      };
      Experiment2.prototype.name = function() {
        return this.data.name;
      };
      return Experiment2;
    }();
    var Experiments = function() {
      function Experiments2(data) {
        if (data) {
          this.drafts = (data.drafts || []).map(function(exp) {
            return new Experiment(exp);
          });
          this.running = (data.running || []).map(function(exp) {
            return new Experiment(exp);
          });
        }
      }
      Experiments2.prototype.current = function() {
        if (this.running.length > 0) {
          return this.running[0];
        } else {
          return null;
        }
      };
      Experiments2.prototype.refFromCookie = function(cookie) {
        if (!cookie || cookie.trim() === "")
          return null;
        var splitted = cookie.trim().split(" ");
        if (splitted.length < 2)
          return null;
        var expId = splitted[0];
        var varIndex = parseInt(splitted[1], 10);
        var exp = this.running.filter(function(exp2) {
          return exp2.googleId() === expId && exp2.variations.length > varIndex;
        })[0];
        return exp ? exp.variations[varIndex].ref() : null;
      };
      return Experiments2;
    }();
    var Form = function() {
      function Form2(form, httpClient) {
        this.httpClient = httpClient;
        this.form = form;
        this.data = {};
        for (var field in form.fields) {
          if (form.fields[field]["default"]) {
            this.data[field] = [form.fields[field]["default"]];
          }
        }
      }
      Form2.prototype.set = function(field, value) {
        var fieldDesc = this.form.fields[field];
        if (!fieldDesc)
          throw new Error("Unknown field " + field);
        var checkedValue = value === "" || value === void 0 ? null : value;
        var values = this.data[field] || [];
        if (fieldDesc.multiple) {
          values = checkedValue ? values.concat([checkedValue]) : values;
        } else {
          values = checkedValue ? [checkedValue] : values;
        }
        this.data[field] = values;
      };
      Form2.prototype.url = function() {
        var url = this.form.action;
        if (this.data) {
          var sep = url.indexOf("?") > -1 ? "&" : "?";
          for (var key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
              var values = this.data[key];
              if (values) {
                for (var i = 0; i < values.length; i++) {
                  url += sep + key + "=" + encodeURIComponent(values[i]);
                  sep = "&";
                }
              }
            }
          }
        }
        return url;
      };
      Form2.prototype.submit = function(cb) {
        return this.httpClient.cachedRequest(this.url()).then(function(response) {
          cb && cb(null, response);
          return response;
        }).catch(function(error2) {
          cb && cb(error2);
          throw error2;
        });
      };
      return Form2;
    }();
    var SearchForm = function(_super) {
      __extends(SearchForm2, _super);
      function SearchForm2(form, httpClient) {
        return _super.call(this, form, httpClient) || this;
      }
      SearchForm2.prototype.set = function(field, value) {
        _super.prototype.set.call(this, field, value);
        return this;
      };
      SearchForm2.prototype.ref = function(ref) {
        return this.set("ref", ref);
      };
      SearchForm2.prototype.query = function(query) {
        if (typeof query === "string") {
          return this.query([query]);
        } else if (Array.isArray(query)) {
          return this.set("q", "[" + query.join("") + "]");
        } else {
          throw new Error("Invalid query : " + query);
        }
      };
      SearchForm2.prototype.pageSize = function(size) {
        return this.set("pageSize", size);
      };
      SearchForm2.prototype.graphQuery = function(query) {
        return this.set("graphQuery", query);
      };
      SearchForm2.prototype.lang = function(langCode) {
        return this.set("lang", langCode);
      };
      SearchForm2.prototype.page = function(p) {
        return this.set("page", p);
      };
      SearchForm2.prototype.after = function(documentId) {
        return this.set("after", documentId);
      };
      SearchForm2.prototype.orderings = function(orderings) {
        if (!orderings) {
          return this;
        } else {
          return this.set("orderings", "[" + orderings.join(",") + "]");
        }
      };
      return SearchForm2;
    }(Form);
    var TagsForm = function(_super) {
      __extends(TagsForm2, _super);
      function TagsForm2(form, httpClient) {
        return _super.call(this, form, httpClient) || this;
      }
      return TagsForm2;
    }(Form);
    var OPERATOR = {
      at: "at",
      not: "not",
      missing: "missing",
      has: "has",
      any: "any",
      in: "in",
      fulltext: "fulltext",
      similar: "similar",
      numberGt: "number.gt",
      numberLt: "number.lt",
      numberInRange: "number.inRange",
      dateBefore: "date.before",
      dateAfter: "date.after",
      dateBetween: "date.between",
      dateDayOfMonth: "date.day-of-month",
      dateDayOfMonthAfter: "date.day-of-month-after",
      dateDayOfMonthBefore: "date.day-of-month-before",
      dateDayOfWeek: "date.day-of-week",
      dateDayOfWeekAfter: "date.day-of-week-after",
      dateDayOfWeekBefore: "date.day-of-week-before",
      dateMonth: "date.month",
      dateMonthBefore: "date.month-before",
      dateMonthAfter: "date.month-after",
      dateYear: "date.year",
      dateHour: "date.hour",
      dateHourBefore: "date.hour-before",
      dateHourAfter: "date.hour-after",
      GeopointNear: "geopoint.near"
    };
    function encode(value) {
      if (typeof value === "string") {
        return '"' + value + '"';
      } else if (typeof value === "number") {
        return value.toString();
      } else if (value instanceof Date) {
        return value.getTime().toString();
      } else if (Array.isArray(value)) {
        return "[" + value.map(function(v) {
          return encode(v);
        }).join(",") + "]";
      } else if (typeof value === "boolean") {
        return value.toString();
      } else {
        throw new Error("Unable to encode " + value + " of type " + typeof value);
      }
    }
    var geopoint = {
      near: function(fragment, latitude, longitude, radius) {
        return "[" + OPERATOR.GeopointNear + "(" + fragment + ", " + latitude + ", " + longitude + ", " + radius + ")]";
      }
    };
    var date = {
      before: function(fragment, before) {
        return "[" + OPERATOR.dateBefore + "(" + fragment + ", " + encode(before) + ")]";
      },
      after: function(fragment, after) {
        return "[" + OPERATOR.dateAfter + "(" + fragment + ", " + encode(after) + ")]";
      },
      between: function(fragment, before, after) {
        return "[" + OPERATOR.dateBetween + "(" + fragment + ", " + encode(before) + ", " + encode(after) + ")]";
      },
      dayOfMonth: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfMonth + "(" + fragment + ", " + day + ")]";
      },
      dayOfMonthAfter: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfMonthAfter + "(" + fragment + ", " + day + ")]";
      },
      dayOfMonthBefore: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfMonthBefore + "(" + fragment + ", " + day + ")]";
      },
      dayOfWeek: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfWeek + "(" + fragment + ", " + encode(day) + ")]";
      },
      dayOfWeekAfter: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfWeekAfter + "(" + fragment + ", " + encode(day) + ")]";
      },
      dayOfWeekBefore: function(fragment, day) {
        return "[" + OPERATOR.dateDayOfWeekBefore + "(" + fragment + ", " + encode(day) + ")]";
      },
      month: function(fragment, month) {
        return "[" + OPERATOR.dateMonth + "(" + fragment + ", " + encode(month) + ")]";
      },
      monthBefore: function(fragment, month) {
        return "[" + OPERATOR.dateMonthBefore + "(" + fragment + ", " + encode(month) + ")]";
      },
      monthAfter: function(fragment, month) {
        return "[" + OPERATOR.dateMonthAfter + "(" + fragment + ", " + encode(month) + ")]";
      },
      year: function(fragment, year) {
        return "[" + OPERATOR.dateYear + "(" + fragment + ", " + year + ")]";
      },
      hour: function(fragment, hour) {
        return "[" + OPERATOR.dateHour + "(" + fragment + ", " + hour + ")]";
      },
      hourBefore: function(fragment, hour) {
        return "[" + OPERATOR.dateHourBefore + "(" + fragment + ", " + hour + ")]";
      },
      hourAfter: function(fragment, hour) {
        return "[" + OPERATOR.dateHourAfter + "(" + fragment + ", " + hour + ")]";
      }
    };
    var number = {
      gt: function(fragment, value) {
        return "[" + OPERATOR.numberGt + "(" + fragment + ", " + value + ")]";
      },
      lt: function(fragment, value) {
        return "[" + OPERATOR.numberLt + "(" + fragment + ", " + value + ")]";
      },
      inRange: function(fragment, before, after) {
        return "[" + OPERATOR.numberInRange + "(" + fragment + ", " + before + ", " + after + ")]";
      }
    };
    var Predicates = {
      at: function(fragment, value) {
        return "[" + OPERATOR.at + "(" + fragment + ", " + encode(value) + ")]";
      },
      not: function(fragment, value) {
        return "[" + OPERATOR.not + "(" + fragment + ", " + encode(value) + ")]";
      },
      missing: function(fragment) {
        return "[" + OPERATOR.missing + "(" + fragment + ")]";
      },
      has: function(fragment) {
        return "[" + OPERATOR.has + "(" + fragment + ")]";
      },
      any: function(fragment, values) {
        return "[" + OPERATOR.any + "(" + fragment + ", " + encode(values) + ")]";
      },
      in: function(fragment, values) {
        return "[" + OPERATOR.in + "(" + fragment + ", " + encode(values) + ")]";
      },
      fulltext: function(fragment, value) {
        return "[" + OPERATOR.fulltext + "(" + fragment + ", " + encode(value) + ")]";
      },
      similar: function(documentId, maxResults) {
        return "[" + OPERATOR.similar + '("' + documentId + '", ' + maxResults + ")]";
      },
      date,
      dateBefore: date.before,
      dateAfter: date.after,
      dateBetween: date.between,
      dayOfMonth: date.dayOfMonth,
      dayOfMonthAfter: date.dayOfMonthAfter,
      dayOfMonthBefore: date.dayOfMonthBefore,
      dayOfWeek: date.dayOfWeek,
      dayOfWeekAfter: date.dayOfWeekAfter,
      dayOfWeekBefore: date.dayOfWeekBefore,
      month: date.month,
      monthBefore: date.monthBefore,
      monthAfter: date.monthAfter,
      year: date.year,
      hour: date.hour,
      hourBefore: date.hourBefore,
      hourAfter: date.hourAfter,
      number,
      gt: number.gt,
      lt: number.lt,
      inRange: number.inRange,
      near: geopoint.near,
      geopoint
    };
    var decode = decodeURIComponent;
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(/; */);
      var dec = opt.decode || decode;
      pairs.forEach(function(pair) {
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          return;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      });
      return obj;
    }
    var Cookies = { parse };
    function createPreviewResolver(token, documentId, getDocByID) {
      var resolve2 = function(linkResolver2, defaultUrl, cb) {
        if (documentId && getDocByID) {
          return getDocByID(documentId, { ref: token }).then(function(document) {
            if (!document) {
              cb && cb(null, defaultUrl);
              return defaultUrl;
            } else {
              var url = linkResolver2 && linkResolver2(document) || document.url || defaultUrl;
              cb && cb(null, url);
              return url;
            }
          });
        } else {
          return Promise.resolve(defaultUrl);
        }
      };
      return { token, documentId, resolve: resolve2 };
    }
    var PREVIEW_COOKIE = "io.prismic.preview";
    var EXPERIMENT_COOKIE = "io.prismic.experiment";
    var ResolvedApi = function() {
      function ResolvedApi2(data, httpClient, options2) {
        this.data = data;
        this.masterRef = data.refs.filter(function(ref) {
          return ref.isMasterRef;
        })[0];
        this.experiments = new Experiments(data.experiments);
        this.bookmarks = data.bookmarks;
        this.httpClient = httpClient;
        this.options = options2;
        this.refs = data.refs;
        this.tags = data.tags;
        this.types = data.types;
        this.languages = data.languages;
      }
      ResolvedApi2.prototype.form = function(formId) {
        var form = this.data.forms[formId];
        if (!form) {
          return null;
        }
        if (formId === "tags") {
          return new TagsForm(form, this.httpClient);
        }
        return new SearchForm(form, this.httpClient);
      };
      ResolvedApi2.prototype.searchForm = function(formId) {
        var f = this.form(formId);
        if (f instanceof SearchForm) {
          return f;
        }
        return null;
      };
      ResolvedApi2.prototype.tagsForm = function() {
        var f = this.form("tags");
        if (!f) {
          throw new Error("Missing tags form");
        }
        if (f instanceof TagsForm) {
          return f;
        }
        throw new Error("Unexpected error: tags form is not TagsForm");
      };
      ResolvedApi2.prototype.everything = function() {
        var f = this.searchForm("everything");
        if (!f)
          throw new Error("Missing everything form");
        return f;
      };
      ResolvedApi2.prototype.master = function() {
        return this.masterRef.ref;
      };
      ResolvedApi2.prototype.ref = function(label) {
        var ref = this.data.refs.filter(function(ref2) {
          return ref2.label === label;
        })[0];
        return ref ? ref.ref : null;
      };
      ResolvedApi2.prototype.currentExperiment = function() {
        return this.experiments.current();
      };
      ResolvedApi2.prototype.query = function(q, optionsOrCallback, cb) {
        if (cb === void 0) {
          cb = function() {
          };
        }
        var _a = typeof optionsOrCallback === "function" ? { options: {}, callback: optionsOrCallback } : { options: optionsOrCallback || {}, callback: cb }, options2 = _a.options, callback = _a.callback;
        var form = this.everything();
        for (var key in options2) {
          form = form.set(key, options2[key]);
        }
        if (!options2.ref) {
          var cookieString = "";
          if (this.options.req) {
            cookieString = this.options.req.headers["cookie"] || "";
          } else if (typeof window !== "undefined" && window.document) {
            cookieString = window.document.cookie || "";
          }
          var cookies = Cookies.parse(cookieString);
          var previewRef = cookies[PREVIEW_COOKIE];
          var experimentRef = this.experiments.refFromCookie(cookies[EXPERIMENT_COOKIE]);
          form = form.ref(previewRef || experimentRef || this.masterRef.ref);
        }
        if (q) {
          form.query(q);
        }
        return form.submit(callback);
      };
      ResolvedApi2.prototype.queryFirst = function(q, optionsOrCallback, cb) {
        var _a = typeof optionsOrCallback === "function" ? { options: {}, callback: optionsOrCallback } : { options: optionsOrCallback || {}, callback: cb || function() {
        } }, options2 = _a.options, callback = _a.callback;
        options2.page = 1;
        options2.pageSize = 1;
        return this.query(q, options2).then(function(response) {
          var document = response && response.results && response.results[0];
          callback(null, document);
          return document;
        }).catch(function(error2) {
          callback(error2);
          throw error2;
        });
      };
      ResolvedApi2.prototype.getByID = function(id, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        if (!options2.lang)
          options2.lang = "*";
        return this.queryFirst(Predicates.at("document.id", id), options2, cb);
      };
      ResolvedApi2.prototype.getByIDs = function(ids, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        if (!options2.lang)
          options2.lang = "*";
        return this.query(Predicates.in("document.id", ids), options2, cb);
      };
      ResolvedApi2.prototype.getByUID = function(type, uid, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        if (options2.lang === "*")
          throw new Error("FORBIDDEN. You can't use getByUID with *, use the predicates instead.");
        if (!options2.page)
          options2.page = 1;
        return this.queryFirst(Predicates.at("my." + type + ".uid", uid), options2, cb);
      };
      ResolvedApi2.prototype.getSingle = function(type, maybeOptions, cb) {
        var options2 = maybeOptions ? __assign({}, maybeOptions) : {};
        return this.queryFirst(Predicates.at("document.type", type), options2, cb);
      };
      ResolvedApi2.prototype.getBookmark = function(bookmark, maybeOptions, cb) {
        var id = this.data.bookmarks[bookmark];
        if (id) {
          return this.getByID(id, maybeOptions, cb);
        } else {
          return Promise.reject("Error retrieving bookmarked id");
        }
      };
      ResolvedApi2.prototype.getTags = function(cb) {
        return this.tagsForm().submit(cb);
      };
      ResolvedApi2.prototype.getPreviewResolver = function(token, documentId) {
        return createPreviewResolver(token, documentId, this.getByID.bind(this));
      };
      return ResolvedApi2;
    }();
    function MakeLRUCache(limit) {
      return new LRUCache(limit);
    }
    function LRUCache(limit) {
      this.size = 0;
      this.limit = limit;
      this._keymap = {};
    }
    LRUCache.prototype.put = function(key, value) {
      var entry = { key, value };
      this._keymap[key] = entry;
      if (this.tail) {
        this.tail.newer = entry;
        entry.older = this.tail;
      } else {
        this.head = entry;
      }
      this.tail = entry;
      if (this.size === this.limit) {
        return this.shift();
      } else {
        this.size++;
      }
    };
    LRUCache.prototype.shift = function() {
      var entry = this.head;
      if (entry) {
        if (this.head.newer) {
          this.head = this.head.newer;
          this.head.older = void 0;
        } else {
          this.head = void 0;
        }
        entry.newer = entry.older = void 0;
        delete this._keymap[entry.key];
      }
      console.log("purging ", entry.key);
      return entry;
    };
    LRUCache.prototype.get = function(key, returnEntry) {
      var entry = this._keymap[key];
      if (entry === void 0)
        return;
      if (entry === this.tail) {
        return returnEntry ? entry : entry.value;
      }
      if (entry.newer) {
        if (entry === this.head)
          this.head = entry.newer;
        entry.newer.older = entry.older;
      }
      if (entry.older)
        entry.older.newer = entry.newer;
      entry.newer = void 0;
      entry.older = this.tail;
      if (this.tail)
        this.tail.newer = entry;
      this.tail = entry;
      return returnEntry ? entry : entry.value;
    };
    LRUCache.prototype.find = function(key) {
      return this._keymap[key];
    };
    LRUCache.prototype.set = function(key, value) {
      var oldvalue;
      var entry = this.get(key, true);
      if (entry) {
        oldvalue = entry.value;
        entry.value = value;
      } else {
        oldvalue = this.put(key, value);
        if (oldvalue)
          oldvalue = oldvalue.value;
      }
      return oldvalue;
    };
    LRUCache.prototype.remove = function(key) {
      var entry = this._keymap[key];
      if (!entry)
        return;
      delete this._keymap[entry.key];
      if (entry.newer && entry.older) {
        entry.older.newer = entry.newer;
        entry.newer.older = entry.older;
      } else if (entry.newer) {
        entry.newer.older = void 0;
        this.head = entry.newer;
      } else if (entry.older) {
        entry.older.newer = void 0;
        this.tail = entry.older;
      } else {
        this.head = this.tail = void 0;
      }
      this.size--;
      return entry.value;
    };
    LRUCache.prototype.removeAll = function() {
      this.head = this.tail = void 0;
      this.size = 0;
      this._keymap = {};
    };
    if (typeof Object.keys === "function") {
      LRUCache.prototype.keys = function() {
        return Object.keys(this._keymap);
      };
    } else {
      LRUCache.prototype.keys = function() {
        var keys = [];
        for (var k in this._keymap)
          keys.push(k);
        return keys;
      };
    }
    LRUCache.prototype.forEach = function(fun, context, desc) {
      var entry;
      if (context === true) {
        desc = true;
        context = void 0;
      } else if (typeof context !== "object")
        context = this;
      if (desc) {
        entry = this.tail;
        while (entry) {
          fun.call(context, entry.key, entry.value, this);
          entry = entry.older;
        }
      } else {
        entry = this.head;
        while (entry) {
          fun.call(context, entry.key, entry.value, this);
          entry = entry.newer;
        }
      }
    };
    LRUCache.prototype.toString = function() {
      var s2 = "", entry = this.head;
      while (entry) {
        s2 += String(entry.key) + ":" + entry.value;
        entry = entry.newer;
        if (entry)
          s2 += " < ";
      }
      return s2;
    };
    var DefaultApiCache = function() {
      function DefaultApiCache2(limit) {
        if (limit === void 0) {
          limit = 1e3;
        }
        this.lru = MakeLRUCache(limit);
      }
      DefaultApiCache2.prototype.isExpired = function(key) {
        var value = this.lru.get(key, false);
        if (value) {
          return value.expiredIn !== 0 && value.expiredIn < Date.now();
        } else {
          return false;
        }
      };
      DefaultApiCache2.prototype.get = function(key, cb) {
        var value = this.lru.get(key, false);
        if (value && !this.isExpired(key)) {
          cb(null, value.data);
        } else {
          cb && cb(null);
        }
      };
      DefaultApiCache2.prototype.set = function(key, value, ttl, cb) {
        this.lru.remove(key);
        this.lru.put(key, {
          data: value,
          expiredIn: ttl ? Date.now() + ttl * 1e3 : 0
        });
        cb && cb(null);
      };
      DefaultApiCache2.prototype.remove = function(key, cb) {
        this.lru.remove(key);
        cb && cb(null);
      };
      DefaultApiCache2.prototype.clear = function(cb) {
        this.lru.removeAll();
        cb && cb(null);
      };
      return DefaultApiCache2;
    }();
    function fetchRequest(url, options2, callback) {
      var fetchOptions = {
        headers: {
          Accept: "application/json"
        }
      };
      if (options2 && options2.proxyAgent) {
        fetchOptions.agent = options2.proxyAgent;
      }
      var timeoutId;
      var fetchPromise = crossFetch(url, fetchOptions);
      var promise = options2.timeoutInMs ? Promise.race([
        fetchPromise,
        new Promise(function(_, reject) {
          timeoutId = setTimeout(function() {
            return reject(new Error(url + " response timeout"));
          }, options2.timeoutInMs);
        })
      ]) : fetchPromise;
      promise.then(function(resp) {
        clearTimeout(timeoutId);
        if (~~(resp.status / 100 !== 2)) {
          return resp.text().then(function() {
            var e = new Error("Unexpected status code [" + resp.status + "] on URL " + url);
            e.status = resp.status;
            throw e;
          });
        }
        return resp.json().then(function(result) {
          var cacheControl = resp.headers.get("cache-control");
          var parsedCacheControl = cacheControl ? /max-age=(\d+)/.exec(cacheControl) : null;
          var ttl = parsedCacheControl ? parseInt(parsedCacheControl[1], 10) : void 0;
          callback(null, result, resp, ttl);
        });
      }).catch(function(err) {
        clearTimeout(timeoutId);
        callback(err);
      });
    }
    var DefaultRequestHandler = function() {
      function DefaultRequestHandler2(options2) {
        this.options = options2 || {};
      }
      DefaultRequestHandler2.prototype.request = function(url, callback) {
        fetchRequest(url, this.options, callback);
      };
      return DefaultRequestHandler2;
    }();
    var HttpClient = function() {
      function HttpClient2(requestHandler, cache, proxyAgent, timeoutInMs) {
        this.requestHandler = requestHandler || new DefaultRequestHandler({ proxyAgent, timeoutInMs });
        this.cache = cache || new DefaultApiCache();
      }
      HttpClient2.prototype.request = function(url, callback) {
        this.requestHandler.request(url, function(err, result, xhr, ttl) {
          if (err) {
            callback && callback(err, null, xhr, ttl);
          } else if (result) {
            callback && callback(null, result, xhr, ttl);
          }
        });
      };
      HttpClient2.prototype.cachedRequest = function(url, maybeOptions) {
        var _this = this;
        var options2 = maybeOptions || {};
        var run2 = function(cb) {
          var cacheKey = options2.cacheKey || url;
          _this.cache.get(cacheKey, function(cacheGetError, cacheGetValue) {
            if (cacheGetError || cacheGetValue) {
              cb(cacheGetError, cacheGetValue);
            } else {
              _this.request(url, function(fetchError, fetchValue, _, ttlReq) {
                if (fetchError) {
                  cb(fetchError, null);
                } else {
                  var ttl = ttlReq || options2.ttl;
                  if (ttl) {
                    _this.cache.set(cacheKey, fetchValue, ttl, cb);
                  }
                  cb(null, fetchValue);
                }
              });
            }
          });
        };
        return new Promise(function(resolve2, reject) {
          run2(function(err, value) {
            if (err)
              reject(err);
            if (value)
              resolve2(value);
          });
        });
      };
      return HttpClient2;
    }();
    function separator(url) {
      return url.indexOf("?") > -1 ? "&" : "?";
    }
    var Api = function() {
      function Api2(url, options2) {
        this.options = options2 || {};
        this.url = url;
        var queryStrings = [
          this.options.accessToken && "access_token=" + this.options.accessToken,
          this.options.routes && "routes=" + encodeURIComponent(JSON.stringify(this.options.routes))
        ].filter(Boolean);
        if (queryStrings.length > 0) {
          this.url += separator(url) + queryStrings.join("&");
        }
        this.apiDataTTL = this.options.apiDataTTL || 5;
        this.httpClient = new HttpClient(this.options.requestHandler, this.options.apiCache, this.options.proxyAgent, this.options.timeoutInMs);
      }
      Api2.prototype.get = function(cb) {
        var _this = this;
        return this.httpClient.cachedRequest(this.url, { ttl: this.apiDataTTL }).then(function(data) {
          var resolvedApi = new ResolvedApi(data, _this.httpClient, _this.options);
          cb && cb(null, resolvedApi);
          return resolvedApi;
        }).catch(function(error2) {
          cb && cb(error2);
          throw error2;
        });
      };
      return Api2;
    }();
    var LazySearchForm = function() {
      function LazySearchForm2(id, api2) {
        this.id = id;
        this.api = api2;
        this.fields = {};
      }
      LazySearchForm2.prototype.set = function(key, value) {
        this.fields[key] = value;
        return this;
      };
      LazySearchForm2.prototype.ref = function(ref) {
        return this.set("ref", ref);
      };
      LazySearchForm2.prototype.query = function(query) {
        return this.set("q", query);
      };
      LazySearchForm2.prototype.pageSize = function(size) {
        return this.set("pageSize", size);
      };
      LazySearchForm2.prototype.graphQuery = function(query) {
        return this.set("graphQuery", query);
      };
      LazySearchForm2.prototype.lang = function(langCode) {
        return this.set("lang", langCode);
      };
      LazySearchForm2.prototype.page = function(p) {
        return this.set("page", p);
      };
      LazySearchForm2.prototype.after = function(documentId) {
        return this.set("after", documentId);
      };
      LazySearchForm2.prototype.orderings = function(orderings) {
        return this.set("orderings", orderings);
      };
      LazySearchForm2.prototype.url = function() {
        var _this = this;
        return this.api.get().then(function(api2) {
          return LazySearchForm2.toSearchForm(_this, api2).url();
        });
      };
      LazySearchForm2.prototype.submit = function(cb) {
        var _this = this;
        return this.api.get().then(function(api2) {
          return LazySearchForm2.toSearchForm(_this, api2).submit(cb);
        });
      };
      LazySearchForm2.toSearchForm = function(lazyForm, api2) {
        var form = api2.searchForm(lazyForm.id);
        if (form) {
          return Object.keys(lazyForm.fields).reduce(function(form2, fieldKey) {
            var fieldValue = lazyForm.fields[fieldKey];
            if (fieldKey === "q") {
              return form2.query(fieldValue);
            } else if (fieldKey === "pageSize") {
              return form2.pageSize(fieldValue);
            } else if (fieldKey === "graphQuery") {
              return form2.graphQuery(fieldValue);
            } else if (fieldKey === "lang") {
              return form2.lang(fieldValue);
            } else if (fieldKey === "page") {
              return form2.page(fieldValue);
            } else if (fieldKey === "after") {
              return form2.after(fieldValue);
            } else if (fieldKey === "orderings") {
              return form2.orderings(fieldValue);
            } else {
              return form2.set(fieldKey, fieldValue);
            }
          }, form);
        } else {
          throw new Error("Unable to access to form " + lazyForm.id);
        }
      };
      return LazySearchForm2;
    }();
    var DefaultClient = function() {
      function DefaultClient2(url, options2) {
        this.api = new Api(url, options2);
      }
      DefaultClient2.prototype.getApi = function() {
        return this.api.get();
      };
      DefaultClient2.prototype.everything = function() {
        return this.form("everything");
      };
      DefaultClient2.prototype.form = function(formId) {
        return new LazySearchForm(formId, this.api);
      };
      DefaultClient2.prototype.query = function(q, optionsOrCallback, cb) {
        return this.getApi().then(function(api2) {
          return api2.query(q, optionsOrCallback, cb);
        });
      };
      DefaultClient2.prototype.queryFirst = function(q, optionsOrCallback, cb) {
        return this.getApi().then(function(api2) {
          return api2.queryFirst(q, optionsOrCallback, cb);
        });
      };
      DefaultClient2.prototype.getByID = function(id, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getByID(id, options2, cb);
        });
      };
      DefaultClient2.prototype.getByIDs = function(ids, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getByIDs(ids, options2, cb);
        });
      };
      DefaultClient2.prototype.getByUID = function(type, uid, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getByUID(type, uid, options2, cb);
        });
      };
      DefaultClient2.prototype.getSingle = function(type, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getSingle(type, options2, cb);
        });
      };
      DefaultClient2.prototype.getBookmark = function(bookmark, options2, cb) {
        return this.getApi().then(function(api2) {
          return api2.getBookmark(bookmark, options2, cb);
        });
      };
      DefaultClient2.prototype.getTags = function() {
        return this.getApi().then(function(api2) {
          return api2.getTags();
        });
      };
      DefaultClient2.prototype.getPreviewResolver = function(token, documentId) {
        var _this = this;
        var getDocById = function(documentId2, maybeOptions) {
          return _this.getApi().then(function(api2) {
            return api2.getByID(documentId2, maybeOptions);
          });
        };
        return createPreviewResolver(token, documentId, getDocById);
      };
      DefaultClient2.getApi = function(url, options2) {
        var api2 = new Api(url, options2);
        return api2.get();
      };
      return DefaultClient2;
    }();
    var index = {
      experimentCookie: EXPERIMENT_COOKIE,
      previewCookie: PREVIEW_COOKIE,
      Predicates,
      predicates: Predicates,
      Experiments,
      Api,
      client,
      getApi,
      api
    };
    function client(url, options2) {
      return new DefaultClient(url, options2);
    }
    function getApi(url, options2) {
      return DefaultClient.getApi(url, options2);
    }
    function api(url, options2) {
      return getApi(url, options2);
    }
    module2.exports = index;
  }
});

// .svelte-kit/output/server/chunks/sitemap.xml-34c527c7.js
var sitemap_xml_34c527c7_exports = {};
__export(sitemap_xml_34c527c7_exports, {
  get: () => get
});
async function get(request) {
  const getHomePageData2 = await fetch(`${BASE_PATH}/api/home/getHomePageData`);
  const home = await getHomePageData2.json();
  const getPostsPageData = await fetch(`${BASE_PATH}/api/blog/getAllPosts`);
  const posts = await getPostsPageData.json();
  const homePageData = {
    lastMod: home.lastMod,
    url: `${BASE_PATH}/`,
    image: home.hero.images[0].src
  };
  const postsPageData = {
    lastMod: posts.pageData.page.lastMod,
    url: `${BASE_PATH}${BLOG_PATH}`
  };
  const allPostsData = posts.allPostsData.map((item) => {
    return {
      lastMod: item.lastMod,
      url: `${BASE_PATH}${item.href}`,
      images: item.images
    };
  });
  const render2 = () => `<?xml version="1.0" encoding="UTF-8" ?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
      <loc><![CDATA[${homePageData.url}]]></loc>
      <lastMod>${homePageData.lastMod}</lastMod>
      <image:image>
        <image:loc><![CDATA[${homePageData.image}]]></image:loc>
      </image:image>
    </url>
    <url>
      <loc><![CDATA[${postsPageData.url}]]></loc>
      <lastMod>${postsPageData.lastMod}</lastMod>
    </url>${allPostsData.map((page2) => {
    if (page2.images[0]) {
      return `
    <url>
      <loc><![CDATA[${page2.url}]]></loc>
      <lastMod>${page2.lastMod}</lastMod>${page2.images.map((item) => `
      <image:image>
        <image:loc><![CDATA[${item.url}]]></image:loc>
        <image:caption><![CDATA[${item.alt}]]></image:caption>
      </image:image>`).join("")}
    </url>`;
    } else {
      return `
    <url>
      <loc><![CDATA[${page2.url}]]></loc>
      <lastMod>${page2.lastMod}</lastMod>
    </url>`;
    }
  }).join("")}
  </urlset>`;
  console.dirxml(`${render2()}`);
  return {
    status: 200,
    headers: {
      "Cache-Control": `max-age=0, s-max-age=${600}`,
      "Content-Type": "application/xml"
    },
    body: render2()
  };
}
var import_client, import_dotenv, BASE_PATH, BLOG_PATH;
var init_sitemap_xml_34c527c7 = __esm({
  ".svelte-kit/output/server/chunks/sitemap.xml-34c527c7.js"() {
    init_shims();
    import_client = __toModule(require_client());
    import_dotenv = __toModule(require_main());
    import_dotenv.default.config();
    ({ BASE_PATH, BLOG_PATH } = process.env);
  }
});

// .svelte-kit/output/server/chunks/rss.xml-8d3d5cca.js
var rss_xml_8d3d5cca_exports = {};
__export(rss_xml_8d3d5cca_exports, {
  get: () => get2
});
async function get2(request) {
  const res = await fetch(`${BASE_PATH2}/api/blog/getAllPosts`);
  const blogPageData = await res.json();
  const { page: page2, pageSEO } = blogPageData.pageData;
  const { allPostsData } = blogPageData;
  console.log(`blogPageData on rss feed server: ${JSON.stringify(blogPageData, null, 2)}`);
  const render2 = (posts) => `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
  <channel>
    <title><![CDATA[ ${page2.title} ]]></title>
    <link><![CDATA[ ${BASE_PATH2}${BLOG_PATH2} ]]></link>
    <description><![CDATA[ ${pageSEO.description} ]]></description>
    <image>
      <url>${BASE_PATH2}/favicon.png</url>
      <title><![CDATA[ ${page2.title} ]]></title>
      <link><![CDATA[ ${BASE_PATH2}${BLOG_PATH2} ]]></link>
    </image>
    ${posts.map((post) => `
      <item>
        <title><![CDATA[ ${post.title} ]]></title>
        <link><![CDATA[ ${BASE_PATH2}${post.href} ]]></link>
        <description><![CDATA[ ${post.subTitle} ]]></description>
        <pubDate>${post.feedPublicationDate}</pubDate>
      </item>
    `).join("\n")}
  </channel>
  </rss>`;
  return {
    status: 200,
    headers: {
      "Cache-Control": `max-age=0, s-max-age=${600}`,
      "Content-Type": "application/xml"
    },
    body: render2(allPostsData)
  };
}
var import_dotenv2, BASE_PATH2, BLOG_PATH2;
var init_rss_xml_8d3d5cca = __esm({
  ".svelte-kit/output/server/chunks/rss.xml-8d3d5cca.js"() {
    init_shims();
    import_dotenv2 = __toModule(require_main());
    import_dotenv2.default.config();
    ({ BASE_PATH: BASE_PATH2, BLOG_PATH: BLOG_PATH2 } = process.env);
  }
});

// .svelte-kit/output/server/chunks/getLayoutData-e02b1b96.js
var getLayoutData_e02b1b96_exports = {};
__export(getLayoutData_e02b1b96_exports, {
  get: () => get3
});
async function get3(request) {
  const res = await initApi(request, request.locals.ctx.endpoint).then(function(api) {
    return getGlobalLayoutData(api);
  }).then((res2) => {
    if (res2.results[0]) {
      console.log(`response in getLayoutData before processing: ${JSON.stringify(res2.results[0], null, 2)}`);
      let body = res2.results[0].data.body;
      let [rawSocialLinks] = body.filter((slice) => slice.primary.link_cluster_type === "Social");
      let processedSocialLinks = rawSocialLinks.items.map((item) => {
        return {
          href: item.link.url,
          site: item.external_link_id,
          iconId: `#icon-${item.external_link_id.toLowerCase()}`
        };
      });
      let seo = body.filter((slice) => slice.slice_type === "seo").map((item) => {
        return {
          siteName: item.primary.site_name,
          siteDescription: item.primary.site_description,
          logo: item.primary.site_logo.url,
          sameAs: processedSocialLinks.map((x) => {
            return x.href;
          }),
          locale: "en_US"
        };
      });
      let [globalSEO] = seo;
      let [rawNavLinks] = body.filter((slice) => slice.primary.link_cluster_type === "Nav");
      let processedNavLinks = rawNavLinks.items.map((item) => {
        return {
          href: request.locals.DOM.Link.url(item.link, request.locals.ctx.linkResolver),
          text: item.link.uid
        };
      });
      return {
        headerData: {
          navLinks: processedNavLinks,
          socialLinks: processedSocialLinks
        },
        globalSEO
      };
    }
  });
  return {
    status: 200,
    body: res
  };
}
var import_dotenv3, import_prismic_dom, import_client2;
var init_getLayoutData_e02b1b96 = __esm({
  ".svelte-kit/output/server/chunks/getLayoutData-e02b1b96.js"() {
    init_shims();
    init_app_179c3158();
    import_dotenv3 = __toModule(require_main());
    import_prismic_dom = __toModule(require_prismic_dom_min());
    import_client2 = __toModule(require_client());
  }
});

// .svelte-kit/output/server/chunks/getAllPosts-5faa5a35.js
var getAllPosts_5faa5a35_exports = {};
__export(getAllPosts_5faa5a35_exports, {
  get: () => get4
});
async function get4(request) {
  const pageData = await initApi(request, request.locals.ctx.endpoint).then(function(api) {
    return getAllPostsPageData(api);
  }).then((result) => {
    if (result.results[0]) {
      let data = result.results[0].data;
      let page2 = {
        title: data.page_title,
        subTitle: data.page_subtitle,
        lastMod: result.results[0].last_publication_date.substring(0, 10)
      };
      let [pageSEO] = data.body.map((slice) => {
        return {
          title: slice.primary.seo_title,
          description: slice.primary.seo_description,
          altText: slice.primary.seo_image.alt,
          images: slice.primary.seo_image.facebook.dimensions ? {
            main: {
              url: slice.primary.seo_image.url
            },
            facebook: {
              width: slice.primary.seo_image.facebook.dimensions.width,
              height: slice.primary.seo_image.facebook.dimensions.height,
              url: slice.primary.seo_image.facebook.url
            },
            twitter: {
              width: slice.primary.seo_image.twitter.dimensions.width,
              height: slice.primary.seo_image.twitter.dimensions.height,
              url: slice.primary.seo_image.twitter.url
            }
          } : null
        };
      });
      return {
        page: page2,
        pageSEO
      };
    }
  });
  const allPostsData = await initApi(request, request.locals.ctx.endpoint).then(function(api) {
    return getAllPosts(api);
  }).then((result) => {
    if (result.results[0]) {
      let postsData = result.results.map((post) => {
        let createdAt = request.locals.DOM.Date(post.first_publication_date);
        return {
          title: post.data.post_title,
          subTitle: post.data.post_subtitle,
          lastMod: post.last_publication_date.substring(0, 10),
          tags: post.tags.map((tag) => `#${tag}`),
          images: post.data.body.reduce((result2, current) => {
            if (current.slice_type === "post_block") {
              result2.push(...current.items);
            }
            return result2;
          }, []).reduce((result2, current) => {
            if (current.post_block_image.url) {
              result2.push({ url: current.post_block_image.url, alt: current.post_block_image.alt });
            }
            if (current.post_block_text.some((element) => element.type === "image")) {
              let inTextImages = current.post_block_text.filter((item) => item.type === "image").map((item) => {
                return {
                  url: item.url,
                  alt: item.alt
                };
              });
              result2.push(...inTextImages);
            }
            return result2;
          }, []),
          href: `/blog/${post.uid}/`,
          feedPublicationDate: createdAt.toUTCString(),
          publicationDate: createdAt.getFullYear === new Date().getFullYear ? `${monthMap[createdAt.getMonth()]} ${createdAt.getDate()}` : `${monthMap[createdAt.getMonth()]} ${createdAt.getDate()}, ${createdAt.getFullYear()}`
        };
      });
      return postsData;
    }
  });
  return {
    status: 200,
    body: {
      pageData,
      allPostsData
    }
  };
}
var import_dotenv4, import_prismic_dom2, import_client3;
var init_getAllPosts_5faa5a35 = __esm({
  ".svelte-kit/output/server/chunks/getAllPosts-5faa5a35.js"() {
    init_shims();
    init_app_179c3158();
    import_dotenv4 = __toModule(require_main());
    import_prismic_dom2 = __toModule(require_prismic_dom_min());
    import_client3 = __toModule(require_client());
  }
});

// .svelte-kit/output/server/chunks/[slug]-94607143.js
var slug_94607143_exports = {};
__export(slug_94607143_exports, {
  get: () => get5
});
async function get5(request) {
  const { slug } = request.params;
  const pageData = await initApi(request, request.locals.ctx.endpoint).then(function(api) {
    return getPost(api, slug);
  }).then((result) => {
    let postSections, title, subTitle, publicationDate;
    if (result.results[0]) {
      console.log(`result before processing in [slug].js: ${JSON.stringify(result, null, 2)}`);
      let seoDatePublished = request.locals.DOM.Date(result.results[0].first_publication_date);
      let seoDateModified = request.locals.DOM.Date(result.results[0].last_publication_date);
      let body = result.results[0].data.body;
      let seo = body.filter((slice) => slice.slice_type === "seo").map((slice) => {
        return {
          title: slice.primary.seo_title,
          description: slice.primary.seo_description,
          altText: slice.primary.seo_image.alt,
          images: slice.primary.seo_image.facebook.dimensions ? {
            main: {
              url: slice.primary.seo_image.url
            },
            facebook: {
              width: slice.primary.seo_image.facebook.dimensions.width,
              height: slice.primary.seo_image.facebook.dimensions.height,
              url: slice.primary.seo_image.facebook.url
            },
            twitter: {
              width: slice.primary.seo_image.twitter.dimensions.width,
              height: slice.primary.seo_image.twitter.dimensions.height,
              url: slice.primary.seo_image.twitter.url
            }
          } : null,
          blogPosting: {
            authorName: slice.primary.seo_author_name,
            authorUrl: slice.primary.seo_author_url,
            dateModified: seoDateModified,
            datePublished: seoDatePublished,
            headline: slice.primary.seo_title,
            image: slice.primary.seo_image["4x3"].dimensions ? [
              slice.primary.seo_image["4x3"].url,
              slice.primary.seo_image["16x9"].url,
              slice.primary.seo_image["1x1"].url
            ] : null
          }
        };
      });
      const [pageSEO] = seo;
      title = result.results[0].data.post_title;
      subTitle = result.results[0].data.post_subtitle;
      publicationDate = `${monthMap[seoDatePublished.getMonth()]} ${seoDatePublished.getDate()}, ${seoDatePublished.getFullYear()}`;
      postSections = body.filter((slice) => {
        return slice.slice_type === "post_block" || slice.slice_type === "embed_media";
      }).map((slice) => {
        if (slice.slice_type === "post_block") {
          let [blockItems] = slice.items.map((item) => {
            return {
              postBlockLayout: item.post_block_layout,
              title: item.post_block_title ? item.post_block_title : null,
              text: item.post_block_text[0] ? request.locals.DOM.RichText.asHtml(item.post_block_text, request.locals.ctx.linkResolver) : null,
              image: item.post_block_image.desktop.dimensions ? [
                { width: item.post_block_image.desktop.dimensions.width, src: item.post_block_image.desktop.url },
                { width: item.post_block_image.tablet.dimensions.width, src: item.post_block_image.tablet.url },
                { width: item.post_block_image.mobile.dimensions.width, src: item.post_block_image.mobile.url }
              ] : null,
              altText: item.post_block_image.alt ? item.post_block_image.alt : null
            };
          });
          return blockItems;
        } else if (slice.slice_type === "embed_media") {
          return {
            postBlockLayout: "Embed Media",
            title: null,
            text: slice.primary.media_link.html,
            image: null,
            altText: null
          };
        }
      });
      return {
        post: {
          title,
          subTitle,
          publicationDate,
          postSections
        },
        pageSEO
      };
    }
  });
  return {
    status: 200,
    body: pageData
  };
}
var import_dotenv5, import_prismic_dom3, import_client4;
var init_slug_94607143 = __esm({
  ".svelte-kit/output/server/chunks/[slug]-94607143.js"() {
    init_shims();
    init_app_179c3158();
    import_dotenv5 = __toModule(require_main());
    import_prismic_dom3 = __toModule(require_prismic_dom_min());
    import_client4 = __toModule(require_client());
  }
});

// .svelte-kit/output/server/chunks/getHomePageData-29a855f5.js
var getHomePageData_29a855f5_exports = {};
__export(getHomePageData_29a855f5_exports, {
  get: () => get6
});
async function get6(request) {
  const res = await initApi(request, request.locals.ctx.endpoint).then(function(api) {
    return getHomePageData(api);
  }).then((res2) => {
    if (res2.results[0]) {
      let body = res2.results[0].data.body;
      let lastMod = res2.results[0].last_publication_date.substring(0, 10);
      let heroSection = body.filter((slice) => slice.slice_type === "hero_section").map((slice) => {
        return {
          header: slice.primary.header.split(" ").join("<br>"),
          text: slice.primary.text.split(", ").join(",<br>"),
          images: slice.primary.image.desktop.dimensions ? [
            { width: slice.primary.image.dimensions.width, src: slice.primary.image.url },
            { width: slice.primary.image.desktop.dimensions.width, src: slice.primary.image.desktop.url },
            { width: slice.primary.image.tablet.dimensions.width, src: slice.primary.image.tablet.url },
            { width: slice.primary.image.mobile.dimensions.width, src: slice.primary.image.mobile.url }
          ] : null
        };
      });
      let aboutSection = body.filter((slice) => slice.slice_type === "about_section").map((slice) => {
        return {
          title: slice.primary.title,
          summary: request.locals.DOM.RichText.asHtml(slice.primary.summary, request.locals.ctx.linkResolver),
          sections: slice.items.map((item) => {
            return {
              header: item.header,
              description: request.locals.DOM.RichText.asHtml(item.description, request.locals.ctx.linkResolver)
            };
          })
        };
      });
      let seo = body.filter((slice) => slice.slice_type === "regular_page_seo").map((slice) => {
        return {
          title: slice.primary.seo_title,
          description: slice.primary.seo_description,
          altText: slice.primary.seo_image.alt,
          images: slice.primary.seo_image.facebook.dimensions ? {
            main: {
              url: slice.primary.seo_image.url
            },
            facebook: {
              width: slice.primary.seo_image.facebook.dimensions.width,
              height: slice.primary.seo_image.facebook.dimensions.height,
              url: slice.primary.seo_image.facebook.url
            },
            twitter: {
              width: slice.primary.seo_image.twitter.dimensions.width,
              height: slice.primary.seo_image.twitter.dimensions.height,
              url: slice.primary.seo_image.twitter.url
            }
          } : null
        };
      });
      const [hero] = heroSection;
      const [about] = aboutSection;
      const [pageSEO] = seo;
      return {
        lastMod,
        hero,
        about,
        pageSEO
      };
    }
  });
  return {
    status: 200,
    body: res
  };
}
var import_dotenv6, import_prismic_dom4, import_client5;
var init_getHomePageData_29a855f5 = __esm({
  ".svelte-kit/output/server/chunks/getHomePageData-29a855f5.js"() {
    init_shims();
    init_app_179c3158();
    import_dotenv6 = __toModule(require_main());
    import_prismic_dom4 = __toModule(require_prismic_dom_min());
    import_client5 = __toModule(require_client());
  }
});

// .svelte-kit/output/server/chunks/constants-193752e4.js
var css, Center, headingLevel, counter, navData, globalSeoData;
var init_constants_193752e4 = __esm({
  ".svelte-kit/output/server/chunks/constants-193752e4.js"() {
    init_shims();
    init_app_179c3158();
    css = {
      code: ".center.svelte-ys2ofb{box-sizing:content-box;margin-left:auto;margin-right:auto;max-width:var(--measure, none);padding-left:var(--gutters, 0);padding-right:var(--gutters, 0);display:flex;flex-direction:column;align-items:center}",
      map: null
    };
    Center = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      $$result.css.add(css);
      return `<div class="${escape(null_to_empty(wrapperClass ? `center ${wrapperClass}` : "center")) + " svelte-ys2ofb"}">${slots.default ? slots.default({}) : ``}
</div>`;
    });
    headingLevel = { name: "headingLevel" };
    counter = { name: "counter" };
    navData = { name: "navData" };
    globalSeoData = { name: "globalSEO" };
  }
});

// .svelte-kit/output/server/chunks/800-5e3c6112.js
var css2, Footer, Sprite;
var init_e3c6112 = __esm({
  ".svelte-kit/output/server/chunks/800-5e3c6112.js"() {
    init_shims();
    init_app_179c3158();
    init_constants_193752e4();
    css2 = {
      code: "footer.svelte-8pnsqe{padding:var(--s3);background-color:var(--color-darkish);color:var(--color-white)}",
      map: null
    };
    Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let string = `&copy; Mike Lamb - ${new Date().getFullYear()}`;
      $$result.css.add(css2);
      return `<footer class="${"svelte-8pnsqe"}">${validate_component(Center, "Center").$$render($$result, {}, {}, {
        default: () => `<div><!-- HTML_TAG_START -->${string}<!-- HTML_TAG_END --></div>`
      })}
</footer>`;
    });
    Sprite = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `<!-- HTML_TAG_START -->${` 
<span style="visibility: hidden; position: absolute; z-index: -1;">
<svg aria-hidden="true" width="0" height="0"><defs/><symbol id="goat" viewBox="0 0 1084 1280"><!--<style>
  @media (prefers-color-scheme: dark) {
    path { fill: #ffffff }
  }
</style>--><metadata>Created by potrace 1.15, written by Peter Selinger 2001-2017</metadata><rect width="100%" height="100%" fill="none"/><g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)" stroke="none"><path d="M9675 12739 c-829 -21 -1586 -94 -2120 -205 -798 -166 -1378 -476
-1935 -1034 -352 -352 -553 -647 -740 -1085 -73 -171 -107 -230 -135 -230 -59
0 -57 155 9 619 64 449 79 594 80 806 1 269 -12 288 -192 277 -164 -10 -338
-60 -687 -199 -110 -43 -284 -104 -387 -134 -102 -30 -204 -61 -225 -70 -76
-32 -93 -67 -48 -102 13 -11 22 -22 19 -25 -3 -3 -1 -14 5 -25 22 -42 120 -62
409 -82 153 -11 193 -22 231 -63 22 -25 24 -32 18 -99 -11 -122 -127 -569
-220 -843 -167 -492 -354 -802 -777 -1285 -160 -182 -267 -320 -322 -412 -46
-78 -79 -105 -195 -166 -141 -72 -251 -106 -667 -201 -369 -85 -457 -117 -644
-235 -199 -124 -248 -144 -595 -247 -131 -38 -263 -81 -293 -94 -133 -59 -163
-116 -133 -254 54 -254 567 -429 1654 -565 290 -36 421 -47 689 -54 l238 -7
32 -37 c30 -34 35 -51 60 -196 57 -327 43 -389 -172 -767 -241 -425 -325 -629
-379 -925 -24 -131 -24 -446 0 -584 31 -178 87 -376 130 -466 50 -102 144
-203 255 -274 79 -50 92 -56 71 -28 -8 10 10 -6 38 -37 29 -31 52 -61 50 -67
-3 -15 97 -165 159 -239 143 -168 340 -255 580 -255 114 0 151 -14 179 -67 30
-56 26 -241 -13 -528 -45 -331 -52 -415 -52 -624 1 -371 75 -710 239 -1079 41
-93 66 -139 87 -157 6 -5 27 -38 48 -71 79 -134 87 -94 25 132 -65 237 -108
440 -120 564 -13 145 0 315 47 604 82 507 70 654 -91 1172 -14 43 -12 45 36
35 4 0 12 -13 18 -28 14 -36 116 -492 132 -591 6 -43 16 -82 21 -88 12 -16 11
-275 -2 -381 -6 -49 -22 -160 -35 -248 -48 -317 -54 -530 -19 -740 14 -85 26
-116 40 -103 3 4 14 96 25 205 26 280 42 364 120 632 86 293 97 354 93 551 -4
311 -58 514 -196 748 -49 84 -58 106 -47 113 23 15 36 10 62 -20 25 -31 86
-190 107 -281 28 -127 43 -180 51 -180 4 0 19 -36 34 -80 80 -241 77 -412 -15
-845 -49 -229 -50 -239 -41 -253 10 -16 109 90 149 160 85 148 233 522 264
663 25 117 34 303 19 376 -25 122 -101 238 -277 426 l-108 116 23 18 c59 48
206 56 292 17 180 -83 421 -398 648 -848 154 -305 277 -597 576 -1370 143
-368 207 -518 228 -535 7 -5 23 -25 36 -42 74 -106 68 51 -14 387 -44 179 -68
262 -206 710 -285 932 -340 1261 -249 1513 74 204 200 326 455 442 478 217
657 336 940 626 150 154 304 337 298 355 -2 6 7 19 19 30 22 19 23 19 8 -1
-14 -18 -14 -19 2 -6 10 7 16 16 13 20 -2 4 28 45 66 92 184 221 326 424 395
566 25 51 44 102 42 115 -2 18 -23 -7 -97 -116 -202 -295 -391 -525 -607 -736
-192 -187 -341 -298 -524 -390 -225 -113 -388 -154 -925 -235 -507 -77 -572
-93 -1145 -285 -535 -179 -753 -233 -990 -247 -243 -14 -403 50 -638 253 -188
161 -397 403 -500 580 -85 144 -131 326 -117 467 11 114 63 170 121 132 50
-32 135 -180 209 -360 20 -49 50 -103 66 -120 l30 -30 29 33 c16 18 36 57 46
85 28 88 93 202 150 265 30 33 96 91 147 129 50 39 171 128 267 200 180 133
256 204 246 229 -3 8 16 35 44 65 117 122 30 99 -355 -94 -466 -233 -641 -275
-796 -190 -63 34 -103 85 -119 154 -26 109 5 204 170 526 115 225 170 343 175
377 2 12 19 59 38 106 19 47 54 139 77 205 23 66 46 125 50 130 12 15 76 256
99 370 54 269 64 415 36 533 -27 113 -65 172 -248 383 -55 63 -116 144 -138
180 -104 178 -128 397 -60 544 11 22 33 70 50 106 44 95 91 149 255 293 193
170 308 299 475 534 198 279 334 549 417 825 28 95 116 503 178 832 99 519
146 720 188 799 16 31 28 77 17 71 -5 -4 -9 -2 -9 4 0 19 62 71 98 81 46 12
153 13 133 1 -26 -17 -2 -40 56 -56 155 -43 175 -55 241 -138 42 -54 -14 -457
-110 -791 -123 -430 -246 -625 -499 -791 -115 -76 -161 -114 -153 -127 3 -4
25 -8 48 -8 35 0 45 -4 49 -20 7 -28 58 -26 254 6 194 32 327 35 498 10 226
-32 272 -2 330 220 34 127 66 211 119 309 236 444 684 951 1149 1299 625 469
1221 645 2627 775 668 62 1229 85 1287 52 21 -11 -122 -58 -497 -162 -506
-139 -709 -211 -1140 -402 -426 -189 -502 -205 -810 -171 -164 17 -263 13
-373 -17 -221 -61 -523 -266 -820 -558 -179 -175 -283 -297 -492 -576 -87
-115 -187 -245 -222 -287 -136 -164 -268 -260 -455 -334 -53 -21 -95 -41 -92
-45 2 -4 26 -11 52 -14 70 -10 80 -14 78 -32 -2 -32 47 -42 240 -53 480 -26
650 -62 1098 -231 334 -127 491 -183 641 -229 210 -64 224 -73 125 -83 -153
-16 -337 -85 -403 -150 -41 -41 -67 -114 -67 -186 0 -114 70 -461 122 -611 75
-214 175 -328 230 -262 42 51 46 99 22 272 -23 166 -17 241 26 326 28 55 45
74 84 99 47 29 54 30 160 30 118 0 189 -17 301 -73 168 -83 335 -241 335 -317
0 -81 -176 -251 -388 -373 -182 -106 -177 -94 -118 -256 5 -17 89 -111 186
-211 202 -209 302 -335 507 -635 350 -513 533 -713 767 -835 71 -37 129 -50
90 -20 -10 8 100 -43 246 -114 360 -175 423 -200 205 -80 -234 129 -451 288
-604 440 -115 115 -181 203 -374 494 -165 251 -262 378 -419 555 -123 138
-178 209 -178 226 0 33 47 79 194 188 232 174 299 256 326 403 23 126 2 173
-221 509 -233 351 -329 464 -476 558 -101 65 -190 101 -588 238 -816 281 -989
356 -1011 443 -25 101 176 415 470 734 355 387 739 662 1281 919 266 125 397
177 1010 397 510 183 668 247 698 283 10 13 8 14 -18 8 -59 -15 -17 4 153 68
142 54 176 64 197 56 37 -14 113 5 182 46 64 39 83 58 83 87 0 10 9 30 20 44
67 85 -44 118 -450 133 -135 5 -252 9 -260 8 -8 -1 -145 -5 -305 -9z m-7422
-4536 c-13 -2 -23 -8 -23 -13 0 -17 40 -20 129 -10 72 9 96 9 118 -2 28 -13
28 -14 35 -138 4 -69 11 -147 16 -175 l8 -50 -60 30 c-58 29 -66 30 -186 29
-133 -1 -281 -23 -520 -76 -122 -27 -230 -58 -567 -163 -192 -59 -414 -95
-592 -95 l-64 0 19 21 c10 12 36 30 57 41 53 26 40 34 -23 13 -28 -9 -53 -15
-55 -13 -4 4 302 105 345 115 8 2 -3 -5 -25 -16 -38 -19 -39 -20 -12 -20 84
-3 384 87 527 157 94 47 380 221 380 232 0 4 -10 6 -22 3 -20 -4 -21 -3 -6 6
37 24 471 131 523 129 17 -1 16 -1 -2 -5z m5087 -3956 c0 -2 -17 -19 -37 -38
l-38 -34 34 38 c33 34 41 42 41 34z m-4519 -924 c13 -16 12 -17 -3 -4 -17 13
-22 21 -14 21 2 0 10 -8 17 -17z"/><path d="M5797 8105 c-27 -7 -73 -26 -104 -41 -139 -68 -478 -386 -446 -418 4
-3 20 -6 36 -6 17 0 27 -3 24 -7 -4 -3 -2 -12 5 -20 9 -11 39 -12 152 -7 164
8 183 4 397 -82 171 -68 257 -87 369 -81 152 8 322 86 453 207 62 57 107 123
93 137 -2 3 2 21 11 40 39 94 -33 138 -347 217 -283 72 -523 94 -643 61z"/></g></symbol><symbol id="icon-email" viewBox="0 0 40 32"><path d="M36 0H4C1.79 0 0.02 1.79 0.02 4L0 28C0 30.21 1.79 32 4 32H36C38.21 32 40 30.21 40 28V4C40 1.79 38.21 0 36 0ZM36 8L20 18L4 8V4L20 14L36 4V8Z" fill="#f1fceb"/></symbol><symbol id="icon-github" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></symbol><symbol id="icon-linkedin" viewBox="0 0 24 24"><path fill="#0B66C2" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></symbol><symbol id="icon-stackoverflow" viewBox="0 0 32 32"><path d="M28.16 32H2.475V20.58H5.32v8.575h19.956V20.58h2.884z" fill="#bcbbbb"/><path d="M8.477 19.8l13.993 2.923.585-2.806-13.993-2.923zm1.832-6.704l12.94 6.04 1.208-2.572-12.94-6.08zm3.586-6.353l10.99 9.12 1.832-2.183-10.99-9.12zM20.99 0l-2.3 1.715 8.536 11.46 2.3-1.715zM8.166 26.27H22.43v-2.845H8.166v2.845z" fill="#f48024"/></symbol><symbol id="icon-twitter" viewBox="0 0 24 24"><path fill="#1D9BF0" d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></symbol></svg>
</span> `}<!-- HTML_TAG_END -->`;
    });
  }
});

// .svelte-kit/output/server/chunks/__layout-5aae68d1.js
var layout_5aae68d1_exports = {};
__export(layout_5aae68d1_exports, {
  default: () => _layout,
  load: () => load
});
async function load({ fetch: fetch2, page: page2 }) {
  let res = await fetch2("/api/layout/getLayoutData/", { method: "GET" }).then((data) => data.json());
  console.log(`res before processing: ${JSON.stringify(res, null, 2)}`);
  const { headerData, globalSEO } = res;
  const { host, path } = page2;
  globalSEO.canonical = `https://${host}${path}`;
  globalSEO.siteUrl = `https://${host}/`;
  return { props: { headerData, globalSEO } };
}
var import_dotenv7, import_prismic_dom5, import_client6, css3, _layout;
var init_layout_5aae68d1 = __esm({
  ".svelte-kit/output/server/chunks/__layout-5aae68d1.js"() {
    init_shims();
    init_app_179c3158();
    init_e3c6112();
    init_constants_193752e4();
    import_dotenv7 = __toModule(require_main());
    import_prismic_dom5 = __toModule(require_prismic_dom_min());
    import_client6 = __toModule(require_client());
    css3 = {
      code: "#body-wrapper.svelte-1ec9gbe h1,#body-wrapper.svelte-1ec9gbe h2,#body-wrapper.svelte-1ec9gbe h3,#body-wrapper.svelte-1ec9gbe h4,#body-wrapper.svelte-1ec9gbe h5,#body-wrapper.svelte-1ec9gbe h6{font-family:'Playfair Display'}",
      map: null
    };
    _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { headerData } = $$props;
      let { globalSEO } = $$props;
      setContext(navData, headerData);
      setContext(globalSeoData, globalSEO);
      if ($$props.headerData === void 0 && $$bindings.headerData && headerData !== void 0)
        $$bindings.headerData(headerData);
      if ($$props.globalSEO === void 0 && $$bindings.globalSEO && globalSEO !== void 0)
        $$bindings.globalSEO(globalSEO);
      $$result.css.add(css3);
      return `${validate_component(Sprite, "Sprite").$$render($$result, {}, {}, {})}

${$$result.head += `<meta name="${"robots"}" content="${"noindex"}" data-svelte="svelte-1jng3fn">`, ""}

<div id="${"body-wrapper"}" class="${"svelte-1ec9gbe"}">${slots.default ? slots.default({}) : ``}
  ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/error-b29e0971.js
var error_b29e0971_exports = {};
__export(error_b29e0971_exports, {
  default: () => Error2,
  load: () => load2
});
function load2({ error: error2, status }) {
  return { props: { error: error2, status } };
}
var import_dotenv8, import_prismic_dom6, import_client7, Error2;
var init_error_b29e0971 = __esm({
  ".svelte-kit/output/server/chunks/error-b29e0971.js"() {
    init_shims();
    init_app_179c3158();
    import_dotenv8 = __toModule(require_main());
    import_prismic_dom6 = __toModule(require_prismic_dom_min());
    import_client7 = __toModule(require_client());
    Error2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { status } = $$props;
      let { error: error2 } = $$props;
      if ($$props.status === void 0 && $$bindings.status && status !== void 0)
        $$bindings.status(status);
      if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
        $$bindings.error(error2);
      return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
    });
  }
});

// .svelte-kit/output/server/chunks/HeadingTag-398fdd7a.js
function labelRegionWithHeading(node, inBrowser) {
  if (node && inBrowser) {
    let sectionHeaderId = node.querySelector("h1, h2, h3, h4, h5, h6")?.id;
    if (sectionHeaderId) {
      node.setAttribute("aria-labelledby", sectionHeaderId);
    } else {
      console.log(`no header for this container: ${node}`);
    }
  }
  return;
}
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
var browser, getStores, page, isBlogPath, isBlogPostPath, BaseSEO, subscriber_queue, Section, Article, HeadingTag;
var init_HeadingTag_398fdd7a = __esm({
  ".svelte-kit/output/server/chunks/HeadingTag-398fdd7a.js"() {
    init_shims();
    init_app_179c3158();
    init_constants_193752e4();
    browser = false;
    getStores = () => {
      const stores = getContext("__svelte__");
      return {
        page: {
          subscribe: stores.page.subscribe
        },
        navigating: {
          subscribe: stores.navigating.subscribe
        },
        get preloading() {
          console.error("stores.preloading is deprecated; use stores.navigating instead");
          return {
            subscribe: stores.navigating.subscribe
          };
        },
        session: stores.session
      };
    };
    page = {
      subscribe(fn) {
        const store = getStores().page;
        return store.subscribe(fn);
      }
    };
    isBlogPath = /\/blog\/$/;
    isBlogPostPath = /\/blog\/[A-Za-z0-9-]+\/$/;
    BaseSEO = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $page, $$unsubscribe_page;
      $$unsubscribe_page = subscribe(page, (value) => $page = value);
      let { data } = $$props;
      const { global: global2, currentPage } = data;
      let webSiteType, webPageType, blogPostingType;
      let jsonld = {
        "@context": "https://schema.org",
        "@graph": []
      };
      let canonical = global2.canonical;
      let websiteUrl = global2.siteUrl;
      let websiteName = global2.siteName;
      let websiteId = `${websiteUrl}#website`;
      let pageId = `${canonical}#webPage`;
      let pageImageId = `${canonical}#primaryimage`;
      let pageImageUrl = currentPage.images.main.url;
      let pageImageAlt = currentPage.altText;
      let pageTitle = currentPage.title;
      let pageDescription = currentPage.description;
      let ogType = isBlogPostPath.test($page.path) ? "article" : "website";
      let ogImage = currentPage.images.facebook.url;
      let ogImageWidth = currentPage.images.facebook.width;
      let ogImageHeight = currentPage.images.facebook.height;
      let twitterImage = currentPage.images.twitter.url;
      let authorName;
      let authorId;
      let authorUrl;
      let dateModified;
      let datePublished;
      let headline;
      let blogPostImage;
      webSiteType = {
        "@type": "WebSite",
        "@id": websiteId,
        name: websiteName,
        url: websiteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${websiteUrl}?s={search_term_string}`,
          "query-input": "required name=search_term_string"
        },
        publisher: { "@id": `${websiteUrl}#westmont` }
      };
      webPageType = {
        "@type": "WebPage",
        "@id": pageId,
        url: canonical,
        inLanguage: global2.locale,
        name: `${pageTitle} | ${websiteName}`,
        image: {
          "@type": "ImageObject",
          "@id": pageImageId,
          url: pageImageUrl
        },
        isPartOf: { "@id": websiteId },
        primaryImageOfPage: { "@id": pageImageId },
        description: pageDescription
      };
      if (isBlogPath.test($page.path)) {
        console.log("IT WORKS!!!");
        webPageType["breadcrumb"] = { "@id": `${canonical}#breadcrumb` };
        jsonld["@graph"].push({
          "@type": "BreadcrumbList",
          "@id": `${canonical}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              item: {
                "@type": "WebPage",
                "@id": `${websiteUrl}#webPage`,
                url: websiteUrl,
                name: `Home`
              }
            },
            {
              "@type": "ListItem",
              position: 2,
              item: {
                "@type": "WebPage",
                "@id": `${canonical}#webPage`,
                url: canonical,
                name: pageTitle
              }
            }
          ]
        });
      }
      if (currentPage?.blogPosting) {
        authorName = currentPage.blogPosting.authorName;
        authorId = `${websiteUrl}#${authorName.toLowerCase().split(" ").join("-")}`;
        authorUrl = currentPage.blogPosting.authorUrl;
        dateModified = currentPage.blogPosting.dateModified;
        datePublished = currentPage.blogPosting.datePublished;
        headline = currentPage.blogPosting.headline;
        blogPostImage = currentPage.blogPosting.image;
        blogPostingType = {
          "@type": "BlogPosting",
          author: {
            "@type": "Person",
            "@id": authorId,
            name: authorName,
            url: authorUrl
          },
          dateModified,
          datePublished,
          headline,
          blogPostImage
        };
        jsonld["@graph"].push(webSiteType, webPageType, blogPostingType);
      } else {
        jsonld["@graph"].push(webSiteType, webPageType);
      }
      let jsonldString = JSON.stringify(jsonld);
      let jsonldScript = `<script type="application/ld+json">${jsonldString + "<"}/script>`;
      if ($$props.data === void 0 && $$bindings.data && data !== void 0)
        $$bindings.data(data);
      $$unsubscribe_page();
      return `${$$result.head += `${$$result.title = `<title>${escape(pageTitle)}</title>`, ""}<link rel="${"canonical"}"${add_attribute("href", canonical, 0)} data-svelte="svelte-90ri3y"><link rel="${"alternate"}" type="${"application/rss+xml"}"${add_attribute("href", `${websiteUrl}rss.xml`, 0)} data-svelte="svelte-90ri3y"><meta name="${"description"}"${add_attribute("content", pageDescription, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:description"}"${add_attribute("content", pageDescription, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:locale"}"${add_attribute("content", global2.locale, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:site_name"}"${add_attribute("content", websiteName, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:title"}"${add_attribute("content", pageTitle, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:image"}"${add_attribute("content", ogImage, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:image:width"}"${add_attribute("content", ogImageWidth, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:image:height"}"${add_attribute("content", ogImageHeight, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:image:alt"}"${add_attribute("content", pageImageAlt, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:type"}"${add_attribute("content", ogType, 0)} data-svelte="svelte-90ri3y"><meta property="${"og:url"}"${add_attribute("content", canonical, 0)} data-svelte="svelte-90ri3y"><meta name="${"twitter:card"}" content="${"summary_large_image"}" data-svelte="svelte-90ri3y"><meta name="${"twitter:creator"}" content="${"@realgoatish"}" data-svelte="svelte-90ri3y"><meta name="${"twitter:title"}"${add_attribute("content", pageTitle, 0)} data-svelte="svelte-90ri3y"><meta name="${"twitter:description"}"${add_attribute("content", pageDescription, 0)} data-svelte="svelte-90ri3y"><meta name="${"twitter:image"}"${add_attribute("content", twitterImage, 0)} data-svelte="svelte-90ri3y"><meta name="${"twitter:image:alt"}"${add_attribute("content", pageImageAlt, 0)} data-svelte="svelte-90ri3y">`, ""}

<!-- HTML_TAG_START -->${jsonldScript}<!-- HTML_TAG_END -->`;
    });
    subscriber_queue = [];
    Section = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $$unsubscribe_currentCounterValue;
      let { wrapperClass } = $$props;
      let level;
      let store = writable(0);
      if (typeof getContext(headingLevel) === "number") {
        level = getContext(headingLevel) + 1;
        setContext(headingLevel, level);
        setContext(counter, store);
      } else {
        level = 1;
        setContext(headingLevel, level);
        setContext(counter, store);
      }
      let currentCounterValue = getContext(counter);
      $$unsubscribe_currentCounterValue = subscribe(currentCounterValue, (value) => value);
      let section = null;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      {
        labelRegionWithHeading(section, browser);
      }
      $$unsubscribe_currentCounterValue();
      return `<section${add_attribute("class", wrapperClass, 0)}${add_attribute("this", section, 0)}>${slots.default ? slots.default({}) : ``}</section>`;
    });
    Article = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $$unsubscribe_currentCounterValue;
      let { wrapperClass } = $$props;
      let level;
      let store = writable(0);
      if (typeof getContext(headingLevel) === "number") {
        level = getContext(headingLevel) + 1;
        setContext(headingLevel, level);
        setContext(counter, store);
      } else {
        level = 1;
        setContext(headingLevel, level);
        setContext(counter, store);
      }
      let currentCounterValue = getContext(counter);
      $$unsubscribe_currentCounterValue = subscribe(currentCounterValue, (value) => value);
      let article = null;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      {
        labelRegionWithHeading(article, browser);
      }
      $$unsubscribe_currentCounterValue();
      return `<article${add_attribute("class", wrapperClass, 0)}${add_attribute("this", article, 0)}>${slots.default ? slots.default({}) : ``}</article>`;
    });
    HeadingTag = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $$unsubscribe_test;
      let { wrapperClass } = $$props;
      let { message } = $$props;
      let level;
      let id = `h-${Math.floor(new Date() * Math.random())}`;
      if (typeof getContext(headingLevel) === "number") {
        level = Math.min(getContext(headingLevel), 6);
      } else {
        level = 1;
      }
      let test = getContext(counter);
      $$unsubscribe_test = subscribe(test, (value) => value);
      const render2 = (param) => {
        return `
    <h${level} 
      id=${id} 
      ${wrapperClass ? `class=${wrapperClass}` : ""}
    >
      ${param}
    </h${level}>
  `;
      };
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.message === void 0 && $$bindings.message && message !== void 0)
        $$bindings.message(message);
      $$unsubscribe_test();
      return `<!-- HTML_TAG_START -->${render2(message)}<!-- HTML_TAG_END -->`;
    });
  }
});

// .svelte-kit/output/server/chunks/Image-dc935feb.js
var css$2, Cover, css$1, Frame, css4, Image;
var init_Image_dc935feb = __esm({
  ".svelte-kit/output/server/chunks/Image-dc935feb.js"() {
    init_shims();
    init_app_179c3158();
    css$2 = {
      code: ".cover.svelte-17bny04.svelte-17bny04{display:flex;flex-direction:column;min-height:100vh}.cover.svelte-17bny04>*{margin-top:var(--space, 1rem);margin-bottom:var(--space, 1rem)}.cover.svelte-17bny04>.header.svelte-17bny04{margin-top:0}.cover.svelte-17bny04>.footer.svelte-17bny04{margin-bottom:0}.cover.svelte-17bny04>.featured.svelte-17bny04{margin-top:auto;margin-bottom:auto}",
      map: null
    };
    Cover = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $$slots = compute_slots(slots);
      let { wrapperClass = "" } = $$props;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      $$result.css.add(css$2);
      return `
<div class="${escape(null_to_empty(wrapperClass ? `cover ${wrapperClass}` : "cover")) + " svelte-17bny04"}">${$$slots.header ? `<div class="${"header svelte-17bny04"}">${slots.header ? slots.header({}) : ``}</div>` : ``}
  ${$$slots.featured ? `<div class="${"featured svelte-17bny04"}">${slots.featured ? slots.featured({}) : ``}</div>` : ``}
  ${$$slots.footer ? `<div class="${"footer svelte-17bny04"}">${slots.footer ? slots.footer({}) : ``}</div>` : ``}
</div>`;
    });
    css$1 = {
      code: ".frame.svelte-1yaab61{padding-bottom:calc(var(--numerator, 1) / var(--denominator, 1) * 100%);position:relative}.frame.svelte-1yaab61>*{overflow:hidden;position:absolute;top:0;right:0;bottom:0;left:0;display:flex;justify-content:center;align-items:center}.frame.svelte-1yaab61>noscript{overflow:visible}.frame.svelte-1yaab61>img,.frame.svelte-1yaab61>noscript > img,.frame.svelte-1yaab61>video,.frame.svelte-1yaab61>noscript > video{width:100%;height:100%;object-fit:cover}",
      map: null
    };
    Frame = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      let { lazy = false } = $$props;
      let intersecting = false;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.lazy === void 0 && $$bindings.lazy && lazy !== void 0)
        $$bindings.lazy(lazy);
      $$result.css.add(css$1);
      return `<div class="${escape(null_to_empty(wrapperClass ? `frame ${wrapperClass}` : "frame")) + " svelte-1yaab61"}"><noscript>${slots.default ? slots.default({}) : ``}</noscript>
	${lazy && intersecting ? `${slots.default ? slots.default({}) : ``}` : `${!lazy ? `${slots.default ? slots.default({}) : ``}` : ``}`}
</div>`;
    });
    css4 = {
      code: "img.svelte-cwzfvz{opacity:0;animation-name:svelte-cwzfvz-fadeImages;animation-duration:1.2s;animation-fill-mode:forwards;border-radius:var(--image-border-radius, none)}@keyframes svelte-cwzfvz-fadeImages{0%{opacity:0}100%{opacity:1}}",
      map: null
    };
    Image = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      let { images } = $$props;
      let { altText } = $$props;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.images === void 0 && $$bindings.images && images !== void 0)
        $$bindings.images(images);
      if ($$props.altText === void 0 && $$bindings.altText && altText !== void 0)
        $$bindings.altText(altText);
      $$result.css.add(css4);
      return `<img${add_attribute("srcset", images.map((obj) => `${obj.src} ${obj.width}w,`).join(""), 0)}${add_attribute("src", images[images.length - 1].src, 0)} sizes="${"50vw"}"${add_attribute("alt", altText, 0)} class="${escape(null_to_empty(wrapperClass)) + " svelte-cwzfvz"}">`;
    });
  }
});

// .svelte-kit/output/server/chunks/Stack-702747d3.js
var css5, Stack;
var init_Stack_702747d3 = __esm({
  ".svelte-kit/output/server/chunks/Stack-702747d3.js"() {
    init_shims();
    init_app_179c3158();
    init_constants_193752e4();
    css5 = {
      code: ".stack.svelte-hlewhq{display:flex;flex-flow:column nowrap;justify-content:flex-start}.stack.svelte-hlewhq,.stack.svelte-hlewhq *{border-radius:inherit}.stack.svelte-hlewhq>*{margin-top:0;margin-bottom:0}.stack.svelte-hlewhq>* + *{margin-top:var(--space, 1rem)}.stack.svelte-hlewhq>.split-after{margin-bottom:auto}",
      map: null
    };
    Stack = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      let { splitAfter = null } = $$props;
      let stack;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.splitAfter === void 0 && $$bindings.splitAfter && splitAfter !== void 0)
        $$bindings.splitAfter(splitAfter);
      $$result.css.add(css5);
      return `<div class="${escape(null_to_empty(wrapperClass ? `stack ${wrapperClass}` : "stack")) + " svelte-hlewhq"}"${add_attribute("this", stack, 0)}>${slots.default ? slots.default({}) : ``}
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/Nav-395022f4.js
var css$22, Cluster, css$12, Icon, css6, Nav;
var init_Nav_395022f4 = __esm({
  ".svelte-kit/output/server/chunks/Nav-395022f4.js"() {
    init_shims();
    init_app_179c3158();
    init_constants_193752e4();
    init_Stack_702747d3();
    css$22 = {
      code: ".cluster.svelte-v2l6fv{display:flex;flex-wrap:wrap;gap:var(--space, 1rem);justify-content:flex-start;align-items:center}ul.svelte-v2l6fv,ol.svelte-v2l6fv,dl.svelte-v2l6fv{list-style:none}",
      map: null
    };
    Cluster = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      let { wrapperElement } = $$props;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.wrapperElement === void 0 && $$bindings.wrapperElement && wrapperElement !== void 0)
        $$bindings.wrapperElement(wrapperElement);
      $$result.css.add(css$22);
      return `${wrapperElement === "ul" ? `<ul class="${escape(null_to_empty(wrapperClass ? `cluster ${wrapperClass}` : "cluster")) + " svelte-v2l6fv"}">${slots.default ? slots.default({}) : ``}</ul>` : `${wrapperElement === "ol" ? `<ol class="${escape(null_to_empty(wrapperClass ? `cluster ${wrapperClass}` : "cluster")) + " svelte-v2l6fv"}">${slots.default ? slots.default({}) : ``}</ol>` : `${wrapperElement === "dl" ? `<dl class="${escape(null_to_empty(wrapperClass ? `cluster ${wrapperClass}` : "cluster")) + " svelte-v2l6fv"}">${slots.default ? slots.default({}) : ``}</dl>` : `${wrapperElement === "div" ? `<div class="${escape(null_to_empty(wrapperClass ? `cluster ${wrapperClass}` : "cluster")) + " svelte-v2l6fv"}">${slots.default ? slots.default({}) : ``}</div>` : ``}`}`}`}`;
    });
    css$12 = {
      code: ".icon.svelte-9ogndg.svelte-9ogndg{width:0.75em;width:1cap;height:0.75em;height:1cap}.with-icon.svelte-9ogndg.svelte-9ogndg{display:inline-flex;align-items:baseline}.with-icon.svelte-9ogndg .icon.svelte-9ogndg{margin-inline-end:var(--space, 1rem)}",
      map: null
    };
    Icon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      let { iconId } = $$props;
      let { label = "" } = $$props;
      let { space = true } = $$props;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.iconId === void 0 && $$bindings.iconId && iconId !== void 0)
        $$bindings.iconId(iconId);
      if ($$props.label === void 0 && $$bindings.label && label !== void 0)
        $$bindings.label(label);
      if ($$props.space === void 0 && $$bindings.space && space !== void 0)
        $$bindings.space(space);
      $$result.css.add(css$12);
      return `<span class="${escape(wrapperClass ? `${wrapperClass}` : "") + " " + escape(space ? `with-icon` : "") + " svelte-9ogndg"}"${add_attribute("aria-label", label ? label : null, 0)}${add_attribute("role", label ? "img" : null, 0)}><svg class="${"icon svelte-9ogndg"}"><use${add_attribute("href", `${iconId}`, 0)}></use></svg>
	${!label ? `${slots.default ? slots.default({}) : ``}` : ``}
</span>`;
    });
    css6 = {
      code: "div.svelte-riisy6.svelte-riisy6{font-size:var(--s1);text-align:center;color:var(--color-darkish);background-color:var(--color-white);padding:var(--s-1) var(--s-3)}div.svelte-riisy6 .center{--measure:60ch}div.svelte-riisy6 .stack{--space:var(--s-2)}div.svelte-riisy6 .cluster{justify-content:center}div.svelte-riisy6 .icon-large.svelte-riisy6 svg{font-size:var(--s5)}div.svelte-riisy6 .icon-small.svelte-riisy6 svg{font-size:var(--s3)}div.svelte-riisy6 .cluster a{width:min-content;display:block;text-transform:uppercase}",
      map: null
    };
    Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      const allLinks = getContext(navData);
      $$result.css.add(css6);
      return `<div class="${"svelte-riisy6"}">${validate_component(Center, "Center").$$render($$result, {}, {}, {
        default: () => `${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
          default: () => `<nav><ul>${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
            default: () => `${each(allLinks.navLinks, (link) => `${link.href === "/" ? `<li class="${"icon-large svelte-riisy6"}"><a${add_attribute("href", link.href, 0)}>${validate_component(Icon, "Icon").$$render($$result, {
              iconId: "#goat",
              label: "goat",
              space: false
            }, {}, {})}</a>
                </li>` : ``}`)}
            ${validate_component(Cluster, "Cluster").$$render($$result, { wrapperElement: "div" }, {}, {
              default: () => `${each(allLinks.navLinks, (link) => `${link.href !== "/" ? `<li><a class="${"nav-link link-hover-effect"}"${add_attribute("href", link.href, 0)}>${escape(link.text)}</a>
                  </li>` : ``}`)}`
            })}`
          })}</ul></nav>
      ${validate_component(Cluster, "Cluster").$$render($$result, { wrapperElement: "ul" }, {}, {
            default: () => `${each(allLinks.socialLinks, (link, i) => `<li class="${"icon-small svelte-riisy6"}"><a${add_attribute("href", link.href, 0)}>${i === allLinks.socialLinks.length - 1 ? `${validate_component(Icon, "Icon").$$render($$result, {
              iconId: link.iconId,
              label: link.site,
              space: false
            }, {}, {})}` : `${validate_component(Icon, "Icon").$$render($$result, { iconId: link.iconId, label: link.site }, {}, {})}`}</a>
          </li>`)}`
          })}`
        })}`
      })}
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-d651b6e2.js
var index_d651b6e2_exports = {};
__export(index_d651b6e2_exports, {
  default: () => Routes,
  load: () => load3,
  prerender: () => prerender
});
async function load3({ fetch: fetch2 }) {
  let res = await fetch2("/api/home/getHomePageData/", { method: "GET" }).then((data) => data.json());
  console.log(`res before processing: ${JSON.stringify(res, null, 2)}`);
  const { hero, about, pageSEO } = res;
  return { props: { hero, about, pageSEO } };
}
var import_dotenv9, import_prismic_dom7, import_client8, css$4, Box, css$3, Switcher, css$23, AboutSection, css$13, Header, css7, prerender, Routes;
var init_index_d651b6e2 = __esm({
  ".svelte-kit/output/server/chunks/index-d651b6e2.js"() {
    init_shims();
    init_app_179c3158();
    init_HeadingTag_398fdd7a();
    init_Image_dc935feb();
    init_Stack_702747d3();
    init_constants_193752e4();
    init_Nav_395022f4();
    import_dotenv9 = __toModule(require_main());
    import_prismic_dom7 = __toModule(require_prismic_dom_min());
    import_client8 = __toModule(require_client());
    css$4 = {
      code: ".box.svelte-1iffxhb.svelte-1iffxhb{color:var(--color, #000);background-color:var(--background-color, #fff)}.box.svelte-1iffxhb .svelte-1iffxhb{color:inherit}.box.invert.svelte-1iffxhb.svelte-1iffxhb{color:var(--background-color);background-color:var(--color)}",
      map: null
    };
    Box = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      let { switchColors = false } = $$props;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.switchColors === void 0 && $$bindings.switchColors && switchColors !== void 0)
        $$bindings.switchColors(switchColors);
      $$result.css.add(css$4);
      return `<div class="${[
        escape(null_to_empty(wrapperClass ? `box ${wrapperClass}` : "box")) + " svelte-1iffxhb",
        switchColors ? "invert" : ""
      ].join(" ").trim()}">${slots.default ? slots.default({}) : ``}
</div>`;
    });
    css$3 = {
      code: ".switcher.svelte-9srj8m{display:flex;flex-wrap:wrap;gap:var(--space, 1rem)}.switcher.svelte-9srj8m>*{flex-grow:1;flex-basis:calc((var(--measure, 30rem) - 100%) * 999)}.switcher.svelte-9srj8m>* > :nth-last-child(n + 5),.switcher.svelte-9srj8m>* > :nth-last-child(n + 5) ~ *{flex-basis:100%}ul.svelte-9srj8m,ol.svelte-9srj8m,dl.svelte-9srj8m{list-style:none}",
      map: null
    };
    Switcher = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { wrapperClass = "" } = $$props;
      let { wrapperElement } = $$props;
      if ($$props.wrapperClass === void 0 && $$bindings.wrapperClass && wrapperClass !== void 0)
        $$bindings.wrapperClass(wrapperClass);
      if ($$props.wrapperElement === void 0 && $$bindings.wrapperElement && wrapperElement !== void 0)
        $$bindings.wrapperElement(wrapperElement);
      $$result.css.add(css$3);
      return `${wrapperElement === "ul" ? `<ul class="${escape(null_to_empty(wrapperClass ? `switcher ${wrapperClass}` : "switcher")) + " svelte-9srj8m"}">${slots.default ? slots.default({}) : ``}</ul>` : `${wrapperElement === "ol" ? `<ol class="${escape(null_to_empty(wrapperClass ? `switcher ${wrapperClass}` : "switcher")) + " svelte-9srj8m"}">${slots.default ? slots.default({}) : ``}</ol>` : `${wrapperElement === "dl" ? `<dl class="${escape(null_to_empty(wrapperClass ? `switcher ${wrapperClass}` : "switcher")) + " svelte-9srj8m"}">${slots.default ? slots.default({}) : ``}</dl>` : `${wrapperElement === "div" ? `
	<div class="${escape(null_to_empty(wrapperClass ? `switcher ${wrapperClass}` : "switcher")) + " svelte-9srj8m"}">${slots.default ? slots.default({}) : ``}</div>` : ``}`}`}`}`;
    });
    css$23 = {
      code: "div.svelte-7zsop3 h1,div.svelte-7zsop3 h2,div.svelte-7zsop3 h3,div.svelte-7zsop3 h4,div.svelte-7zsop3 h5,div.svelte-7zsop3 h6{color:var(--color-lightish)}div.svelte-7zsop3 .switcher{--space:var(--s2);--measure:30rem}div.svelte-7zsop3 .stack{--space:var(--s0)}",
      map: null
    };
    AboutSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { title } = $$props;
      let { summary } = $$props;
      let { sections } = $$props;
      if ($$props.title === void 0 && $$bindings.title && title !== void 0)
        $$bindings.title(title);
      if ($$props.summary === void 0 && $$bindings.summary && summary !== void 0)
        $$bindings.summary(summary);
      if ($$props.sections === void 0 && $$bindings.sections && sections !== void 0)
        $$bindings.sections(sections);
      $$result.css.add(css$23);
      return `<div class="${"svelte-7zsop3"}">${validate_component(Section, "Section").$$render($$result, {}, {}, {
        default: () => `${validate_component(Cover, "Cover").$$render($$result, {}, {}, {
          footer: () => `<button slot="${"footer"}">PRESS ME</button>`,
          featured: () => `${validate_component(Switcher, "Switcher").$$render($$result, { slot: "featured", wrapperElement: "div" }, {}, {
            default: () => `${each(sections, (section) => `${validate_component(Article, "Article").$$render($$result, {}, {}, {
              default: () => `${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
                default: () => `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: section.header }, {}, {})}
              <!-- HTML_TAG_START -->${section.description}<!-- HTML_TAG_END -->
            `
              })}
          `
            })}`)}`
          })}`,
          header: () => `${validate_component(Section, "Section").$$render($$result, { slot: "header" }, {}, {
            default: () => `${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
              default: () => `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: title }, {}, {})}
          <!-- HTML_TAG_START -->${summary}<!-- HTML_TAG_END -->`
            })}`
          })}`
        })}`
      })}
</div>`;
    });
    css$13 = {
      code: "header.svelte-56ctdp{position:relative;max-width:75ch;margin:0 auto}header.svelte-56ctdp .frame{min-height:100vh}header.svelte-56ctdp .frame img{object-position:50% 100%}header.svelte-56ctdp .cover{position:absolute;top:0;left:0;bottom:0;right:0}header.header.svelte-56ctdp .cover > .featured{margin-top:var(--s-4)}h1.svelte-56ctdp{line-height:1;font-size:var(--s3);color:var(--color-lightish);text-shadow:-1px -1px 0 var(--color-white),\n    1px -1px 0 var(--color-white),\n    -1px 1px 0 var(--color-white),\n    1px 1px 0 var(--color-white)}header.svelte-56ctdp .cover .footer .box{--background-color:var(--color-darkish);--color:var(--color-white);--measure:60ch;padding:var(--s-1) var(--s-3)}@media(min-width: 400px){h1.svelte-56ctdp{font-size:var(--s4)}header.header.svelte-56ctdp .cover > .featured{margin-top:var(--s3)}}",
      map: null
    };
    Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { header } = $$props;
      let { text } = $$props;
      let { images } = $$props;
      if ($$props.header === void 0 && $$bindings.header && header !== void 0)
        $$bindings.header(header);
      if ($$props.text === void 0 && $$bindings.text && text !== void 0)
        $$bindings.text(text);
      if ($$props.images === void 0 && $$bindings.images && images !== void 0)
        $$bindings.images(images);
      $$result.css.add(css$13);
      return `<header class="${"header svelte-56ctdp"}">${validate_component(Frame, "Frame").$$render($$result, {}, {}, {
        default: () => `${validate_component(Image, "Image").$$render($$result, { images, altText: "test alt text" }, {}, {})}`
      })}
  ${validate_component(Cover, "Cover").$$render($$result, {}, {}, {
        footer: () => `${validate_component(Box, "Box").$$render($$result, { slot: "footer" }, {}, {
          default: () => `${validate_component(Center, "Center").$$render($$result, {}, {}, {
            default: () => `<h2><!-- HTML_TAG_START -->${text}<!-- HTML_TAG_END --></h2>`
          })}`
        })}`,
        featured: () => `<h1 slot="${"featured"}" class="${"svelte-56ctdp"}"><!-- HTML_TAG_START -->${header}<!-- HTML_TAG_END --></h1>`,
        header: () => `${validate_component(Nav, "Nav").$$render($$result, { slot: "header" }, {}, {})}`
      })}
</header>`;
    });
    css7 = {
      code: "main.svelte-1kd576t>.center{--measure:75ch;padding-top:var(--s5);padding-bottom:var(--s5)}",
      map: null
    };
    prerender = true;
    Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { hero } = $$props;
      let { about } = $$props;
      let { pageSEO } = $$props;
      let globalSEO = getContext(globalSeoData);
      if ($$props.hero === void 0 && $$bindings.hero && hero !== void 0)
        $$bindings.hero(hero);
      if ($$props.about === void 0 && $$bindings.about && about !== void 0)
        $$bindings.about(about);
      if ($$props.pageSEO === void 0 && $$bindings.pageSEO && pageSEO !== void 0)
        $$bindings.pageSEO(pageSEO);
      $$result.css.add(css7);
      return `${validate_component(BaseSEO, "BaseSEO").$$render($$result, {
        data: { currentPage: pageSEO, global: globalSEO }
      }, {}, {})}

${validate_component(Header, "Header").$$render($$result, Object.assign(hero), {}, {})}
<main class="${"svelte-1kd576t"}">${validate_component(Center, "Center").$$render($$result, {}, {}, {
        default: () => `${validate_component(AboutSection, "AboutSection").$$render($$result, Object.assign(about), {}, {})}`
      })}
</main>`;
    });
  }
});

// .svelte-kit/output/server/chunks/__layout.reset-221c4e47.js
var layout_reset_221c4e47_exports = {};
__export(layout_reset_221c4e47_exports, {
  default: () => _layout_reset,
  load: () => load4
});
async function load4({ fetch: fetch2, page: page2 }) {
  let res = await fetch2("/api/layout/getLayoutData/", { method: "GET" }).then((data) => data.json());
  const { headerData, globalSEO } = res;
  const { host, path } = page2;
  globalSEO.canonical = `https://${host}${path}`;
  globalSEO.siteUrl = `https://${host}/`;
  return { props: { headerData, globalSEO } };
}
var import_dotenv10, import_prismic_dom8, import_client9, css8, _layout_reset;
var init_layout_reset_221c4e47 = __esm({
  ".svelte-kit/output/server/chunks/__layout.reset-221c4e47.js"() {
    init_shims();
    init_app_179c3158();
    init_e3c6112();
    init_Nav_395022f4();
    init_constants_193752e4();
    import_dotenv10 = __toModule(require_main());
    import_prismic_dom8 = __toModule(require_prismic_dom_min());
    import_client9 = __toModule(require_client());
    init_Stack_702747d3();
    css8 = {
      code: "#body-wrapper.svelte-182foo7 h1,#body-wrapper.svelte-182foo7 h2,#body-wrapper.svelte-182foo7 h3,#body-wrapper.svelte-182foo7 h4,#body-wrapper.svelte-182foo7 h5,#body-wrapper.svelte-182foo7 h6{font-family:'Playfair Display'}",
      map: null
    };
    _layout_reset = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { headerData } = $$props;
      let { globalSEO } = $$props;
      setContext(navData, headerData);
      setContext(globalSeoData, globalSEO);
      if ($$props.headerData === void 0 && $$bindings.headerData && headerData !== void 0)
        $$bindings.headerData(headerData);
      if ($$props.globalSEO === void 0 && $$bindings.globalSEO && globalSEO !== void 0)
        $$bindings.globalSEO(globalSEO);
      $$result.css.add(css8);
      return `${validate_component(Sprite, "Sprite").$$render($$result, {}, {}, {})}

${$$result.head += `<meta name="${"robots"}" content="${"noindex"}" data-svelte="svelte-1jng3fn">`, ""}

<div id="${"body-wrapper"}" class="${"svelte-182foo7"}"><header>${validate_component(Nav, "Nav").$$render($$result, {}, {}, {})}</header>
  ${slots.default ? slots.default({}) : ``}
  ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-a3287ce9.js
var index_a3287ce9_exports = {};
__export(index_a3287ce9_exports, {
  default: () => Blog,
  load: () => load5
});
async function load5({ fetch: fetch2 }) {
  let res = await fetch2("/api/blog/getAllPosts/", { method: "GET" }).then((data) => data.json());
  console.log(`res before processing: ${JSON.stringify(res, null, 2)}`);
  const { allPostsData } = res;
  const { page: page2 } = res.pageData;
  const { pageSEO } = res.pageData;
  return { props: { pageSEO, page: page2, allPostsData } };
}
var import_dotenv11, import_prismic_dom9, import_client10, css9, Blog;
var init_index_a3287ce9 = __esm({
  ".svelte-kit/output/server/chunks/index-a3287ce9.js"() {
    init_shims();
    init_app_179c3158();
    init_HeadingTag_398fdd7a();
    init_Stack_702747d3();
    init_constants_193752e4();
    import_dotenv11 = __toModule(require_main());
    import_prismic_dom9 = __toModule(require_prismic_dom_min());
    import_client10 = __toModule(require_client());
    css9 = {
      code: "main.svelte-1brxpxw .center{--gutters:var(--s-3);--measure:60ch}main.svelte-1brxpxw .center > .stack{--space:var(--s1)}main.svelte-1brxpxw section .stack{--space:var(--s0)}",
      map: null
    };
    Blog = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { pageSEO } = $$props;
      let { page: page2 } = $$props;
      let { allPostsData } = $$props;
      const globalSEO = getContext(globalSeoData);
      if ($$props.pageSEO === void 0 && $$bindings.pageSEO && pageSEO !== void 0)
        $$bindings.pageSEO(pageSEO);
      if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
        $$bindings.page(page2);
      if ($$props.allPostsData === void 0 && $$bindings.allPostsData && allPostsData !== void 0)
        $$bindings.allPostsData(allPostsData);
      $$result.css.add(css9);
      return `${validate_component(BaseSEO, "BaseSEO").$$render($$result, {
        data: { currentPage: pageSEO, global: globalSEO }
      }, {}, {})}

<main class="${"svelte-1brxpxw"}">${validate_component(Center, "Center").$$render($$result, {}, {}, {
        default: () => `${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
          default: () => `<div>${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: page2.title }, {}, {})}</div>
      ${validate_component(Section, "Section").$$render($$result, {}, {}, {
            default: () => `${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
              default: () => `${each(allPostsData, (post) => `${validate_component(Article, "Article").$$render($$result, {}, {}, {
                default: () => `<p class="${"text-small"}">${escape(post.publicationDate)}</p>
              <a class="${"link-hover-effect"}"${add_attribute("href", post.href, 0)}>${escape(post.title)}</a>
              <p class="${"text-small"}">${escape(post.tags)}</p>
  
            `
              })}`)}`
            })}`
          })}`
        })}`
      })}
</main>`;
    });
  }
});

// .svelte-kit/output/server/chunks/[slug]-27f96c17.js
var slug_27f96c17_exports = {};
__export(slug_27f96c17_exports, {
  default: () => U5Bslugu5D,
  load: () => load6
});
async function load6({ fetch: fetch2, page: page2 }) {
  const { slug } = page2.params;
  let res = await fetch2(`/api/blog/${slug}/`, { method: "GET" }).then((data) => data.json());
  console.log(`res before processing: ${JSON.stringify(res, null, 2)}`);
  const { post, pageSEO } = res;
  return { props: { post, pageSEO } };
}
var import_dotenv12, import_prismic_dom10, import_client11, css10, U5Bslugu5D;
var init_slug_27f96c17 = __esm({
  ".svelte-kit/output/server/chunks/[slug]-27f96c17.js"() {
    init_shims();
    init_app_179c3158();
    init_HeadingTag_398fdd7a();
    init_Image_dc935feb();
    init_Stack_702747d3();
    init_constants_193752e4();
    import_dotenv12 = __toModule(require_main());
    import_prismic_dom10 = __toModule(require_prismic_dom_min());
    import_client11 = __toModule(require_client());
    css10 = {
      code: "main.svelte-1evrurg .center{--gutters:var(--s-3);--measure:60ch}main.svelte-1evrurg .cover{padding-top:var(--s1);padding-bottom:var(--s1)}main.svelte-1evrurg ul{list-style:disc;padding-left:45%}main.svelte-1evrurg article > section > .stack{--space:var(--s1)}main.svelte-1evrurg .blog-post-text.svelte-1evrurg>* + *{margin-top:var(--s0)}main.svelte-1evrurg .embedded-media{margin-left:auto;margin-right:auto}",
      map: null
    };
    U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { post } = $$props;
      let { pageSEO } = $$props;
      const globalSEO = getContext(globalSeoData);
      if ($$props.post === void 0 && $$bindings.post && post !== void 0)
        $$bindings.post(post);
      if ($$props.pageSEO === void 0 && $$bindings.pageSEO && pageSEO !== void 0)
        $$bindings.pageSEO(pageSEO);
      $$result.css.add(css10);
      {
        console.log(`pageSEO on blog/[slug].svelte: ${JSON.stringify(pageSEO, null, 2)}`);
      }
      return `${validate_component(BaseSEO, "BaseSEO").$$render($$result, {
        data: { currentPage: pageSEO, global: globalSEO }
      }, {}, {})}
<main class="${"svelte-1evrurg"}">${validate_component(Center, "Center").$$render($$result, {}, {}, {
        default: () => `${validate_component(Article, "Article").$$render($$result, {}, {}, {
          default: () => `${validate_component(Cover, "Cover").$$render($$result, {}, {}, {
            featured: () => `${validate_component(Section, "Section").$$render($$result, { slot: "featured" }, {}, {
              default: () => `${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
                default: () => `${each(post.postSections, (section) => `${section.postBlockLayout === "Text" ? `<div class="${"blog-post-text svelte-1evrurg"}"><!-- HTML_TAG_START -->${section.text}<!-- HTML_TAG_END --></div>` : `${section.postBlockLayout === "Title" ? `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: section.title }, {}, {})}` : `${section.postBlockLayout === "Image" ? `<div class="${"blog-post-image"}">${validate_component(Frame, "Frame").$$render($$result, {}, {}, {
                  default: () => `${validate_component(Image, "Image").$$render($$result, {
                    images: section.image,
                    altText: section.altText
                  }, {}, {})}
                  `
                })}
                </div>` : `${section.postBlockLayout === "Title Image" ? `<div>${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
                  default: () => `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: section.title }, {}, {})}
                    <div class="${"blog-post-image"}">${validate_component(Frame, "Frame").$$render($$result, {}, {}, {
                    default: () => `${validate_component(Image, "Image").$$render($$result, {
                      images: section.image,
                      altText: section.altText
                    }, {}, {})}
                      `
                  })}</div>
                  `
                })}
                </div>` : `${section.postBlockLayout === "Title Image Text" ? `<div>${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
                  default: () => `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: section.title }, {}, {})}
                    <div class="${"blog-post-image"}">${validate_component(Frame, "Frame").$$render($$result, {}, {}, {
                    default: () => `${validate_component(Image, "Image").$$render($$result, {
                      images: section.image,
                      altText: section.altText
                    }, {}, {})}
                      `
                  })}</div>
                    <div class="${"blog-post-text svelte-1evrurg"}"><!-- HTML_TAG_START -->${section.text}<!-- HTML_TAG_END --></div>
                  `
                })}
                </div>` : `${section.postBlockLayout === "Title Text" ? `<div>${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
                  default: () => `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: section.title }, {}, {})}
                    <div class="${"blog-post-text svelte-1evrurg"}"><!-- HTML_TAG_START -->${section.text}<!-- HTML_TAG_END --></div>
                  `
                })}
                </div>` : `${section.postBlockLayout === "Title Text Image" ? `<div>${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
                  default: () => `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: section.title }, {}, {})}
                    <div class="${"blog-post-text svelte-1evrurg"}"><!-- HTML_TAG_START -->${section.text}<!-- HTML_TAG_END --></div>
                    <div class="${"blog-post-image"}">${validate_component(Frame, "Frame").$$render($$result, {}, {}, {
                    default: () => `${validate_component(Image, "Image").$$render($$result, {
                      images: section.image,
                      altText: section.altText
                    }, {}, {})}
                      `
                  })}</div>
                  `
                })}
                </div>` : `${section.postBlockLayout === "Embed Media" ? `<div class="${"embedded-media"}"><!-- HTML_TAG_START -->${section.text}<!-- HTML_TAG_END -->
                </div>` : ``}`}`}`}`}`}`}`}`)}`
              })}`
            })}`,
            header: () => `<div slot="${"header"}">${validate_component(Stack, "Stack").$$render($$result, {}, {}, {
              default: () => `${validate_component(HeadingTag, "HeadingTag").$$render($$result, { message: post.title }, {}, {})}
            <p>${escape(post.subTitle)}</p>`
            })}</div>`
          })}`
        })}`
      })}
</main>`;
    });
  }
});

// .svelte-kit/output/server/chunks/app-179c3158.js
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function writable2(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue2.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
function escape_json_string_in_html(str) {
  return escape$1(str, escape_json_string_in_html_dict, (code) => `\\u${code.toString(16).toUpperCase()}`);
}
function escape_html_attr(str) {
  return '"' + escape$1(str, escape_html_attr_dict, (code) => `&#${code};`) + '"';
}
function escape$1(str, dict, unicode_encoder) {
  let result = "";
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char in dict) {
      result += dict[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += unicode_encoder(code);
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page: page2
}) {
  const css22 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css22.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable2($session);
    const props = {
      stores: {
        page: writable2(null),
        navigating: writable2(null),
        session
      },
      page: page2,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css22).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2 && page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${page2 && page2.path ? try_serialize(page2.path, (error3) => {
      throw new Error(`Failed to serialize page.path: ${error3.message}`);
    }) : null},
						query: new URLSearchParams(${page2 && page2.query ? s$1(page2.query.toString()) : ""}),
						params: ${page2 && page2.params ? try_serialize(page2.params, (error3) => {
      throw new Error(`Failed to serialize page.params: ${error3.message}`);
    }) : null}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url=${escape_html_attr(url)}`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  if (loaded.context) {
    throw new Error('You are returning "context" from a load function. "context" was renamed to "stuff", please adjust your code accordingly.');
  }
  return loaded;
}
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  stuff,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page2, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const prefix = options2.paths.assets || options2.paths.base;
        const filename = (resolved.startsWith(prefix) ? resolved.slice(prefix.length) : resolved).slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page2.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, _receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":"${escape_json_string_in_html(body)}"}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      stuff: { ...stuff }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    stuff: loaded.stuff || stuff,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page: page2,
    node: default_layout,
    $session,
    stuff: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page: page2,
      node: default_error,
      $session,
      stuff: loaded ? loaded.stuff : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page: page2
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {}
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let stuff = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              stuff,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    stuff: node_loaded.stuff,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.stuff) {
          stuff = {
            ...stuff,
            ...loaded.loaded.stuff
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page: page2
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {}
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function compute_slots(slots) {
  const result = {};
  for (const key in slots) {
    result[key] = true;
  }
  return result;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css22) => css22.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
function linkResolver(doc) {
  if (doc.type === "posts_page") {
    return "/" + doc.uid + "/";
  } else if (doc.type === "blog_post") {
    return "/blog/" + doc.uid + "/";
  }
  return "/";
}
function initApi(req, endpoint) {
  return import_client12.default.getApi(endpoint, {
    req
  });
}
function getGlobalLayoutData(api) {
  return api.query([
    import_client12.default.Predicates.at("my.global_content.uid", "global-layout")
  ]);
}
function getHomePageData(api) {
  return api.query([
    import_client12.default.Predicates.at("my.home_page.uid", "home")
  ]);
}
function getAllPostsPageData(api) {
  return api.query([
    import_client12.default.Predicates.at("my.posts_page.uid", "blog")
  ]);
}
function getAllPosts(api) {
  return api.query(import_client12.default.Predicates.at("document.type", "blog_post"), { orderings: "[document.first_publication_date desc]" });
}
function getPost(api, slug) {
  return api.query([
    import_client12.default.Predicates.at("my.blog_post.uid", `${slug}`)
  ]);
}
async function handle({ request, resolve: resolve2 }) {
  request.locals.ctx = {
    endpoint: PRISMIC_API_ENDPOINT,
    linkResolver
  };
  request.locals.DOM = import_prismic_dom11.default;
  const response = await resolve2(request);
  return {
    ...response,
    headers: {
      ...response.headers
    }
  };
}
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-cb515cc3.js",
      css: [assets + "/_app/assets/start-61d1577b.css"],
      js: [assets + "/_app/start-cb515cc3.js", assets + "/_app/chunks/vendor-adb43fae.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "always"
  };
}
async function load_component(file) {
  const { entry, css: css22, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css22.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
var import_dotenv13, import_prismic_dom11, import_client12, __accessCheck, __privateGet, __privateAdd, __privateSet, _map, chars, unsafeChars, reserved, escaped$1, objectProtoOwnPropertyNames, subscriber_queue2, escape_json_string_in_html_dict, escape_html_attr_dict, s$1, s, absolute, ReadOnlyFormData, current_component, escaped, missing_component, on_destroy, css11, Root, base, assets, monthMap, PRISMIC_API_ENDPOINT, user_hooks, template, options, default_settings, d, empty, manifest, get_hooks, module_lookup, metadata_lookup;
var init_app_179c3158 = __esm({
  ".svelte-kit/output/server/chunks/app-179c3158.js"() {
    init_shims();
    import_dotenv13 = __toModule(require_main());
    import_prismic_dom11 = __toModule(require_prismic_dom_min());
    import_client12 = __toModule(require_client());
    __accessCheck = (obj, member, msg) => {
      if (!member.has(obj))
        throw TypeError("Cannot " + msg);
    };
    __privateGet = (obj, member, getter) => {
      __accessCheck(obj, member, "read from private field");
      return getter ? getter.call(obj) : member.get(obj);
    };
    __privateAdd = (obj, member, value) => {
      if (member.has(obj))
        throw TypeError("Cannot add the same private member more than once");
      member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
    };
    __privateSet = (obj, member, value, setter) => {
      __accessCheck(obj, member, "write to private field");
      setter ? setter.call(obj, value) : member.set(obj, value);
      return value;
    };
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
    unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
    reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
    escaped$1 = {
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
    Promise.resolve();
    subscriber_queue2 = [];
    escape_json_string_in_html_dict = {
      '"': '\\"',
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    escape_html_attr_dict = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    s$1 = JSON.stringify;
    s = JSON.stringify;
    absolute = /^([a-z]+:)?\/?\//;
    ReadOnlyFormData = class {
      constructor(map) {
        __privateAdd(this, _map, void 0);
        __privateSet(this, _map, map);
      }
      get(key) {
        const value = __privateGet(this, _map).get(key);
        return value && value[0];
      }
      getAll(key) {
        return __privateGet(this, _map).get(key);
      }
      has(key) {
        return __privateGet(this, _map).has(key);
      }
      *[Symbol.iterator]() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *entries() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *keys() {
        for (const [key] of __privateGet(this, _map))
          yield key;
      }
      *values() {
        for (const [, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield value[i];
          }
        }
      }
    };
    _map = new WeakMap();
    Promise.resolve();
    escaped = {
      '"': "&quot;",
      "'": "&#39;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    missing_component = {
      $$render: () => ""
    };
    css11 = {
      code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
      map: null
    };
    Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { stores } = $$props;
      let { page: page2 } = $$props;
      let { components } = $$props;
      let { props_0 = null } = $$props;
      let { props_1 = null } = $$props;
      let { props_2 = null } = $$props;
      setContext("__svelte__", stores);
      afterUpdate(stores.page.notify);
      if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
        $$bindings.stores(stores);
      if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
        $$bindings.page(page2);
      if ($$props.components === void 0 && $$bindings.components && components !== void 0)
        $$bindings.components(components);
      if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
        $$bindings.props_0(props_0);
      if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
        $$bindings.props_1(props_1);
      if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
        $$bindings.props_2(props_2);
      $$result.css.add(css11);
      {
        stores.page.set(page2);
      }
      return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
        default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
          default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
        })}` : ``}`
      })}

${``}`;
    });
    base = "";
    assets = "";
    monthMap = {
      0: "January",
      1: "February",
      2: "March",
      3: "April",
      4: "May",
      5: "June",
      6: "July",
      7: "August",
      8: "September",
      9: "October",
      10: "November",
      11: "December"
    };
    import_dotenv13.default.config();
    ({ PRISMIC_API_ENDPOINT } = process.env);
    user_hooks = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module",
      handle
    });
    template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<style>\n			html {\n				font-size: calc(1rem + 0.5vw);\n			}\n		</style>\n		<link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png">\n    <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">\n    <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">\n    <link rel="manifest" href="/favicon/site.webmanifest">\n    <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5">\n    <meta name="msapplication-TileColor" content="#da532c">\n    <meta name="theme-color" content="#ffffff">\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
    options = null;
    default_settings = { paths: { "base": "", "assets": "" } };
    d = (s2) => s2.replace(/%23/g, "#").replace(/%3[Bb]/g, ";").replace(/%2[Cc]/g, ",").replace(/%2[Ff]/g, "/").replace(/%3[Ff]/g, "?").replace(/%3[Aa]/g, ":").replace(/%40/g, "@").replace(/%26/g, "&").replace(/%3[Dd]/g, "=").replace(/%2[Bb]/g, "+").replace(/%24/g, "$");
    empty = () => ({});
    manifest = {
      assets: [{ "file": ".DS_Store", "size": 6148, "type": null }, { "file": "favicon/android-chrome-192x192.png", "size": 6212, "type": "image/png" }, { "file": "favicon/android-chrome-512x512.png", "size": 19247, "type": "image/png" }, { "file": "favicon/apple-touch-icon.png", "size": 5764, "type": "image/png" }, { "file": "favicon/browserconfig.xml", "size": 246, "type": "application/xml" }, { "file": "favicon/favicon-16x16.png", "size": 662, "type": "image/png" }, { "file": "favicon/favicon-32x32.png", "size": 1090, "type": "image/png" }, { "file": "favicon/favicon.ico", "size": 15086, "type": "image/vnd.microsoft.icon" }, { "file": "favicon/mstile-150x150.png", "size": 4320, "type": "image/png" }, { "file": "favicon/safari-pinned-tab.svg", "size": 8779, "type": "image/svg+xml" }, { "file": "favicon/site.webmanifest", "size": 426, "type": "application/manifest+json" }, { "file": "favicon.png", "size": 31053, "type": "image/png" }, { "file": "svg/goat.svg", "size": 6376, "type": "image/svg+xml" }, { "file": "svg/icon-email.svg", "size": 387, "type": "image/svg+xml" }, { "file": "svg/icon-github.svg", "size": 791, "type": "image/svg+xml" }, { "file": "svg/icon-linkedin.svg", "size": 416, "type": "image/svg+xml" }, { "file": "svg/icon-stackoverflow.svg", "size": 394, "type": "image/svg+xml" }, { "file": "svg/icon-twitter.svg", "size": 599, "type": "image/svg+xml" }, { "file": "svg/sprite/sprite.svg", "size": 8526, "type": "image/svg+xml" }],
      layout: "src/routes/__layout.svelte",
      error: ".svelte-kit/build/components/error.svelte",
      routes: [
        {
          type: "page",
          pattern: /^\/$/,
          params: empty,
          a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/sitemap\.xml$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_sitemap_xml_34c527c7(), sitemap_xml_34c527c7_exports))
        },
        {
          type: "endpoint",
          pattern: /^\/rss\.xml$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_rss_xml_8d3d5cca(), rss_xml_8d3d5cca_exports))
        },
        {
          type: "page",
          pattern: /^\/blog\/?$/,
          params: empty,
          a: ["src/routes/blog/__layout.reset.svelte", "src/routes/blog/index.svelte"],
          b: []
        },
        {
          type: "page",
          pattern: /^\/blog\/([^/]+?)\/?$/,
          params: (m) => ({ slug: d(m[1]) }),
          a: ["src/routes/blog/__layout.reset.svelte", "src/routes/blog/[slug].svelte"],
          b: []
        },
        {
          type: "endpoint",
          pattern: /^\/api\/layout\/getLayoutData\/?$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_getLayoutData_e02b1b96(), getLayoutData_e02b1b96_exports))
        },
        {
          type: "endpoint",
          pattern: /^\/api\/blog\/getAllPosts\/?$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_getAllPosts_5faa5a35(), getAllPosts_5faa5a35_exports))
        },
        {
          type: "endpoint",
          pattern: /^\/api\/blog\/([^/]+?)\/?$/,
          params: (m) => ({ slug: d(m[1]) }),
          load: () => Promise.resolve().then(() => (init_slug_94607143(), slug_94607143_exports))
        },
        {
          type: "endpoint",
          pattern: /^\/api\/home\/getHomePageData\/?$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_getHomePageData_29a855f5(), getHomePageData_29a855f5_exports))
        }
      ]
    };
    get_hooks = (hooks) => ({
      getSession: hooks.getSession || (() => ({})),
      handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
      handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
      externalFetch: hooks.externalFetch || fetch
    });
    module_lookup = {
      "src/routes/__layout.svelte": () => Promise.resolve().then(() => (init_layout_5aae68d1(), layout_5aae68d1_exports)),
      ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(() => (init_error_b29e0971(), error_b29e0971_exports)),
      "src/routes/index.svelte": () => Promise.resolve().then(() => (init_index_d651b6e2(), index_d651b6e2_exports)),
      "src/routes/blog/__layout.reset.svelte": () => Promise.resolve().then(() => (init_layout_reset_221c4e47(), layout_reset_221c4e47_exports)),
      "src/routes/blog/index.svelte": () => Promise.resolve().then(() => (init_index_a3287ce9(), index_a3287ce9_exports)),
      "src/routes/blog/[slug].svelte": () => Promise.resolve().then(() => (init_slug_27f96c17(), slug_27f96c17_exports))
    };
    metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-59851c83.js", "css": ["assets/pages/__layout.svelte-a626b8e9.css", "assets/Nav.svelte_svelte&type=style&lang-acb3a841.css", "assets/800-db5eb64c.css", "assets/constants-5fcd4b3b.css"], "js": ["pages/__layout.svelte-59851c83.js", "chunks/vendor-adb43fae.js", "chunks/800-ee7e36a4.js", "chunks/constants-36199e4f.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-90b0571f.js", "css": [], "js": ["error.svelte-90b0571f.js", "chunks/vendor-adb43fae.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-a360110b.js", "css": ["assets/pages/index.svelte-d53b7d92.css", "assets/Nav.svelte_svelte&type=style&lang-acb3a841.css", "assets/constants-5fcd4b3b.css", "assets/Image-eef7409f.css"], "js": ["pages/index.svelte-a360110b.js", "chunks/vendor-adb43fae.js", "chunks/HeadingTag-5eb4f305.js", "chunks/constants-36199e4f.js", "chunks/Image-6b1b0ed5.js", "chunks/Stack-a9cb16a1.js", "chunks/Nav-d7e3989e.js"], "styles": [] }, "src/routes/blog/__layout.reset.svelte": { "entry": "pages/blog/__layout.reset.svelte-7b2675dc.js", "css": ["assets/pages/blog/__layout.reset.svelte-48fbb00c.css", "assets/Nav.svelte_svelte&type=style&lang-acb3a841.css", "assets/800-db5eb64c.css", "assets/constants-5fcd4b3b.css"], "js": ["pages/blog/__layout.reset.svelte-7b2675dc.js", "chunks/vendor-adb43fae.js", "chunks/800-ee7e36a4.js", "chunks/constants-36199e4f.js", "chunks/Nav-d7e3989e.js", "chunks/Stack-a9cb16a1.js"], "styles": [] }, "src/routes/blog/index.svelte": { "entry": "pages/blog/index.svelte-e5a9a181.js", "css": ["assets/pages/blog/index.svelte-81b66cb4.css", "assets/constants-5fcd4b3b.css"], "js": ["pages/blog/index.svelte-e5a9a181.js", "chunks/vendor-adb43fae.js", "chunks/HeadingTag-5eb4f305.js", "chunks/constants-36199e4f.js", "chunks/Stack-a9cb16a1.js"], "styles": [] }, "src/routes/blog/[slug].svelte": { "entry": "pages/blog/[slug].svelte-4b773606.js", "css": ["assets/pages/blog/[slug].svelte-f704ecc4.css", "assets/constants-5fcd4b3b.css", "assets/Image-eef7409f.css"], "js": ["pages/blog/[slug].svelte-4b773606.js", "chunks/vendor-adb43fae.js", "chunks/HeadingTag-5eb4f305.js", "chunks/constants-36199e4f.js", "chunks/Image-6b1b0ed5.js", "chunks/Stack-a9cb16a1.js"], "styles": [] } };
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h = req.headers;
    if (!h["content-type"]) {
      return fulfil(null);
    }
    req.on("error", reject);
    const length = Number(h["content-length"]);
    if (isNaN(length) && h["transfer-encoding"] == null) {
      return fulfil(null);
    }
    let data = new Uint8Array(length || 0);
    if (length > 0) {
      let offset = 0;
      req.on("data", (chunk) => {
        const new_len = offset + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data.set(chunk, offset);
        offset = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data.length + chunk.length);
        new_data.set(data, 0);
        new_data.set(chunk, data.length);
        data = new_data;
      });
    }
    req.on("end", () => {
      fulfil(data);
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();
init_app_179c3158();
var import_dotenv14 = __toModule(require_main());
var import_prismic_dom12 = __toModule(require_prismic_dom_min());
var import_client13 = __toModule(require_client());

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
