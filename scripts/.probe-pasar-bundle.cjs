var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/convex/dist/cjs/values/base64.js
var require_base64 = __commonJS({
  "node_modules/convex/dist/cjs/values/base64.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var base64_exports = {};
    __export2(base64_exports, {
      byteLength: () => byteLength,
      fromByteArray: () => fromByteArray,
      fromByteArrayUrlSafeNoPadding: () => fromByteArrayUrlSafeNoPadding,
      toByteArray: () => toByteArray
    });
    module2.exports = __toCommonJS2(base64_exports);
    var lookup = [];
    var revLookup = [];
    var Arr = Uint8Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1)
        validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(_b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(
          encodeChunk(
            uint8,
            i2,
            i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength
          )
        );
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
    function fromByteArrayUrlSafeNoPadding(uint8) {
      return fromByteArray(uint8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    }
  }
});

// node_modules/convex/dist/cjs/common/index.js
var require_common = __commonJS({
  "node_modules/convex/dist/cjs/common/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var common_exports = {};
    __export2(common_exports, {
      isSimpleObject: () => isSimpleObject,
      parseArgs: () => parseArgs,
      validateDeploymentUrl: () => validateDeploymentUrl
    });
    module2.exports = __toCommonJS2(common_exports);
    function parseArgs(args) {
      if (args === void 0) {
        return {};
      }
      if (!isSimpleObject(args)) {
        throw new Error(
          `The arguments to a Convex function must be an object. Received: ${args}`
        );
      }
      return args;
    }
    function validateDeploymentUrl(deploymentUrl) {
      if (typeof deploymentUrl === "undefined") {
        throw new Error(
          `Client created with undefined deployment address. If you used an environment variable, check that it's set.`
        );
      }
      if (typeof deploymentUrl !== "string") {
        throw new Error(
          `Invalid deployment address: found ${deploymentUrl}".`
        );
      }
      if (!(deploymentUrl.startsWith("http:") || deploymentUrl.startsWith("https:"))) {
        throw new Error(
          `Invalid deployment address: Must start with "https://" or "http://". Found "${deploymentUrl}".`
        );
      }
      try {
        new URL(deploymentUrl);
      } catch {
        throw new Error(
          `Invalid deployment address: "${deploymentUrl}" is not a valid URL. If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`
        );
      }
      if (deploymentUrl.endsWith(".convex.site")) {
        throw new Error(
          `Invalid deployment address: "${deploymentUrl}" ends with .convex.site, which is used for HTTP Actions. Convex deployment URLs typically end with .convex.cloud? If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`
        );
      }
    }
    function isSimpleObject(value) {
      const isObject = typeof value === "object";
      const prototype = Object.getPrototypeOf(value);
      const isSimple = prototype === null || prototype === Object.prototype || // Objects generated from other contexts (e.g. across Node.js `vm` modules) will not satisfy the previous
      // conditions but are still simple objects.
      prototype?.constructor?.name === "Object";
      return isObject && isSimple;
    }
  }
});

// node_modules/convex/dist/cjs/values/value.js
var require_value = __commonJS({
  "node_modules/convex/dist/cjs/values/value.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var value_exports = {};
    __export2(value_exports, {
      CommitTsPlaceholder: () => CommitTsPlaceholder,
      MAX_INT64: () => MAX_INT64,
      base64ToBigInt: () => base64ToBigInt,
      bigIntToBase64: () => bigIntToBase64,
      commitTsPlaceholder: () => commitTsPlaceholder,
      convexOrUndefinedToJson: () => convexOrUndefinedToJson,
      convexToJson: () => convexToJson,
      jsonToConvex: () => jsonToConvex,
      modernBase64ToBigInt: () => modernBase64ToBigInt,
      modernBigIntToBase64: () => modernBigIntToBase64,
      patchValueToJson: () => patchValueToJson,
      slowBase64ToBigInt: () => slowBase64ToBigInt,
      slowBigIntToBase64: () => slowBigIntToBase64,
      stringifyValueForError: () => stringifyValueForError
    });
    module2.exports = __toCommonJS2(value_exports);
    var Base64 = __toESM2(require_base64(), 1);
    var import_common = require_common();
    var LITTLE_ENDIAN = true;
    var MIN_INT64 = BigInt("-9223372036854775808");
    var MAX_INT64 = BigInt("9223372036854775807");
    var ZERO = BigInt("0");
    var EIGHT = BigInt("8");
    var TWOFIFTYSIX = BigInt("256");
    var COMMIT_TS_UNRESOLVED = "This commit timestamp is unresolved: its value is assigned when the mutation commits. Read the document after the mutation completes to get its value.";
    var CommitTsPlaceholder = class {
      [Symbol.toPrimitive](hint) {
        if (hint === "string") {
          return this.toString();
        }
        throw new Error(COMMIT_TS_UNRESOLVED);
      }
      valueOf() {
        throw new Error(COMMIT_TS_UNRESOLVED);
      }
      toJSON() {
        throw new Error(COMMIT_TS_UNRESOLVED);
      }
      toString() {
        return "[unresolved commit timestamp]";
      }
    };
    var commitTsPlaceholder = new CommitTsPlaceholder();
    function isSpecial(n) {
      return Number.isNaN(n) || !Number.isFinite(n) || Object.is(n, -0);
    }
    function slowBigIntToBase64(value) {
      if (value < ZERO) {
        value -= MIN_INT64 + MIN_INT64;
      }
      let hex = value.toString(16);
      if (hex.length % 2 === 1)
        hex = "0" + hex;
      const bytes = new Uint8Array(new ArrayBuffer(8));
      let i = 0;
      for (const hexByte of hex.match(/.{2}/g).reverse()) {
        bytes.set([parseInt(hexByte, 16)], i++);
        value >>= EIGHT;
      }
      return Base64.fromByteArray(bytes);
    }
    function slowBase64ToBigInt(encoded) {
      const integerBytes = Base64.toByteArray(encoded);
      if (integerBytes.byteLength !== 8) {
        throw new Error(
          `Received ${integerBytes.byteLength} bytes, expected 8 for $integer`
        );
      }
      let value = ZERO;
      let power = ZERO;
      for (const byte of integerBytes) {
        value += BigInt(byte) * TWOFIFTYSIX ** power;
        power++;
      }
      if (value > MAX_INT64) {
        value += MIN_INT64 + MIN_INT64;
      }
      return value;
    }
    function modernBigIntToBase64(value) {
      if (value < MIN_INT64 || MAX_INT64 < value) {
        throw new Error(
          `BigInt ${value} does not fit into a 64-bit signed integer.`
        );
      }
      const buffer = new ArrayBuffer(8);
      new DataView(buffer).setBigInt64(0, value, true);
      return Base64.fromByteArray(new Uint8Array(buffer));
    }
    function modernBase64ToBigInt(encoded) {
      const integerBytes = Base64.toByteArray(encoded);
      if (integerBytes.byteLength !== 8) {
        throw new Error(
          `Received ${integerBytes.byteLength} bytes, expected 8 for $integer`
        );
      }
      const intBytesView = new DataView(integerBytes.buffer);
      return intBytesView.getBigInt64(0, true);
    }
    var bigIntToBase64 = DataView.prototype.setBigInt64 ? modernBigIntToBase64 : slowBigIntToBase64;
    var base64ToBigInt = DataView.prototype.getBigInt64 ? modernBase64ToBigInt : slowBase64ToBigInt;
    var MAX_IDENTIFIER_LEN = 1024;
    function validateObjectField(k) {
      if (k.length > MAX_IDENTIFIER_LEN) {
        throw new Error(
          `Field name ${k} exceeds maximum field name length ${MAX_IDENTIFIER_LEN}.`
        );
      }
      if (k.startsWith("$")) {
        throw new Error(`Field name ${k} starts with a '$', which is reserved.`);
      }
      for (let i = 0; i < k.length; i += 1) {
        const charCode = k.charCodeAt(i);
        if (charCode < 32 || charCode >= 127) {
          throw new Error(
            `Field name ${k} has invalid character '${k[i]}': Field names can only contain non-control ASCII characters`
          );
        }
      }
    }
    function jsonToConvex(value) {
      if (value === null) {
        return value;
      }
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map((value2) => jsonToConvex(value2));
      }
      if (typeof value !== "object") {
        throw new Error(`Unexpected type of ${value}`);
      }
      const entries = Object.entries(value);
      if (entries.length === 1) {
        const key = entries[0][0];
        if (key === "$bytes") {
          if (typeof value.$bytes !== "string") {
            throw new Error(`Malformed $bytes field on ${value}`);
          }
          return Base64.toByteArray(value.$bytes).buffer;
        }
        if (key === "$integer") {
          if (typeof value.$integer !== "string") {
            throw new Error(`Malformed $integer field on ${value}`);
          }
          return base64ToBigInt(value.$integer);
        }
        if (key === "$float") {
          if (typeof value.$float !== "string") {
            throw new Error(`Malformed $float field on ${value}`);
          }
          const floatBytes = Base64.toByteArray(value.$float);
          if (floatBytes.byteLength !== 8) {
            throw new Error(
              `Received ${floatBytes.byteLength} bytes, expected 8 for $float`
            );
          }
          const floatBytesView = new DataView(floatBytes.buffer);
          const float = floatBytesView.getFloat64(0, LITTLE_ENDIAN);
          if (!isSpecial(float)) {
            throw new Error(`Float ${float} should be encoded as a number`);
          }
          return float;
        }
        if (key === "$commitTs") {
          if (value.$commitTs !== null) {
            throw new Error(`Malformed $commitTs field on ${value}`);
          }
          return commitTsPlaceholder;
        }
        if (key === "$set") {
          throw new Error(
            `Received a Set which is no longer supported as a Convex type.`
          );
        }
        if (key === "$map") {
          throw new Error(
            `Received a Map which is no longer supported as a Convex type.`
          );
        }
      }
      const out = {};
      for (const [k, v3] of Object.entries(value)) {
        validateObjectField(k);
        out[k] = jsonToConvex(v3);
      }
      return out;
    }
    var MAX_VALUE_FOR_ERROR_LEN = 16384;
    function stringifyValueForError(value) {
      const str = JSON.stringify(value, (_key, value2) => {
        if (value2 === void 0) {
          return "undefined";
        }
        if (typeof value2 === "bigint") {
          return `${value2.toString()}n`;
        }
        return value2;
      });
      if (str.length > MAX_VALUE_FOR_ERROR_LEN) {
        const rest = "[...truncated]";
        let truncateAt = MAX_VALUE_FOR_ERROR_LEN - rest.length;
        const codePoint = str.codePointAt(truncateAt - 1);
        if (codePoint !== void 0 && codePoint > 65535) {
          truncateAt -= 1;
        }
        return str.substring(0, truncateAt) + rest;
      }
      return str;
    }
    function convexToJsonInternal(value, originalValue, context, includeTopLevelUndefined) {
      if (value === void 0) {
        const contextText = context && ` (present at path ${context} in original object ${stringifyValueForError(
          originalValue
        )})`;
        throw new Error(
          `undefined is not a valid Convex value${contextText}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`
        );
      }
      if (value === null) {
        return value;
      }
      if (typeof value === "bigint") {
        if (value < MIN_INT64 || MAX_INT64 < value) {
          throw new Error(
            `BigInt ${value} does not fit into a 64-bit signed integer.`
          );
        }
        return { $integer: bigIntToBase64(value) };
      }
      if (typeof value === "number") {
        if (isSpecial(value)) {
          const buffer = new ArrayBuffer(8);
          new DataView(buffer).setFloat64(0, value, LITTLE_ENDIAN);
          return { $float: Base64.fromByteArray(new Uint8Array(buffer)) };
        } else {
          return value;
        }
      }
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "string") {
        return value;
      }
      if (value instanceof ArrayBuffer) {
        return { $bytes: Base64.fromByteArray(new Uint8Array(value)) };
      }
      if (value instanceof CommitTsPlaceholder) {
        return { $commitTs: null };
      }
      if (Array.isArray(value)) {
        return value.map(
          (value2, i) => convexToJsonInternal(value2, originalValue, context + `[${i}]`, false)
        );
      }
      if (value instanceof Set) {
        throw new Error(
          errorMessageForUnsupportedType(context, "Set", [...value], originalValue)
        );
      }
      if (value instanceof Map) {
        throw new Error(
          errorMessageForUnsupportedType(context, "Map", [...value], originalValue)
        );
      }
      if (!(0, import_common.isSimpleObject)(value)) {
        const theType = value?.constructor?.name;
        const typeName = theType ? `${theType} ` : "";
        throw new Error(
          errorMessageForUnsupportedType(context, typeName, value, originalValue)
        );
      }
      const out = {};
      const entries = Object.entries(value);
      entries.sort(([k1, _v1], [k2, _v2]) => k1 === k2 ? 0 : k1 < k2 ? -1 : 1);
      for (const [k, v3] of entries) {
        if (v3 !== void 0) {
          validateObjectField(k);
          out[k] = convexToJsonInternal(v3, originalValue, context + `.${k}`, false);
        } else if (includeTopLevelUndefined) {
          validateObjectField(k);
          out[k] = convexOrUndefinedToJsonInternal(
            v3,
            originalValue,
            context + `.${k}`
          );
        }
      }
      return out;
    }
    function errorMessageForUnsupportedType(context, typeName, value, originalValue) {
      if (context) {
        return `${typeName}${stringifyValueForError(
          value
        )} is not a supported Convex type (present at path ${context} in original object ${stringifyValueForError(
          originalValue
        )}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.`;
      } else {
        return `${typeName}${stringifyValueForError(
          value
        )} is not a supported Convex type.`;
      }
    }
    function convexOrUndefinedToJsonInternal(value, originalValue, context) {
      if (value === void 0) {
        return { $undefined: null };
      } else {
        if (originalValue === void 0) {
          throw new Error(
            `Programming error. Current value is ${stringifyValueForError(
              value
            )} but original value is undefined`
          );
        }
        return convexToJsonInternal(value, originalValue, context, false);
      }
    }
    function convexToJson(value) {
      return convexToJsonInternal(value, value, "", false);
    }
    function convexOrUndefinedToJson(value) {
      return convexOrUndefinedToJsonInternal(value, value, "");
    }
    function patchValueToJson(value) {
      return convexToJsonInternal(value, value, "", true);
    }
  }
});

// node_modules/convex/dist/cjs/values/validators.js
var require_validators = __commonJS({
  "node_modules/convex/dist/cjs/values/validators.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var validators_exports = {};
    __export2(validators_exports, {
      VAny: () => VAny,
      VArray: () => VArray,
      VBoolean: () => VBoolean,
      VBytes: () => VBytes,
      VCommitTs: () => VCommitTs,
      VFloat64: () => VFloat64,
      VId: () => VId,
      VInt64: () => VInt64,
      VLiteral: () => VLiteral,
      VNull: () => VNull,
      VObject: () => VObject,
      VRecord: () => VRecord,
      VString: () => VString,
      VUnion: () => VUnion
    });
    module2.exports = __toCommonJS2(validators_exports);
    var import_value = require_value();
    var UNDEFINED_VALIDATOR_ERROR_URL = "https://docs.convex.dev/error#undefined-validator";
    function throwUndefinedValidatorError(context, fieldName) {
      const fieldInfo = fieldName !== void 0 ? ` for field "${fieldName}"` : "";
      throw new Error(
        `A validator is undefined${fieldInfo} in ${context}. This is often caused by circular imports. See ${UNDEFINED_VALIDATOR_ERROR_URL} for details.`
      );
    }
    var BaseValidator = class {
      constructor({ isOptional }) {
        __publicField(this, "type");
        __publicField(this, "fieldPaths");
        __publicField(this, "isOptional");
        __publicField(this, "isConvexValidator");
        this.isOptional = isOptional;
        this.isConvexValidator = true;
      }
    };
    var VId = class _VId extends BaseValidator {
      /**
       * Usually you'd use `v.id(tableName)` instead.
       */
      constructor({
        isOptional,
        tableName
      }) {
        super({ isOptional });
        __publicField(this, "tableName");
        __publicField(this, "kind", "id");
        if (typeof tableName !== "string") {
          throw new Error("v.id(tableName) requires a string");
        }
        this.tableName = tableName;
      }
      /** @internal */
      get json() {
        return { type: "id", tableName: this.tableName };
      }
      /** @internal */
      asOptional() {
        return new _VId({
          isOptional: "optional",
          tableName: this.tableName
        });
      }
    };
    var VFloat64 = class _VFloat64 extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "float64");
      }
      /** @internal */
      get json() {
        return { type: "number" };
      }
      /** @internal */
      asOptional() {
        return new _VFloat64({
          isOptional: "optional"
        });
      }
    };
    var VInt64 = class _VInt64 extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "int64");
      }
      /** @internal */
      get json() {
        return { type: "bigint" };
      }
      /** @internal */
      asOptional() {
        return new _VInt64({ isOptional: "optional" });
      }
    };
    var VCommitTs = class _VCommitTs extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "commitTs");
      }
      /** @internal */
      get json() {
        return { type: this.kind };
      }
      /** @internal */
      asOptional() {
        return new _VCommitTs({
          isOptional: "optional"
        });
      }
    };
    var VBoolean = class _VBoolean extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "boolean");
      }
      /** @internal */
      get json() {
        return { type: this.kind };
      }
      /** @internal */
      asOptional() {
        return new _VBoolean({
          isOptional: "optional"
        });
      }
    };
    var VBytes = class _VBytes extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "bytes");
      }
      /** @internal */
      get json() {
        return { type: this.kind };
      }
      /** @internal */
      asOptional() {
        return new _VBytes({ isOptional: "optional" });
      }
    };
    var VString = class _VString extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "string");
      }
      /** @internal */
      get json() {
        return { type: this.kind };
      }
      /** @internal */
      asOptional() {
        return new _VString({
          isOptional: "optional"
        });
      }
    };
    var VNull = class _VNull extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "null");
      }
      /** @internal */
      get json() {
        return { type: this.kind };
      }
      /** @internal */
      asOptional() {
        return new _VNull({ isOptional: "optional" });
      }
    };
    var VAny = class _VAny extends BaseValidator {
      constructor() {
        super(...arguments);
        __publicField(this, "kind", "any");
      }
      /** @internal */
      get json() {
        return {
          type: this.kind
        };
      }
      /** @internal */
      asOptional() {
        return new _VAny({
          isOptional: "optional"
        });
      }
    };
    var VObject = class _VObject extends BaseValidator {
      /**
       * Usually you'd use `v.object({ ... })` instead.
       */
      constructor({
        isOptional,
        fields
      }) {
        super({ isOptional });
        __publicField(this, "fields");
        __publicField(this, "kind", "object");
        globalThis.Object.entries(fields).forEach(([fieldName, validator]) => {
          if (validator === void 0) {
            throwUndefinedValidatorError("v.object()", fieldName);
          }
          if (!validator.isConvexValidator) {
            throw new Error("v.object() entries must be validators");
          }
        });
        this.fields = fields;
      }
      /** @internal */
      get json() {
        return {
          type: this.kind,
          value: globalThis.Object.fromEntries(
            globalThis.Object.entries(this.fields).map(([k, v3]) => [
              k,
              {
                fieldType: v3.json,
                optional: v3.isOptional === "optional" ? true : false
              }
            ])
          )
        };
      }
      /** @internal */
      asOptional() {
        return new _VObject({
          isOptional: "optional",
          fields: this.fields
        });
      }
      /**
       * Create a new VObject with the specified fields omitted.
       * @param fields The field names to omit from this VObject.
       */
      omit(...fields) {
        const newFields = { ...this.fields };
        for (const field of fields) {
          delete newFields[field];
        }
        return new _VObject({
          isOptional: this.isOptional,
          fields: newFields
        });
      }
      /**
       * Create a new VObject with only the specified fields.
       * @param fields The field names to pick from this VObject.
       */
      pick(...fields) {
        const newFields = {};
        for (const field of fields) {
          newFields[field] = this.fields[field];
        }
        return new _VObject({
          isOptional: this.isOptional,
          fields: newFields
        });
      }
      /**
       * Create a new VObject with all fields marked as optional.
       */
      partial() {
        const newFields = {};
        for (const [key, validator] of globalThis.Object.entries(this.fields)) {
          newFields[key] = validator.asOptional();
        }
        return new _VObject({
          isOptional: this.isOptional,
          fields: newFields
        });
      }
      /**
       * Create a new VObject with additional fields merged in.
       * @param fields An object with additional validators to merge into this VObject.
       */
      extend(fields) {
        return new _VObject({
          isOptional: this.isOptional,
          fields: { ...this.fields, ...fields }
        });
      }
    };
    var VLiteral = class _VLiteral extends BaseValidator {
      /**
       * Usually you'd use `v.literal(value)` instead.
       */
      constructor({ isOptional, value }) {
        super({ isOptional });
        __publicField(this, "value");
        __publicField(this, "kind", "literal");
        if (typeof value !== "string" && typeof value !== "boolean" && typeof value !== "number" && typeof value !== "bigint") {
          throw new Error("v.literal(value) must be a string, number, or boolean");
        }
        this.value = value;
      }
      /** @internal */
      get json() {
        return {
          type: this.kind,
          value: (0, import_value.convexToJson)(this.value)
        };
      }
      /** @internal */
      asOptional() {
        return new _VLiteral({
          isOptional: "optional",
          value: this.value
        });
      }
    };
    var VArray = class _VArray extends BaseValidator {
      /**
       * Usually you'd use `v.array(element)` instead.
       */
      constructor({
        isOptional,
        element
      }) {
        super({ isOptional });
        __publicField(this, "element");
        __publicField(this, "kind", "array");
        if (element === void 0) {
          throwUndefinedValidatorError("v.array()");
        }
        this.element = element;
      }
      /** @internal */
      get json() {
        return {
          type: this.kind,
          value: this.element.json
        };
      }
      /** @internal */
      asOptional() {
        return new _VArray({
          isOptional: "optional",
          element: this.element
        });
      }
    };
    var VRecord = class _VRecord extends BaseValidator {
      /**
       * Usually you'd use `v.record(key, value)` instead.
       */
      constructor({
        isOptional,
        key,
        value
      }) {
        super({ isOptional });
        __publicField(this, "key");
        __publicField(this, "value");
        __publicField(this, "kind", "record");
        if (key === void 0) {
          throwUndefinedValidatorError("v.record()", "key");
        }
        if (value === void 0) {
          throwUndefinedValidatorError("v.record()", "value");
        }
        if (key.isOptional === "optional") {
          throw new Error("Record validator cannot have optional keys");
        }
        if (value.isOptional === "optional") {
          throw new Error("Record validator cannot have optional values");
        }
        if (!key.isConvexValidator || !value.isConvexValidator) {
          throw new Error("Key and value of v.record() but be validators");
        }
        this.key = key;
        this.value = value;
      }
      /** @internal */
      get json() {
        return {
          type: this.kind,
          // This cast is needed because TypeScript thinks the key type is too wide
          keys: this.key.json,
          values: {
            fieldType: this.value.json,
            optional: false
          }
        };
      }
      /** @internal */
      asOptional() {
        return new _VRecord({
          isOptional: "optional",
          key: this.key,
          value: this.value
        });
      }
    };
    var VUnion = class _VUnion extends BaseValidator {
      /**
       * Usually you'd use `v.union(...members)` instead.
       */
      constructor({ isOptional, members }) {
        super({ isOptional });
        __publicField(this, "members");
        __publicField(this, "kind", "union");
        members.forEach((member, index) => {
          if (member === void 0) {
            throwUndefinedValidatorError("v.union()", `member at index ${index}`);
          }
          if (!member.isConvexValidator) {
            throw new Error("All members of v.union() must be validators");
          }
        });
        this.members = members;
      }
      /** @internal */
      get json() {
        return {
          type: this.kind,
          value: this.members.map((v3) => v3.json)
        };
      }
      /** @internal */
      asOptional() {
        return new _VUnion({
          isOptional: "optional",
          members: this.members
        });
      }
    };
  }
});

// node_modules/convex/dist/cjs/values/validator.js
var require_validator = __commonJS({
  "node_modules/convex/dist/cjs/values/validator.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var validator_exports = {};
    __export2(validator_exports, {
      asObjectValidator: () => asObjectValidator,
      isValidator: () => isValidator,
      v: () => v3
    });
    module2.exports = __toCommonJS2(validator_exports);
    var import_validators = require_validators();
    function isValidator(v22) {
      return !!v22.isConvexValidator;
    }
    function asObjectValidator(obj) {
      if (isValidator(obj)) {
        return obj;
      } else {
        return v3.object(obj);
      }
    }
    var v3 = {
      /**
       * Validates that the value is a document ID for the given table.
       *
       * IDs are strings at runtime but are typed as `Id<"tableName">` in
       * TypeScript for type safety.
       *
       * @example
       * ```typescript
       * args: { userId: v.id("users") }
       * ```
       *
       * @param tableName The name of the table.
       */
      id: (tableName) => {
        return new import_validators.VId({
          isOptional: "required",
          tableName
        });
      },
      /**
       * Validates that the value is `null`.
       *
       * Use `returns: v.null()` for functions that don't return a meaningful value.
       * JavaScript `undefined` is not a valid Convex value, it is automatically
       * converted to `null`.
       */
      null: () => {
        return new import_validators.VNull({ isOptional: "required" });
      },
      /**
       * Validates that the value is a JavaScript `number` (Convex Float64).
       *
       * Supports all IEEE-754 double-precision floating point numbers including
       * NaN and Infinity.
       *
       * Alias for `v.float64()`.
       */
      number: () => {
        return new import_validators.VFloat64({ isOptional: "required" });
      },
      /**
       * Validates that the value is a JavaScript `number` (Convex Float64).
       *
       * Supports all IEEE-754 double-precision floating point numbers.
       */
      float64: () => {
        return new import_validators.VFloat64({ isOptional: "required" });
      },
      /**
       * @deprecated Use `v.int64()` instead.
       */
      bigint: () => {
        return new import_validators.VInt64({ isOptional: "required" });
      },
      /**
       * Validates that the value is a JavaScript `bigint` (Convex Int64).
       *
       * Supports BigInts between -2^63 and 2^63-1.
       *
       * @example
       * ```typescript
       * args: { timestamp: v.int64() }
       * // Usage: createDoc({ timestamp: 1234567890n })
       * ```
       */
      int64: () => {
        return new import_validators.VInt64({ isOptional: "required" });
      },
      /**
       * Validates that the value is a commit timestamp: an int64 (`bigint`)
       * assigned from the transaction's commit timestamp.
       *
       * An index on a field with this validator orders documents by commit order.
       * Accepts any int64 value; write `db.vars.commitTs` to have the field
       * resolve to the commit timestamp when the mutation commits.
       */
      commitTs: () => {
        return new import_validators.VCommitTs({ isOptional: "required" });
      },
      /**
       * Validates that the value is a `boolean`.
       */
      boolean: () => {
        return new import_validators.VBoolean({ isOptional: "required" });
      },
      /**
       * Validates that the value is a `string`.
       *
       * Strings are stored as UTF-8 and their storage size is calculated as their
       * UTF-8 encoded size.
       */
      string: () => {
        return new import_validators.VString({ isOptional: "required" });
      },
      /**
       * Validates that the value is an `ArrayBuffer` (Convex Bytes).
       *
       * Use for binary data.
       */
      bytes: () => {
        return new import_validators.VBytes({ isOptional: "required" });
      },
      /**
       * Validates that the value is exactly equal to the given literal.
       *
       * Useful for discriminated unions and enum-like patterns.
       *
       * @example
       * ```typescript
       * // Discriminated union pattern:
       * v.union(
       *   v.object({ kind: v.literal("error"), message: v.string() }),
       *   v.object({ kind: v.literal("success"), value: v.number() }),
       * )
       * ```
       *
       * @param literal The literal value to compare against.
       */
      literal: (literal) => {
        return new import_validators.VLiteral({ isOptional: "required", value: literal });
      },
      /**
       * Validates that the value is an `Array` where every element matches the
       * given validator.
       *
       * Arrays can have at most 8192 elements.
       *
       * @example
       * ```typescript
       * args: { tags: v.array(v.string()) }
       * args: { coordinates: v.array(v.number()) }
       * args: { items: v.array(v.object({ name: v.string(), qty: v.number() })) }
       * ```
       *
       * @param element The validator for the elements of the array.
       */
      array: (element) => {
        return new import_validators.VArray({ isOptional: "required", element });
      },
      /**
       * Validates that the value is an `Object` with the specified properties.
       *
       * Objects can have at most 1024 entries. Field names must be non-empty and
       * must not start with `"$"` or `"_"` (`_` is reserved for system fields
       * like `_id` and `_creationTime`; `$` is reserved for Convex internal use).
       *
       * @example
       * ```typescript
       * args: {
       *   user: v.object({
       *     name: v.string(),
       *     email: v.string(),
       *     age: v.optional(v.number()),
       *   })
       * }
       * ```
       *
       * @param fields An object mapping property names to their validators.
       */
      object: (fields) => {
        return new import_validators.VObject({ isOptional: "required", fields });
      },
      /**
       * Validates that the value is a `Record` (object with dynamic keys).
       *
       * Records are objects at runtime but allow dynamic keys, unlike `v.object()`
       * which requires known property names. Keys must be ASCII characters only,
       * non-empty, and not start with `"$"` or `"_"`.
       *
       * @example
       * ```typescript
       * // Map of user IDs to scores:
       * args: { scores: v.record(v.id("users"), v.number()) }
       *
       * // Map of string keys to string values:
       * args: { metadata: v.record(v.string(), v.string()) }
       * ```
       *
       * @param keys The validator for the keys of the record.
       * @param values The validator for the values of the record.
       */
      record: (keys, values) => {
        return new import_validators.VRecord({
          isOptional: "required",
          key: keys,
          value: values
        });
      },
      /**
       * Validates that the value matches at least one of the given validators.
       *
       * @example
       * ```typescript
       * // Allow string or number:
       * args: { value: v.union(v.string(), v.number()) }
       *
       * // Discriminated union (recommended pattern):
       * v.union(
       *   v.object({ kind: v.literal("text"), body: v.string() }),
       *   v.object({ kind: v.literal("image"), url: v.string() }),
       * )
       *
       * // Nullable value:
       * returns: v.union(v.object({ ... }), v.null())
       * ```
       *
       * @param members The validators to match against.
       */
      union: (...members) => {
        return new import_validators.VUnion({
          isOptional: "required",
          members
        });
      },
      /**
       * A validator that accepts any Convex value without validation.
       *
       * Prefer using specific validators when possible for better type safety
       * and runtime validation.
       */
      any: () => {
        return new import_validators.VAny({ isOptional: "required" });
      },
      /**
       * Makes a property optional in an object validator.
       *
       * An optional property can be omitted entirely when creating a document or
       * calling a function. This is different from `v.nullable()` which requires
       * the property to be present but allows `null`.
       *
       * @example
       * ```typescript
       * v.object({
       *   name: v.string(),              // required
       *   nickname: v.optional(v.string()), // can be omitted
       * })
       *
       * // Valid: { name: "Alice" }
       * // Valid: { name: "Alice", nickname: "Ali" }
       * // Invalid: { name: "Alice", nickname: null }  - use v.nullable() for this
       * ```
       *
       * @param value The property value validator to make optional.
       */
      optional: (value) => {
        return value.asOptional();
      },
      /**
       * Allows a value to be either the given type or `null`.
       *
       * This is shorthand for `v.union(value, v.null())`. Unlike `v.optional()`,
       * the property must still be present, but may be `null`.
       *
       * @example
       * ```typescript
       * v.object({
       *   name: v.string(),
       *   deletedAt: v.nullable(v.number()), // must be present, can be null
       * })
       *
       * // Valid: { name: "Alice", deletedAt: null }
       * // Valid: { name: "Alice", deletedAt: 1234567890 }
       * // Invalid: { name: "Alice" }  - deletedAt is required
       * ```
       */
      nullable: (value) => {
        return v3.union(value, v3.null());
      }
    };
  }
});

// node_modules/convex/dist/cjs/values/errors.js
var require_errors = __commonJS({
  "node_modules/convex/dist/cjs/values/errors.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var errors_exports = {};
    __export2(errors_exports, {
      ConvexError: () => ConvexError2
    });
    module2.exports = __toCommonJS2(errors_exports);
    var import_value = require_value();
    var _a;
    var _b;
    var IDENTIFYING_FIELD = Symbol.for("ConvexError");
    var ConvexError2 = class extends (_b = Error, _a = IDENTIFYING_FIELD, _b) {
      constructor(data) {
        super(typeof data === "string" ? data : (0, import_value.stringifyValueForError)(data));
        __publicField(this, "name", "ConvexError");
        __publicField(this, "data");
        __publicField(this, _a, true);
        this.data = data;
      }
    };
  }
});

// node_modules/convex/dist/cjs/values/compare_utf8.js
var require_compare_utf8 = __commonJS({
  "node_modules/convex/dist/cjs/values/compare_utf8.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var compare_utf8_exports = {};
    __export2(compare_utf8_exports, {
      compareUTF8: () => compareUTF8,
      greaterThan: () => greaterThan,
      greaterThanEq: () => greaterThanEq,
      lessThan: () => lessThan,
      lessThanEq: () => lessThanEq,
      utf16LengthForCodePoint: () => utf16LengthForCodePoint
    });
    module2.exports = __toCommonJS2(compare_utf8_exports);
    function compareUTF8(a, b) {
      const aLength = a.length;
      const bLength = b.length;
      const length = Math.min(aLength, bLength);
      for (let i = 0; i < length; ) {
        const aCodePoint = a.codePointAt(i);
        const bCodePoint = b.codePointAt(i);
        if (aCodePoint !== bCodePoint) {
          if (aCodePoint < 128 && bCodePoint < 128) {
            return aCodePoint - bCodePoint;
          }
          const aLength2 = utf8Bytes(aCodePoint, aBytes);
          const bLength2 = utf8Bytes(bCodePoint, bBytes);
          return compareArrays(aBytes, aLength2, bBytes, bLength2);
        }
        i += utf16LengthForCodePoint(aCodePoint);
      }
      return aLength - bLength;
    }
    function compareArrays(a, aLength, b, bLength) {
      const length = Math.min(aLength, bLength);
      for (let i = 0; i < length; i++) {
        const aValue = a[i];
        const bValue = b[i];
        if (aValue !== bValue) {
          return aValue - bValue;
        }
      }
      return aLength - bLength;
    }
    function utf16LengthForCodePoint(aCodePoint) {
      return aCodePoint > 65535 ? 2 : 1;
    }
    var arr = () => Array.from({ length: 4 }, () => 0);
    var aBytes = arr();
    var bBytes = arr();
    function utf8Bytes(codePoint, bytes) {
      if (codePoint < 128) {
        bytes[0] = codePoint;
        return 1;
      }
      let count;
      let offset;
      if (codePoint <= 2047) {
        count = 1;
        offset = 192;
      } else if (codePoint <= 65535) {
        count = 2;
        offset = 224;
      } else if (codePoint <= 1114111) {
        count = 3;
        offset = 240;
      } else {
        throw new Error("Invalid code point");
      }
      bytes[0] = (codePoint >> 6 * count) + offset;
      let i = 1;
      for (; count > 0; count--) {
        const temp = codePoint >> 6 * (count - 1);
        bytes[i++] = 128 | temp & 63;
      }
      return i;
    }
    function greaterThan(a, b) {
      return compareUTF8(a, b) > 0;
    }
    function greaterThanEq(a, b) {
      return compareUTF8(a, b) >= 0;
    }
    function lessThan(a, b) {
      return compareUTF8(a, b) < 0;
    }
    function lessThanEq(a, b) {
      return compareUTF8(a, b) <= 0;
    }
  }
});

// node_modules/convex/dist/cjs/values/compare.js
var require_compare = __commonJS({
  "node_modules/convex/dist/cjs/values/compare.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var compare_exports = {};
    __export2(compare_exports, {
      compareValues: () => compareValues
    });
    module2.exports = __toCommonJS2(compare_exports);
    var import_value = require_value();
    var import_compare_utf8 = require_compare_utf8();
    function compareValues(k1, k2) {
      return compareAsTuples(makeComparable(k1), makeComparable(k2));
    }
    function compareAsTuples(a, b) {
      if (a[0] === b[0]) {
        return compareSameTypeValues(a[1], b[1]);
      } else if (a[0] < b[0]) {
        return -1;
      }
      return 1;
    }
    function compareSameTypeValues(v1, v22) {
      if (v1 === void 0 || v1 === null) {
        return 0;
      }
      if (typeof v1 === "number") {
        if (typeof v22 !== "number") {
          throw new Error(`Unexpected type ${v22}`);
        }
        return compareNumbers(v1, v22);
      }
      if (typeof v1 === "string") {
        if (typeof v22 !== "string") {
          throw new Error(`Unexpected type ${v22}`);
        }
        return (0, import_compare_utf8.compareUTF8)(v1, v22);
      }
      if (typeof v1 === "bigint" || typeof v1 === "boolean" || typeof v1 === "string") {
        return v1 < v22 ? -1 : v1 === v22 ? 0 : 1;
      }
      if (!Array.isArray(v1) || !Array.isArray(v22)) {
        throw new Error(`Unexpected type ${v1}`);
      }
      for (let i = 0; i < v1.length && i < v22.length; i++) {
        const cmp = compareAsTuples(v1[i], v22[i]);
        if (cmp !== 0) {
          return cmp;
        }
      }
      if (v1.length < v22.length) {
        return -1;
      }
      if (v1.length > v22.length) {
        return 1;
      }
      return 0;
    }
    function compareNumbers(v1, v22) {
      if (isNaN(v1) || isNaN(v22)) {
        const buffer1 = new ArrayBuffer(8);
        const buffer2 = new ArrayBuffer(8);
        new DataView(buffer1).setFloat64(
          0,
          v1,
          /* little-endian */
          true
        );
        new DataView(buffer2).setFloat64(
          0,
          v22,
          /* little-endian */
          true
        );
        const v1Bits = BigInt(
          new DataView(buffer1).getBigInt64(
            0,
            /* little-endian */
            true
          )
        );
        const v2Bits = BigInt(
          new DataView(buffer2).getBigInt64(
            0,
            /* little-endian */
            true
          )
        );
        const v1Sign = (v1Bits & 0x8000000000000000n) !== 0n;
        const v2Sign = (v2Bits & 0x8000000000000000n) !== 0n;
        if (isNaN(v1) !== isNaN(v22)) {
          if (isNaN(v1)) {
            return v1Sign ? -1 : 1;
          }
          return v2Sign ? 1 : -1;
        }
        if (v1Sign !== v2Sign) {
          return v1Sign ? -1 : 1;
        }
        return v1Bits < v2Bits ? -1 : v1Bits === v2Bits ? 0 : 1;
      }
      if (Object.is(v1, v22)) {
        return 0;
      }
      if (Object.is(v1, -0)) {
        return Object.is(v22, 0) ? -1 : -Math.sign(v22);
      }
      if (Object.is(v22, -0)) {
        return Object.is(v1, 0) ? 1 : Math.sign(v1);
      }
      return v1 < v22 ? -1 : 1;
    }
    function makeComparable(v3) {
      if (v3 === void 0) {
        return [0, void 0];
      }
      if (v3 === null) {
        return [1, null];
      }
      if (typeof v3 === "bigint") {
        return [2, v3];
      }
      if (v3 instanceof import_value.CommitTsPlaceholder) {
        return [2, import_value.MAX_INT64];
      }
      if (typeof v3 === "number") {
        return [3, v3];
      }
      if (typeof v3 === "boolean") {
        return [4, v3];
      }
      if (typeof v3 === "string") {
        return [5, v3];
      }
      if (v3 instanceof ArrayBuffer) {
        return [6, Array.from(new Uint8Array(v3)).map(makeComparable)];
      }
      if (Array.isArray(v3)) {
        return [7, v3.map(makeComparable)];
      }
      const keys = Object.keys(v3).sort();
      const pojo = keys.map((k) => [k, v3[k]]);
      return [9, pojo.map(makeComparable)];
    }
  }
});

// node_modules/convex/dist/cjs/values/size.js
var require_size = __commonJS({
  "node_modules/convex/dist/cjs/values/size.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var size_exports = {};
    __export2(size_exports, {
      SYSTEM_FIELD_CREATION_TIME_SIZE: () => SYSTEM_FIELD_CREATION_TIME_SIZE,
      SYSTEM_FIELD_ID_ESTIMATE: () => SYSTEM_FIELD_ID_ESTIMATE,
      getConvexSize: () => getConvexSize,
      getDocumentSize: () => getDocumentSize
    });
    module2.exports = __toCommonJS2(size_exports);
    var import_value = require_value();
    var import_common = require_common();
    function getConvexSize(value) {
      if (value === void 0) {
        return 0;
      }
      if (value === null) {
        return 1;
      }
      if (typeof value === "boolean") {
        return 1;
      }
      if (typeof value === "bigint") {
        return 9;
      }
      if (value instanceof import_value.CommitTsPlaceholder) {
        return 9;
      }
      if (typeof value === "number") {
        return 9;
      }
      if (typeof value === "string") {
        return 2 + getUtf8ByteLength(value);
      }
      if (value instanceof ArrayBuffer) {
        return 2 + value.byteLength;
      }
      if (Array.isArray(value)) {
        let size = 2;
        for (const element of value) {
          size += getConvexSize(element);
        }
        return size;
      }
      if ((0, import_common.isSimpleObject)(value)) {
        let size = 2;
        for (const [key, val] of Object.entries(value)) {
          if (val !== void 0) {
            size += getUtf8ByteLength(key) + 1 + getConvexSize(val);
          }
        }
        return size;
      }
      throw new Error(`Unsupported value type: ${typeof value}`);
    }
    var UTF8_LENGTH_THRESHOLD = 500;
    function getUtf8ByteLength(str) {
      if (str.length > UTF8_LENGTH_THRESHOLD) {
        return new TextEncoder().encode(str).length;
      }
      let bytes = 0;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 128) {
          bytes += 1;
        } else if (code < 2048) {
          bytes += 2;
        } else if (code >= 55296 && code <= 56319) {
          bytes += 4;
          i++;
        } else {
          bytes += 3;
        }
      }
      return bytes;
    }
    var SYSTEM_FIELD_ID_ESTIMATE = 38;
    var SYSTEM_FIELD_CREATION_TIME_SIZE = 23;
    function getDocumentSize(value, options) {
      const baseSize = getConvexSize(value);
      const hasId = "_id" in value && value["_id"] !== void 0;
      const hasCreationTime = "_creationTime" in value && value["_creationTime"] !== void 0;
      if (hasId && hasCreationTime) {
        return baseSize;
      }
      let additionalSize = 0;
      if (!hasId) {
        if (options?.customIdLength) {
          additionalSize += options.customIdLength + 6;
        } else {
          additionalSize += SYSTEM_FIELD_ID_ESTIMATE;
        }
      }
      if (!hasCreationTime) {
        additionalSize += SYSTEM_FIELD_CREATION_TIME_SIZE;
      }
      return baseSize + additionalSize;
    }
  }
});

// node_modules/convex/dist/cjs/values/index.js
var require_values = __commonJS({
  "node_modules/convex/dist/cjs/values/index.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __reExport = (target, mod, secondTarget) => (__copyProps2(target, mod, "default"), secondTarget && __copyProps2(secondTarget, mod, "default"));
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var values_exports = {};
    __export2(values_exports, {
      Base64: () => Base64,
      CommitTsPlaceholder: () => import_value.CommitTsPlaceholder,
      asObjectValidator: () => import_validator.asObjectValidator,
      compareValues: () => import_compare.compareValues,
      convexToJson: () => import_value.convexToJson,
      getConvexSize: () => import_size.getConvexSize,
      getDocumentSize: () => import_size.getDocumentSize,
      jsonToConvex: () => import_value.jsonToConvex,
      v: () => import_validator.v
    });
    module2.exports = __toCommonJS2(values_exports);
    var import_value = require_value();
    var import_validator = require_validator();
    var Base64 = __toESM2(require_base64(), 1);
    __reExport(values_exports, require_errors(), module2.exports);
    var import_compare = require_compare();
    var import_size = require_size();
  }
});

// node_modules/convex/dist/cjs/server/database.js
var require_database = __commonJS({
  "node_modules/convex/dist/cjs/server/database.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var database_exports = {};
    module2.exports = __toCommonJS2(database_exports);
  }
});

// node_modules/convex/dist/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/convex/dist/cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export2(index_exports, {
      version: () => version
    });
    module2.exports = __toCommonJS2(index_exports);
    var version = "1.44.0";
  }
});

// node_modules/convex/dist/cjs/server/impl/syscall.js
var require_syscall = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/syscall.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var syscall_exports = {};
    __export2(syscall_exports, {
      performAsyncSyscall: () => performAsyncSyscall,
      performJsSyscall: () => performJsSyscall,
      performSyscall: () => performSyscall
    });
    module2.exports = __toCommonJS2(syscall_exports);
    var import_errors = require_errors();
    var import_value = require_value();
    function performSyscall(op, arg) {
      if (typeof Convex === "undefined" || Convex.syscall === void 0) {
        throw new Error(
          "The Convex database and auth objects are being used outside of a Convex backend. Did you mean to use `useQuery` or `useMutation` to call a Convex function?"
        );
      }
      const resultStr = Convex.syscall(op, JSON.stringify(arg));
      return JSON.parse(resultStr);
    }
    async function performAsyncSyscall(op, arg) {
      if (typeof Convex === "undefined" || Convex.asyncSyscall === void 0) {
        throw new Error(
          "The Convex database and auth objects are being used outside of a Convex backend. Did you mean to use `useQuery` or `useMutation` to call a Convex function?"
        );
      }
      let resultStr;
      try {
        resultStr = await Convex.asyncSyscall(op, JSON.stringify(arg));
      } catch (e) {
        if (e.data !== void 0) {
          const rethrown = new import_errors.ConvexError(e.message);
          rethrown.data = (0, import_value.jsonToConvex)(e.data);
          throw rethrown;
        }
        throw new Error(e.message);
      }
      return JSON.parse(resultStr);
    }
    function performJsSyscall(op, arg) {
      if (typeof Convex === "undefined" || Convex.jsSyscall === void 0) {
        throw new Error(
          "The Convex database and auth objects are being used outside of a Convex backend. Did you mean to use `useQuery` or `useMutation` to call a Convex function?"
        );
      }
      return Convex.jsSyscall(op, arg);
    }
  }
});

// node_modules/convex/dist/cjs/server/functionName.js
var require_functionName = __commonJS({
  "node_modules/convex/dist/cjs/server/functionName.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var functionName_exports = {};
    __export2(functionName_exports, {
      functionName: () => functionName
    });
    module2.exports = __toCommonJS2(functionName_exports);
    var functionName = Symbol.for("functionName");
  }
});

// node_modules/convex/dist/cjs/server/components/paths.js
var require_paths = __commonJS({
  "node_modules/convex/dist/cjs/server/components/paths.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var paths_exports = {};
    __export2(paths_exports, {
      extractReferencePath: () => extractReferencePath,
      getFunctionAddress: () => getFunctionAddress,
      isFunctionHandle: () => isFunctionHandle,
      setReferencePath: () => setReferencePath,
      toReferencePath: () => toReferencePath
    });
    module2.exports = __toCommonJS2(paths_exports);
    var import_functionName = require_functionName();
    var toReferencePath = Symbol.for("toReferencePath");
    function setReferencePath(obj, value) {
      obj[toReferencePath] = value;
    }
    function extractReferencePath(reference) {
      return reference[toReferencePath] ?? null;
    }
    function isFunctionHandle(s) {
      return s.startsWith("function://");
    }
    function getFunctionAddress(functionReference) {
      let functionAddress;
      if (typeof functionReference === "string") {
        if (isFunctionHandle(functionReference)) {
          functionAddress = { functionHandle: functionReference };
        } else {
          functionAddress = { name: functionReference };
        }
      } else if (functionReference[import_functionName.functionName]) {
        functionAddress = { name: functionReference[import_functionName.functionName] };
      } else {
        const referencePath = extractReferencePath(functionReference);
        if (!referencePath) {
          throw new Error(`${functionReference} is not a functionReference`);
        }
        functionAddress = { reference: referencePath };
      }
      return functionAddress;
    }
  }
});

// node_modules/convex/dist/cjs/server/impl/validate.js
var require_validate = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/validate.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var validate_exports = {};
    __export2(validate_exports, {
      validateArg: () => validateArg,
      validateArgIsInteger: () => validateArgIsInteger,
      validateArgIsNonNegativeInteger: () => validateArgIsNonNegativeInteger
    });
    module2.exports = __toCommonJS2(validate_exports);
    function validateArg(arg, idx, method, argName) {
      if (arg === void 0) {
        throw new TypeError(
          `Must provide arg ${idx} \`${argName}\` to \`${method}\``
        );
      }
    }
    function validateArgIsInteger(arg, idx, method, argName) {
      if (!Number.isInteger(arg)) {
        throw new TypeError(
          `Arg ${idx} \`${argName}\` to \`${method}\` must be an integer`
        );
      }
    }
    function validateArgIsNonNegativeInteger(arg, idx, method, argName) {
      if (!Number.isInteger(arg) || arg < 0) {
        throw new TypeError(
          `Arg ${idx} \`${argName}\` to \`${method}\` must be a non-negative integer`
        );
      }
    }
  }
});

// node_modules/convex/dist/cjs/server/impl/actions_impl.js
var require_actions_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/actions_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var actions_impl_exports = {};
    __export2(actions_impl_exports, {
      getServiceToken: () => getServiceToken,
      setupActionCalls: () => setupActionCalls
    });
    module2.exports = __toCommonJS2(actions_impl_exports);
    var import_values3 = require_values();
    var import__ = require_cjs();
    var import_syscall = require_syscall();
    var import_common = require_common();
    var import_paths = require_paths();
    var import_validate = require_validate();
    function syscallArgs(requestId, functionReference, args) {
      const address = (0, import_paths.getFunctionAddress)(functionReference);
      return {
        ...address,
        args: (0, import_values3.convexToJson)((0, import_common.parseArgs)(args)),
        version: import__.version,
        requestId
      };
    }
    function setupActionCalls(requestId) {
      return {
        runQuery: async (query, args) => {
          const result = await (0, import_syscall.performAsyncSyscall)(
            "1.0/actions/query",
            syscallArgs(requestId, query, args)
          );
          return (0, import_values3.jsonToConvex)(result);
        },
        runMutation: async (mutation2, args) => {
          const result = await (0, import_syscall.performAsyncSyscall)(
            "1.0/actions/mutation",
            syscallArgs(requestId, mutation2, args)
          );
          return (0, import_values3.jsonToConvex)(result);
        },
        runAction: async (action, args) => {
          const result = await (0, import_syscall.performAsyncSyscall)(
            "1.0/actions/action",
            syscallArgs(requestId, action, args)
          );
          return (0, import_values3.jsonToConvex)(result);
        }
      };
    }
    async function getServiceToken(service) {
      (0, import_validate.validateArg)(service, 1, "getServiceToken", "service");
      if (service !== "ai-gateway") {
        throw new Error(`Unsupported service "${String(service)}"`);
      }
      return await (0, import_syscall.performAsyncSyscall)("1.0/createServiceToken", {
        service,
        version: import__.version
      });
    }
  }
});

// node_modules/convex/dist/cjs/server/vector_search.js
var require_vector_search = __commonJS({
  "node_modules/convex/dist/cjs/server/vector_search.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var vector_search_exports = {};
    __export2(vector_search_exports, {
      FilterExpression: () => FilterExpression
    });
    module2.exports = __toCommonJS2(vector_search_exports);
    var FilterExpression = class {
      /**
       * @internal
       */
      constructor() {
        __publicField(this, "_isExpression");
        __publicField(this, "_value");
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/vector_search_impl.js
var require_vector_search_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/vector_search_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var vector_search_impl_exports = {};
    __export2(vector_search_impl_exports, {
      ExpressionImpl: () => ExpressionImpl,
      VectorQueryImpl: () => VectorQueryImpl,
      filterBuilderImpl: () => filterBuilderImpl,
      serializeExpression: () => serializeExpression,
      setupActionVectorSearch: () => setupActionVectorSearch
    });
    module2.exports = __toCommonJS2(vector_search_impl_exports);
    var import_syscall = require_syscall();
    var import__ = require_cjs();
    var import_vector_search = require_vector_search();
    var import_validate = require_validate();
    var import_value = require_value();
    function setupActionVectorSearch(requestId) {
      return async (tableName, indexName, query) => {
        (0, import_validate.validateArg)(tableName, 1, "vectorSearch", "tableName");
        (0, import_validate.validateArg)(indexName, 2, "vectorSearch", "indexName");
        (0, import_validate.validateArg)(query, 3, "vectorSearch", "query");
        if (!query.vector || !Array.isArray(query.vector) || query.vector.length === 0) {
          throw Error("`vector` must be a non-empty Array in vectorSearch");
        }
        return await new VectorQueryImpl(
          requestId,
          tableName + "." + indexName,
          query
        ).collect();
      };
    }
    var VectorQueryImpl = class {
      constructor(requestId, indexName, query) {
        __publicField(this, "requestId");
        __publicField(this, "state");
        this.requestId = requestId;
        const filters = query.filter ? serializeExpression(query.filter(filterBuilderImpl)) : null;
        this.state = {
          type: "preparing",
          query: {
            indexName,
            limit: query.limit,
            vector: query.vector,
            expressions: filters
          }
        };
      }
      async collect() {
        if (this.state.type === "consumed") {
          throw new Error("This query is closed and can't emit any more values.");
        }
        const query = this.state.query;
        this.state = { type: "consumed" };
        const { results } = await (0, import_syscall.performAsyncSyscall)("1.0/actions/vectorSearch", {
          requestId: this.requestId,
          version: import__.version,
          query
        });
        return results;
      }
    };
    var ExpressionImpl = class extends import_vector_search.FilterExpression {
      constructor(inner) {
        super();
        __publicField(this, "inner");
        this.inner = inner;
      }
      serialize() {
        return this.inner;
      }
    };
    function serializeExpression(expr) {
      if (expr instanceof ExpressionImpl) {
        return expr.serialize();
      } else {
        return { $literal: (0, import_value.convexOrUndefinedToJson)(expr) };
      }
    }
    var filterBuilderImpl = {
      //  Comparisons  /////////////////////////////////////////////////////////////
      eq(fieldName, value) {
        if (typeof fieldName !== "string") {
          throw new Error("The first argument to `q.eq` must be a field name.");
        }
        return new ExpressionImpl({
          $eq: [
            serializeExpression(new ExpressionImpl({ $field: fieldName })),
            serializeExpression(value)
          ]
        });
      },
      //  Logic  ///////////////////////////////////////////////////////////////////
      or(...exprs) {
        return new ExpressionImpl({ $or: exprs.map(serializeExpression) });
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/authentication_impl.js
var require_authentication_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/authentication_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var authentication_impl_exports = {};
    __export2(authentication_impl_exports, {
      setupAuth: () => setupAuth
    });
    module2.exports = __toCommonJS2(authentication_impl_exports);
    var import_syscall = require_syscall();
    function setupAuth(requestId) {
      return {
        getUserIdentity: async () => {
          return await (0, import_syscall.performAsyncSyscall)("1.0/getUserIdentity", {
            requestId
          });
        }
      };
    }
  }
});

// node_modules/convex/dist/cjs/server/filter_builder.js
var require_filter_builder = __commonJS({
  "node_modules/convex/dist/cjs/server/filter_builder.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var filter_builder_exports = {};
    __export2(filter_builder_exports, {
      Expression: () => Expression
    });
    module2.exports = __toCommonJS2(filter_builder_exports);
    var Expression = class {
      /**
       * @internal
       */
      constructor() {
        __publicField(this, "_isExpression");
        __publicField(this, "_value");
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/filter_builder_impl.js
var require_filter_builder_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/filter_builder_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var filter_builder_impl_exports = {};
    __export2(filter_builder_impl_exports, {
      ExpressionImpl: () => ExpressionImpl,
      filterBuilderImpl: () => filterBuilderImpl,
      serializeExpression: () => serializeExpression
    });
    module2.exports = __toCommonJS2(filter_builder_impl_exports);
    var import_value = require_value();
    var import_filter_builder = require_filter_builder();
    var ExpressionImpl = class extends import_filter_builder.Expression {
      constructor(inner) {
        super();
        __publicField(this, "inner");
        this.inner = inner;
      }
      serialize() {
        return this.inner;
      }
    };
    function serializeExpression(expr) {
      if (expr instanceof ExpressionImpl) {
        return expr.serialize();
      } else {
        return { $literal: (0, import_value.convexOrUndefinedToJson)(expr) };
      }
    }
    var filterBuilderImpl = {
      //  Comparisons  /////////////////////////////////////////////////////////////
      eq(l, r) {
        return new ExpressionImpl({
          $eq: [serializeExpression(l), serializeExpression(r)]
        });
      },
      neq(l, r) {
        return new ExpressionImpl({
          $neq: [serializeExpression(l), serializeExpression(r)]
        });
      },
      lt(l, r) {
        return new ExpressionImpl({
          $lt: [serializeExpression(l), serializeExpression(r)]
        });
      },
      lte(l, r) {
        return new ExpressionImpl({
          $lte: [serializeExpression(l), serializeExpression(r)]
        });
      },
      gt(l, r) {
        return new ExpressionImpl({
          $gt: [serializeExpression(l), serializeExpression(r)]
        });
      },
      gte(l, r) {
        return new ExpressionImpl({
          $gte: [serializeExpression(l), serializeExpression(r)]
        });
      },
      //  Arithmetic  //////////////////////////////////////////////////////////////
      add(l, r) {
        return new ExpressionImpl({
          $add: [serializeExpression(l), serializeExpression(r)]
        });
      },
      sub(l, r) {
        return new ExpressionImpl({
          $sub: [serializeExpression(l), serializeExpression(r)]
        });
      },
      mul(l, r) {
        return new ExpressionImpl({
          $mul: [serializeExpression(l), serializeExpression(r)]
        });
      },
      div(l, r) {
        return new ExpressionImpl({
          $div: [serializeExpression(l), serializeExpression(r)]
        });
      },
      mod(l, r) {
        return new ExpressionImpl({
          $mod: [serializeExpression(l), serializeExpression(r)]
        });
      },
      neg(x) {
        return new ExpressionImpl({ $neg: serializeExpression(x) });
      },
      //  Logic  ///////////////////////////////////////////////////////////////////
      and(...exprs) {
        return new ExpressionImpl({ $and: exprs.map(serializeExpression) });
      },
      or(...exprs) {
        return new ExpressionImpl({ $or: exprs.map(serializeExpression) });
      },
      not(x) {
        return new ExpressionImpl({ $not: serializeExpression(x) });
      },
      //  Other  ///////////////////////////////////////////////////////////////////
      field(fieldPath) {
        return new ExpressionImpl({ $field: fieldPath });
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/index_range_builder.js
var require_index_range_builder = __commonJS({
  "node_modules/convex/dist/cjs/server/index_range_builder.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var index_range_builder_exports = {};
    __export2(index_range_builder_exports, {
      IndexRange: () => IndexRange
    });
    module2.exports = __toCommonJS2(index_range_builder_exports);
    var IndexRange = class {
      /**
       * @internal
       */
      constructor() {
        __publicField(this, "_isIndexRange");
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/index_range_builder_impl.js
var require_index_range_builder_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/index_range_builder_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var index_range_builder_impl_exports = {};
    __export2(index_range_builder_impl_exports, {
      IndexRangeBuilderImpl: () => IndexRangeBuilderImpl
    });
    module2.exports = __toCommonJS2(index_range_builder_impl_exports);
    var import_value = require_value();
    var import_index_range_builder = require_index_range_builder();
    var IndexRangeBuilderImpl = class _IndexRangeBuilderImpl extends import_index_range_builder.IndexRange {
      constructor(rangeExpressions) {
        super();
        __publicField(this, "rangeExpressions");
        __publicField(this, "isConsumed");
        this.rangeExpressions = rangeExpressions;
        this.isConsumed = false;
      }
      static new() {
        return new _IndexRangeBuilderImpl([]);
      }
      consume() {
        if (this.isConsumed) {
          throw new Error(
            "IndexRangeBuilder has already been used! Chain your method calls like `q => q.eq(...).eq(...)`. See https://docs.convex.dev/using/indexes"
          );
        }
        this.isConsumed = true;
      }
      eq(fieldName, value) {
        this.consume();
        return new _IndexRangeBuilderImpl(
          this.rangeExpressions.concat({
            type: "Eq",
            fieldPath: fieldName,
            value: (0, import_value.convexOrUndefinedToJson)(value)
          })
        );
      }
      gt(fieldName, value) {
        this.consume();
        return new _IndexRangeBuilderImpl(
          this.rangeExpressions.concat({
            type: "Gt",
            fieldPath: fieldName,
            value: (0, import_value.convexOrUndefinedToJson)(value)
          })
        );
      }
      gte(fieldName, value) {
        this.consume();
        return new _IndexRangeBuilderImpl(
          this.rangeExpressions.concat({
            type: "Gte",
            fieldPath: fieldName,
            value: (0, import_value.convexOrUndefinedToJson)(value)
          })
        );
      }
      lt(fieldName, value) {
        this.consume();
        return new _IndexRangeBuilderImpl(
          this.rangeExpressions.concat({
            type: "Lt",
            fieldPath: fieldName,
            value: (0, import_value.convexOrUndefinedToJson)(value)
          })
        );
      }
      lte(fieldName, value) {
        this.consume();
        return new _IndexRangeBuilderImpl(
          this.rangeExpressions.concat({
            type: "Lte",
            fieldPath: fieldName,
            value: (0, import_value.convexOrUndefinedToJson)(value)
          })
        );
      }
      export() {
        this.consume();
        return this.rangeExpressions;
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/search_filter_builder.js
var require_search_filter_builder = __commonJS({
  "node_modules/convex/dist/cjs/server/search_filter_builder.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var search_filter_builder_exports = {};
    __export2(search_filter_builder_exports, {
      SearchFilter: () => SearchFilter
    });
    module2.exports = __toCommonJS2(search_filter_builder_exports);
    var SearchFilter = class {
      /**
       * @internal
       */
      constructor() {
        __publicField(this, "_isSearchFilter");
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/search_filter_builder_impl.js
var require_search_filter_builder_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/search_filter_builder_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var search_filter_builder_impl_exports = {};
    __export2(search_filter_builder_impl_exports, {
      SearchFilterBuilderImpl: () => SearchFilterBuilderImpl
    });
    module2.exports = __toCommonJS2(search_filter_builder_impl_exports);
    var import_value = require_value();
    var import_search_filter_builder = require_search_filter_builder();
    var import_validate = require_validate();
    var SearchFilterBuilderImpl = class _SearchFilterBuilderImpl extends import_search_filter_builder.SearchFilter {
      constructor(filters) {
        super();
        __publicField(this, "filters");
        __publicField(this, "isConsumed");
        this.filters = filters;
        this.isConsumed = false;
      }
      static new() {
        return new _SearchFilterBuilderImpl([]);
      }
      consume() {
        if (this.isConsumed) {
          throw new Error(
            "SearchFilterBuilder has already been used! Chain your method calls like `q => q.search(...).eq(...)`."
          );
        }
        this.isConsumed = true;
      }
      search(fieldName, query) {
        (0, import_validate.validateArg)(fieldName, 1, "search", "fieldName");
        (0, import_validate.validateArg)(query, 2, "search", "query");
        this.consume();
        return new _SearchFilterBuilderImpl(
          this.filters.concat({
            type: "Search",
            fieldPath: fieldName,
            value: query
          })
        );
      }
      eq(fieldName, value) {
        (0, import_validate.validateArg)(fieldName, 1, "eq", "fieldName");
        if (arguments.length !== 2) {
          (0, import_validate.validateArg)(value, 2, "search", "value");
        }
        this.consume();
        return new _SearchFilterBuilderImpl(
          this.filters.concat({
            type: "Eq",
            fieldPath: fieldName,
            value: (0, import_value.convexOrUndefinedToJson)(value)
          })
        );
      }
      export() {
        this.consume();
        return this.filters;
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/query_impl.js
var require_query_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/query_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var query_impl_exports = {};
    __export2(query_impl_exports, {
      QueryImpl: () => QueryImpl,
      QueryInitializerImpl: () => QueryInitializerImpl
    });
    module2.exports = __toCommonJS2(query_impl_exports);
    var import_values3 = require_values();
    var import_syscall = require_syscall();
    var import_filter_builder_impl = require_filter_builder_impl();
    var import_index_range_builder_impl = require_index_range_builder_impl();
    var import_search_filter_builder_impl = require_search_filter_builder_impl();
    var import_validate = require_validate();
    var import__ = require_cjs();
    var MAX_QUERY_OPERATORS = 256;
    var QueryInitializerImpl = class {
      constructor(tableName) {
        __publicField(this, "tableName");
        this.tableName = tableName;
      }
      withIndex(indexName, indexRange) {
        (0, import_validate.validateArg)(indexName, 1, "withIndex", "indexName");
        let rangeBuilder = import_index_range_builder_impl.IndexRangeBuilderImpl.new();
        if (indexRange !== void 0) {
          rangeBuilder = indexRange(rangeBuilder);
        }
        return new QueryImpl({
          source: {
            type: "IndexRange",
            indexName: this.tableName + "." + indexName,
            range: rangeBuilder.export(),
            order: null
          },
          operators: []
        });
      }
      withSearchIndex(indexName, searchFilter) {
        (0, import_validate.validateArg)(indexName, 1, "withSearchIndex", "indexName");
        (0, import_validate.validateArg)(searchFilter, 2, "withSearchIndex", "searchFilter");
        const searchFilterBuilder = import_search_filter_builder_impl.SearchFilterBuilderImpl.new();
        return new QueryImpl({
          source: {
            type: "Search",
            indexName: this.tableName + "." + indexName,
            filters: searchFilter(searchFilterBuilder).export()
          },
          operators: []
        });
      }
      fullTableScan() {
        return new QueryImpl({
          source: {
            type: "FullTableScan",
            tableName: this.tableName,
            order: null
          },
          operators: []
        });
      }
      order(order) {
        return this.fullTableScan().order(order);
      }
      // This is internal API and should not be exposed to developers yet.
      async count() {
        const syscallJSON = await (0, import_syscall.performAsyncSyscall)("1.0/count", {
          table: this.tableName
        });
        const syscallResult = (0, import_values3.jsonToConvex)(syscallJSON);
        return syscallResult;
      }
      filter(predicate) {
        return this.fullTableScan().filter(predicate);
      }
      limit(n) {
        return this.fullTableScan().limit(n);
      }
      collect() {
        return this.fullTableScan().collect();
      }
      take(n) {
        return this.fullTableScan().take(n);
      }
      paginate(paginationOpts) {
        return this.fullTableScan().paginate(paginationOpts);
      }
      first() {
        return this.fullTableScan().first();
      }
      unique() {
        return this.fullTableScan().unique();
      }
      [Symbol.asyncIterator]() {
        return this.fullTableScan()[Symbol.asyncIterator]();
      }
    };
    function throwClosedError(type) {
      throw new Error(
        type === "consumed" ? "This query is closed and can't emit any more values." : "This query has been chained with another operator and can't be reused."
      );
    }
    var QueryImpl = class _QueryImpl {
      constructor(query) {
        __publicField(this, "state");
        __publicField(this, "tableNameForErrorMessages");
        this.state = { type: "preparing", query };
        if (query.source.type === "FullTableScan") {
          this.tableNameForErrorMessages = query.source.tableName;
        } else {
          this.tableNameForErrorMessages = query.source.indexName.split(".")[0];
        }
      }
      takeQuery() {
        if (this.state.type !== "preparing") {
          throw new Error(
            "A query can only be chained once and can't be chained after iteration begins."
          );
        }
        const query = this.state.query;
        this.state = { type: "closed" };
        return query;
      }
      startQuery() {
        if (this.state.type === "executing") {
          throw new Error("Iteration can only begin on a query once.");
        }
        if (this.state.type === "closed" || this.state.type === "consumed") {
          throwClosedError(this.state.type);
        }
        const query = this.state.query;
        const { queryId } = (0, import_syscall.performSyscall)("1.0/queryStream", { query, version: import__.version });
        this.state = { type: "executing", queryId };
        return queryId;
      }
      closeQuery() {
        if (this.state.type === "executing") {
          const queryId = this.state.queryId;
          (0, import_syscall.performSyscall)("1.0/queryCleanup", { queryId });
        }
        this.state = { type: "consumed" };
      }
      order(order) {
        (0, import_validate.validateArg)(order, 1, "order", "order");
        const query = this.takeQuery();
        if (query.source.type === "Search") {
          throw new Error(
            "Search queries must always be in relevance order. Can not set order manually."
          );
        }
        if (query.source.order !== null) {
          throw new Error("Queries may only specify order at most once");
        }
        query.source.order = order;
        return new _QueryImpl(query);
      }
      filter(predicate) {
        (0, import_validate.validateArg)(predicate, 1, "filter", "predicate");
        const query = this.takeQuery();
        if (query.operators.length >= MAX_QUERY_OPERATORS) {
          throw new Error(
            `Can't construct query with more than ${MAX_QUERY_OPERATORS} operators`
          );
        }
        query.operators.push({
          filter: (0, import_filter_builder_impl.serializeExpression)(predicate(import_filter_builder_impl.filterBuilderImpl))
        });
        return new _QueryImpl(query);
      }
      limit(n) {
        (0, import_validate.validateArg)(n, 1, "limit", "n");
        const query = this.takeQuery();
        query.operators.push({ limit: n });
        return new _QueryImpl(query);
      }
      [Symbol.asyncIterator]() {
        this.startQuery();
        return this;
      }
      async next() {
        if (this.state.type === "closed" || this.state.type === "consumed") {
          throwClosedError(this.state.type);
        }
        const queryId = this.state.type === "preparing" ? this.startQuery() : this.state.queryId;
        const { value, done } = await (0, import_syscall.performAsyncSyscall)("1.0/queryStreamNext", {
          queryId
        });
        if (done) {
          this.closeQuery();
        }
        const convexValue = (0, import_values3.jsonToConvex)(value);
        return { value: convexValue, done };
      }
      return() {
        this.closeQuery();
        return Promise.resolve({ done: true, value: void 0 });
      }
      async paginate(paginationOpts) {
        (0, import_validate.validateArg)(paginationOpts, 1, "paginate", "options");
        if (typeof paginationOpts?.numItems !== "number" || paginationOpts.numItems < 0) {
          throw new Error(
            `\`options.numItems\` must be a positive number. Received \`${paginationOpts?.numItems}\`.`
          );
        }
        const query = this.takeQuery();
        const pageSize = paginationOpts.numItems;
        const cursor = paginationOpts.cursor;
        const endCursor = paginationOpts?.endCursor ?? null;
        const maximumRowsRead = paginationOpts.maximumRowsRead ?? null;
        const { page, isDone, continueCursor, splitCursor, pageStatus } = await (0, import_syscall.performAsyncSyscall)("1.0/queryPage", {
          query,
          cursor,
          endCursor,
          pageSize,
          maximumRowsRead,
          maximumBytesRead: paginationOpts.maximumBytesRead,
          version: import__.version
        });
        return {
          page: page.map((json) => (0, import_values3.jsonToConvex)(json)),
          isDone,
          continueCursor,
          splitCursor,
          pageStatus
        };
      }
      async collect() {
        const out = [];
        for await (const item of this) {
          out.push(item);
        }
        return out;
      }
      async take(n) {
        (0, import_validate.validateArg)(n, 1, "take", "n");
        (0, import_validate.validateArgIsNonNegativeInteger)(n, 1, "take", "n");
        return this.limit(n).collect();
      }
      async first() {
        const first_array = await this.take(1);
        return first_array.length === 0 ? null : first_array[0];
      }
      async unique() {
        const first_two_array = await this.take(2);
        if (first_two_array.length === 0) {
          return null;
        }
        if (first_two_array.length === 2) {
          throw new Error(`unique() query returned more than one result from table ${this.tableNameForErrorMessages}:
 [${first_two_array[0]._id}, ${first_two_array[1]._id}, ...]`);
        }
        return first_two_array[0];
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/database_impl.js
var require_database_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/database_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var database_impl_exports = {};
    __export2(database_impl_exports, {
      setupReader: () => setupReader,
      setupWriter: () => setupWriter
    });
    module2.exports = __toCommonJS2(database_impl_exports);
    var import_values3 = require_values();
    var import_syscall = require_syscall();
    var import_query_impl = require_query_impl();
    var import_validate = require_validate();
    var import__ = require_cjs();
    var import_value = require_value();
    async function get(table, id, isSystem) {
      (0, import_validate.validateArg)(id, 1, "get", "id");
      if (typeof id !== "string") {
        throw new Error(
          `Invalid argument \`id\` for \`db.get\`, expected string but got '${typeof id}': ${id}`
        );
      }
      const args = {
        id: (0, import_values3.convexToJson)(id),
        isSystem,
        version: import__.version,
        table
      };
      const syscallJSON = await (0, import_syscall.performAsyncSyscall)("1.0/get", args);
      return (0, import_values3.jsonToConvex)(syscallJSON);
    }
    function setupReader() {
      const reader = (isSystem = false) => {
        return {
          get: async (arg0, arg1) => {
            return arg1 !== void 0 ? await get(arg0, arg1, isSystem) : await get(void 0, arg0, isSystem);
          },
          query: (tableName) => {
            return new TableReader(tableName, isSystem).query();
          },
          normalizeId: (tableName, id) => {
            (0, import_validate.validateArg)(tableName, 1, "normalizeId", "tableName");
            (0, import_validate.validateArg)(id, 2, "normalizeId", "id");
            const accessingSystemTable = tableName.startsWith("_");
            if (accessingSystemTable !== isSystem) {
              throw new Error(
                `${accessingSystemTable ? "System" : "User"} tables can only be accessed from db.${isSystem ? "" : "system."}normalizeId().`
              );
            }
            const syscallJSON = (0, import_syscall.performSyscall)("1.0/db/normalizeId", {
              table: tableName,
              idString: id
            });
            const syscallResult = (0, import_values3.jsonToConvex)(syscallJSON);
            return syscallResult.id;
          },
          // We set the system reader on the next line
          system: null,
          table: (tableName) => {
            return new TableReader(tableName, isSystem);
          }
        };
      };
      const { system: _, ...rest } = reader(true);
      const r = reader();
      r.system = rest;
      return r;
    }
    async function insert(tableName, value) {
      if (tableName.startsWith("_")) {
        throw new Error("System tables (prefixed with `_`) are read-only.");
      }
      (0, import_validate.validateArg)(tableName, 1, "insert", "table");
      (0, import_validate.validateArg)(value, 2, "insert", "value");
      const syscallJSON = await (0, import_syscall.performAsyncSyscall)("1.0/insert", {
        table: tableName,
        value: (0, import_values3.convexToJson)(value)
      });
      const syscallResult = (0, import_values3.jsonToConvex)(syscallJSON);
      return syscallResult._id;
    }
    async function patch(table, id, value) {
      (0, import_validate.validateArg)(id, 1, "patch", "id");
      (0, import_validate.validateArg)(value, 2, "patch", "value");
      await (0, import_syscall.performAsyncSyscall)("1.0/shallowMerge", {
        id: (0, import_values3.convexToJson)(id),
        value: (0, import_value.patchValueToJson)(value),
        table
      });
    }
    async function replace(table, id, value) {
      (0, import_validate.validateArg)(id, 1, "replace", "id");
      (0, import_validate.validateArg)(value, 2, "replace", "value");
      await (0, import_syscall.performAsyncSyscall)("1.0/replace", {
        id: (0, import_values3.convexToJson)(id),
        value: (0, import_values3.convexToJson)(value),
        table
      });
    }
    async function delete_(table, id) {
      (0, import_validate.validateArg)(id, 1, "delete", "id");
      await (0, import_syscall.performAsyncSyscall)("1.0/remove", {
        id: (0, import_values3.convexToJson)(id),
        table
      });
    }
    function setupWriter() {
      const reader = setupReader();
      return {
        get: reader.get,
        query: reader.query,
        normalizeId: reader.normalizeId,
        system: reader.system,
        insert: async (table, value) => {
          return await insert(table, value);
        },
        patch: async (arg0, arg1, arg2) => {
          return arg2 !== void 0 ? await patch(arg0, arg1, arg2) : await patch(void 0, arg0, arg1);
        },
        replace: async (arg0, arg1, arg2) => {
          return arg2 !== void 0 ? await replace(arg0, arg1, arg2) : await replace(void 0, arg0, arg1);
        },
        delete: async (arg0, arg1) => {
          return arg1 !== void 0 ? await delete_(arg0, arg1) : await delete_(void 0, arg0);
        },
        table: (tableName) => {
          return new TableWriter(tableName, false);
        },
        vars: {
          commitTs: import_value.commitTsPlaceholder
        }
      };
    }
    var TableReader = class {
      constructor(tableName, isSystem) {
        this.tableName = tableName;
        this.isSystem = isSystem;
      }
      async get(id) {
        return get(this.tableName, id, this.isSystem);
      }
      query() {
        const accessingSystemTable = this.tableName.startsWith("_");
        if (accessingSystemTable !== this.isSystem) {
          throw new Error(
            `${accessingSystemTable ? "System" : "User"} tables can only be accessed from db.${this.isSystem ? "" : "system."}query().`
          );
        }
        return new import_query_impl.QueryInitializerImpl(this.tableName);
      }
    };
    var TableWriter = class extends TableReader {
      async insert(value) {
        return insert(this.tableName, value);
      }
      async patch(id, value) {
        return patch(this.tableName, id, value);
      }
      async replace(id, value) {
        return replace(this.tableName, id, value);
      }
      async delete(id) {
        return delete_(this.tableName, id);
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/impl/scheduler_impl.js
var require_scheduler_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/scheduler_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var scheduler_impl_exports = {};
    __export2(scheduler_impl_exports, {
      setupActionScheduler: () => setupActionScheduler,
      setupMutationScheduler: () => setupMutationScheduler
    });
    module2.exports = __toCommonJS2(scheduler_impl_exports);
    var import_values3 = require_values();
    var import__ = require_cjs();
    var import_syscall = require_syscall();
    var import_common = require_common();
    var import_validate = require_validate();
    var import_paths = require_paths();
    function setupMutationScheduler() {
      return {
        runAfter: async (delayMs, functionReference, args) => {
          const syscallArgs = runAfterSyscallArgs(delayMs, functionReference, args);
          return await (0, import_syscall.performAsyncSyscall)("1.0/schedule", syscallArgs);
        },
        runAt: async (ms_since_epoch_or_date, functionReference, args) => {
          const syscallArgs = runAtSyscallArgs(
            ms_since_epoch_or_date,
            functionReference,
            args
          );
          return await (0, import_syscall.performAsyncSyscall)("1.0/schedule", syscallArgs);
        },
        cancel: async (id) => {
          (0, import_validate.validateArg)(id, 1, "cancel", "id");
          const args = { id: (0, import_values3.convexToJson)(id) };
          await (0, import_syscall.performAsyncSyscall)("1.0/cancel_job", args);
        }
      };
    }
    function setupActionScheduler(requestId) {
      return {
        runAfter: async (delayMs, functionReference, args) => {
          const syscallArgs = {
            requestId,
            ...runAfterSyscallArgs(delayMs, functionReference, args)
          };
          return await (0, import_syscall.performAsyncSyscall)("1.0/actions/schedule", syscallArgs);
        },
        runAt: async (ms_since_epoch_or_date, functionReference, args) => {
          const syscallArgs = {
            requestId,
            ...runAtSyscallArgs(ms_since_epoch_or_date, functionReference, args)
          };
          return await (0, import_syscall.performAsyncSyscall)("1.0/actions/schedule", syscallArgs);
        },
        cancel: async (id) => {
          (0, import_validate.validateArg)(id, 1, "cancel", "id");
          const syscallArgs = {
            requestId,
            id: (0, import_values3.convexToJson)(id)
          };
          return await (0, import_syscall.performAsyncSyscall)("1.0/actions/cancel_job", syscallArgs);
        }
      };
    }
    function runAfterSyscallArgs(delayMs, functionReference, args) {
      if (typeof delayMs !== "number") {
        throw new Error("`delayMs` must be a number");
      }
      if (!isFinite(delayMs)) {
        throw new Error("`delayMs` must be a finite number");
      }
      if (delayMs < 0) {
        throw new Error("`delayMs` must be non-negative");
      }
      const functionArgs = (0, import_common.parseArgs)(args);
      const address = (0, import_paths.getFunctionAddress)(functionReference);
      const ts = (Date.now() + delayMs) / 1e3;
      return {
        ...address,
        ts,
        args: (0, import_values3.convexToJson)(functionArgs),
        version: import__.version
      };
    }
    function runAtSyscallArgs(ms_since_epoch_or_date, functionReference, args) {
      let ts;
      if (ms_since_epoch_or_date instanceof Date) {
        ts = ms_since_epoch_or_date.valueOf() / 1e3;
      } else if (typeof ms_since_epoch_or_date === "number") {
        ts = ms_since_epoch_or_date / 1e3;
      } else {
        throw new Error("The invoke time must a Date or a timestamp");
      }
      const address = (0, import_paths.getFunctionAddress)(functionReference);
      const functionArgs = (0, import_common.parseArgs)(args);
      return {
        ...address,
        ts,
        args: (0, import_values3.convexToJson)(functionArgs),
        version: import__.version
      };
    }
  }
});

// node_modules/convex/dist/cjs/server/impl/storage_impl.js
var require_storage_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/storage_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var storage_impl_exports = {};
    __export2(storage_impl_exports, {
      setupStorageActionWriter: () => setupStorageActionWriter,
      setupStorageReader: () => setupStorageReader,
      setupStorageWriter: () => setupStorageWriter
    });
    module2.exports = __toCommonJS2(storage_impl_exports);
    var import__ = require_cjs();
    var import_syscall = require_syscall();
    var import_validate = require_validate();
    function setupStorageReader(requestId) {
      return {
        getUrl: async (storageId) => {
          (0, import_validate.validateArg)(storageId, 1, "getUrl", "storageId");
          return await (0, import_syscall.performAsyncSyscall)("1.0/storageGetUrl", {
            requestId,
            version: import__.version,
            storageId
          });
        },
        getMetadata: async (storageId) => {
          return await (0, import_syscall.performAsyncSyscall)("1.0/storageGetMetadata", {
            requestId,
            version: import__.version,
            storageId
          });
        }
      };
    }
    function setupStorageWriter(requestId) {
      const reader = setupStorageReader(requestId);
      return {
        generateUploadUrl: async () => {
          return await (0, import_syscall.performAsyncSyscall)("1.0/storageGenerateUploadUrl", {
            requestId,
            version: import__.version
          });
        },
        delete: async (storageId) => {
          await (0, import_syscall.performAsyncSyscall)("1.0/storageDelete", {
            requestId,
            version: import__.version,
            storageId
          });
        },
        getUrl: reader.getUrl,
        getMetadata: reader.getMetadata
      };
    }
    function setupStorageActionWriter(requestId) {
      const writer = setupStorageWriter(requestId);
      return {
        ...writer,
        store: async (blob, options) => {
          return await (0, import_syscall.performJsSyscall)("storage/storeBlob", {
            requestId,
            version: import__.version,
            blob,
            options
          });
        },
        get: async (storageId) => {
          return await (0, import_syscall.performJsSyscall)("storage/getBlob", {
            requestId,
            version: import__.version,
            storageId
          });
        }
      };
    }
  }
});

// node_modules/convex/dist/cjs/server/impl/meta_impl.js
var require_meta_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/meta_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var meta_impl_exports = {};
    __export2(meta_impl_exports, {
      setupActionMeta: () => setupActionMeta,
      setupMutationMeta: () => setupMutationMeta,
      setupQueryMeta: () => setupQueryMeta
    });
    module2.exports = __toCommonJS2(meta_impl_exports);
    var import_values3 = require_values();
    var import_syscall = require_syscall();
    async function getTransactionMetrics() {
      let syscallJSON;
      try {
        syscallJSON = await (0, import_syscall.performAsyncSyscall)("1.0/getTransactionMetrics", {});
      } catch (e) {
        if (e.message?.includes("Unknown async operation")) {
          throw new Error(
            "getTransactionMetrics() can only be called from a query or mutation. It is not available in actions or outside of a Convex function."
          );
        }
        throw e;
      }
      return (0, import_values3.jsonToConvex)(syscallJSON);
    }
    async function getFunctionMetadata() {
      const { name, componentPath } = await (0, import_syscall.performAsyncSyscall)(
        "1.0/getFunctionMetadata",
        {}
      );
      return {
        name,
        componentPath
      };
    }
    async function getDeploymentMetadata() {
      const syscallJSON = await (0, import_syscall.performAsyncSyscall)(
        "1.0/getDeploymentMetadata",
        {}
      );
      const result = (0, import_values3.jsonToConvex)(syscallJSON);
      return {
        name: result.name,
        region: result.region ?? null,
        class: result.class
      };
    }
    async function getRequestMetadata() {
      const { ip, userAgent, requestId, scheduledFunctionId, authToken } = await (0, import_syscall.performAsyncSyscall)("1.0/getRequestMetadata", {});
      return { ip, userAgent, requestId, scheduledFunctionId, authToken };
    }
    function setupQueryMeta(visibility) {
      return {
        getFunctionMetadata: async () => ({
          ...await getFunctionMetadata(),
          type: "query",
          visibility
        }),
        getTransactionMetrics,
        getDeploymentMetadata
      };
    }
    function setupMutationMeta(visibility) {
      return {
        getFunctionMetadata: async () => ({
          ...await getFunctionMetadata(),
          type: "mutation",
          visibility
        }),
        getTransactionMetrics,
        getDeploymentMetadata,
        getRequestMetadata
      };
    }
    function setupActionMeta(visibility) {
      return {
        getFunctionMetadata: async () => ({
          ...await getFunctionMetadata(),
          type: "action",
          visibility
        }),
        getDeploymentMetadata,
        getRequestMetadata
      };
    }
  }
});

// node_modules/convex/dist/cjs/server/impl/registration_impl.js
var require_registration_impl = __commonJS({
  "node_modules/convex/dist/cjs/server/impl/registration_impl.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var registration_impl_exports = {};
    __export2(registration_impl_exports, {
      actionGeneric: () => actionGeneric2,
      httpActionGeneric: () => httpActionGeneric2,
      internalActionGeneric: () => internalActionGeneric2,
      internalMutationGeneric: () => internalMutationGeneric2,
      internalQueryGeneric: () => internalQueryGeneric2,
      invokeFunction: () => invokeFunction,
      mutationGeneric: () => mutationGeneric2,
      queryGeneric: () => queryGeneric2,
      validateReturnValue: () => validateReturnValue
    });
    module2.exports = __toCommonJS2(registration_impl_exports);
    var import_values3 = require_values();
    var import_actions_impl = require_actions_impl();
    var import_vector_search_impl = require_vector_search_impl();
    var import_authentication_impl = require_authentication_impl();
    var import_database_impl = require_database_impl();
    var import_query_impl = require_query_impl();
    var import_scheduler_impl = require_scheduler_impl();
    var import_storage_impl = require_storage_impl();
    var import_common = require_common();
    var import_syscall = require_syscall();
    var import_validator = require_validator();
    var import_paths = require_paths();
    var import_meta_impl = require_meta_impl();
    async function invokeMutation(func, argsStr, visibility) {
      const requestId = "";
      const args = (0, import_values3.jsonToConvex)(JSON.parse(argsStr));
      const mutationCtx = {
        db: (0, import_database_impl.setupWriter)(),
        auth: (0, import_authentication_impl.setupAuth)(requestId),
        storage: (0, import_storage_impl.setupStorageWriter)(requestId),
        scheduler: (0, import_scheduler_impl.setupMutationScheduler)(),
        meta: (0, import_meta_impl.setupMutationMeta)(visibility),
        runQuery: (reference, args2, options) => options?.useStaleSnapshot ? runUdf("snapshotQuery", reference, args2, options?.transactionLimits) : runUdf("query", reference, args2, options?.transactionLimits),
        runMutation: (reference, args2, options) => runUdf("mutation", reference, args2, options?.transactionLimits)
      };
      const result = await invokeFunction(func, mutationCtx, args);
      validateReturnValue(result);
      return JSON.stringify((0, import_values3.convexToJson)(result === void 0 ? null : result));
    }
    function validateReturnValue(v22) {
      if (v22 instanceof import_query_impl.QueryInitializerImpl || v22 instanceof import_query_impl.QueryImpl) {
        throw new Error(
          "Return value is a Query. Results must be retrieved with `.collect()`, `.take(n), `.unique()`, or `.first()`."
        );
      }
    }
    async function invokeFunction(func, ctx, args) {
      let result;
      try {
        result = await Promise.resolve(func(ctx, ...args));
      } catch (thrown) {
        throw serializeConvexErrorData(thrown);
      }
      return result;
    }
    function dontCallDirectly(funcType, handler) {
      return (ctx, args) => {
        globalThis.console.warn(
          `Convex functions should not directly call other Convex functions. Consider calling a helper function instead. e.g. \`export const foo = ${funcType}(...); await foo(ctx);\` is not supported. See https://docs.convex.dev/production/best-practices/#use-helper-functions-to-write-shared-code`
        );
        return handler(ctx, args);
      };
    }
    function serializeConvexErrorData(thrown) {
      if (typeof thrown === "object" && thrown !== null && Symbol.for("ConvexError") in thrown) {
        const error = thrown;
        error.data = JSON.stringify(
          (0, import_values3.convexToJson)(error.data === void 0 ? null : error.data)
        );
        error.ConvexErrorSymbol = Symbol.for("ConvexError");
        return error;
      } else {
        return thrown;
      }
    }
    function assertNotBrowser() {
      if (typeof window === "undefined" || window.__convexAllowFunctionsInBrowser) {
        return;
      }
      const isRealBrowser = Object.getOwnPropertyDescriptor(globalThis, "window")?.get?.toString().includes("[native code]") ?? false;
      if (isRealBrowser) {
        console.error(
          "Convex functions should not be imported in the browser. This will throw an error in future versions of `convex`. If this is a false negative, please report it to Convex support."
        );
      }
    }
    function strictReplacer(key, value) {
      if (value === void 0) {
        throw new Error(
          `A validator is undefined for field "${key}". This is often caused by circular imports. See https://docs.convex.dev/error#undefined-validator for details.`
        );
      }
      return value;
    }
    function exportArgs(functionDefinition) {
      return () => {
        let args = import_values3.v.any();
        if (typeof functionDefinition === "object" && functionDefinition.args !== void 0) {
          args = (0, import_validator.asObjectValidator)(functionDefinition.args);
        }
        return JSON.stringify(args.json, strictReplacer);
      };
    }
    function exportReturns(functionDefinition) {
      return () => {
        let returns;
        if (typeof functionDefinition === "object" && functionDefinition.returns !== void 0) {
          returns = (0, import_validator.asObjectValidator)(functionDefinition.returns);
        }
        return JSON.stringify(returns ? returns.json : null, strictReplacer);
      };
    }
    var mutationGeneric2 = (functionDefinition) => {
      const handler = typeof functionDefinition === "function" ? functionDefinition : functionDefinition.handler;
      const func = dontCallDirectly("mutation", handler);
      assertNotBrowser();
      func.isMutation = true;
      func.isPublic = true;
      func.invokeMutation = (argsStr) => invokeMutation(handler, argsStr, "public");
      func.exportArgs = exportArgs(functionDefinition);
      func.exportReturns = exportReturns(functionDefinition);
      func._handler = handler;
      return func;
    };
    var internalMutationGeneric2 = (functionDefinition) => {
      const handler = typeof functionDefinition === "function" ? functionDefinition : functionDefinition.handler;
      const func = dontCallDirectly(
        "internalMutation",
        handler
      );
      assertNotBrowser();
      func.isMutation = true;
      func.isInternal = true;
      func.invokeMutation = (argsStr) => invokeMutation(handler, argsStr, "internal");
      func.exportArgs = exportArgs(functionDefinition);
      func.exportReturns = exportReturns(functionDefinition);
      func._handler = handler;
      return func;
    };
    async function invokeQuery(func, argsStr, visibility) {
      const requestId = "";
      const args = (0, import_values3.jsonToConvex)(JSON.parse(argsStr));
      const queryCtx = {
        db: (0, import_database_impl.setupReader)(),
        auth: (0, import_authentication_impl.setupAuth)(requestId),
        storage: (0, import_storage_impl.setupStorageReader)(requestId),
        meta: (0, import_meta_impl.setupQueryMeta)(visibility),
        runQuery: (reference, args2, options) => {
          if (options?.useStaleSnapshot) {
            throw new Error(
              "`useStaleSnapshot` is only supported in mutations, not queries."
            );
          }
          return runUdf("query", reference, args2, options?.transactionLimits);
        }
      };
      const result = await invokeFunction(func, queryCtx, args);
      validateReturnValue(result);
      return JSON.stringify((0, import_values3.convexToJson)(result === void 0 ? null : result));
    }
    var queryGeneric2 = (functionDefinition) => {
      const handler = typeof functionDefinition === "function" ? functionDefinition : functionDefinition.handler;
      const func = dontCallDirectly("query", handler);
      assertNotBrowser();
      func.isQuery = true;
      func.isPublic = true;
      func.invokeQuery = (argsStr) => invokeQuery(handler, argsStr, "public");
      func.exportArgs = exportArgs(functionDefinition);
      func.exportReturns = exportReturns(functionDefinition);
      func._handler = handler;
      return func;
    };
    var internalQueryGeneric2 = (functionDefinition) => {
      const handler = typeof functionDefinition === "function" ? functionDefinition : functionDefinition.handler;
      const func = dontCallDirectly("internalQuery", handler);
      assertNotBrowser();
      func.isQuery = true;
      func.isInternal = true;
      func.invokeQuery = (argsStr) => invokeQuery(handler, argsStr, "internal");
      func.exportArgs = exportArgs(functionDefinition);
      func.exportReturns = exportReturns(functionDefinition);
      func._handler = handler;
      return func;
    };
    async function invokeAction(func, requestId, argsStr, visibility) {
      const args = (0, import_values3.jsonToConvex)(JSON.parse(argsStr));
      const calls = (0, import_actions_impl.setupActionCalls)(requestId);
      const ctx = {
        ...calls,
        auth: (0, import_authentication_impl.setupAuth)(requestId),
        scheduler: (0, import_scheduler_impl.setupActionScheduler)(requestId),
        storage: (0, import_storage_impl.setupStorageActionWriter)(requestId),
        vectorSearch: (0, import_vector_search_impl.setupActionVectorSearch)(requestId),
        meta: (0, import_meta_impl.setupActionMeta)(visibility)
      };
      const result = await invokeFunction(func, ctx, args);
      return JSON.stringify((0, import_values3.convexToJson)(result === void 0 ? null : result));
    }
    var actionGeneric2 = (functionDefinition) => {
      const handler = typeof functionDefinition === "function" ? functionDefinition : functionDefinition.handler;
      const func = dontCallDirectly("action", handler);
      assertNotBrowser();
      func.isAction = true;
      func.isPublic = true;
      func.invokeAction = (requestId, argsStr) => invokeAction(handler, requestId, argsStr, "public");
      func.exportArgs = exportArgs(functionDefinition);
      func.exportReturns = exportReturns(functionDefinition);
      func._handler = handler;
      return func;
    };
    var internalActionGeneric2 = (functionDefinition) => {
      const handler = typeof functionDefinition === "function" ? functionDefinition : functionDefinition.handler;
      const func = dontCallDirectly("internalAction", handler);
      assertNotBrowser();
      func.isAction = true;
      func.isInternal = true;
      func.invokeAction = (requestId, argsStr) => invokeAction(handler, requestId, argsStr, "internal");
      func.exportArgs = exportArgs(functionDefinition);
      func.exportReturns = exportReturns(functionDefinition);
      func._handler = handler;
      return func;
    };
    async function invokeHttpAction(func, request) {
      const requestId = "";
      const calls = (0, import_actions_impl.setupActionCalls)(requestId);
      const ctx = {
        ...calls,
        auth: (0, import_authentication_impl.setupAuth)(requestId),
        storage: (0, import_storage_impl.setupStorageActionWriter)(requestId),
        scheduler: (0, import_scheduler_impl.setupActionScheduler)(requestId),
        vectorSearch: (0, import_vector_search_impl.setupActionVectorSearch)(requestId),
        meta: (0, import_meta_impl.setupActionMeta)("public")
      };
      return await invokeFunction(func, ctx, [request]);
    }
    var httpActionGeneric2 = (func) => {
      const q = dontCallDirectly("httpAction", func);
      assertNotBrowser();
      q.isHttp = true;
      q.invokeHttpAction = (request) => invokeHttpAction(func, request);
      q._handler = func;
      return q;
    };
    async function runUdf(udfType, f, args, transactionLimits) {
      const queryArgs = (0, import_common.parseArgs)(args);
      const syscallArgs = {
        udfType,
        args: (0, import_values3.convexToJson)(queryArgs),
        ...(0, import_paths.getFunctionAddress)(f)
      };
      if (transactionLimits) {
        syscallArgs.transactionLimits = transactionLimits;
      }
      const result = await (0, import_syscall.performAsyncSyscall)("1.0/runUdf", syscallArgs);
      return (0, import_values3.jsonToConvex)(result);
    }
  }
});

// node_modules/convex/dist/cjs/server/pagination.js
var require_pagination = __commonJS({
  "node_modules/convex/dist/cjs/server/pagination.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var pagination_exports = {};
    __export2(pagination_exports, {
      paginationOptsValidator: () => paginationOptsValidator,
      paginationResultValidator: () => paginationResultValidator
    });
    module2.exports = __toCommonJS2(pagination_exports);
    var import_validator = require_validator();
    var paginationOptsValidator = import_validator.v.object({
      numItems: import_validator.v.number(),
      cursor: import_validator.v.union(import_validator.v.string(), import_validator.v.null()),
      endCursor: import_validator.v.optional(import_validator.v.union(import_validator.v.string(), import_validator.v.null())),
      id: import_validator.v.optional(import_validator.v.number()),
      maximumRowsRead: import_validator.v.optional(import_validator.v.number()),
      maximumBytesRead: import_validator.v.optional(import_validator.v.number())
    });
    function paginationResultValidator(itemValidator) {
      return import_validator.v.object({
        page: import_validator.v.array(itemValidator),
        continueCursor: import_validator.v.string(),
        isDone: import_validator.v.boolean(),
        splitCursor: import_validator.v.optional(import_validator.v.union(import_validator.v.string(), import_validator.v.null())),
        pageStatus: import_validator.v.optional(
          import_validator.v.union(
            import_validator.v.literal("SplitRecommended"),
            import_validator.v.literal("SplitRequired"),
            import_validator.v.null()
          )
        )
      });
    }
  }
});

// node_modules/convex/dist/cjs/server/storage.js
var require_storage = __commonJS({
  "node_modules/convex/dist/cjs/server/storage.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var storage_exports = {};
    module2.exports = __toCommonJS2(storage_exports);
  }
});

// node_modules/convex/dist/cjs/server/api.js
var require_api = __commonJS({
  "node_modules/convex/dist/cjs/server/api.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var api_exports = {};
    __export2(api_exports, {
      anyApi: () => anyApi,
      filterApi: () => filterApi,
      getFunctionName: () => getFunctionName,
      justActions: () => justActions,
      justInternal: () => justInternal,
      justMutations: () => justMutations,
      justPaginatedQueries: () => justPaginatedQueries,
      justPublic: () => justPublic,
      justQueries: () => justQueries,
      justSchedulable: () => justSchedulable,
      makeFunctionReference: () => makeFunctionReference
    });
    module2.exports = __toCommonJS2(api_exports);
    var import_functionName = require_functionName();
    var import_paths = require_paths();
    function getFunctionName(functionReference) {
      const address = (0, import_paths.getFunctionAddress)(functionReference);
      if (address.name === void 0) {
        if (address.functionHandle !== void 0) {
          throw new Error(
            `Expected function reference like "api.file.func" or "internal.file.func", but received function handle ${address.functionHandle}`
          );
        } else if (address.reference !== void 0) {
          throw new Error(
            `Expected function reference in the current component like "api.file.func" or "internal.file.func", but received reference ${address.reference}`
          );
        }
        throw new Error(
          `Expected function reference like "api.file.func" or "internal.file.func", but received ${JSON.stringify(address)}`
        );
      }
      if (typeof functionReference === "string")
        return functionReference;
      const name = functionReference[import_functionName.functionName];
      if (!name) {
        throw new Error(`${functionReference} is not a functionReference`);
      }
      return name;
    }
    function makeFunctionReference(name) {
      return { [import_functionName.functionName]: name };
    }
    function createApi(pathParts = []) {
      const handler = {
        get(_, prop) {
          if (typeof prop === "string") {
            const newParts = [...pathParts, prop];
            return createApi(newParts);
          } else if (prop === import_functionName.functionName) {
            if (pathParts.length < 2) {
              const found = ["api", ...pathParts].join(".");
              throw new Error(
                `API path is expected to be of the form \`api.moduleName.functionName\`. Found: \`${found}\``
              );
            }
            const path = pathParts.slice(0, -1).join("/");
            const exportName = pathParts[pathParts.length - 1];
            if (exportName === "default") {
              return path;
            } else {
              return path + ":" + exportName;
            }
          } else if (prop === Symbol.toStringTag) {
            return "FunctionReference";
          } else {
            return void 0;
          }
        }
      };
      return new Proxy({}, handler);
    }
    function filterApi(api) {
      return api;
    }
    function justInternal(api) {
      return api;
    }
    function justPublic(api) {
      return api;
    }
    function justQueries(api) {
      return api;
    }
    function justMutations(api) {
      return api;
    }
    function justActions(api) {
      return api;
    }
    function justPaginatedQueries(api) {
      return api;
    }
    function justSchedulable(api) {
      return api;
    }
    var anyApi = createApi();
  }
});

// node_modules/convex/dist/cjs/server/cron.js
var require_cron = __commonJS({
  "node_modules/convex/dist/cjs/server/cron.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var cron_exports = {};
    __export2(cron_exports, {
      Crons: () => Crons,
      cronJobs: () => cronJobs
    });
    module2.exports = __toCommonJS2(cron_exports);
    var import_api = require_api();
    var import_common = require_common();
    var import_values3 = require_values();
    var import_paths = require_paths();
    var DAYS_OF_WEEK = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];
    var cronJobs = () => new Crons();
    function validateIntervalNumber(n) {
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error("Interval must be an integer greater than 0");
      }
    }
    function validatedDayOfMonth(n) {
      if (!Number.isInteger(n) || n < 1 || n > 31) {
        throw new Error("Day of month must be an integer from 1 to 31");
      }
      return n;
    }
    function validatedDayOfWeek(s) {
      if (!DAYS_OF_WEEK.includes(s)) {
        throw new Error('Day of week must be a string like "monday".');
      }
      return s;
    }
    function validatedHourOfDay(n) {
      if (!Number.isInteger(n) || n < 0 || n > 23) {
        throw new Error("Hour of day must be an integer from 0 to 23");
      }
      return n;
    }
    function validatedMinuteOfHour(n) {
      if (!Number.isInteger(n) || n < 0 || n > 59) {
        throw new Error("Minute of hour must be an integer from 0 to 59");
      }
      return n;
    }
    function validatedOptionalMinuteOfHour(n) {
      return n === void 0 ? void 0 : validatedMinuteOfHour(n);
    }
    function isSchedulableFunctionReference(arg) {
      try {
        (0, import_paths.getFunctionAddress)(arg);
        return true;
      } catch {
        return false;
      }
    }
    function validatedCronString(s) {
      return s;
    }
    function validatedCronIdentifier(s) {
      if (!s.match(/^[ -~]*$/)) {
        throw new Error(
          `Invalid cron identifier ${s}: use ASCII letters that are not control characters`
        );
      }
      return s;
    }
    var Crons = class {
      constructor() {
        __publicField(this, "crons");
        __publicField(this, "isCrons");
        this.isCrons = true;
        this.crons = {};
      }
      /** @internal */
      schedule(cronIdentifier, schedule, functionReference, args) {
        const cronArgs = (0, import_common.parseArgs)(args);
        validatedCronIdentifier(cronIdentifier);
        if (cronIdentifier in this.crons) {
          throw new Error(`Cron identifier registered twice: ${cronIdentifier}`);
        }
        this.crons[cronIdentifier] = {
          name: (0, import_api.getFunctionName)(functionReference),
          args: [(0, import_values3.convexToJson)(cronArgs)],
          schedule
        };
      }
      /**
       * Schedule a mutation or action to run at some interval.
       *
       * ```js
       * crons.interval("Clear presence data", {seconds: 30}, api.presence.clear);
       * ```
       *
       * @param identifier - A unique name for this scheduled job.
       * @param schedule - The time between runs for this scheduled job.
       * @param functionReference - A {@link FunctionReference} for the function
       * to schedule.
       * @param args - The arguments to the function.
       */
      interval(cronIdentifier, schedule, functionReference, ...args) {
        const s = schedule;
        const hasSeconds = +("seconds" in s && s.seconds !== void 0);
        const hasMinutes = +("minutes" in s && s.minutes !== void 0);
        const hasHours = +("hours" in s && s.hours !== void 0);
        const total = hasSeconds + hasMinutes + hasHours;
        if (total !== 1) {
          throw new Error("Must specify one of seconds, minutes, or hours");
        }
        if (hasSeconds) {
          validateIntervalNumber(schedule.seconds);
        } else if (hasMinutes) {
          validateIntervalNumber(schedule.minutes);
        } else if (hasHours) {
          validateIntervalNumber(schedule.hours);
        }
        this.schedule(
          cronIdentifier,
          { ...schedule, type: "interval" },
          functionReference,
          ...args
        );
      }
      hourly(cronIdentifier, scheduleOrFunctionReference, functionReferenceOrArg, ...args) {
        if (isSchedulableFunctionReference(scheduleOrFunctionReference)) {
          this.schedule(
            cronIdentifier,
            { type: "hourly" },
            scheduleOrFunctionReference,
            functionReferenceOrArg
          );
          return;
        }
        const minuteUTC = validatedOptionalMinuteOfHour(
          scheduleOrFunctionReference.minuteUTC
        );
        this.schedule(
          cronIdentifier,
          minuteUTC === void 0 ? { type: "hourly" } : { minuteUTC, type: "hourly" },
          functionReferenceOrArg,
          ...args
        );
      }
      /**
       * Schedule a mutation or action to run on a daily basis.
       *
       * ```js
       * crons.daily(
       *   "Reset high scores",
       *   {
       *     hourUTC: 17, // (9:30am Pacific/10:30am Daylight Savings Pacific)
       *     minuteUTC: 30,
       *   },
       *   api.scores.reset
       * )
       * ```
       *
       * @param cronIdentifier - A unique name for this scheduled job.
       * @param schedule - What time (UTC) each day to run this function.
       * @param functionReference - A {@link FunctionReference} for the function
       * to schedule.
       * @param args - The arguments to the function.
       */
      daily(cronIdentifier, schedule, functionReference, ...args) {
        const hourUTC = validatedHourOfDay(schedule.hourUTC);
        const minuteUTC = validatedOptionalMinuteOfHour(schedule.minuteUTC);
        this.schedule(
          cronIdentifier,
          minuteUTC === void 0 ? { hourUTC, type: "daily" } : { hourUTC, minuteUTC, type: "daily" },
          functionReference,
          ...args
        );
      }
      /**
       * Schedule a mutation or action to run on a weekly basis.
       *
       * ```js
       * crons.weekly(
       *   "Weekly re-engagement email",
       *   {
       *     dayOfWeek: "Tuesday",
       *     hourUTC: 17, // (9:30am Pacific/10:30am Daylight Savings Pacific)
       *     minuteUTC: 30,
       *   },
       *   api.emails.send
       * )
       * ```
       *
       * @param cronIdentifier - A unique name for this scheduled job.
       * @param schedule - What day and time (UTC) each week to run this function.
       * @param functionReference - A {@link FunctionReference} for the function
       * to schedule.
       */
      weekly(cronIdentifier, schedule, functionReference, ...args) {
        const dayOfWeek = validatedDayOfWeek(schedule.dayOfWeek);
        const hourUTC = validatedHourOfDay(schedule.hourUTC);
        const minuteUTC = validatedOptionalMinuteOfHour(schedule.minuteUTC);
        this.schedule(
          cronIdentifier,
          minuteUTC === void 0 ? { dayOfWeek, hourUTC, type: "weekly" } : { dayOfWeek, hourUTC, minuteUTC, type: "weekly" },
          functionReference,
          ...args
        );
      }
      /**
       * Schedule a mutation or action to run on a monthly basis.
       *
       * Note that some months have fewer days than others, so e.g. a function
       * scheduled to run on the 30th will not run in February.
       *
       * ```js
       * crons.monthly(
       *   "Bill customers at ",
       *   {
       *     hourUTC: 17, // (9:30am Pacific/10:30am Daylight Savings Pacific)
       *     minuteUTC: 30,
       *     day: 1,
       *   },
       *   api.billing.billCustomers
       * )
       * ```
       *
       * @param cronIdentifier - A unique name for this scheduled job.
       * @param schedule - What day and time (UTC) each month to run this function.
       * @param functionReference - A {@link FunctionReference} for the function
       * to schedule.
       * @param args - The arguments to the function.
       */
      monthly(cronIdentifier, schedule, functionReference, ...args) {
        const day = validatedDayOfMonth(schedule.day);
        const hourUTC = validatedHourOfDay(schedule.hourUTC);
        const minuteUTC = validatedOptionalMinuteOfHour(schedule.minuteUTC);
        this.schedule(
          cronIdentifier,
          minuteUTC === void 0 ? { day, hourUTC, type: "monthly" } : { day, hourUTC, minuteUTC, type: "monthly" },
          functionReference,
          ...args
        );
      }
      /**
       * Schedule a mutation or action to run on a recurring basis.
       *
       * Like the unix command `cron`, Sunday is 0, Monday is 1, etc.
       *
       * ```
       *  ┌─ minute (0 - 59)
       *  │ ┌─ hour (0 - 23)
       *  │ │ ┌─ day of the month (1 - 31)
       *  │ │ │ ┌─ month (1 - 12)
       *  │ │ │ │ ┌─ day of the week (0 - 6) (Sunday to Saturday)
       * "* * * * *"
       * ```
       *
       * @param cronIdentifier - A unique name for this scheduled job.
       * @param cron - Cron string like `"15 7 * * *"` (Every day at 7:15 UTC)
       * @param functionReference - A {@link FunctionReference} for the function
       * to schedule.
       * @param args - The arguments to the function.
       */
      cron(cronIdentifier, cron, functionReference, ...args) {
        const c = validatedCronString(cron);
        this.schedule(
          cronIdentifier,
          { cron: c, type: "cron" },
          functionReference,
          ...args
        );
      }
      /** @internal */
      export() {
        return JSON.stringify(this.crons);
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/router.js
var require_router = __commonJS({
  "node_modules/convex/dist/cjs/server/router.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var router_exports = {};
    __export2(router_exports, {
      HttpRouter: () => HttpRouter,
      ROUTABLE_HTTP_METHODS: () => ROUTABLE_HTTP_METHODS,
      httpRouter: () => httpRouter,
      normalizeMethod: () => normalizeMethod
    });
    module2.exports = __toCommonJS2(router_exports);
    var import_syscall = require_syscall();
    var ROUTABLE_HTTP_METHODS = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
      "PATCH"
    ];
    function normalizeMethod(method) {
      if (method === "HEAD")
        return "GET";
      return method;
    }
    var httpRouter = () => new HttpRouter();
    var HttpRouter = class {
      constructor() {
        __publicField(this, "exactRoutes", /* @__PURE__ */ new Map());
        __publicField(this, "prefixRoutes", /* @__PURE__ */ new Map());
        __publicField(this, "isRouter", true);
        __publicField(this, "route", (spec) => {
          if (!spec.handler)
            throw new Error(`route requires handler`);
          if (!spec.method)
            throw new Error(`route requires method`);
          const { method, handler } = spec;
          if (!ROUTABLE_HTTP_METHODS.includes(method)) {
            throw new Error(
              `'${method}' is not an allowed HTTP method (like GET, POST, PUT etc.)`
            );
          }
          if ("path" in spec) {
            if ("pathPrefix" in spec) {
              throw new Error(
                `Invalid httpRouter route: cannot contain both 'path' and 'pathPrefix'`
              );
            }
            if (!spec.path.startsWith("/")) {
              throw new Error(`path '${spec.path}' does not start with a /`);
            }
            if (spec.path.startsWith("/.files/") || spec.path === "/.files") {
              throw new Error(`path '${spec.path}' is reserved`);
            }
            const methods = this.exactRoutes.has(spec.path) ? this.exactRoutes.get(spec.path) : /* @__PURE__ */ new Map();
            if (methods.has(method)) {
              throw new Error(
                `Path '${spec.path}' for method ${method} already in use`
              );
            }
            methods.set(method, handler);
            this.exactRoutes.set(spec.path, methods);
          } else if ("pathPrefix" in spec) {
            if (!spec.pathPrefix.startsWith("/")) {
              throw new Error(
                `pathPrefix '${spec.pathPrefix}' does not start with a /`
              );
            }
            if (!spec.pathPrefix.endsWith("/")) {
              throw new Error(`pathPrefix ${spec.pathPrefix} must end with a /`);
            }
            if (spec.pathPrefix.startsWith("/.files/")) {
              throw new Error(`pathPrefix '${spec.pathPrefix}' is reserved`);
            }
            const prefixes = this.prefixRoutes.get(method) || /* @__PURE__ */ new Map();
            if (prefixes.has(spec.pathPrefix)) {
              throw new Error(
                `${spec.method} pathPrefix ${spec.pathPrefix} is already defined`
              );
            }
            prefixes.set(spec.pathPrefix, handler);
            this.prefixRoutes.set(method, prefixes);
          } else {
            throw new Error(
              `Invalid httpRouter route entry: must contain either field 'path' or 'pathPrefix'`
            );
          }
        });
        __publicField(this, "getRoutes", () => {
          const exactPaths = [...this.exactRoutes.keys()].sort();
          const exact = exactPaths.flatMap(
            (path) => [...this.exactRoutes.get(path).keys()].sort().map(
              (method) => [path, method, this.exactRoutes.get(path).get(method)]
            )
          );
          const prefixPathMethods = [...this.prefixRoutes.keys()].sort();
          const prefixes = prefixPathMethods.flatMap(
            (method) => [...this.prefixRoutes.get(method).keys()].sort().map(
              (pathPrefix) => [
                `${pathPrefix}*`,
                method,
                this.prefixRoutes.get(method).get(pathPrefix)
              ]
            )
          );
          return [...exact, ...prefixes];
        });
        __publicField(this, "lookup", (path, method) => {
          method = normalizeMethod(method);
          const exactMatch = this.exactRoutes.get(path)?.get(method);
          if (exactMatch)
            return [exactMatch, method, path];
          const prefixes = this.prefixRoutes.get(method) || /* @__PURE__ */ new Map();
          const prefixesSorted = [...prefixes.entries()].sort(
            ([prefixA, _a], [prefixB, _b]) => prefixB.length - prefixA.length
          );
          for (const [pathPrefix, endpoint] of prefixesSorted) {
            if (path.startsWith(pathPrefix)) {
              return [endpoint, method, `${pathPrefix}*`];
            }
          }
          return null;
        });
        __publicField(this, "runRequest", async (argsStr, requestRoute) => {
          const request = (0, import_syscall.performJsSyscall)("requestFromConvexJson", {
            convexJson: JSON.parse(argsStr)
          });
          let pathname = requestRoute;
          if (!pathname || typeof pathname !== "string") {
            pathname = new URL(request.url).pathname;
          }
          const method = request.method;
          const match = this.lookup(pathname, method);
          if (!match) {
            const response2 = new Response(`No HttpAction routed for ${pathname}`, {
              status: 404
            });
            return JSON.stringify(
              (0, import_syscall.performJsSyscall)("convexJsonFromResponse", { response: response2 })
            );
          }
          const [endpoint, _method, _path] = match;
          const response = await endpoint.invokeHttpAction(request);
          return JSON.stringify(
            (0, import_syscall.performJsSyscall)("convexJsonFromResponse", { response })
          );
        });
      }
    };
  }
});

// node_modules/convex/dist/cjs/server/components/index.js
var require_components = __commonJS({
  "node_modules/convex/dist/cjs/server/components/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var components_exports = {};
    __export2(components_exports, {
      componentsGeneric: () => componentsGeneric,
      createFunctionHandle: () => createFunctionHandle,
      currentSystemUdfInComponent: () => currentSystemUdfInComponent,
      defineApp: () => defineApp,
      defineComponent: () => defineComponent,
      getFunctionAddress: () => import_paths2.getFunctionAddress
    });
    module2.exports = __toCommonJS2(components_exports);
    var import__ = require_cjs();
    var import_syscall = require_syscall();
    var import_paths = require_paths();
    var import_validator = require_validator();
    var import_paths2 = require_paths();
    async function createFunctionHandle(functionReference) {
      const address = (0, import_paths.getFunctionAddress)(functionReference);
      return await (0, import_syscall.performAsyncSyscall)("1.0/createFunctionHandle", {
        ...address,
        version: import__.version
      });
    }
    var InstalledComponent = class {
      constructor(definition, name) {
        __publicField(this, "_definition");
        __publicField(this, "_name");
        this._definition = definition;
        this._name = name;
        (0, import_paths.setReferencePath)(this, `_reference/childComponent/${name}`);
      }
      get exports() {
        return createExports(this._name, []);
      }
    };
    function createExports(name, pathParts) {
      const handler = {
        get(_, prop) {
          if (typeof prop === "string") {
            const newParts = [...pathParts, prop];
            return createExports(name, newParts);
          } else if (prop === import_paths.toReferencePath) {
            let reference = `_reference/childComponent/${name}`;
            for (const part of pathParts) {
              reference += `/${part}`;
            }
            return reference;
          } else {
            return void 0;
          }
        }
      };
      return new Proxy({}, handler);
    }
    function createEnvRefs(ownerLabel, declared) {
      const handler = {
        get(_, prop) {
          if (typeof prop !== "string") {
            return void 0;
          }
          if (!declared || !Object.prototype.hasOwnProperty.call(declared, prop)) {
            throw new Error(
              `Env var "${prop}" is not declared on ${ownerLabel}. Add it to the \`env\` option of ${ownerLabel === "this app" ? "defineApp" : "defineComponent"}.`
            );
          }
          return { __envVarRef: prop };
        }
      };
      return new Proxy({}, handler);
    }
    function isEnvRef(value) {
      return typeof value === "object" && value !== null && typeof value.__envVarRef === "string";
    }
    function use(definition, options) {
      const importedComponentDefinition = definition;
      if (typeof importedComponentDefinition.componentDefinitionPath !== "string") {
        throw new Error(
          "Component definition does not have the required componentDefinitionPath property. This code only works in Convex runtime."
        );
      }
      const name = options?.name ?? // added recently
      importedComponentDefinition.defaultName ?? // can be removed once backend is out
      importedComponentDefinition.componentDefinitionPath.split("/").pop();
      if (typeof name !== "string") {
        throw new Error(
          `Component name must be a string. Received: ${typeof name}`
        );
      }
      if (name.length === 0) {
        throw new Error("Component name cannot be empty.");
      }
      const httpPrefix = options?.httpPrefix;
      if (httpPrefix !== void 0) {
        if (!httpPrefix.startsWith("/")) {
          throw new Error(
            `httpPrefix must start with "/". Received: "${httpPrefix}"`
          );
        }
      }
      const envValues = {};
      if (options?.env) {
        for (const [key, value] of Object.entries(options.env)) {
          if (value !== void 0) {
            envValues[key] = value;
          }
        }
      }
      this._childComponents.push([
        name,
        importedComponentDefinition,
        envValues,
        httpPrefix
      ]);
      return new InstalledComponent(definition, name);
    }
    function exportAppForAnalysis() {
      const definitionType = { type: "app" };
      const childComponents = serializeChildComponents(this._childComponents);
      const httpMounts = buildHttpMounts(this._childComponents);
      const envVars = this._env ? Object.entries(this._env).map(
        ([name, validator]) => [
          name,
          {
            type: "value",
            value: JSON.stringify(validator.json),
            ...validator.isOptional === "optional" ? { optional: true } : {}
          }
        ]
      ) : void 0;
      return {
        definitionType,
        ...this._httpPrefix !== void 0 ? { httpPrefix: normalizeHttpPrefix(this._httpPrefix) } : {},
        childComponents,
        httpMounts,
        exports: serializeExportTree(this._exportTree),
        ...envVars !== void 0 ? { envVars } : {}
      };
    }
    function serializeExportTree(tree) {
      const branch = [];
      for (const [key, child] of Object.entries(tree)) {
        let node;
        if (typeof child === "string") {
          node = { type: "leaf", leaf: child };
        } else {
          node = serializeExportTree(child);
        }
        branch.push([key, node]);
      }
      return { type: "branch", branch };
    }
    function normalizeHttpPrefix(prefix) {
      return prefix.endsWith("/") ? prefix : prefix + "/";
    }
    function buildHttpMounts(childComponents) {
      const httpMounts = {};
      for (const [name, , , httpPrefix] of childComponents) {
        if (httpPrefix !== void 0) {
          const normalized = normalizeHttpPrefix(httpPrefix);
          httpMounts[normalized] = `_reference/childComponent/${name}`;
        }
      }
      return httpMounts;
    }
    function serializeChildComponents(childComponents) {
      return childComponents.map(([name, definition, p]) => {
        let env2 = null;
        if (p !== null) {
          env2 = [];
          for (const [name2, value] of Object.entries(p)) {
            if (value === void 0) {
              continue;
            }
            if (isEnvRef(value)) {
              env2.push([name2, { type: "envVar", name: value.__envVarRef }]);
            } else if (typeof value === "string") {
              env2.push([name2, { type: "value", value }]);
            } else {
              throw new Error(
                `Env var "${name2}" must be a string or an env var reference. Received: ${typeof value}`
              );
            }
          }
        }
        const path = definition.componentDefinitionPath;
        if (!path)
          throw new Error(
            "no .componentPath for component definition " + JSON.stringify(definition, null, 2)
          );
        return {
          name,
          path,
          args: [],
          env: env2
        };
      });
    }
    function exportComponentForAnalysis() {
      const envVars = Object.entries(this._env).map(
        ([name, validator]) => [
          name,
          {
            type: "value",
            value: JSON.stringify(validator.json),
            ...validator.isOptional === "optional" ? { optional: true } : {}
          }
        ]
      );
      const definitionType = {
        type: "childComponent",
        name: this._name,
        args: []
      };
      const childComponents = serializeChildComponents(this._childComponents);
      const httpMounts = buildHttpMounts(this._childComponents);
      return {
        name: this._name,
        definitionType,
        childComponents,
        httpMounts,
        exports: serializeExportTree(this._exportTree),
        ...envVars.length > 0 ? { envVars } : {}
      };
    }
    function defineComponent(name, options) {
      const envValidators = {};
      if (options?.env) {
        for (const [key, decl] of Object.entries(options.env)) {
          if (decl !== null && decl !== void 0 && (0, import_validator.isValidator)(decl)) {
            envValidators[key] = decl;
          } else {
            throw new Error(
              `Environment variable "${key}" must be defined with a validator (e.g. v.string()).`
            );
          }
        }
      }
      const ret = {
        _isRoot: false,
        _name: name,
        _env: envValidators,
        _childComponents: [],
        _exportTree: {},
        _onInitCallbacks: {},
        env: createEnvRefs(`component "${name}"`, options?.env),
        export: exportComponentForAnalysis,
        use,
        ...{}
      };
      return ret;
    }
    function defineApp(options) {
      const httpPrefix = options?.httpPrefix;
      if (httpPrefix !== void 0 && !httpPrefix.startsWith("/")) {
        throw new Error(
          `httpPrefix must start with "/". Received: "${httpPrefix}"`
        );
      }
      const env2 = options?.env;
      if (env2 !== void 0) {
        for (const [name, validator] of Object.entries(env2)) {
          if (!(0, import_validator.isValidator)(validator)) {
            throw new Error(
              `Environment variable "${name}" must be defined with a validator (e.g. v.string()).`
            );
          }
        }
      }
      const ret = {
        _isRoot: true,
        _childComponents: [],
        _exportTree: {},
        ...httpPrefix !== void 0 ? { _httpPrefix: httpPrefix } : {},
        ...env2 !== void 0 ? { _env: env2 } : {},
        env: createEnvRefs("this app", env2),
        export: exportAppForAnalysis,
        use
      };
      return ret;
    }
    function currentSystemUdfInComponent(componentId) {
      return {
        [import_paths.toReferencePath]: `_reference/currentSystemUdfInComponent/${componentId}`
      };
    }
    function createChildComponents(root, pathParts) {
      const handler = {
        get(_, prop) {
          if (typeof prop === "string") {
            const newParts = [...pathParts, prop];
            return createChildComponents(root, newParts);
          } else if (prop === import_paths.toReferencePath) {
            if (pathParts.length < 1) {
              const found = [root, ...pathParts].join(".");
              throw new Error(
                `API path is expected to be of the form \`${root}.childComponent.functionName\`. Found: \`${found}\``
              );
            }
            return `_reference/childComponent/` + pathParts.join("/");
          } else {
            return void 0;
          }
        }
      };
      return new Proxy({}, handler);
    }
    var componentsGeneric = () => createChildComponents("components", []);
  }
});

// node_modules/convex/dist/cjs/server/logVars.js
var require_logVars = __commonJS({
  "node_modules/convex/dist/cjs/server/logVars.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var logVars_exports = {};
    __export2(logVars_exports, {
      varNames: () => varNames,
      vars: () => vars
    });
    module2.exports = __toCommonJS2(logVars_exports);
    var REQUEST_ID = Symbol("var.requestId");
    var IP = Symbol("var.ip");
    var USER_AGENT = Symbol("var.userAgent");
    var NOW = Symbol("var.now");
    var CONVEX_ACTOR = Symbol("var.convexActor");
    var varNames = {
      [REQUEST_ID]: "requestId",
      [IP]: "ip",
      [USER_AGENT]: "userAgent",
      [NOW]: "now",
      [CONVEX_ACTOR]: "convexActor"
    };
    var vars = {
      /** Resolved to the request ID. */
      requestId: REQUEST_ID,
      /** Resolved to the client's IP address. */
      ip: IP,
      /** Resolved to the client's User-Agent header. */
      userAgent: USER_AGENT,
      /**
       * Resolved to the current server timestamp, as milliseconds from the
       * Unix epoch.
       */
      now: NOW,
      /**
       * If the function was invoked using admin auth (either directly or while
       * acting as an end user, e.g. from the dashboard), resolved to information
       * about the admin. Otherwise, resolved to `null`.
       */
      convexActor: CONVEX_ACTOR
    };
  }
});

// node_modules/convex/dist/cjs/server/audit_logging.js
var require_audit_logging = __commonJS({
  "node_modules/convex/dist/cjs/server/audit_logging.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var audit_logging_exports = {};
    __export2(audit_logging_exports, {
      audit: () => audit,
      cloneWithSentinels: () => cloneWithSentinels
    });
    module2.exports = __toCommonJS2(audit_logging_exports);
    var import__ = require_cjs();
    var import_syscall = require_syscall();
    var import_logVars = require_logVars();
    function validateKey(key) {
      if (key.startsWith("$")) {
        throw new Error(`Audit log body keys must not start with "$": "${key}"`);
      }
    }
    function cloneValue(value) {
      if (typeof value === "symbol") {
        if (!(value in import_logVars.varNames)) {
          throw new Error(`Unknown audit var symbol: ${String(value)}.`);
        }
        return { $var: import_logVars.varNames[value] };
      }
      if (value === null || value === void 0 || typeof value !== "object") {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map(cloneValue);
      }
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        validateKey(key);
        result[key] = cloneValue(val);
      }
      return result;
    }
    function cloneWithSentinels(body) {
      const result = {};
      for (const [key, val] of Object.entries(body)) {
        validateKey(key);
        result[key] = cloneValue(val);
      }
      return result;
    }
    var audit = async (body) => {
      await (0, import_syscall.performAsyncSyscall)("1.0/auditLog", {
        body: cloneWithSentinels(body),
        version: import__.version
      });
    };
  }
});

// node_modules/convex/dist/cjs/server/log.js
var require_log = __commonJS({
  "node_modules/convex/dist/cjs/server/log.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var log_exports = {};
    __export2(log_exports, {
      log: () => log
    });
    module2.exports = __toCommonJS2(log_exports);
    var import_audit_logging = require_audit_logging();
    var import_logVars = require_logVars();
    var log = {
      audit: import_audit_logging.audit,
      vars: import_logVars.vars
    };
  }
});

// node_modules/convex/dist/cjs/server/schema.js
var require_schema = __commonJS({
  "node_modules/convex/dist/cjs/server/schema.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    var schema_exports = {};
    __export2(schema_exports, {
      SchemaDefinition: () => SchemaDefinition,
      TableDefinition: () => TableDefinition,
      defineSchema: () => defineSchema,
      defineTable: () => defineTable,
      docValidator: () => docValidator
    });
    module2.exports = __toCommonJS2(schema_exports);
    var import_validator = require_validator();
    var TableDefinition = class {
      /**
       * @internal
       */
      constructor(documentType) {
        __publicField(this, "indexes");
        __publicField(this, "stagedDbIndexes");
        __publicField(this, "searchIndexes");
        __publicField(this, "stagedSearchIndexes");
        __publicField(this, "vectorIndexes");
        __publicField(this, "stagedVectorIndexes");
        __publicField(this, "validator");
        this.indexes = [];
        this.stagedDbIndexes = [];
        this.searchIndexes = [];
        this.stagedSearchIndexes = [];
        this.vectorIndexes = [];
        this.stagedVectorIndexes = [];
        this.validator = documentType;
      }
      /**
       * This API is experimental: it may change or disappear.
       *
       * Returns indexes defined on this table.
       * Intended for the advanced use cases of dynamically deciding which index to use for a query.
       * If you think you need this, please chime in on ths issue in the Convex JS GitHub repo.
       * https://github.com/get-convex/convex-js/issues/49
       */
      " indexes"() {
        return this.indexes;
      }
      index(name, indexConfig) {
        if (Array.isArray(indexConfig)) {
          this.indexes.push({
            indexDescriptor: name,
            fields: indexConfig
          });
        } else if (indexConfig.staged) {
          this.stagedDbIndexes.push({
            indexDescriptor: name,
            fields: indexConfig.fields
          });
        } else {
          this.indexes.push({
            indexDescriptor: name,
            fields: indexConfig.fields
          });
        }
        return this;
      }
      searchIndex(name, indexConfig) {
        if (indexConfig.staged) {
          this.stagedSearchIndexes.push({
            indexDescriptor: name,
            searchField: indexConfig.searchField,
            filterFields: indexConfig.filterFields || []
          });
        } else {
          this.searchIndexes.push({
            indexDescriptor: name,
            searchField: indexConfig.searchField,
            filterFields: indexConfig.filterFields || []
          });
        }
        return this;
      }
      vectorIndex(name, indexConfig) {
        if (indexConfig.staged) {
          this.stagedVectorIndexes.push({
            indexDescriptor: name,
            vectorField: indexConfig.vectorField,
            dimensions: indexConfig.dimensions,
            filterFields: indexConfig.filterFields || []
          });
        } else {
          this.vectorIndexes.push({
            indexDescriptor: name,
            vectorField: indexConfig.vectorField,
            dimensions: indexConfig.dimensions,
            filterFields: indexConfig.filterFields || []
          });
        }
        return this;
      }
      /**
       * Work around for https://github.com/microsoft/TypeScript/issues/57035
       */
      self() {
        return this;
      }
      /**
       * Export the contents of this definition.
       *
       * This is called internally by the Convex framework.
       * @internal
       */
      export() {
        const documentType = this.validator.json;
        if (typeof documentType !== "object") {
          throw new Error(
            "Invalid validator: please make sure that the parameter of `defineTable` is valid (see https://docs.convex.dev/database/schemas)"
          );
        }
        return {
          indexes: this.indexes,
          stagedDbIndexes: this.stagedDbIndexes,
          searchIndexes: this.searchIndexes,
          stagedSearchIndexes: this.stagedSearchIndexes,
          vectorIndexes: this.vectorIndexes,
          stagedVectorIndexes: this.stagedVectorIndexes,
          documentType
        };
      }
    };
    function defineTable(documentSchema) {
      if ((0, import_validator.isValidator)(documentSchema)) {
        return new TableDefinition(documentSchema);
      } else {
        return new TableDefinition(import_validator.v.object(documentSchema));
      }
    }
    function addSystemFields(tableName, validator) {
      switch (validator.kind) {
        case "object":
          return validator.extend({
            _id: import_validator.v.id(tableName),
            _creationTime: import_validator.v.number()
          });
        case "union":
          return import_validator.v.union(
            ...validator.members.map(
              (member) => addSystemFields(tableName, member)
            )
          );
        case "any":
          return validator;
        default:
          throw new Error(
            `Invalid validator for table "${tableName}": a table's documents must be objects, or a union of objects (see https://docs.convex.dev/database/schemas)`
          );
      }
    }
    function docValidator(tableName, table) {
      return addSystemFields(tableName, table.validator);
    }
    function tableInSchema(schema, tableName) {
      const table = schema.tables[tableName];
      if (table === void 0) {
        throw new Error(
          `Table "${tableName}" is not in this schema. Tables in this schema: ${Object.keys(
            schema.tables
          ).join(", ")}`
        );
      }
      return table;
    }
    var SchemaDefinition = class {
      /**
       * @internal
       */
      constructor(tables, options) {
        __publicField(this, "tables");
        __publicField(this, "strictTableNameTypes");
        __publicField(this, "schemaValidation");
        this.tables = tables;
        this.schemaValidation = options?.schemaValidation === void 0 ? true : options.schemaValidation;
      }
      /**
       * The validator for whole documents of a table in this schema: the table's
       * own validator with the `_id` and `_creationTime` system fields added.
       *
       * @example
       * ```ts
       * export const get = query({
       *   args: { id: schema.id("messages") },
       *   returns: v.union(schema.doc("messages"), v.null()),
       *   handler: (ctx, args) => ctx.db.get(args.id),
       * });
       * ```
       *
       * @param tableName - The name of a table in this schema.
       * @returns A validator matching documents of that table.
       */
      doc(tableName) {
        return docValidator(tableName, tableInSchema(this, tableName));
      }
      /**
       * The validator for IDs of a table in this schema.
       *
       * Same as `v.id(tableName)`, but only accepts tables in this schema.
       *
       * @param tableName - The name of a table in this schema.
       * @returns A validator matching IDs of that table.
       */
      id(tableName) {
        tableInSchema(this, tableName);
        return import_validator.v.id(tableName);
      }
      /**
       * Export the contents of this definition.
       *
       * This is called internally by the Convex framework.
       * @internal
       */
      export() {
        return JSON.stringify({
          tables: Object.entries(this.tables).map(([tableName, definition]) => {
            const {
              indexes,
              stagedDbIndexes,
              searchIndexes,
              stagedSearchIndexes,
              vectorIndexes,
              stagedVectorIndexes,
              documentType
            } = definition.export();
            return {
              tableName,
              indexes,
              stagedDbIndexes,
              searchIndexes,
              stagedSearchIndexes,
              vectorIndexes,
              stagedVectorIndexes,
              documentType
            };
          }),
          schemaValidation: this.schemaValidation
        });
      }
    };
    function defineSchema(schema, options) {
      return new SchemaDefinition(schema, options);
    }
    var _systemSchema = defineSchema({
      _scheduled_functions: defineTable({
        name: import_validator.v.string(),
        args: import_validator.v.array(import_validator.v.any()),
        scheduledTime: import_validator.v.float64(),
        completedTime: import_validator.v.optional(import_validator.v.float64()),
        state: import_validator.v.union(
          import_validator.v.object({ kind: import_validator.v.literal("pending") }),
          import_validator.v.object({ kind: import_validator.v.literal("inProgress") }),
          import_validator.v.object({ kind: import_validator.v.literal("success") }),
          import_validator.v.object({ kind: import_validator.v.literal("failed"), error: import_validator.v.string() }),
          import_validator.v.object({ kind: import_validator.v.literal("canceled") })
        )
      }),
      _storage: defineTable({
        sha256: import_validator.v.string(),
        size: import_validator.v.float64(),
        contentType: import_validator.v.optional(import_validator.v.string())
      })
    });
  }
});

// node_modules/convex/dist/cjs/server/index.js
var require_server = __commonJS({
  "node_modules/convex/dist/cjs/server/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __reExport = (target, mod, secondTarget) => (__copyProps2(target, mod, "default"), secondTarget && __copyProps2(secondTarget, mod, "default"));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var server_exports = {};
    __export2(server_exports, {
      HttpRouter: () => import_router.HttpRouter,
      ROUTABLE_HTTP_METHODS: () => import_router.ROUTABLE_HTTP_METHODS,
      actionGeneric: () => import_registration_impl.actionGeneric,
      anyApi: () => import_api.anyApi,
      componentsGeneric: () => import_components.componentsGeneric,
      createFunctionHandle: () => import_components.createFunctionHandle,
      cronJobs: () => import_cron.cronJobs,
      currentSystemUdfInComponent: () => import_components2.currentSystemUdfInComponent,
      defineApp: () => import_components.defineApp,
      defineComponent: () => import_components.defineComponent,
      defineSchema: () => import_schema.defineSchema,
      defineTable: () => import_schema.defineTable,
      docValidator: () => import_schema.docValidator,
      filterApi: () => import_api.filterApi,
      getFunctionAddress: () => import_components3.getFunctionAddress,
      getFunctionName: () => import_api.getFunctionName,
      getServiceToken: () => import_actions_impl.getServiceToken,
      httpActionGeneric: () => import_registration_impl.httpActionGeneric,
      httpRouter: () => import_router.httpRouter,
      internalActionGeneric: () => import_registration_impl.internalActionGeneric,
      internalMutationGeneric: () => import_registration_impl.internalMutationGeneric,
      internalQueryGeneric: () => import_registration_impl.internalQueryGeneric,
      log: () => import_log.log,
      makeFunctionReference: () => import_api.makeFunctionReference,
      mutationGeneric: () => import_registration_impl.mutationGeneric,
      queryGeneric: () => import_registration_impl.queryGeneric
    });
    module2.exports = __toCommonJS2(server_exports);
    __reExport(server_exports, require_database(), module2.exports);
    var import_registration_impl = require_registration_impl();
    var import_actions_impl = require_actions_impl();
    __reExport(server_exports, require_pagination(), module2.exports);
    __reExport(server_exports, require_search_filter_builder(), module2.exports);
    __reExport(server_exports, require_storage(), module2.exports);
    var import_cron = require_cron();
    var import_router = require_router();
    var import_api = require_api();
    var import_components = require_components();
    var import_components2 = require_components();
    var import_components3 = require_components();
    var import_log = require_log();
    var import_schema = require_schema();
  }
});

// node_modules/zod/v4/core/core.cjs
var require_core = __commonJS({
  "node_modules/zod/v4/core/core.cjs"(exports2) {
    "use strict";
    var _a;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.globalConfig = exports2.$ZodEncodeError = exports2.$ZodAsyncError = exports2.$brand = exports2.NEVER = void 0;
    exports2.$constructor = $constructor;
    exports2.config = config;
    exports2.NEVER = Object.freeze({
      status: "aborted"
    });
    function $constructor(name, initializer, params) {
      function init(inst, def) {
        if (!inst._zod) {
          Object.defineProperty(inst, "_zod", {
            value: {
              def,
              constr: _,
              traits: /* @__PURE__ */ new Set()
            },
            enumerable: false
          });
        }
        if (inst._zod.traits.has(name)) {
          return;
        }
        inst._zod.traits.add(name);
        initializer(inst, def);
        const proto = _.prototype;
        const keys = Object.keys(proto);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (!(k in inst)) {
            inst[k] = proto[k].bind(inst);
          }
        }
      }
      const Parent = params?.Parent ?? Object;
      class Definition extends Parent {
      }
      Object.defineProperty(Definition, "name", { value: name });
      function _(def) {
        var _a2;
        const inst = params?.Parent ? new Definition() : this;
        init(inst, def);
        (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
        for (const fn of inst._zod.deferred) {
          fn();
        }
        return inst;
      }
      Object.defineProperty(_, "init", { value: init });
      Object.defineProperty(_, Symbol.hasInstance, {
        value: (inst) => {
          if (params?.Parent && inst instanceof params.Parent)
            return true;
          return inst?._zod?.traits?.has(name);
        }
      });
      Object.defineProperty(_, "name", { value: name });
      return _;
    }
    exports2.$brand = Symbol("zod_brand");
    var $ZodAsyncError = class extends Error {
      constructor() {
        super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
      }
    };
    exports2.$ZodAsyncError = $ZodAsyncError;
    var $ZodEncodeError = class extends Error {
      constructor(name) {
        super(`Encountered unidirectional transform during encode: ${name}`);
        this.name = "ZodEncodeError";
      }
    };
    exports2.$ZodEncodeError = $ZodEncodeError;
    (_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
    exports2.globalConfig = globalThis.__zod_globalConfig;
    function config(newConfig) {
      if (newConfig)
        Object.assign(exports2.globalConfig, newConfig);
      return exports2.globalConfig;
    }
  }
});

// node_modules/zod/v4/core/util.cjs
var require_util = __commonJS({
  "node_modules/zod/v4/core/util.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Class = exports2.BIGINT_FORMAT_RANGES = exports2.NUMBER_FORMAT_RANGES = exports2.primitiveTypes = exports2.propertyKeyTypes = exports2.getParsedType = exports2.allowsEval = exports2.captureStackTrace = void 0;
    exports2.assertEqual = assertEqual;
    exports2.assertNotEqual = assertNotEqual;
    exports2.assertIs = assertIs;
    exports2.assertNever = assertNever;
    exports2.assert = assert;
    exports2.getEnumValues = getEnumValues;
    exports2.joinValues = joinValues;
    exports2.jsonStringifyReplacer = jsonStringifyReplacer;
    exports2.cached = cached;
    exports2.nullish = nullish;
    exports2.cleanRegex = cleanRegex;
    exports2.floatSafeRemainder = floatSafeRemainder;
    exports2.defineLazy = defineLazy;
    exports2.objectClone = objectClone;
    exports2.assignProp = assignProp;
    exports2.mergeDefs = mergeDefs;
    exports2.cloneDef = cloneDef;
    exports2.getElementAtPath = getElementAtPath;
    exports2.promiseAllObject = promiseAllObject;
    exports2.randomString = randomString;
    exports2.esc = esc;
    exports2.slugify = slugify;
    exports2.isObject = isObject;
    exports2.isPlainObject = isPlainObject;
    exports2.shallowClone = shallowClone;
    exports2.numKeys = numKeys;
    exports2.escapeRegex = escapeRegex;
    exports2.clone = clone;
    exports2.normalizeParams = normalizeParams;
    exports2.createTransparentProxy = createTransparentProxy;
    exports2.stringifyPrimitive = stringifyPrimitive;
    exports2.optionalKeys = optionalKeys;
    exports2.pick = pick;
    exports2.omit = omit;
    exports2.extend = extend;
    exports2.safeExtend = safeExtend;
    exports2.merge = merge;
    exports2.partial = partial;
    exports2.required = required;
    exports2.aborted = aborted;
    exports2.explicitlyAborted = explicitlyAborted;
    exports2.prefixIssues = prefixIssues;
    exports2.unwrapMessage = unwrapMessage;
    exports2.finalizeIssue = finalizeIssue;
    exports2.getSizableOrigin = getSizableOrigin;
    exports2.getLengthableOrigin = getLengthableOrigin;
    exports2.parsedType = parsedType;
    exports2.issue = issue;
    exports2.cleanEnum = cleanEnum;
    exports2.base64ToUint8Array = base64ToUint8Array;
    exports2.uint8ArrayToBase64 = uint8ArrayToBase64;
    exports2.base64urlToUint8Array = base64urlToUint8Array;
    exports2.uint8ArrayToBase64url = uint8ArrayToBase64url;
    exports2.hexToUint8Array = hexToUint8Array;
    exports2.uint8ArrayToHex = uint8ArrayToHex;
    var core_js_1 = require_core();
    function assertEqual(val) {
      return val;
    }
    function assertNotEqual(val) {
      return val;
    }
    function assertIs(_arg) {
    }
    function assertNever(_x) {
      throw new Error("Unexpected value in exhaustive check");
    }
    function assert(_) {
    }
    function getEnumValues(entries) {
      const numericValues = Object.values(entries).filter((v3) => typeof v3 === "number");
      const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v3]) => v3);
      return values;
    }
    function joinValues(array, separator = "|") {
      return array.map((val) => stringifyPrimitive(val)).join(separator);
    }
    function jsonStringifyReplacer(_, value) {
      if (typeof value === "bigint")
        return value.toString();
      return value;
    }
    function cached(getter) {
      const set = false;
      return {
        get value() {
          if (!set) {
            const value = getter();
            Object.defineProperty(this, "value", { value });
            return value;
          }
          throw new Error("cached value already set");
        }
      };
    }
    function nullish(input) {
      return input === null || input === void 0;
    }
    function cleanRegex(source) {
      const start = source.startsWith("^") ? 1 : 0;
      const end = source.endsWith("$") ? source.length - 1 : source.length;
      return source.slice(start, end);
    }
    function floatSafeRemainder(val, step) {
      const ratio = val / step;
      const roundedRatio = Math.round(ratio);
      const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
      if (Math.abs(ratio - roundedRatio) < tolerance)
        return 0;
      return ratio - roundedRatio;
    }
    var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
    function defineLazy(object, key, getter) {
      let value = void 0;
      Object.defineProperty(object, key, {
        get() {
          if (value === EVALUATING) {
            return void 0;
          }
          if (value === void 0) {
            value = EVALUATING;
            value = getter();
          }
          return value;
        },
        set(v3) {
          Object.defineProperty(object, key, {
            value: v3
            // configurable: true,
          });
        },
        configurable: true
      });
    }
    function objectClone(obj) {
      return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
    }
    function assignProp(target, prop, value) {
      Object.defineProperty(target, prop, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    function mergeDefs(...defs) {
      const mergedDescriptors = {};
      for (const def of defs) {
        const descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
      }
      return Object.defineProperties({}, mergedDescriptors);
    }
    function cloneDef(schema) {
      return mergeDefs(schema._zod.def);
    }
    function getElementAtPath(obj, path) {
      if (!path)
        return obj;
      return path.reduce((acc, key) => acc?.[key], obj);
    }
    function promiseAllObject(promisesObj) {
      const keys = Object.keys(promisesObj);
      const promises = keys.map((key) => promisesObj[key]);
      return Promise.all(promises).then((results) => {
        const resolvedObj = {};
        for (let i = 0; i < keys.length; i++) {
          resolvedObj[keys[i]] = results[i];
        }
        return resolvedObj;
      });
    }
    function randomString(length = 10) {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      let str = "";
      for (let i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
      return str;
    }
    function esc(str) {
      return JSON.stringify(str);
    }
    function slugify(input) {
      return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
    }
    exports2.captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
    };
    function isObject(data) {
      return typeof data === "object" && data !== null && !Array.isArray(data);
    }
    exports2.allowsEval = cached(() => {
      if (core_js_1.globalConfig.jitless) {
        return false;
      }
      if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
        return false;
      }
      try {
        const F = Function;
        new F("");
        return true;
      } catch (_) {
        return false;
      }
    });
    function isPlainObject(o) {
      if (isObject(o) === false)
        return false;
      const ctor = o.constructor;
      if (ctor === void 0)
        return true;
      if (typeof ctor !== "function")
        return true;
      const prot = ctor.prototype;
      if (isObject(prot) === false)
        return false;
      if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
        return false;
      }
      return true;
    }
    function shallowClone(o) {
      if (isPlainObject(o))
        return { ...o };
      if (Array.isArray(o))
        return [...o];
      if (o instanceof Map)
        return new Map(o);
      if (o instanceof Set)
        return new Set(o);
      return o;
    }
    function numKeys(data) {
      let keyCount = 0;
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          keyCount++;
        }
      }
      return keyCount;
    }
    var getParsedType = (data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return "undefined";
        case "string":
          return "string";
        case "number":
          return Number.isNaN(data) ? "nan" : "number";
        case "boolean":
          return "boolean";
        case "function":
          return "function";
        case "bigint":
          return "bigint";
        case "symbol":
          return "symbol";
        case "object":
          if (Array.isArray(data)) {
            return "array";
          }
          if (data === null) {
            return "null";
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return "promise";
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return "map";
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return "set";
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return "date";
          }
          if (typeof File !== "undefined" && data instanceof File) {
            return "file";
          }
          return "object";
        default:
          throw new Error(`Unknown data type: ${t}`);
      }
    };
    exports2.getParsedType = getParsedType;
    exports2.propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
    exports2.primitiveTypes = /* @__PURE__ */ new Set([
      "string",
      "number",
      "bigint",
      "boolean",
      "symbol",
      "undefined"
    ]);
    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function clone(inst, def, params) {
      const cl = new inst._zod.constr(def ?? inst._zod.def);
      if (!def || params?.parent)
        cl._zod.parent = inst;
      return cl;
    }
    function normalizeParams(_params) {
      const params = _params;
      if (!params)
        return {};
      if (typeof params === "string")
        return { error: () => params };
      if (params?.message !== void 0) {
        if (params?.error !== void 0)
          throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
      }
      delete params.message;
      if (typeof params.error === "string")
        return { ...params, error: () => params.error };
      return params;
    }
    function createTransparentProxy(getter) {
      let target;
      return new Proxy({}, {
        get(_, prop, receiver) {
          target ?? (target = getter());
          return Reflect.get(target, prop, receiver);
        },
        set(_, prop, value, receiver) {
          target ?? (target = getter());
          return Reflect.set(target, prop, value, receiver);
        },
        has(_, prop) {
          target ?? (target = getter());
          return Reflect.has(target, prop);
        },
        deleteProperty(_, prop) {
          target ?? (target = getter());
          return Reflect.deleteProperty(target, prop);
        },
        ownKeys(_) {
          target ?? (target = getter());
          return Reflect.ownKeys(target);
        },
        getOwnPropertyDescriptor(_, prop) {
          target ?? (target = getter());
          return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        defineProperty(_, prop, descriptor) {
          target ?? (target = getter());
          return Reflect.defineProperty(target, prop, descriptor);
        }
      });
    }
    function stringifyPrimitive(value) {
      if (typeof value === "bigint")
        return value.toString() + "n";
      if (typeof value === "string")
        return `"${value}"`;
      return `${value}`;
    }
    function optionalKeys(shape) {
      return Object.keys(shape).filter((k) => {
        return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
      });
    }
    exports2.NUMBER_FORMAT_RANGES = {
      safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
      int32: [-2147483648, 2147483647],
      uint32: [0, 4294967295],
      float32: [-34028234663852886e22, 34028234663852886e22],
      float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
    };
    exports2.BIGINT_FORMAT_RANGES = {
      int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
      uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
    };
    function pick(schema, mask) {
      const currDef = schema._zod.def;
      const checks = currDef.checks;
      const hasChecks = checks && checks.length > 0;
      if (hasChecks) {
        throw new Error(".pick() cannot be used on object schemas containing refinements");
      }
      const def = mergeDefs(schema._zod.def, {
        get shape() {
          const newShape = {};
          for (const key in mask) {
            if (!(key in currDef.shape)) {
              throw new Error(`Unrecognized key: "${key}"`);
            }
            if (!mask[key])
              continue;
            newShape[key] = currDef.shape[key];
          }
          assignProp(this, "shape", newShape);
          return newShape;
        },
        checks: []
      });
      return clone(schema, def);
    }
    function omit(schema, mask) {
      const currDef = schema._zod.def;
      const checks = currDef.checks;
      const hasChecks = checks && checks.length > 0;
      if (hasChecks) {
        throw new Error(".omit() cannot be used on object schemas containing refinements");
      }
      const def = mergeDefs(schema._zod.def, {
        get shape() {
          const newShape = { ...schema._zod.def.shape };
          for (const key in mask) {
            if (!(key in currDef.shape)) {
              throw new Error(`Unrecognized key: "${key}"`);
            }
            if (!mask[key])
              continue;
            delete newShape[key];
          }
          assignProp(this, "shape", newShape);
          return newShape;
        },
        checks: []
      });
      return clone(schema, def);
    }
    function extend(schema, shape) {
      if (!isPlainObject(shape)) {
        throw new Error("Invalid input to extend: expected a plain object");
      }
      const checks = schema._zod.def.checks;
      const hasChecks = checks && checks.length > 0;
      if (hasChecks) {
        const existingShape = schema._zod.def.shape;
        for (const key in shape) {
          if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
            throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
          }
        }
      }
      const def = mergeDefs(schema._zod.def, {
        get shape() {
          const _shape = { ...schema._zod.def.shape, ...shape };
          assignProp(this, "shape", _shape);
          return _shape;
        }
      });
      return clone(schema, def);
    }
    function safeExtend(schema, shape) {
      if (!isPlainObject(shape)) {
        throw new Error("Invalid input to safeExtend: expected a plain object");
      }
      const def = mergeDefs(schema._zod.def, {
        get shape() {
          const _shape = { ...schema._zod.def.shape, ...shape };
          assignProp(this, "shape", _shape);
          return _shape;
        }
      });
      return clone(schema, def);
    }
    function merge(a, b) {
      if (a._zod.def.checks?.length) {
        throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
      }
      const def = mergeDefs(a._zod.def, {
        get shape() {
          const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
          assignProp(this, "shape", _shape);
          return _shape;
        },
        get catchall() {
          return b._zod.def.catchall;
        },
        checks: b._zod.def.checks ?? []
      });
      return clone(a, def);
    }
    function partial(Class2, schema, mask) {
      const currDef = schema._zod.def;
      const checks = currDef.checks;
      const hasChecks = checks && checks.length > 0;
      if (hasChecks) {
        throw new Error(".partial() cannot be used on object schemas containing refinements");
      }
      const def = mergeDefs(schema._zod.def, {
        get shape() {
          const oldShape = schema._zod.def.shape;
          const shape = { ...oldShape };
          if (mask) {
            for (const key in mask) {
              if (!(key in oldShape)) {
                throw new Error(`Unrecognized key: "${key}"`);
              }
              if (!mask[key])
                continue;
              shape[key] = Class2 ? new Class2({
                type: "optional",
                innerType: oldShape[key]
              }) : oldShape[key];
            }
          } else {
            for (const key in oldShape) {
              shape[key] = Class2 ? new Class2({
                type: "optional",
                innerType: oldShape[key]
              }) : oldShape[key];
            }
          }
          assignProp(this, "shape", shape);
          return shape;
        },
        checks: []
      });
      return clone(schema, def);
    }
    function required(Class2, schema, mask) {
      const def = mergeDefs(schema._zod.def, {
        get shape() {
          const oldShape = schema._zod.def.shape;
          const shape = { ...oldShape };
          if (mask) {
            for (const key in mask) {
              if (!(key in shape)) {
                throw new Error(`Unrecognized key: "${key}"`);
              }
              if (!mask[key])
                continue;
              shape[key] = new Class2({
                type: "nonoptional",
                innerType: oldShape[key]
              });
            }
          } else {
            for (const key in oldShape) {
              shape[key] = new Class2({
                type: "nonoptional",
                innerType: oldShape[key]
              });
            }
          }
          assignProp(this, "shape", shape);
          return shape;
        }
      });
      return clone(schema, def);
    }
    function aborted(x, startIndex = 0) {
      if (x.aborted === true)
        return true;
      for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue !== true) {
          return true;
        }
      }
      return false;
    }
    function explicitlyAborted(x, startIndex = 0) {
      if (x.aborted === true)
        return true;
      for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue === false) {
          return true;
        }
      }
      return false;
    }
    function prefixIssues(path, issues) {
      return issues.map((iss) => {
        var _a;
        (_a = iss).path ?? (_a.path = []);
        iss.path.unshift(path);
        return iss;
      });
    }
    function unwrapMessage(message) {
      return typeof message === "string" ? message : message?.message;
    }
    function finalizeIssue(iss, ctx, config) {
      const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
      const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
      rest.path ?? (rest.path = []);
      rest.message = message;
      if (ctx?.reportInput) {
        rest.input = _input;
      }
      return rest;
    }
    function getSizableOrigin(input) {
      if (input instanceof Set)
        return "set";
      if (input instanceof Map)
        return "map";
      if (input instanceof File)
        return "file";
      return "unknown";
    }
    function getLengthableOrigin(input) {
      if (Array.isArray(input))
        return "array";
      if (typeof input === "string")
        return "string";
      return "unknown";
    }
    function parsedType(data) {
      const t = typeof data;
      switch (t) {
        case "number": {
          return Number.isNaN(data) ? "nan" : "number";
        }
        case "object": {
          if (data === null) {
            return "null";
          }
          if (Array.isArray(data)) {
            return "array";
          }
          const obj = data;
          if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
            return obj.constructor.name;
          }
        }
      }
      return t;
    }
    function issue(...args) {
      const [iss, input, inst] = args;
      if (typeof iss === "string") {
        return {
          message: iss,
          code: "custom",
          input,
          inst
        };
      }
      return { ...iss };
    }
    function cleanEnum(obj) {
      return Object.entries(obj).filter(([k, _]) => {
        return Number.isNaN(Number.parseInt(k, 10));
      }).map((el) => el[1]);
    }
    function base64ToUint8Array(base64) {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    function uint8ArrayToBase64(bytes) {
      let binaryString = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      return btoa(binaryString);
    }
    function base64urlToUint8Array(base64url) {
      const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - base64.length % 4) % 4);
      return base64ToUint8Array(base64 + padding);
    }
    function uint8ArrayToBase64url(bytes) {
      return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    }
    function hexToUint8Array(hex) {
      const cleanHex = hex.replace(/^0x/, "");
      if (cleanHex.length % 2 !== 0) {
        throw new Error("Invalid hex string length");
      }
      const bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
      }
      return bytes;
    }
    function uint8ArrayToHex(bytes) {
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    var Class = class {
      constructor(..._args) {
      }
    };
    exports2.Class = Class;
  }
});

// node_modules/zod/v4/core/errors.cjs
var require_errors2 = __commonJS({
  "node_modules/zod/v4/core/errors.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.$ZodRealError = exports2.$ZodError = void 0;
    exports2.flattenError = flattenError;
    exports2.formatError = formatError;
    exports2.treeifyError = treeifyError;
    exports2.toDotPath = toDotPath;
    exports2.prettifyError = prettifyError;
    var core_js_1 = require_core();
    var util = __importStar(require_util());
    var initializer = (inst, def) => {
      inst.name = "$ZodError";
      Object.defineProperty(inst, "_zod", {
        value: inst._zod,
        enumerable: false
      });
      Object.defineProperty(inst, "issues", {
        value: def,
        enumerable: false
      });
      inst.message = JSON.stringify(def, util.jsonStringifyReplacer, 2);
      Object.defineProperty(inst, "toString", {
        value: () => inst.message,
        enumerable: false
      });
    };
    exports2.$ZodError = (0, core_js_1.$constructor)("$ZodError", initializer);
    exports2.$ZodRealError = (0, core_js_1.$constructor)("$ZodError", initializer, { Parent: Error });
    function flattenError(error, mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of error.issues) {
        if (sub.path.length > 0) {
          fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
          fieldErrors[sub.path[0]].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    function formatError(error, mapper = (issue) => issue.message) {
      const fieldErrors = { _errors: [] };
      const processError = (error2, path = []) => {
        for (const issue of error2.issues) {
          if (issue.code === "invalid_union" && issue.errors.length) {
            issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
          } else if (issue.code === "invalid_key") {
            processError({ issues: issue.issues }, [...path, ...issue.path]);
          } else if (issue.code === "invalid_element") {
            processError({ issues: issue.issues }, [...path, ...issue.path]);
          } else {
            const fullpath = [...path, ...issue.path];
            if (fullpath.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i = 0;
              while (i < fullpath.length) {
                const el = fullpath[i];
                const terminal = i === fullpath.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i++;
              }
            }
          }
        }
      };
      processError(error);
      return fieldErrors;
    }
    function treeifyError(error, mapper = (issue) => issue.message) {
      const result = { errors: [] };
      const processError = (error2, path = []) => {
        var _a, _b;
        for (const issue of error2.issues) {
          if (issue.code === "invalid_union" && issue.errors.length) {
            issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
          } else if (issue.code === "invalid_key") {
            processError({ issues: issue.issues }, [...path, ...issue.path]);
          } else if (issue.code === "invalid_element") {
            processError({ issues: issue.issues }, [...path, ...issue.path]);
          } else {
            const fullpath = [...path, ...issue.path];
            if (fullpath.length === 0) {
              result.errors.push(mapper(issue));
              continue;
            }
            let curr = result;
            let i = 0;
            while (i < fullpath.length) {
              const el = fullpath[i];
              const terminal = i === fullpath.length - 1;
              if (typeof el === "string") {
                curr.properties ?? (curr.properties = {});
                (_a = curr.properties)[el] ?? (_a[el] = { errors: [] });
                curr = curr.properties[el];
              } else {
                curr.items ?? (curr.items = []);
                (_b = curr.items)[el] ?? (_b[el] = { errors: [] });
                curr = curr.items[el];
              }
              if (terminal) {
                curr.errors.push(mapper(issue));
              }
              i++;
            }
          }
        }
      };
      processError(error);
      return result;
    }
    function toDotPath(_path) {
      const segs = [];
      const path = _path.map((seg) => typeof seg === "object" ? seg.key : seg);
      for (const seg of path) {
        if (typeof seg === "number")
          segs.push(`[${seg}]`);
        else if (typeof seg === "symbol")
          segs.push(`[${JSON.stringify(String(seg))}]`);
        else if (/[^\w$]/.test(seg))
          segs.push(`[${JSON.stringify(seg)}]`);
        else {
          if (segs.length)
            segs.push(".");
          segs.push(seg);
        }
      }
      return segs.join("");
    }
    function prettifyError(error) {
      const lines = [];
      const issues = [...error.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
      for (const issue of issues) {
        lines.push(`\u2716 ${issue.message}`);
        if (issue.path?.length)
          lines.push(`  \u2192 at ${toDotPath(issue.path)}`);
      }
      return lines.join("\n");
    }
  }
});

// node_modules/zod/v4/core/parse.cjs
var require_parse = __commonJS({
  "node_modules/zod/v4/core/parse.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.safeDecodeAsync = exports2._safeDecodeAsync = exports2.safeEncodeAsync = exports2._safeEncodeAsync = exports2.safeDecode = exports2._safeDecode = exports2.safeEncode = exports2._safeEncode = exports2.decodeAsync = exports2._decodeAsync = exports2.encodeAsync = exports2._encodeAsync = exports2.decode = exports2._decode = exports2.encode = exports2._encode = exports2.safeParseAsync = exports2._safeParseAsync = exports2.safeParse = exports2._safeParse = exports2.parseAsync = exports2._parseAsync = exports2.parse = exports2._parse = void 0;
    var core = __importStar(require_core());
    var errors = __importStar(require_errors2());
    var util = __importStar(require_util());
    var _parse = (_Err) => (schema, value, _ctx, _params) => {
      const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
      const result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise) {
        throw new core.$ZodAsyncError();
      }
      if (result.issues.length) {
        const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())));
        util.captureStackTrace(e, _params?.callee);
        throw e;
      }
      return result.value;
    };
    exports2._parse = _parse;
    exports2.parse = (0, exports2._parse)(errors.$ZodRealError);
    var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
      const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
      let result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise)
        result = await result;
      if (result.issues.length) {
        const e = new (params?.Err ?? _Err)(result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())));
        util.captureStackTrace(e, params?.callee);
        throw e;
      }
      return result.value;
    };
    exports2._parseAsync = _parseAsync;
    exports2.parseAsync = (0, exports2._parseAsync)(errors.$ZodRealError);
    var _safeParse = (_Err) => (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
      const result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise) {
        throw new core.$ZodAsyncError();
      }
      return result.issues.length ? {
        success: false,
        error: new (_Err ?? errors.$ZodError)(result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())))
      } : { success: true, data: result.value };
    };
    exports2._safeParse = _safeParse;
    exports2.safeParse = (0, exports2._safeParse)(errors.$ZodRealError);
    var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
      let result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise)
        result = await result;
      return result.issues.length ? {
        success: false,
        error: new _Err(result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())))
      } : { success: true, data: result.value };
    };
    exports2._safeParseAsync = _safeParseAsync;
    exports2.safeParseAsync = (0, exports2._safeParseAsync)(errors.$ZodRealError);
    var _encode = (_Err) => (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return (0, exports2._parse)(_Err)(schema, value, ctx);
    };
    exports2._encode = _encode;
    exports2.encode = (0, exports2._encode)(errors.$ZodRealError);
    var _decode = (_Err) => (schema, value, _ctx) => {
      return (0, exports2._parse)(_Err)(schema, value, _ctx);
    };
    exports2._decode = _decode;
    exports2.decode = (0, exports2._decode)(errors.$ZodRealError);
    var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return (0, exports2._parseAsync)(_Err)(schema, value, ctx);
    };
    exports2._encodeAsync = _encodeAsync;
    exports2.encodeAsync = (0, exports2._encodeAsync)(errors.$ZodRealError);
    var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
      return (0, exports2._parseAsync)(_Err)(schema, value, _ctx);
    };
    exports2._decodeAsync = _decodeAsync;
    exports2.decodeAsync = (0, exports2._decodeAsync)(errors.$ZodRealError);
    var _safeEncode = (_Err) => (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return (0, exports2._safeParse)(_Err)(schema, value, ctx);
    };
    exports2._safeEncode = _safeEncode;
    exports2.safeEncode = (0, exports2._safeEncode)(errors.$ZodRealError);
    var _safeDecode = (_Err) => (schema, value, _ctx) => {
      return (0, exports2._safeParse)(_Err)(schema, value, _ctx);
    };
    exports2._safeDecode = _safeDecode;
    exports2.safeDecode = (0, exports2._safeDecode)(errors.$ZodRealError);
    var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return (0, exports2._safeParseAsync)(_Err)(schema, value, ctx);
    };
    exports2._safeEncodeAsync = _safeEncodeAsync;
    exports2.safeEncodeAsync = (0, exports2._safeEncodeAsync)(errors.$ZodRealError);
    var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
      return (0, exports2._safeParseAsync)(_Err)(schema, value, _ctx);
    };
    exports2._safeDecodeAsync = _safeDecodeAsync;
    exports2.safeDecodeAsync = (0, exports2._safeDecodeAsync)(errors.$ZodRealError);
  }
});

// node_modules/zod/v4/core/regexes.cjs
var require_regexes = __commonJS({
  "node_modules/zod/v4/core/regexes.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sha256_base64url = exports2.sha256_base64 = exports2.sha256_hex = exports2.sha1_base64url = exports2.sha1_base64 = exports2.sha1_hex = exports2.md5_base64url = exports2.md5_base64 = exports2.md5_hex = exports2.hex = exports2.uppercase = exports2.lowercase = exports2.undefined = exports2.null = exports2.boolean = exports2.number = exports2.integer = exports2.bigint = exports2.string = exports2.date = exports2.e164 = exports2.httpProtocol = exports2.domain = exports2.hostname = exports2.base64url = exports2.base64 = exports2.cidrv6 = exports2.cidrv4 = exports2.mac = exports2.ipv6 = exports2.ipv4 = exports2.browserEmail = exports2.idnEmail = exports2.unicodeEmail = exports2.rfc5322Email = exports2.html5Email = exports2.email = exports2.uuid7 = exports2.uuid6 = exports2.uuid4 = exports2.uuid = exports2.guid = exports2.extendedDuration = exports2.duration = exports2.nanoid = exports2.ksuid = exports2.xid = exports2.ulid = exports2.cuid2 = exports2.cuid = void 0;
    exports2.sha512_base64url = exports2.sha512_base64 = exports2.sha512_hex = exports2.sha384_base64url = exports2.sha384_base64 = exports2.sha384_hex = void 0;
    exports2.emoji = emoji;
    exports2.time = time;
    exports2.datetime = datetime;
    var util = __importStar(require_util());
    exports2.cuid = /^[cC][0-9a-z]{6,}$/;
    exports2.cuid2 = /^[0-9a-z]+$/;
    exports2.ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
    exports2.xid = /^[0-9a-vA-V]{20}$/;
    exports2.ksuid = /^[A-Za-z0-9]{27}$/;
    exports2.nanoid = /^[a-zA-Z0-9_-]{21}$/;
    exports2.duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
    exports2.extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    exports2.guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
    var uuid = (version) => {
      if (!version)
        return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
      return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
    };
    exports2.uuid = uuid;
    exports2.uuid4 = (0, exports2.uuid)(4);
    exports2.uuid6 = (0, exports2.uuid)(6);
    exports2.uuid7 = (0, exports2.uuid)(7);
    exports2.email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
    exports2.html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    exports2.rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    exports2.unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
    exports2.idnEmail = exports2.unicodeEmail;
    exports2.browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    function emoji() {
      return new RegExp(_emoji, "u");
    }
    exports2.ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    exports2.ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
    var mac = (delimiter) => {
      const escapedDelim = util.escapeRegex(delimiter ?? ":");
      return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
    };
    exports2.mac = mac;
    exports2.cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
    exports2.cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    exports2.base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
    exports2.base64url = /^[A-Za-z0-9_-]*$/;
    exports2.hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
    exports2.domain = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    exports2.httpProtocol = /^https?$/;
    exports2.e164 = /^\+[1-9]\d{6,14}$/;
    var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
    exports2.date = new RegExp(`^${dateSource}$`);
    function timeSource(args) {
      const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
      const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
      return regex;
    }
    function time(args) {
      return new RegExp(`^${timeSource(args)}$`);
    }
    function datetime(args) {
      const time2 = timeSource({ precision: args.precision });
      const opts = ["Z"];
      if (args.local)
        opts.push("");
      if (args.offset)
        opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
      const timeRegex = `${time2}(?:${opts.join("|")})`;
      return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
    }
    var string = (params) => {
      const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
      return new RegExp(`^${regex}$`);
    };
    exports2.string = string;
    exports2.bigint = /^-?\d+n?$/;
    exports2.integer = /^-?\d+$/;
    exports2.number = /^-?\d+(?:\.\d+)?$/;
    exports2.boolean = /^(?:true|false)$/i;
    var _null = /^null$/i;
    exports2.null = _null;
    var _undefined = /^undefined$/i;
    exports2.undefined = _undefined;
    exports2.lowercase = /^[^A-Z]*$/;
    exports2.uppercase = /^[^a-z]*$/;
    exports2.hex = /^[0-9a-fA-F]*$/;
    function fixedBase64(bodyLength, padding) {
      return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
    }
    function fixedBase64url(length) {
      return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
    }
    exports2.md5_hex = /^[0-9a-fA-F]{32}$/;
    exports2.md5_base64 = fixedBase64(22, "==");
    exports2.md5_base64url = fixedBase64url(22);
    exports2.sha1_hex = /^[0-9a-fA-F]{40}$/;
    exports2.sha1_base64 = fixedBase64(27, "=");
    exports2.sha1_base64url = fixedBase64url(27);
    exports2.sha256_hex = /^[0-9a-fA-F]{64}$/;
    exports2.sha256_base64 = fixedBase64(43, "=");
    exports2.sha256_base64url = fixedBase64url(43);
    exports2.sha384_hex = /^[0-9a-fA-F]{96}$/;
    exports2.sha384_base64 = fixedBase64(64, "");
    exports2.sha384_base64url = fixedBase64url(64);
    exports2.sha512_hex = /^[0-9a-fA-F]{128}$/;
    exports2.sha512_base64 = fixedBase64(86, "==");
    exports2.sha512_base64url = fixedBase64url(86);
  }
});

// node_modules/zod/v4/core/checks.cjs
var require_checks = __commonJS({
  "node_modules/zod/v4/core/checks.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.$ZodCheckOverwrite = exports2.$ZodCheckMimeType = exports2.$ZodCheckProperty = exports2.$ZodCheckEndsWith = exports2.$ZodCheckStartsWith = exports2.$ZodCheckIncludes = exports2.$ZodCheckUpperCase = exports2.$ZodCheckLowerCase = exports2.$ZodCheckRegex = exports2.$ZodCheckStringFormat = exports2.$ZodCheckLengthEquals = exports2.$ZodCheckMinLength = exports2.$ZodCheckMaxLength = exports2.$ZodCheckSizeEquals = exports2.$ZodCheckMinSize = exports2.$ZodCheckMaxSize = exports2.$ZodCheckBigIntFormat = exports2.$ZodCheckNumberFormat = exports2.$ZodCheckMultipleOf = exports2.$ZodCheckGreaterThan = exports2.$ZodCheckLessThan = exports2.$ZodCheck = void 0;
    var core = __importStar(require_core());
    var regexes = __importStar(require_regexes());
    var util = __importStar(require_util());
    exports2.$ZodCheck = core.$constructor("$ZodCheck", (inst, def) => {
      var _a;
      inst._zod ?? (inst._zod = {});
      inst._zod.def = def;
      (_a = inst._zod).onattach ?? (_a.onattach = []);
    });
    var numericOriginMap = {
      number: "number",
      bigint: "bigint",
      object: "date"
    };
    exports2.$ZodCheckLessThan = core.$constructor("$ZodCheckLessThan", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      const origin = numericOriginMap[typeof def.value];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
        if (def.value < curr) {
          if (def.inclusive)
            bag.maximum = def.value;
          else
            bag.exclusiveMaximum = def.value;
        }
      });
      inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
          return;
        }
        payload.issues.push({
          origin,
          code: "too_big",
          maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
          input: payload.value,
          inclusive: def.inclusive,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckGreaterThan = core.$constructor("$ZodCheckGreaterThan", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      const origin = numericOriginMap[typeof def.value];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
        if (def.value > curr) {
          if (def.inclusive)
            bag.minimum = def.value;
          else
            bag.exclusiveMinimum = def.value;
        }
      });
      inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
          return;
        }
        payload.issues.push({
          origin,
          code: "too_small",
          minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
          input: payload.value,
          inclusive: def.inclusive,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckMultipleOf = /* @__PURE__ */ core.$constructor("$ZodCheckMultipleOf", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        var _a;
        (_a = inst2._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
      });
      inst._zod.check = (payload) => {
        if (typeof payload.value !== typeof def.value)
          throw new Error("Cannot mix number and bigint in multiple_of check.");
        const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : util.floatSafeRemainder(payload.value, def.value) === 0;
        if (isMultiple)
          return;
        payload.issues.push({
          origin: typeof payload.value,
          code: "not_multiple_of",
          divisor: def.value,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckNumberFormat = core.$constructor("$ZodCheckNumberFormat", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      def.format = def.format || "float64";
      const isInt = def.format?.includes("int");
      const origin = isInt ? "int" : "number";
      const [minimum, maximum] = util.NUMBER_FORMAT_RANGES[def.format];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
        if (isInt)
          bag.pattern = regexes.integer;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        if (isInt) {
          if (!Number.isInteger(input)) {
            payload.issues.push({
              expected: origin,
              format: def.format,
              code: "invalid_type",
              continue: false,
              input,
              inst
            });
            return;
          }
          if (!Number.isSafeInteger(input)) {
            if (input > 0) {
              payload.issues.push({
                input,
                code: "too_big",
                maximum: Number.MAX_SAFE_INTEGER,
                note: "Integers must be within the safe integer range.",
                inst,
                origin,
                inclusive: true,
                continue: !def.abort
              });
            } else {
              payload.issues.push({
                input,
                code: "too_small",
                minimum: Number.MIN_SAFE_INTEGER,
                note: "Integers must be within the safe integer range.",
                inst,
                origin,
                inclusive: true,
                continue: !def.abort
              });
            }
            return;
          }
        }
        if (input < minimum) {
          payload.issues.push({
            origin: "number",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
        if (input > maximum) {
          payload.issues.push({
            origin: "number",
            input,
            code: "too_big",
            maximum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    exports2.$ZodCheckBigIntFormat = core.$constructor("$ZodCheckBigIntFormat", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      const [minimum, maximum] = util.BIGINT_FORMAT_RANGES[def.format];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        if (input < minimum) {
          payload.issues.push({
            origin: "bigint",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
        if (input > maximum) {
          payload.issues.push({
            origin: "bigint",
            input,
            code: "too_big",
            maximum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    exports2.$ZodCheckMaxSize = core.$constructor("$ZodCheckMaxSize", (inst, def) => {
      var _a;
      exports2.$ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
        if (def.maximum < curr)
          inst2._zod.bag.maximum = def.maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size <= def.maximum)
          return;
        payload.issues.push({
          origin: util.getSizableOrigin(input),
          code: "too_big",
          maximum: def.maximum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckMinSize = core.$constructor("$ZodCheckMinSize", (inst, def) => {
      var _a;
      exports2.$ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
        if (def.minimum > curr)
          inst2._zod.bag.minimum = def.minimum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size >= def.minimum)
          return;
        payload.issues.push({
          origin: util.getSizableOrigin(input),
          code: "too_small",
          minimum: def.minimum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckSizeEquals = core.$constructor("$ZodCheckSizeEquals", (inst, def) => {
      var _a;
      exports2.$ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.minimum = def.size;
        bag.maximum = def.size;
        bag.size = def.size;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size === def.size)
          return;
        const tooBig = size > def.size;
        payload.issues.push({
          origin: util.getSizableOrigin(input),
          ...tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size },
          inclusive: true,
          exact: true,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckMaxLength = core.$constructor("$ZodCheckMaxLength", (inst, def) => {
      var _a;
      exports2.$ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
        if (def.maximum < curr)
          inst2._zod.bag.maximum = def.maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length <= def.maximum)
          return;
        const origin = util.getLengthableOrigin(input);
        payload.issues.push({
          origin,
          code: "too_big",
          maximum: def.maximum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckMinLength = core.$constructor("$ZodCheckMinLength", (inst, def) => {
      var _a;
      exports2.$ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
        if (def.minimum > curr)
          inst2._zod.bag.minimum = def.minimum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length >= def.minimum)
          return;
        const origin = util.getLengthableOrigin(input);
        payload.issues.push({
          origin,
          code: "too_small",
          minimum: def.minimum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckLengthEquals = core.$constructor("$ZodCheckLengthEquals", (inst, def) => {
      var _a;
      exports2.$ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.minimum = def.length;
        bag.maximum = def.length;
        bag.length = def.length;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length === def.length)
          return;
        const origin = util.getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
          origin,
          ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
          inclusive: true,
          exact: true,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckStringFormat = core.$constructor("$ZodCheckStringFormat", (inst, def) => {
      var _a, _b;
      exports2.$ZodCheck.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        if (def.pattern) {
          bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
          bag.patterns.add(def.pattern);
        }
      });
      if (def.pattern)
        (_a = inst._zod).check ?? (_a.check = (payload) => {
          def.pattern.lastIndex = 0;
          if (def.pattern.test(payload.value))
            return;
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            ...def.pattern ? { pattern: def.pattern.toString() } : {},
            inst,
            continue: !def.abort
          });
        });
      else
        (_b = inst._zod).check ?? (_b.check = () => {
        });
    });
    exports2.$ZodCheckRegex = core.$constructor("$ZodCheckRegex", (inst, def) => {
      exports2.$ZodCheckStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "regex",
          input: payload.value,
          pattern: def.pattern.toString(),
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckLowerCase = core.$constructor("$ZodCheckLowerCase", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.lowercase);
      exports2.$ZodCheckStringFormat.init(inst, def);
    });
    exports2.$ZodCheckUpperCase = core.$constructor("$ZodCheckUpperCase", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.uppercase);
      exports2.$ZodCheckStringFormat.init(inst, def);
    });
    exports2.$ZodCheckIncludes = core.$constructor("$ZodCheckIncludes", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      const escapedRegex = util.escapeRegex(def.includes);
      const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
      def.pattern = pattern;
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.includes(def.includes, def.position))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "includes",
          includes: def.includes,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckStartsWith = core.$constructor("$ZodCheckStartsWith", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      const pattern = new RegExp(`^${util.escapeRegex(def.prefix)}.*`);
      def.pattern ?? (def.pattern = pattern);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.startsWith(def.prefix))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "starts_with",
          prefix: def.prefix,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckEndsWith = core.$constructor("$ZodCheckEndsWith", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      const pattern = new RegExp(`.*${util.escapeRegex(def.suffix)}$`);
      def.pattern ?? (def.pattern = pattern);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.endsWith(def.suffix))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "ends_with",
          suffix: def.suffix,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    function handleCheckPropertyResult(result, payload, property) {
      if (result.issues.length) {
        payload.issues.push(...util.prefixIssues(property, result.issues));
      }
    }
    exports2.$ZodCheckProperty = core.$constructor("$ZodCheckProperty", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      inst._zod.check = (payload) => {
        const result = def.schema._zod.run({
          value: payload.value[def.property],
          issues: []
        }, {});
        if (result instanceof Promise) {
          return result.then((result2) => handleCheckPropertyResult(result2, payload, def.property));
        }
        handleCheckPropertyResult(result, payload, def.property);
        return;
      };
    });
    exports2.$ZodCheckMimeType = core.$constructor("$ZodCheckMimeType", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      const mimeSet = new Set(def.mime);
      inst._zod.onattach.push((inst2) => {
        inst2._zod.bag.mime = def.mime;
      });
      inst._zod.check = (payload) => {
        if (mimeSet.has(payload.value.type))
          return;
        payload.issues.push({
          code: "invalid_value",
          values: def.mime,
          input: payload.value.type,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCheckOverwrite = core.$constructor("$ZodCheckOverwrite", (inst, def) => {
      exports2.$ZodCheck.init(inst, def);
      inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
      };
    });
  }
});

// node_modules/zod/v4/core/doc.cjs
var require_doc = __commonJS({
  "node_modules/zod/v4/core/doc.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Doc = void 0;
    var Doc = class {
      constructor(args = []) {
        this.content = [];
        this.indent = 0;
        if (this)
          this.args = args;
      }
      indented(fn) {
        this.indent += 1;
        fn(this);
        this.indent -= 1;
      }
      write(arg) {
        if (typeof arg === "function") {
          arg(this, { execution: "sync" });
          arg(this, { execution: "async" });
          return;
        }
        const content = arg;
        const lines = content.split("\n").filter((x) => x);
        const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
        const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
        for (const line of dedented) {
          this.content.push(line);
        }
      }
      compile() {
        const F = Function;
        const args = this?.args;
        const content = this?.content ?? [``];
        const lines = [...content.map((x) => `  ${x}`)];
        return new F(...args, lines.join("\n"));
      }
    };
    exports2.Doc = Doc;
  }
});

// node_modules/zod/v4/core/versions.cjs
var require_versions = __commonJS({
  "node_modules/zod/v4/core/versions.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.version = void 0;
    exports2.version = {
      major: 4,
      minor: 4,
      patch: 3
    };
  }
});

// node_modules/zod/v4/core/schemas.cjs
var require_schemas = __commonJS({
  "node_modules/zod/v4/core/schemas.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.$ZodTuple = exports2.$ZodIntersection = exports2.$ZodDiscriminatedUnion = exports2.$ZodXor = exports2.$ZodUnion = exports2.$ZodObjectJIT = exports2.$ZodObject = exports2.$ZodArray = exports2.$ZodDate = exports2.$ZodVoid = exports2.$ZodNever = exports2.$ZodUnknown = exports2.$ZodAny = exports2.$ZodNull = exports2.$ZodUndefined = exports2.$ZodSymbol = exports2.$ZodBigIntFormat = exports2.$ZodBigInt = exports2.$ZodBoolean = exports2.$ZodNumberFormat = exports2.$ZodNumber = exports2.$ZodCustomStringFormat = exports2.$ZodJWT = exports2.$ZodE164 = exports2.$ZodBase64URL = exports2.$ZodBase64 = exports2.$ZodCIDRv6 = exports2.$ZodCIDRv4 = exports2.$ZodMAC = exports2.$ZodIPv6 = exports2.$ZodIPv4 = exports2.$ZodISODuration = exports2.$ZodISOTime = exports2.$ZodISODate = exports2.$ZodISODateTime = exports2.$ZodKSUID = exports2.$ZodXID = exports2.$ZodULID = exports2.$ZodCUID2 = exports2.$ZodCUID = exports2.$ZodNanoID = exports2.$ZodEmoji = exports2.$ZodURL = exports2.$ZodEmail = exports2.$ZodUUID = exports2.$ZodGUID = exports2.$ZodStringFormat = exports2.$ZodString = exports2.clone = exports2.$ZodType = void 0;
    exports2.$ZodCustom = exports2.$ZodLazy = exports2.$ZodPromise = exports2.$ZodFunction = exports2.$ZodTemplateLiteral = exports2.$ZodReadonly = exports2.$ZodPreprocess = exports2.$ZodCodec = exports2.$ZodPipe = exports2.$ZodNaN = exports2.$ZodCatch = exports2.$ZodSuccess = exports2.$ZodNonOptional = exports2.$ZodPrefault = exports2.$ZodDefault = exports2.$ZodNullable = exports2.$ZodExactOptional = exports2.$ZodOptional = exports2.$ZodTransform = exports2.$ZodFile = exports2.$ZodLiteral = exports2.$ZodEnum = exports2.$ZodSet = exports2.$ZodMap = exports2.$ZodRecord = void 0;
    exports2.isValidBase64 = isValidBase64;
    exports2.isValidBase64URL = isValidBase64URL;
    exports2.isValidJWT = isValidJWT;
    var checks = __importStar(require_checks());
    var core = __importStar(require_core());
    var doc_js_1 = require_doc();
    var parse_js_1 = require_parse();
    var regexes = __importStar(require_regexes());
    var util = __importStar(require_util());
    var versions_js_1 = require_versions();
    exports2.$ZodType = core.$constructor("$ZodType", (inst, def) => {
      var _a;
      inst ?? (inst = {});
      inst._zod.def = def;
      inst._zod.bag = inst._zod.bag || {};
      inst._zod.version = versions_js_1.version;
      const checks2 = [...inst._zod.def.checks ?? []];
      if (inst._zod.traits.has("$ZodCheck")) {
        checks2.unshift(inst);
      }
      for (const ch of checks2) {
        for (const fn of ch._zod.onattach) {
          fn(inst);
        }
      }
      if (checks2.length === 0) {
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(() => {
          inst._zod.run = inst._zod.parse;
        });
      } else {
        const runChecks = (payload, checks3, ctx) => {
          let isAborted = util.aborted(payload);
          let asyncResult;
          for (const ch of checks3) {
            if (ch._zod.def.when) {
              if (util.explicitlyAborted(payload))
                continue;
              const shouldRun = ch._zod.def.when(payload);
              if (!shouldRun)
                continue;
            } else if (isAborted) {
              continue;
            }
            const currLen = payload.issues.length;
            const _ = ch._zod.check(payload);
            if (_ instanceof Promise && ctx?.async === false) {
              throw new core.$ZodAsyncError();
            }
            if (asyncResult || _ instanceof Promise) {
              asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                await _;
                const nextLen = payload.issues.length;
                if (nextLen === currLen)
                  return;
                if (!isAborted)
                  isAborted = util.aborted(payload, currLen);
              });
            } else {
              const nextLen = payload.issues.length;
              if (nextLen === currLen)
                continue;
              if (!isAborted)
                isAborted = util.aborted(payload, currLen);
            }
          }
          if (asyncResult) {
            return asyncResult.then(() => {
              return payload;
            });
          }
          return payload;
        };
        const handleCanaryResult = (canary, payload, ctx) => {
          if (util.aborted(canary)) {
            canary.aborted = true;
            return canary;
          }
          const checkResult = runChecks(payload, checks2, ctx);
          if (checkResult instanceof Promise) {
            if (ctx.async === false)
              throw new core.$ZodAsyncError();
            return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
          }
          return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx) => {
          if (ctx.skipChecks) {
            return inst._zod.parse(payload, ctx);
          }
          if (ctx.direction === "backward") {
            const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
            if (canary instanceof Promise) {
              return canary.then((canary2) => {
                return handleCanaryResult(canary2, payload, ctx);
              });
            }
            return handleCanaryResult(canary, payload, ctx);
          }
          const result = inst._zod.parse(payload, ctx);
          if (result instanceof Promise) {
            if (ctx.async === false)
              throw new core.$ZodAsyncError();
            return result.then((result2) => runChecks(result2, checks2, ctx));
          }
          return runChecks(result, checks2, ctx);
        };
      }
      util.defineLazy(inst, "~standard", () => ({
        validate: (value) => {
          try {
            const r = (0, parse_js_1.safeParse)(inst, value);
            return r.success ? { value: r.data } : { issues: r.error?.issues };
          } catch (_) {
            return (0, parse_js_1.safeParseAsync)(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
          }
        },
        vendor: "zod",
        version: 1
      }));
    });
    var util_js_1 = require_util();
    Object.defineProperty(exports2, "clone", { enumerable: true, get: function() {
      return util_js_1.clone;
    } });
    exports2.$ZodString = core.$constructor("$ZodString", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? regexes.string(inst._zod.bag);
      inst._zod.parse = (payload, _) => {
        if (def.coerce)
          try {
            payload.value = String(payload.value);
          } catch (_2) {
          }
        if (typeof payload.value === "string")
          return payload;
        payload.issues.push({
          expected: "string",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodStringFormat = core.$constructor("$ZodStringFormat", (inst, def) => {
      checks.$ZodCheckStringFormat.init(inst, def);
      exports2.$ZodString.init(inst, def);
    });
    exports2.$ZodGUID = core.$constructor("$ZodGUID", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.guid);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodUUID = core.$constructor("$ZodUUID", (inst, def) => {
      if (def.version) {
        const versionMap = {
          v1: 1,
          v2: 2,
          v3: 3,
          v4: 4,
          v5: 5,
          v6: 6,
          v7: 7,
          v8: 8
        };
        const v3 = versionMap[def.version];
        if (v3 === void 0)
          throw new Error(`Invalid UUID version: "${def.version}"`);
        def.pattern ?? (def.pattern = regexes.uuid(v3));
      } else
        def.pattern ?? (def.pattern = regexes.uuid());
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodEmail = core.$constructor("$ZodEmail", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.email);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodURL = core.$constructor("$ZodURL", (inst, def) => {
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        try {
          const trimmed = payload.value.trim();
          if (!def.normalize && def.protocol?.source === regexes.httpProtocol.source) {
            if (!/^https?:\/\//i.test(trimmed)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid URL format",
                input: payload.value,
                inst,
                continue: !def.abort
              });
              return;
            }
          }
          const url = new URL(trimmed);
          if (def.hostname) {
            def.hostname.lastIndex = 0;
            if (!def.hostname.test(url.hostname)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: def.hostname.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
          }
          if (def.protocol) {
            def.protocol.lastIndex = 0;
            if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid protocol",
                pattern: def.protocol.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
          }
          if (def.normalize) {
            payload.value = url.href;
          } else {
            payload.value = trimmed;
          }
          return;
        } catch (_) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    exports2.$ZodEmoji = core.$constructor("$ZodEmoji", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.emoji());
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodNanoID = core.$constructor("$ZodNanoID", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.nanoid);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodCUID = core.$constructor("$ZodCUID", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.cuid);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodCUID2 = core.$constructor("$ZodCUID2", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.cuid2);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodULID = core.$constructor("$ZodULID", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.ulid);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodXID = core.$constructor("$ZodXID", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.xid);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodKSUID = core.$constructor("$ZodKSUID", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.ksuid);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodISODateTime = core.$constructor("$ZodISODateTime", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.datetime(def));
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodISODate = core.$constructor("$ZodISODate", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.date);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodISOTime = core.$constructor("$ZodISOTime", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.time(def));
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodISODuration = core.$constructor("$ZodISODuration", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.duration);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodIPv4 = core.$constructor("$ZodIPv4", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.ipv4);
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.bag.format = `ipv4`;
    });
    exports2.$ZodIPv6 = core.$constructor("$ZodIPv6", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.ipv6);
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.bag.format = `ipv6`;
      inst._zod.check = (payload) => {
        try {
          new URL(`http://[${payload.value}]`);
        } catch {
          payload.issues.push({
            code: "invalid_format",
            format: "ipv6",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    exports2.$ZodMAC = core.$constructor("$ZodMAC", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.mac(def.delimiter));
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.bag.format = `mac`;
    });
    exports2.$ZodCIDRv4 = core.$constructor("$ZodCIDRv4", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.cidrv4);
      exports2.$ZodStringFormat.init(inst, def);
    });
    exports2.$ZodCIDRv6 = core.$constructor("$ZodCIDRv6", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.cidrv6);
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        const parts = payload.value.split("/");
        try {
          if (parts.length !== 2)
            throw new Error();
          const [address, prefix] = parts;
          if (!prefix)
            throw new Error();
          const prefixNum = Number(prefix);
          if (`${prefixNum}` !== prefix)
            throw new Error();
          if (prefixNum < 0 || prefixNum > 128)
            throw new Error();
          new URL(`http://[${address}]`);
        } catch {
          payload.issues.push({
            code: "invalid_format",
            format: "cidrv6",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    function isValidBase64(data) {
      if (data === "")
        return true;
      if (/\s/.test(data))
        return false;
      if (data.length % 4 !== 0)
        return false;
      try {
        atob(data);
        return true;
      } catch {
        return false;
      }
    }
    exports2.$ZodBase64 = core.$constructor("$ZodBase64", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.base64);
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.bag.contentEncoding = "base64";
      inst._zod.check = (payload) => {
        if (isValidBase64(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "base64",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    function isValidBase64URL(data) {
      if (!regexes.base64url.test(data))
        return false;
      const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      return isValidBase64(padded);
    }
    exports2.$ZodBase64URL = core.$constructor("$ZodBase64URL", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.base64url);
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.bag.contentEncoding = "base64url";
      inst._zod.check = (payload) => {
        if (isValidBase64URL(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "base64url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodE164 = core.$constructor("$ZodE164", (inst, def) => {
      def.pattern ?? (def.pattern = regexes.e164);
      exports2.$ZodStringFormat.init(inst, def);
    });
    function isValidJWT(token, algorithm = null) {
      try {
        const tokensParts = token.split(".");
        if (tokensParts.length !== 3)
          return false;
        const [header] = tokensParts;
        if (!header)
          return false;
        const parsedHeader = JSON.parse(atob(header));
        if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
          return false;
        if (!parsedHeader.alg)
          return false;
        if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
          return false;
        return true;
      } catch {
        return false;
      }
    }
    exports2.$ZodJWT = core.$constructor("$ZodJWT", (inst, def) => {
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        if (isValidJWT(payload.value, def.alg))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "jwt",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodCustomStringFormat = core.$constructor("$ZodCustomStringFormat", (inst, def) => {
      exports2.$ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        if (def.fn(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: def.format,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    exports2.$ZodNumber = core.$constructor("$ZodNumber", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.pattern = inst._zod.bag.pattern ?? regexes.number;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = Number(payload.value);
          } catch (_) {
          }
        const input = payload.value;
        if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
          return payload;
        }
        const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
        payload.issues.push({
          expected: "number",
          code: "invalid_type",
          input,
          inst,
          ...received ? { received } : {}
        });
        return payload;
      };
    });
    exports2.$ZodNumberFormat = core.$constructor("$ZodNumberFormat", (inst, def) => {
      checks.$ZodCheckNumberFormat.init(inst, def);
      exports2.$ZodNumber.init(inst, def);
    });
    exports2.$ZodBoolean = core.$constructor("$ZodBoolean", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.pattern = regexes.boolean;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = Boolean(payload.value);
          } catch (_) {
          }
        const input = payload.value;
        if (typeof input === "boolean")
          return payload;
        payload.issues.push({
          expected: "boolean",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodBigInt = core.$constructor("$ZodBigInt", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.pattern = regexes.bigint;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = BigInt(payload.value);
          } catch (_) {
          }
        if (typeof payload.value === "bigint")
          return payload;
        payload.issues.push({
          expected: "bigint",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodBigIntFormat = core.$constructor("$ZodBigIntFormat", (inst, def) => {
      checks.$ZodCheckBigIntFormat.init(inst, def);
      exports2.$ZodBigInt.init(inst, def);
    });
    exports2.$ZodSymbol = core.$constructor("$ZodSymbol", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "symbol")
          return payload;
        payload.issues.push({
          expected: "symbol",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodUndefined = core.$constructor("$ZodUndefined", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.pattern = regexes.undefined;
      inst._zod.values = /* @__PURE__ */ new Set([void 0]);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
          return payload;
        payload.issues.push({
          expected: "undefined",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodNull = core.$constructor("$ZodNull", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.pattern = regexes.null;
      inst._zod.values = /* @__PURE__ */ new Set([null]);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input === null)
          return payload;
        payload.issues.push({
          expected: "null",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodAny = core.$constructor("$ZodAny", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload) => payload;
    });
    exports2.$ZodUnknown = core.$constructor("$ZodUnknown", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload) => payload;
    });
    exports2.$ZodNever = core.$constructor("$ZodNever", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        payload.issues.push({
          expected: "never",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodVoid = core.$constructor("$ZodVoid", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
          return payload;
        payload.issues.push({
          expected: "void",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodDate = core.$constructor("$ZodDate", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce) {
          try {
            payload.value = new Date(payload.value);
          } catch (_err) {
          }
        }
        const input = payload.value;
        const isDate = input instanceof Date;
        const isValidDate = isDate && !Number.isNaN(input.getTime());
        if (isValidDate)
          return payload;
        payload.issues.push({
          expected: "date",
          code: "invalid_type",
          input,
          ...isDate ? { received: "Invalid Date" } : {},
          inst
        });
        return payload;
      };
    });
    function handleArrayResult(result, final, index) {
      if (result.issues.length) {
        final.issues.push(...util.prefixIssues(index, result.issues));
      }
      final.value[index] = result.value;
    }
    exports2.$ZodArray = core.$constructor("$ZodArray", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
          payload.issues.push({
            expected: "array",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        payload.value = Array(input.length);
        const proms = [];
        for (let i = 0; i < input.length; i++) {
          const item = input[i];
          const result = def.element._zod.run({
            value: item,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
          } else {
            handleArrayResult(result, payload, i);
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => payload);
        }
        return payload;
      };
    });
    function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
      const isPresent = key in input;
      if (result.issues.length) {
        if (isOptionalIn && isOptionalOut && !isPresent) {
          return;
        }
        final.issues.push(...util.prefixIssues(key, result.issues));
      }
      if (!isPresent && !isOptionalIn) {
        if (!result.issues.length) {
          final.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: void 0,
            path: [key]
          });
        }
        return;
      }
      if (result.value === void 0) {
        if (isPresent) {
          final.value[key] = void 0;
        }
      } else {
        final.value[key] = result.value;
      }
    }
    function normalizeDef(def) {
      const keys = Object.keys(def.shape);
      for (const k of keys) {
        if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
          throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
        }
      }
      const okeys = util.optionalKeys(def.shape);
      return {
        ...def,
        keys,
        keySet: new Set(keys),
        numKeys: keys.length,
        optionalKeys: new Set(okeys)
      };
    }
    function handleCatchall(proms, input, payload, ctx, def, inst) {
      const unrecognized = [];
      const keySet = def.keySet;
      const _catchall = def.catchall._zod;
      const t = _catchall.def.type;
      const isOptionalIn = _catchall.optin === "optional";
      const isOptionalOut = _catchall.optout === "optional";
      for (const key in input) {
        if (key === "__proto__")
          continue;
        if (keySet.has(key))
          continue;
        if (t === "never") {
          unrecognized.push(key);
          continue;
        }
        const r = _catchall.run({ value: input[key], issues: [] }, ctx);
        if (r instanceof Promise) {
          proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
        } else {
          handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
        }
      }
      if (unrecognized.length) {
        payload.issues.push({
          code: "unrecognized_keys",
          keys: unrecognized,
          input,
          inst
        });
      }
      if (!proms.length)
        return payload;
      return Promise.all(proms).then(() => {
        return payload;
      });
    }
    exports2.$ZodObject = core.$constructor("$ZodObject", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      const desc = Object.getOwnPropertyDescriptor(def, "shape");
      if (!desc?.get) {
        const sh = def.shape;
        Object.defineProperty(def, "shape", {
          get: () => {
            const newSh = { ...sh };
            Object.defineProperty(def, "shape", {
              value: newSh
            });
            return newSh;
          }
        });
      }
      const _normalized = util.cached(() => normalizeDef(def));
      util.defineLazy(inst._zod, "propValues", () => {
        const shape = def.shape;
        const propValues = {};
        for (const key in shape) {
          const field = shape[key]._zod;
          if (field.values) {
            propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
            for (const v3 of field.values)
              propValues[key].add(v3);
          }
        }
        return propValues;
      });
      const isObject = util.isObject;
      const catchall = def.catchall;
      let value;
      inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
          payload.issues.push({
            expected: "object",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        payload.value = {};
        const proms = [];
        const shape = value.shape;
        for (const key of value.keys) {
          const el = shape[key];
          const isOptionalIn = el._zod.optin === "optional";
          const isOptionalOut = el._zod.optout === "optional";
          const r = el._zod.run({ value: input[key], issues: [] }, ctx);
          if (r instanceof Promise) {
            proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
          } else {
            handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
          }
        }
        if (!catchall) {
          return proms.length ? Promise.all(proms).then(() => payload) : payload;
        }
        return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
      };
    });
    exports2.$ZodObjectJIT = core.$constructor("$ZodObjectJIT", (inst, def) => {
      exports2.$ZodObject.init(inst, def);
      const superParse = inst._zod.parse;
      const _normalized = util.cached(() => normalizeDef(def));
      const generateFastpass = (shape) => {
        const doc = new doc_js_1.Doc(["shape", "payload", "ctx"]);
        const normalized = _normalized.value;
        const parseStr = (key) => {
          const k = util.esc(key);
          return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
        };
        doc.write(`const input = payload.value;`);
        const ids = /* @__PURE__ */ Object.create(null);
        let counter = 0;
        for (const key of normalized.keys) {
          ids[key] = `key_${counter++}`;
        }
        doc.write(`const newResult = {};`);
        for (const key of normalized.keys) {
          const id = ids[key];
          const k = util.esc(key);
          const schema = shape[key];
          const isOptionalIn = schema?._zod?.optin === "optional";
          const isOptionalOut = schema?._zod?.optout === "optional";
          doc.write(`const ${id} = ${parseStr(key)};`);
          if (isOptionalIn && isOptionalOut) {
            doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
          } else if (!isOptionalIn) {
            doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
          } else {
            doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
          }
        }
        doc.write(`payload.value = newResult;`);
        doc.write(`return payload;`);
        const fn = doc.compile();
        return (payload, ctx) => fn(shape, payload, ctx);
      };
      let fastpass;
      const isObject = util.isObject;
      const jit = !core.globalConfig.jitless;
      const allowsEval = util.allowsEval;
      const fastEnabled = jit && allowsEval.value;
      const catchall = def.catchall;
      let value;
      inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
          payload.issues.push({
            expected: "object",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
          if (!fastpass)
            fastpass = generateFastpass(def.shape);
          payload = fastpass(payload, ctx);
          if (!catchall)
            return payload;
          return handleCatchall([], input, payload, ctx, value, inst);
        }
        return superParse(payload, ctx);
      };
    });
    function handleUnionResults(results, final, inst, ctx) {
      for (const result of results) {
        if (result.issues.length === 0) {
          final.value = result.value;
          return final;
        }
      }
      const nonaborted = results.filter((r) => !util.aborted(r));
      if (nonaborted.length === 1) {
        final.value = nonaborted[0].value;
        return nonaborted[0];
      }
      final.issues.push({
        code: "invalid_union",
        input: final.value,
        inst,
        errors: results.map((result) => result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())))
      });
      return final;
    }
    exports2.$ZodUnion = core.$constructor("$ZodUnion", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      util.defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
      util.defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
      util.defineLazy(inst._zod, "values", () => {
        if (def.options.every((o) => o._zod.values)) {
          return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
        }
        return void 0;
      });
      util.defineLazy(inst._zod, "pattern", () => {
        if (def.options.every((o) => o._zod.pattern)) {
          const patterns = def.options.map((o) => o._zod.pattern);
          return new RegExp(`^(${patterns.map((p) => util.cleanRegex(p.source)).join("|")})$`);
        }
        return void 0;
      });
      const first = def.options.length === 1 ? def.options[0]._zod.run : null;
      inst._zod.parse = (payload, ctx) => {
        if (first) {
          return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
          const result = option._zod.run({
            value: payload.value,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            results.push(result);
            async = true;
          } else {
            if (result.issues.length === 0)
              return result;
            results.push(result);
          }
        }
        if (!async)
          return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results2) => {
          return handleUnionResults(results2, payload, inst, ctx);
        });
      };
    });
    function handleExclusiveUnionResults(results, final, inst, ctx) {
      const successes = results.filter((r) => r.issues.length === 0);
      if (successes.length === 1) {
        final.value = successes[0].value;
        return final;
      }
      if (successes.length === 0) {
        final.issues.push({
          code: "invalid_union",
          input: final.value,
          inst,
          errors: results.map((result) => result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())))
        });
      } else {
        final.issues.push({
          code: "invalid_union",
          input: final.value,
          inst,
          errors: [],
          inclusive: false
        });
      }
      return final;
    }
    exports2.$ZodXor = core.$constructor("$ZodXor", (inst, def) => {
      exports2.$ZodUnion.init(inst, def);
      def.inclusive = false;
      const first = def.options.length === 1 ? def.options[0]._zod.run : null;
      inst._zod.parse = (payload, ctx) => {
        if (first) {
          return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
          const result = option._zod.run({
            value: payload.value,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            results.push(result);
            async = true;
          } else {
            results.push(result);
          }
        }
        if (!async)
          return handleExclusiveUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results2) => {
          return handleExclusiveUnionResults(results2, payload, inst, ctx);
        });
      };
    });
    exports2.$ZodDiscriminatedUnion = /* @__PURE__ */ core.$constructor("$ZodDiscriminatedUnion", (inst, def) => {
      def.inclusive = false;
      exports2.$ZodUnion.init(inst, def);
      const _super = inst._zod.parse;
      util.defineLazy(inst._zod, "propValues", () => {
        const propValues = {};
        for (const option of def.options) {
          const pv = option._zod.propValues;
          if (!pv || Object.keys(pv).length === 0)
            throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
          for (const [k, v3] of Object.entries(pv)) {
            if (!propValues[k])
              propValues[k] = /* @__PURE__ */ new Set();
            for (const val of v3) {
              propValues[k].add(val);
            }
          }
        }
        return propValues;
      });
      const disc = util.cached(() => {
        const opts = def.options;
        const map = /* @__PURE__ */ new Map();
        for (const o of opts) {
          const values = o._zod.propValues?.[def.discriminator];
          if (!values || values.size === 0)
            throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
          for (const v3 of values) {
            if (map.has(v3)) {
              throw new Error(`Duplicate discriminator value "${String(v3)}"`);
            }
            map.set(v3, o);
          }
        }
        return map;
      });
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!util.isObject(input)) {
          payload.issues.push({
            code: "invalid_type",
            expected: "object",
            input,
            inst
          });
          return payload;
        }
        const opt = disc.value.get(input?.[def.discriminator]);
        if (opt) {
          return opt._zod.run(payload, ctx);
        }
        if (def.unionFallback || ctx.direction === "backward") {
          return _super(payload, ctx);
        }
        payload.issues.push({
          code: "invalid_union",
          errors: [],
          note: "No matching discriminator",
          discriminator: def.discriminator,
          options: Array.from(disc.value.keys()),
          input,
          path: [def.discriminator],
          inst
        });
        return payload;
      };
    });
    exports2.$ZodIntersection = core.$constructor("$ZodIntersection", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        const left = def.left._zod.run({ value: input, issues: [] }, ctx);
        const right = def.right._zod.run({ value: input, issues: [] }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) {
          return Promise.all([left, right]).then(([left2, right2]) => {
            return handleIntersectionResults(payload, left2, right2);
          });
        }
        return handleIntersectionResults(payload, left, right);
      };
    });
    function mergeValues(a, b) {
      if (a === b) {
        return { valid: true, data: a };
      }
      if (a instanceof Date && b instanceof Date && +a === +b) {
        return { valid: true, data: a };
      }
      if (util.isPlainObject(a) && util.isPlainObject(b)) {
        const bKeys = Object.keys(b);
        const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
          const sharedValue = mergeValues(a[key], b[key]);
          if (!sharedValue.valid) {
            return {
              valid: false,
              mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
            };
          }
          newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
      }
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
          return { valid: false, mergeErrorPath: [] };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
          const itemA = a[index];
          const itemB = b[index];
          const sharedValue = mergeValues(itemA, itemB);
          if (!sharedValue.valid) {
            return {
              valid: false,
              mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
            };
          }
          newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
      }
      return { valid: false, mergeErrorPath: [] };
    }
    function handleIntersectionResults(result, left, right) {
      const unrecKeys = /* @__PURE__ */ new Map();
      let unrecIssue;
      for (const iss of left.issues) {
        if (iss.code === "unrecognized_keys") {
          unrecIssue ?? (unrecIssue = iss);
          for (const k of iss.keys) {
            if (!unrecKeys.has(k))
              unrecKeys.set(k, {});
            unrecKeys.get(k).l = true;
          }
        } else {
          result.issues.push(iss);
        }
      }
      for (const iss of right.issues) {
        if (iss.code === "unrecognized_keys") {
          for (const k of iss.keys) {
            if (!unrecKeys.has(k))
              unrecKeys.set(k, {});
            unrecKeys.get(k).r = true;
          }
        } else {
          result.issues.push(iss);
        }
      }
      const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
      if (bothKeys.length && unrecIssue) {
        result.issues.push({ ...unrecIssue, keys: bothKeys });
      }
      if (util.aborted(result))
        return result;
      const merged = mergeValues(left.value, right.value);
      if (!merged.valid) {
        throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
      }
      result.value = merged.data;
      return result;
    }
    exports2.$ZodTuple = core.$constructor("$ZodTuple", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      const items = def.items;
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
          payload.issues.push({
            input,
            inst,
            expected: "tuple",
            code: "invalid_type"
          });
          return payload;
        }
        payload.value = [];
        const proms = [];
        const optinStart = getTupleOptStart(items, "optin");
        const optoutStart = getTupleOptStart(items, "optout");
        if (!def.rest) {
          if (input.length < optinStart) {
            payload.issues.push({
              code: "too_small",
              minimum: optinStart,
              inclusive: true,
              input,
              inst,
              origin: "array"
            });
            return payload;
          }
          if (input.length > items.length) {
            payload.issues.push({
              code: "too_big",
              maximum: items.length,
              inclusive: true,
              input,
              inst,
              origin: "array"
            });
          }
        }
        const itemResults = new Array(items.length);
        for (let i = 0; i < items.length; i++) {
          const r = items[i]._zod.run({ value: input[i], issues: [] }, ctx);
          if (r instanceof Promise) {
            proms.push(r.then((rr) => {
              itemResults[i] = rr;
            }));
          } else {
            itemResults[i] = r;
          }
        }
        if (def.rest) {
          let i = items.length - 1;
          const rest = input.slice(items.length);
          for (const el of rest) {
            i++;
            const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
            if (result instanceof Promise) {
              proms.push(result.then((r) => handleTupleResult(r, payload, i)));
            } else {
              handleTupleResult(result, payload, i);
            }
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
        }
        return handleTupleResults(itemResults, payload, items, input, optoutStart);
      };
    });
    function getTupleOptStart(items, key) {
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i]._zod[key] !== "optional")
          return i + 1;
      }
      return 0;
    }
    function handleTupleResult(result, final, index) {
      if (result.issues.length) {
        final.issues.push(...util.prefixIssues(index, result.issues));
      }
      final.value[index] = result.value;
    }
    function handleTupleResults(itemResults, final, items, input, optoutStart) {
      for (let i = 0; i < items.length; i++) {
        const r = itemResults[i];
        const isPresent = i < input.length;
        if (r.issues.length) {
          if (!isPresent && i >= optoutStart) {
            final.value.length = i;
            break;
          }
          final.issues.push(...util.prefixIssues(i, r.issues));
        }
        final.value[i] = r.value;
      }
      for (let i = final.value.length - 1; i >= input.length; i--) {
        if (items[i]._zod.optout === "optional" && final.value[i] === void 0) {
          final.value.length = i;
        } else {
          break;
        }
      }
      return final;
    }
    exports2.$ZodRecord = core.$constructor("$ZodRecord", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!util.isPlainObject(input)) {
          payload.issues.push({
            expected: "record",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        const proms = [];
        const values = def.keyType._zod.values;
        if (values) {
          payload.value = {};
          const recordKeys = /* @__PURE__ */ new Set();
          for (const key of values) {
            if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
              recordKeys.add(typeof key === "number" ? key.toString() : key);
              const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
              if (keyResult instanceof Promise) {
                throw new Error("Async schemas not supported in object keys currently");
              }
              if (keyResult.issues.length) {
                payload.issues.push({
                  code: "invalid_key",
                  origin: "record",
                  issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
                  input: key,
                  path: [key],
                  inst
                });
                continue;
              }
              const outKey = keyResult.value;
              const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
              if (result instanceof Promise) {
                proms.push(result.then((result2) => {
                  if (result2.issues.length) {
                    payload.issues.push(...util.prefixIssues(key, result2.issues));
                  }
                  payload.value[outKey] = result2.value;
                }));
              } else {
                if (result.issues.length) {
                  payload.issues.push(...util.prefixIssues(key, result.issues));
                }
                payload.value[outKey] = result.value;
              }
            }
          }
          let unrecognized;
          for (const key in input) {
            if (!recordKeys.has(key)) {
              unrecognized = unrecognized ?? [];
              unrecognized.push(key);
            }
          }
          if (unrecognized && unrecognized.length > 0) {
            payload.issues.push({
              code: "unrecognized_keys",
              input,
              inst,
              keys: unrecognized
            });
          }
        } else {
          payload.value = {};
          for (const key of Reflect.ownKeys(input)) {
            if (key === "__proto__")
              continue;
            if (!Object.prototype.propertyIsEnumerable.call(input, key))
              continue;
            let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
            if (keyResult instanceof Promise) {
              throw new Error("Async schemas not supported in object keys currently");
            }
            const checkNumericKey = typeof key === "string" && regexes.number.test(key) && keyResult.issues.length;
            if (checkNumericKey) {
              const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
              if (retryResult instanceof Promise) {
                throw new Error("Async schemas not supported in object keys currently");
              }
              if (retryResult.issues.length === 0) {
                keyResult = retryResult;
              }
            }
            if (keyResult.issues.length) {
              if (def.mode === "loose") {
                payload.value[key] = input[key];
              } else {
                payload.issues.push({
                  code: "invalid_key",
                  origin: "record",
                  issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
                  input: key,
                  path: [key],
                  inst
                });
              }
              continue;
            }
            const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
            if (result instanceof Promise) {
              proms.push(result.then((result2) => {
                if (result2.issues.length) {
                  payload.issues.push(...util.prefixIssues(key, result2.issues));
                }
                payload.value[keyResult.value] = result2.value;
              }));
            } else {
              if (result.issues.length) {
                payload.issues.push(...util.prefixIssues(key, result.issues));
              }
              payload.value[keyResult.value] = result.value;
            }
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => payload);
        }
        return payload;
      };
    });
    exports2.$ZodMap = core.$constructor("$ZodMap", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Map)) {
          payload.issues.push({
            expected: "map",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        const proms = [];
        payload.value = /* @__PURE__ */ new Map();
        for (const [key, value] of input) {
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          const valueResult = def.valueType._zod.run({ value, issues: [] }, ctx);
          if (keyResult instanceof Promise || valueResult instanceof Promise) {
            proms.push(Promise.all([keyResult, valueResult]).then(([keyResult2, valueResult2]) => {
              handleMapResult(keyResult2, valueResult2, payload, key, input, inst, ctx);
            }));
          } else {
            handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
          }
        }
        if (proms.length)
          return Promise.all(proms).then(() => payload);
        return payload;
      };
    });
    function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
      if (keyResult.issues.length) {
        if (util.propertyKeyTypes.has(typeof key)) {
          final.issues.push(...util.prefixIssues(key, keyResult.issues));
        } else {
          final.issues.push({
            code: "invalid_key",
            origin: "map",
            input,
            inst,
            issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))
          });
        }
      }
      if (valueResult.issues.length) {
        if (util.propertyKeyTypes.has(typeof key)) {
          final.issues.push(...util.prefixIssues(key, valueResult.issues));
        } else {
          final.issues.push({
            origin: "map",
            code: "invalid_element",
            input,
            inst,
            key,
            issues: valueResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))
          });
        }
      }
      final.value.set(keyResult.value, valueResult.value);
    }
    exports2.$ZodSet = core.$constructor("$ZodSet", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Set)) {
          payload.issues.push({
            input,
            inst,
            expected: "set",
            code: "invalid_type"
          });
          return payload;
        }
        const proms = [];
        payload.value = /* @__PURE__ */ new Set();
        for (const item of input) {
          const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => handleSetResult(result2, payload)));
          } else
            handleSetResult(result, payload);
        }
        if (proms.length)
          return Promise.all(proms).then(() => payload);
        return payload;
      };
    });
    function handleSetResult(result, final) {
      if (result.issues.length) {
        final.issues.push(...result.issues);
      }
      final.value.add(result.value);
    }
    exports2.$ZodEnum = core.$constructor("$ZodEnum", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      const values = util.getEnumValues(def.entries);
      const valuesSet = new Set(values);
      inst._zod.values = valuesSet;
      inst._zod.pattern = new RegExp(`^(${values.filter((k) => util.propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? util.escapeRegex(o) : o.toString()).join("|")})$`);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (valuesSet.has(input)) {
          return payload;
        }
        payload.issues.push({
          code: "invalid_value",
          values,
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodLiteral = core.$constructor("$ZodLiteral", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      if (def.values.length === 0) {
        throw new Error("Cannot create literal schema with no valid values");
      }
      const values = new Set(def.values);
      inst._zod.values = values;
      inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? util.escapeRegex(o) : o ? util.escapeRegex(o.toString()) : String(o)).join("|")})$`);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (values.has(input)) {
          return payload;
        }
        payload.issues.push({
          code: "invalid_value",
          values: def.values,
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodFile = core.$constructor("$ZodFile", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input instanceof File)
          return payload;
        payload.issues.push({
          expected: "file",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    exports2.$ZodTransform = core.$constructor("$ZodTransform", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.optin = "optional";
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          throw new core.$ZodEncodeError(inst.constructor.name);
        }
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
          const output = _out instanceof Promise ? _out : Promise.resolve(_out);
          return output.then((output2) => {
            payload.value = output2;
            payload.fallback = true;
            return payload;
          });
        }
        if (_out instanceof Promise) {
          throw new core.$ZodAsyncError();
        }
        payload.value = _out;
        payload.fallback = true;
        return payload;
      };
    });
    function handleOptionalResult(result, input) {
      if (input === void 0 && (result.issues.length || result.fallback)) {
        return { issues: [], value: void 0 };
      }
      return result;
    }
    exports2.$ZodOptional = core.$constructor("$ZodOptional", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.optin = "optional";
      inst._zod.optout = "optional";
      util.defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
      });
      util.defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${util.cleanRegex(pattern.source)})?$`) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        if (def.innerType._zod.optin === "optional") {
          const input = payload.value;
          const result = def.innerType._zod.run(payload, ctx);
          if (result instanceof Promise)
            return result.then((r) => handleOptionalResult(r, input));
          return handleOptionalResult(result, input);
        }
        if (payload.value === void 0) {
          return payload;
        }
        return def.innerType._zod.run(payload, ctx);
      };
    });
    exports2.$ZodExactOptional = core.$constructor("$ZodExactOptional", (inst, def) => {
      exports2.$ZodOptional.init(inst, def);
      util.defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      util.defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
      inst._zod.parse = (payload, ctx) => {
        return def.innerType._zod.run(payload, ctx);
      };
    });
    exports2.$ZodNullable = core.$constructor("$ZodNullable", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      util.defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
      util.defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
      util.defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${util.cleanRegex(pattern.source)}|null)$`) : void 0;
      });
      util.defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        if (payload.value === null)
          return payload;
        return def.innerType._zod.run(payload, ctx);
      };
    });
    exports2.$ZodDefault = core.$constructor("$ZodDefault", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.optin = "optional";
      util.defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        if (payload.value === void 0) {
          payload.value = def.defaultValue;
          return payload;
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => handleDefaultResult(result2, def));
        }
        return handleDefaultResult(result, def);
      };
    });
    function handleDefaultResult(payload, def) {
      if (payload.value === void 0) {
        payload.value = def.defaultValue;
      }
      return payload;
    }
    exports2.$ZodPrefault = core.$constructor("$ZodPrefault", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.optin = "optional";
      util.defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        if (payload.value === void 0) {
          payload.value = def.defaultValue;
        }
        return def.innerType._zod.run(payload, ctx);
      };
    });
    exports2.$ZodNonOptional = core.$constructor("$ZodNonOptional", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      util.defineLazy(inst._zod, "values", () => {
        const v3 = def.innerType._zod.values;
        return v3 ? new Set([...v3].filter((x) => x !== void 0)) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => handleNonOptionalResult(result2, inst));
        }
        return handleNonOptionalResult(result, inst);
      };
    });
    function handleNonOptionalResult(payload, inst) {
      if (!payload.issues.length && payload.value === void 0) {
        payload.issues.push({
          code: "invalid_type",
          expected: "nonoptional",
          input: payload.value,
          inst
        });
      }
      return payload;
    }
    exports2.$ZodSuccess = core.$constructor("$ZodSuccess", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          throw new core.$ZodEncodeError("ZodSuccess");
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => {
            payload.value = result2.issues.length === 0;
            return payload;
          });
        }
        payload.value = result.issues.length === 0;
        return payload;
      };
    });
    exports2.$ZodCatch = core.$constructor("$ZodCatch", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.optin = "optional";
      util.defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
      util.defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => {
            payload.value = result2.value;
            if (result2.issues.length) {
              payload.value = def.catchValue({
                ...payload,
                error: {
                  issues: result2.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))
                },
                input: payload.value
              });
              payload.issues = [];
              payload.fallback = true;
            }
            return payload;
          });
        }
        payload.value = result.value;
        if (result.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      };
    });
    exports2.$ZodNaN = core.$constructor("$ZodNaN", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
          payload.issues.push({
            input: payload.value,
            inst,
            expected: "nan",
            code: "invalid_type"
          });
          return payload;
        }
        return payload;
      };
    });
    exports2.$ZodPipe = core.$constructor("$ZodPipe", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      util.defineLazy(inst._zod, "values", () => def.in._zod.values);
      util.defineLazy(inst._zod, "optin", () => def.in._zod.optin);
      util.defineLazy(inst._zod, "optout", () => def.out._zod.optout);
      util.defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          const right = def.out._zod.run(payload, ctx);
          if (right instanceof Promise) {
            return right.then((right2) => handlePipeResult(right2, def.in, ctx));
          }
          return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) {
          return left.then((left2) => handlePipeResult(left2, def.out, ctx));
        }
        return handlePipeResult(left, def.out, ctx);
      };
    });
    function handlePipeResult(left, next, ctx) {
      if (left.issues.length) {
        left.aborted = true;
        return left;
      }
      return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
    }
    exports2.$ZodCodec = core.$constructor("$ZodCodec", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      util.defineLazy(inst._zod, "values", () => def.in._zod.values);
      util.defineLazy(inst._zod, "optin", () => def.in._zod.optin);
      util.defineLazy(inst._zod, "optout", () => def.out._zod.optout);
      util.defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
      inst._zod.parse = (payload, ctx) => {
        const direction = ctx.direction || "forward";
        if (direction === "forward") {
          const left = def.in._zod.run(payload, ctx);
          if (left instanceof Promise) {
            return left.then((left2) => handleCodecAResult(left2, def, ctx));
          }
          return handleCodecAResult(left, def, ctx);
        } else {
          const right = def.out._zod.run(payload, ctx);
          if (right instanceof Promise) {
            return right.then((right2) => handleCodecAResult(right2, def, ctx));
          }
          return handleCodecAResult(right, def, ctx);
        }
      };
    });
    function handleCodecAResult(result, def, ctx) {
      if (result.issues.length) {
        result.aborted = true;
        return result;
      }
      const direction = ctx.direction || "forward";
      if (direction === "forward") {
        const transformed = def.transform(result.value, result);
        if (transformed instanceof Promise) {
          return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
        }
        return handleCodecTxResult(result, transformed, def.out, ctx);
      } else {
        const transformed = def.reverseTransform(result.value, result);
        if (transformed instanceof Promise) {
          return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
        }
        return handleCodecTxResult(result, transformed, def.in, ctx);
      }
    }
    function handleCodecTxResult(left, value, nextSchema, ctx) {
      if (left.issues.length) {
        left.aborted = true;
        return left;
      }
      return nextSchema._zod.run({ value, issues: left.issues }, ctx);
    }
    exports2.$ZodPreprocess = core.$constructor("$ZodPreprocess", (inst, def) => {
      exports2.$ZodPipe.init(inst, def);
    });
    exports2.$ZodReadonly = core.$constructor("$ZodReadonly", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      util.defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
      util.defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      util.defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
      util.defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
      inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then(handleReadonlyResult);
        }
        return handleReadonlyResult(result);
      };
    });
    function handleReadonlyResult(payload) {
      payload.value = Object.freeze(payload.value);
      return payload;
    }
    exports2.$ZodTemplateLiteral = core.$constructor("$ZodTemplateLiteral", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      const regexParts = [];
      for (const part of def.parts) {
        if (typeof part === "object" && part !== null) {
          if (!part._zod.pattern) {
            throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
          }
          const source = part._zod.pattern instanceof RegExp ? part._zod.pattern.source : part._zod.pattern;
          if (!source)
            throw new Error(`Invalid template literal part: ${part._zod.traits}`);
          const start = source.startsWith("^") ? 1 : 0;
          const end = source.endsWith("$") ? source.length - 1 : source.length;
          regexParts.push(source.slice(start, end));
        } else if (part === null || util.primitiveTypes.has(typeof part)) {
          regexParts.push(util.escapeRegex(`${part}`));
        } else {
          throw new Error(`Invalid template literal part: ${part}`);
        }
      }
      inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "string") {
          payload.issues.push({
            input: payload.value,
            inst,
            expected: "string",
            code: "invalid_type"
          });
          return payload;
        }
        inst._zod.pattern.lastIndex = 0;
        if (!inst._zod.pattern.test(payload.value)) {
          payload.issues.push({
            input: payload.value,
            inst,
            code: "invalid_format",
            format: def.format ?? "template_literal",
            pattern: inst._zod.pattern.source
          });
          return payload;
        }
        return payload;
      };
    });
    exports2.$ZodFunction = core.$constructor("$ZodFunction", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._def = def;
      inst._zod.def = def;
      inst.implement = (func) => {
        if (typeof func !== "function") {
          throw new Error("implement() must be called with a function");
        }
        return function(...args) {
          const parsedArgs = inst._def.input ? (0, parse_js_1.parse)(inst._def.input, args) : args;
          const result = Reflect.apply(func, this, parsedArgs);
          if (inst._def.output) {
            return (0, parse_js_1.parse)(inst._def.output, result);
          }
          return result;
        };
      };
      inst.implementAsync = (func) => {
        if (typeof func !== "function") {
          throw new Error("implementAsync() must be called with a function");
        }
        return async function(...args) {
          const parsedArgs = inst._def.input ? await (0, parse_js_1.parseAsync)(inst._def.input, args) : args;
          const result = await Reflect.apply(func, this, parsedArgs);
          if (inst._def.output) {
            return await (0, parse_js_1.parseAsync)(inst._def.output, result);
          }
          return result;
        };
      };
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "function") {
          payload.issues.push({
            code: "invalid_type",
            expected: "function",
            input: payload.value,
            inst
          });
          return payload;
        }
        const hasPromiseOutput = inst._def.output && inst._def.output._zod.def.type === "promise";
        if (hasPromiseOutput) {
          payload.value = inst.implementAsync(payload.value);
        } else {
          payload.value = inst.implement(payload.value);
        }
        return payload;
      };
      inst.input = (...args) => {
        const F = inst.constructor;
        if (Array.isArray(args[0])) {
          return new F({
            type: "function",
            input: new exports2.$ZodTuple({
              type: "tuple",
              items: args[0],
              rest: args[1]
            }),
            output: inst._def.output
          });
        }
        return new F({
          type: "function",
          input: args[0],
          output: inst._def.output
        });
      };
      inst.output = (output) => {
        const F = inst.constructor;
        return new F({
          type: "function",
          input: inst._def.input,
          output
        });
      };
      return inst;
    });
    exports2.$ZodPromise = core.$constructor("$ZodPromise", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
      };
    });
    exports2.$ZodLazy = core.$constructor("$ZodLazy", (inst, def) => {
      exports2.$ZodType.init(inst, def);
      util.defineLazy(inst._zod, "innerType", () => {
        const d = def;
        if (!d._cachedInner)
          d._cachedInner = def.getter();
        return d._cachedInner;
      });
      util.defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
      util.defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
      util.defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? void 0);
      util.defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? void 0);
      inst._zod.parse = (payload, ctx) => {
        const inner = inst._zod.innerType;
        return inner._zod.run(payload, ctx);
      };
    });
    exports2.$ZodCustom = core.$constructor("$ZodCustom", (inst, def) => {
      checks.$ZodCheck.init(inst, def);
      exports2.$ZodType.init(inst, def);
      inst._zod.parse = (payload, _) => {
        return payload;
      };
      inst._zod.check = (payload) => {
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) {
          return r.then((r2) => handleRefineResult(r2, payload, input, inst));
        }
        handleRefineResult(r, payload, input, inst);
        return;
      };
    });
    function handleRefineResult(result, payload, input, inst) {
      if (!result) {
        const _iss = {
          code: "custom",
          input,
          inst,
          // incorporates params.error into issue reporting
          path: [...inst._zod.def.path ?? []],
          // incorporates params.error into issue reporting
          continue: !inst._zod.def.abort
          // params: inst._zod.def.params,
        };
        if (inst._zod.def.params)
          _iss.params = inst._zod.def.params;
        payload.issues.push(util.issue(_iss));
      }
    }
  }
});

// node_modules/zod/v4/locales/ar.cjs
var require_ar = __commonJS({
  "node_modules/zod/v4/locales/ar.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u062D\u0631\u0641", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
        file: { unit: "\u0628\u0627\u064A\u062A", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
        array: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
        set: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0645\u062F\u062E\u0644",
        email: "\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
        url: "\u0631\u0627\u0628\u0637",
        emoji: "\u0625\u064A\u0645\u0648\u062C\u064A",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        date: "\u062A\u0627\u0631\u064A\u062E \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        time: "\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        duration: "\u0645\u062F\u0629 \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        ipv4: "\u0639\u0646\u0648\u0627\u0646 IPv4",
        ipv6: "\u0639\u0646\u0648\u0627\u0646 IPv6",
        cidrv4: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv4",
        cidrv6: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv6",
        base64: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64-encoded",
        base64url: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64url-encoded",
        json_string: "\u0646\u064E\u0635 \u0639\u0644\u0649 \u0647\u064A\u0626\u0629 JSON",
        e164: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0628\u0645\u0639\u064A\u0627\u0631 E.164",
        jwt: "JWT",
        template_literal: "\u0645\u062F\u062E\u0644"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 instanceof ${issue.expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
            }
            return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u0627\u062E\u062A\u064A\u0627\u0631 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062A\u0648\u0642\u0639 \u0627\u0646\u062A\u0642\u0627\u0621 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A: ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return ` \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"}`;
            return `\u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 "${issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0646\u062A\u0647\u064A \u0628\u0640 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0636\u0645\u0651\u064E\u0646 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0646\u0645\u0637 ${_issue.pattern}`;
            return `${FormatDictionary[_issue.format] ?? issue.format} \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644`;
          }
          case "not_multiple_of":
            return `\u0631\u0642\u0645 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0646 \u0645\u0636\u0627\u0639\u0641\u0627\u062A ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u0645\u0639\u0631\u0641${issue.keys.length > 1 ? "\u0627\u062A" : ""} \u063A\u0631\u064A\u0628${issue.keys.length > 1 ? "\u0629" : ""}: ${util.joinValues(issue.keys, "\u060C ")}`;
          case "invalid_key":
            return `\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue.origin}`;
          case "invalid_union":
            return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
          case "invalid_element":
            return `\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue.origin}`;
          default:
            return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/az.cjs
var require_az = __commonJS({
  "node_modules/zod/v4/locales/az.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "simvol", verb: "olmal\u0131d\u0131r" },
        file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
        array: { unit: "element", verb: "olmal\u0131d\u0131r" },
        set: { unit: "element", verb: "olmal\u0131d\u0131r" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n instanceof ${issue.expected}, daxil olan ${received}`;
            }
            return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${expected}, daxil olan ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${util.stringifyPrimitive(issue.values[0])}`;
            return `Yanl\u0131\u015F se\xE7im: a\u015Fa\u011F\u0131dak\u0131lardan biri olmal\u0131d\u0131r: ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue.origin ?? "d\u0259y\u0259r"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "element"}`;
            return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue.origin ?? "d\u0259y\u0259r"} ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue.origin} ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Yanl\u0131\u015F m\u0259tn: "${_issue.prefix}" il\u0259 ba\u015Flamal\u0131d\u0131r`;
            if (_issue.format === "ends_with")
              return `Yanl\u0131\u015F m\u0259tn: "${_issue.suffix}" il\u0259 bitm\u0259lidir`;
            if (_issue.format === "includes")
              return `Yanl\u0131\u015F m\u0259tn: "${_issue.includes}" daxil olmal\u0131d\u0131r`;
            if (_issue.format === "regex")
              return `Yanl\u0131\u015F m\u0259tn: ${_issue.pattern} \u015Fablonuna uy\u011Fun olmal\u0131d\u0131r`;
            return `Yanl\u0131\u015F ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Yanl\u0131\u015F \u0259d\u0259d: ${issue.divisor} il\u0259 b\xF6l\xFCn\u0259 bil\u0259n olmal\u0131d\u0131r`;
          case "unrecognized_keys":
            return `Tan\u0131nmayan a\xE7ar${issue.keys.length > 1 ? "lar" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `${issue.origin} daxilind\u0259 yanl\u0131\u015F a\xE7ar`;
          case "invalid_union":
            return "Yanl\u0131\u015F d\u0259y\u0259r";
          case "invalid_element":
            return `${issue.origin} daxilind\u0259 yanl\u0131\u015F d\u0259y\u0259r`;
          default:
            return `Yanl\u0131\u015F d\u0259y\u0259r`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/be.cjs
var require_be = __commonJS({
  "node_modules/zod/v4/locales/be.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    function getBelarusianPlural(count, one, few, many) {
      const absCount = Math.abs(count);
      const lastDigit = absCount % 10;
      const lastTwoDigits = absCount % 100;
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return many;
      }
      if (lastDigit === 1) {
        return one;
      }
      if (lastDigit >= 2 && lastDigit <= 4) {
        return few;
      }
      return many;
    }
    var error = () => {
      const Sizable = {
        string: {
          unit: {
            one: "\u0441\u0456\u043C\u0432\u0430\u043B",
            few: "\u0441\u0456\u043C\u0432\u0430\u043B\u044B",
            many: "\u0441\u0456\u043C\u0432\u0430\u043B\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        },
        array: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        },
        set: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        },
        file: {
          unit: {
            one: "\u0431\u0430\u0439\u0442",
            few: "\u0431\u0430\u0439\u0442\u044B",
            many: "\u0431\u0430\u0439\u0442\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0443\u0432\u043E\u0434",
        email: "email \u0430\u0434\u0440\u0430\u0441",
        url: "URL",
        emoji: "\u044D\u043C\u043E\u0434\u0437\u0456",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0434\u0430\u0442\u0430 \u0456 \u0447\u0430\u0441",
        date: "ISO \u0434\u0430\u0442\u0430",
        time: "ISO \u0447\u0430\u0441",
        duration: "ISO \u043F\u0440\u0430\u0446\u044F\u0433\u043B\u0430\u0441\u0446\u044C",
        ipv4: "IPv4 \u0430\u0434\u0440\u0430\u0441",
        ipv6: "IPv6 \u0430\u0434\u0440\u0430\u0441",
        cidrv4: "IPv4 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
        cidrv6: "IPv6 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
        base64: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64",
        base64url: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64url",
        json_string: "JSON \u0440\u0430\u0434\u043E\u043A",
        e164: "\u043D\u0443\u043C\u0430\u0440 E.164",
        jwt: "JWT",
        template_literal: "\u0443\u0432\u043E\u0434"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u043B\u0456\u043A",
        array: "\u043C\u0430\u0441\u0456\u045E"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F instanceof ${issue.expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
            }
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F ${expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0432\u0430\u0440\u044B\u044F\u043D\u0442: \u0447\u0430\u043A\u0430\u045E\u0441\u044F \u0430\u0434\u0437\u0456\u043D \u0437 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              const maxValue = Number(issue.maximum);
              const unit = getBelarusianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue.maximum.toString()} ${unit}`;
            }
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              const minValue = Number(issue.minimum);
              const unit = getBelarusianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue.minimum.toString()} ${unit}`;
            }
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u043F\u0430\u0447\u044B\u043D\u0430\u0446\u0446\u0430 \u0437 "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u0430\u043A\u0430\u043D\u0447\u0432\u0430\u0446\u0446\u0430 \u043D\u0430 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u043C\u044F\u0448\u0447\u0430\u0446\u044C "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0430\u0434\u043F\u0430\u0432\u044F\u0434\u0430\u0446\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043B\u0456\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0431\u044B\u0446\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u041D\u0435\u0440\u0430\u0441\u043F\u0430\u0437\u043D\u0430\u043D\u044B ${issue.keys.length > 1 ? "\u043A\u043B\u044E\u0447\u044B" : "\u043A\u043B\u044E\u0447"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043A\u043B\u044E\u0447 \u0443 ${issue.origin}`;
          case "invalid_union":
            return "\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434";
          case "invalid_element":
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u0430\u0435 \u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435 \u045E ${issue.origin}`;
          default:
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/bg.cjs
var require_bg = __commonJS({
  "node_modules/zod/v4/locales/bg.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
        file: { unit: "\u0431\u0430\u0439\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
        array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
        set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0432\u0445\u043E\u0434",
        email: "\u0438\u043C\u0435\u0439\u043B \u0430\u0434\u0440\u0435\u0441",
        url: "URL",
        emoji: "\u0435\u043C\u043E\u0434\u0436\u0438",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0432\u0440\u0435\u043C\u0435",
        date: "ISO \u0434\u0430\u0442\u0430",
        time: "ISO \u0432\u0440\u0435\u043C\u0435",
        duration: "ISO \u043F\u0440\u043E\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E\u0441\u0442",
        ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
        ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
        cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
        cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
        base64: "base64-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
        base64url: "base64url-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
        json_string: "JSON \u043D\u0438\u0437",
        e164: "E.164 \u043D\u043E\u043C\u0435\u0440",
        jwt: "JWT",
        template_literal: "\u0432\u0445\u043E\u0434"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0447\u0438\u0441\u043B\u043E",
        array: "\u043C\u0430\u0441\u0438\u0432"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D instanceof ${issue.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
            }
            return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u043E\u043F\u0446\u0438\u044F: \u043E\u0447\u0430\u043A\u0432\u0430\u043D\u043E \u0435\u0434\u043D\u043E \u043E\u0442 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430"}`;
            return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue.origin} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue.origin} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u0432\u0430 \u0441 "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u0432\u044A\u0440\u0448\u0432\u0430 \u0441 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0432\u043A\u043B\u044E\u0447\u0432\u0430 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0441\u044A\u0432\u043F\u0430\u0434\u0430 \u0441 ${_issue.pattern}`;
            let invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D";
            if (_issue.format === "emoji")
              invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
            if (_issue.format === "datetime")
              invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
            if (_issue.format === "date")
              invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
            if (_issue.format === "time")
              invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
            if (_issue.format === "duration")
              invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
            return `${invalid_adj} ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E \u0447\u0438\u0441\u043B\u043E: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0431\u044A\u0434\u0435 \u043A\u0440\u0430\u0442\u043D\u043E \u043D\u0430 ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u041D\u0435\u0440\u0430\u0437\u043F\u043E\u0437\u043D\u0430\u0442${issue.keys.length > 1 ? "\u0438" : ""} \u043A\u043B\u044E\u0447${issue.keys.length > 1 ? "\u043E\u0432\u0435" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043A\u043B\u044E\u0447 \u0432 ${issue.origin}`;
          case "invalid_union":
            return "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434";
          case "invalid_element":
            return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442 \u0432 ${issue.origin}`;
          default:
            return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ca.cjs
var require_ca = __commonJS({
  "node_modules/zod/v4/locales/ca.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "car\xE0cters", verb: "contenir" },
        file: { unit: "bytes", verb: "contenir" },
        array: { unit: "elements", verb: "contenir" },
        set: { unit: "elements", verb: "contenir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entrada",
        email: "adre\xE7a electr\xF2nica",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data i hora ISO",
        date: "data ISO",
        time: "hora ISO",
        duration: "durada ISO",
        ipv4: "adre\xE7a IPv4",
        ipv6: "adre\xE7a IPv6",
        cidrv4: "rang IPv4",
        cidrv6: "rang IPv6",
        base64: "cadena codificada en base64",
        base64url: "cadena codificada en base64url",
        json_string: "cadena JSON",
        e164: "n\xFAmero E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Tipus inv\xE0lid: s'esperava instanceof ${issue.expected}, s'ha rebut ${received}`;
            }
            return `Tipus inv\xE0lid: s'esperava ${expected}, s'ha rebut ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Valor inv\xE0lid: s'esperava ${util.stringifyPrimitive(issue.values[0])}`;
            return `Opci\xF3 inv\xE0lida: s'esperava una de ${util.joinValues(issue.values, " o ")}`;
          case "too_big": {
            const adj = issue.inclusive ? "com a m\xE0xim" : "menys de";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Massa gran: s'esperava que ${issue.origin ?? "el valor"} contingu\xE9s ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
            return `Massa gran: s'esperava que ${issue.origin ?? "el valor"} fos ${adj} ${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? "com a m\xEDnim" : "m\xE9s de";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Massa petit: s'esperava que ${issue.origin} contingu\xE9s ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Massa petit: s'esperava que ${issue.origin} fos ${adj} ${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `Format inv\xE0lid: ha de comen\xE7ar amb "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Format inv\xE0lid: ha d'acabar amb "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Format inv\xE0lid: ha d'incloure "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Format inv\xE0lid: ha de coincidir amb el patr\xF3 ${_issue.pattern}`;
            return `Format inv\xE0lid per a ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `N\xFAmero inv\xE0lid: ha de ser m\xFAltiple de ${issue.divisor}`;
          case "unrecognized_keys":
            return `Clau${issue.keys.length > 1 ? "s" : ""} no reconeguda${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Clau inv\xE0lida a ${issue.origin}`;
          case "invalid_union":
            return "Entrada inv\xE0lida";
          case "invalid_element":
            return `Element inv\xE0lid a ${issue.origin}`;
          default:
            return `Entrada inv\xE0lida`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/cs.cjs
var require_cs = __commonJS({
  "node_modules/zod/v4/locales/cs.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "znak\u016F", verb: "m\xEDt" },
        file: { unit: "bajt\u016F", verb: "m\xEDt" },
        array: { unit: "prvk\u016F", verb: "m\xEDt" },
        set: { unit: "prvk\u016F", verb: "m\xEDt" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "regul\xE1rn\xED v\xFDraz",
        email: "e-mailov\xE1 adresa",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "datum a \u010Das ve form\xE1tu ISO",
        date: "datum ve form\xE1tu ISO",
        time: "\u010Das ve form\xE1tu ISO",
        duration: "doba trv\xE1n\xED ISO",
        ipv4: "IPv4 adresa",
        ipv6: "IPv6 adresa",
        cidrv4: "rozsah IPv4",
        cidrv6: "rozsah IPv6",
        base64: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64",
        base64url: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64url",
        json_string: "\u0159et\u011Bzec ve form\xE1tu JSON",
        e164: "\u010D\xEDslo E.164",
        jwt: "JWT",
        template_literal: "vstup"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u010D\xEDslo",
        string: "\u0159et\u011Bzec",
        function: "funkce",
        array: "pole"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no instanceof ${issue.expected}, obdr\u017Eeno ${received}`;
            }
            return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${expected}, obdr\u017Eeno ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${util.stringifyPrimitive(issue.values[0])}`;
            return `Neplatn\xE1 mo\u017Enost: o\u010Dek\xE1v\xE1na jedna z hodnot ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue.maximum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
            }
            return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue.minimum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
            }
            return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED za\u010D\xEDnat na "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED kon\u010Dit na "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED obsahovat "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED odpov\xEDdat vzoru ${_issue.pattern}`;
            return `Neplatn\xFD form\xE1t ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Neplatn\xE9 \u010D\xEDslo: mus\xED b\xFDt n\xE1sobkem ${issue.divisor}`;
          case "unrecognized_keys":
            return `Nezn\xE1m\xE9 kl\xED\u010De: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Neplatn\xFD kl\xED\u010D v ${issue.origin}`;
          case "invalid_union":
            return "Neplatn\xFD vstup";
          case "invalid_element":
            return `Neplatn\xE1 hodnota v ${issue.origin}`;
          default:
            return `Neplatn\xFD vstup`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/da.cjs
var require_da = __commonJS({
  "node_modules/zod/v4/locales/da.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "tegn", verb: "havde" },
        file: { unit: "bytes", verb: "havde" },
        array: { unit: "elementer", verb: "indeholdt" },
        set: { unit: "elementer", verb: "indeholdt" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "e-mailadresse",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO dato- og klokkesl\xE6t",
        date: "ISO-dato",
        time: "ISO-klokkesl\xE6t",
        duration: "ISO-varighed",
        ipv4: "IPv4-omr\xE5de",
        ipv6: "IPv6-omr\xE5de",
        cidrv4: "IPv4-spektrum",
        cidrv6: "IPv6-spektrum",
        base64: "base64-kodet streng",
        base64url: "base64url-kodet streng",
        json_string: "JSON-streng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "streng",
        number: "tal",
        boolean: "boolean",
        array: "liste",
        object: "objekt",
        set: "s\xE6t",
        file: "fil"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Ugyldigt input: forventede instanceof ${issue.expected}, fik ${received}`;
            }
            return `Ugyldigt input: forventede ${expected}, fik ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Ugyldig v\xE6rdi: forventede ${util.stringifyPrimitive(issue.values[0])}`;
            return `Ugyldigt valg: forventede en af f\xF8lgende ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            if (sizing)
              return `For stor: forventede ${origin ?? "value"} ${sizing.verb} ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "elementer"}`;
            return `For stor: forventede ${origin ?? "value"} havde ${adj} ${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            if (sizing) {
              return `For lille: forventede ${origin} ${sizing.verb} ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `For lille: forventede ${origin} havde ${adj} ${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Ugyldig streng: skal starte med "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Ugyldig streng: skal ende med "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Ugyldig streng: skal indeholde "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Ugyldig streng: skal matche m\xF8nsteret ${_issue.pattern}`;
            return `Ugyldig ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Ugyldigt tal: skal v\xE6re deleligt med ${issue.divisor}`;
          case "unrecognized_keys":
            return `${issue.keys.length > 1 ? "Ukendte n\xF8gler" : "Ukendt n\xF8gle"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Ugyldig n\xF8gle i ${issue.origin}`;
          case "invalid_union":
            return "Ugyldigt input: matcher ingen af de tilladte typer";
          case "invalid_element":
            return `Ugyldig v\xE6rdi i ${issue.origin}`;
          default:
            return `Ugyldigt input`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/de.cjs
var require_de = __commonJS({
  "node_modules/zod/v4/locales/de.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "Zeichen", verb: "zu haben" },
        file: { unit: "Bytes", verb: "zu haben" },
        array: { unit: "Elemente", verb: "zu haben" },
        set: { unit: "Elemente", verb: "zu haben" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "Eingabe",
        email: "E-Mail-Adresse",
        url: "URL",
        emoji: "Emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-Datum und -Uhrzeit",
        date: "ISO-Datum",
        time: "ISO-Uhrzeit",
        duration: "ISO-Dauer",
        ipv4: "IPv4-Adresse",
        ipv6: "IPv6-Adresse",
        cidrv4: "IPv4-Bereich",
        cidrv6: "IPv6-Bereich",
        base64: "Base64-codierter String",
        base64url: "Base64-URL-codierter String",
        json_string: "JSON-String",
        e164: "E.164-Nummer",
        jwt: "JWT",
        template_literal: "Eingabe"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "Zahl",
        array: "Array"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Ung\xFCltige Eingabe: erwartet instanceof ${issue.expected}, erhalten ${received}`;
            }
            return `Ung\xFCltige Eingabe: erwartet ${expected}, erhalten ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Ung\xFCltige Eingabe: erwartet ${util.stringifyPrimitive(issue.values[0])}`;
            return `Ung\xFCltige Option: erwartet eine von ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Zu gro\xDF: erwartet, dass ${issue.origin ?? "Wert"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "Elemente"} hat`;
            return `Zu gro\xDF: erwartet, dass ${issue.origin ?? "Wert"} ${adj}${issue.maximum.toString()} ist`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Zu klein: erwartet, dass ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} hat`;
            }
            return `Zu klein: erwartet, dass ${issue.origin} ${adj}${issue.minimum.toString()} ist`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Ung\xFCltiger String: muss mit "${_issue.prefix}" beginnen`;
            if (_issue.format === "ends_with")
              return `Ung\xFCltiger String: muss mit "${_issue.suffix}" enden`;
            if (_issue.format === "includes")
              return `Ung\xFCltiger String: muss "${_issue.includes}" enthalten`;
            if (_issue.format === "regex")
              return `Ung\xFCltiger String: muss dem Muster ${_issue.pattern} entsprechen`;
            return `Ung\xFCltig: ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Ung\xFCltige Zahl: muss ein Vielfaches von ${issue.divisor} sein`;
          case "unrecognized_keys":
            return `${issue.keys.length > 1 ? "Unbekannte Schl\xFCssel" : "Unbekannter Schl\xFCssel"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Ung\xFCltiger Schl\xFCssel in ${issue.origin}`;
          case "invalid_union":
            return "Ung\xFCltige Eingabe";
          case "invalid_element":
            return `Ung\xFCltiger Wert in ${issue.origin}`;
          default:
            return `Ung\xFCltige Eingabe`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/el.cjs
var require_el = __commonJS({
  "node_modules/zod/v4/locales/el.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u03C7\u03B1\u03C1\u03B1\u03BA\u03C4\u03AE\u03C1\u03B5\u03C2", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
        file: { unit: "bytes", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
        array: { unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
        set: { unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
        map: { unit: "\u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03C3\u03B5\u03B9\u03C2", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2",
        email: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1 \u03BA\u03B1\u03B9 \u03CE\u03C1\u03B1",
        date: "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1",
        time: "ISO \u03CE\u03C1\u03B1",
        duration: "ISO \u03B4\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1",
        ipv4: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv4",
        ipv6: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv6",
        mac: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 MAC",
        cidrv4: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv4",
        cidrv6: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv6",
        base64: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64",
        base64url: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64url",
        json_string: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC JSON",
        e164: "\u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 E.164",
        jwt: "JWT",
        template_literal: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (typeof issue.expected === "string" && /^[A-Z]/.test(issue.expected)) {
              return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD instanceof ${issue.expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
            }
            return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD \u03AD\u03BD\u03B1 \u03B1\u03C0\u03CC ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1"}`;
            return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue.origin} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue.origin} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03BE\u03B5\u03BA\u03B9\u03BD\u03AC \u03BC\u03B5 "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B5\u03BB\u03B5\u03B9\u03CE\u03BD\u03B5\u03B9 \u03BC\u03B5 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C0\u03B5\u03C1\u03B9\u03AD\u03C7\u03B5\u03B9 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B1\u03B9\u03C1\u03B9\u03AC\u03B6\u03B5\u03B9 \u03BC\u03B5 \u03C4\u03BF \u03BC\u03BF\u03C4\u03AF\u03B2\u03BF ${_issue.pattern}`;
            return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF: ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF\u03C2 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03BF \u03C4\u03BF\u03C5 ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u0386\u03B3\u03BD\u03C9\u03C3\u03C4${issue.keys.length > 1 ? "\u03B1" : "\u03BF"} \u03BA\u03BB\u03B5\u03B9\u03B4${issue.keys.length > 1 ? "\u03B9\u03AC" : "\u03AF"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03BA\u03BB\u03B5\u03B9\u03B4\u03AF \u03C3\u03C4\u03BF ${issue.origin}`;
          case "invalid_union":
            return "\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2";
          case "invalid_element":
            return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C4\u03B9\u03BC\u03AE \u03C3\u03C4\u03BF ${issue.origin}`;
          default:
            return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/en.cjs
var require_en = __commonJS({
  "node_modules/zod/v4/locales/en.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "characters", verb: "to have" },
        file: { unit: "bytes", verb: "to have" },
        array: { unit: "items", verb: "to have" },
        set: { unit: "items", verb: "to have" },
        map: { unit: "entries", verb: "to have" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        mac: "MAC address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        // Compatibility: "nan" -> "NaN" for display
        nan: "NaN"
        // All other type names omitted - they fall back to raw values via ?? operator
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            return `Invalid input: expected ${expected}, received ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Invalid input: expected ${util.stringifyPrimitive(issue.values[0])}`;
            return `Invalid option: expected one of ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
            return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `Invalid string: must start with "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Invalid string: must end with "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Invalid string: must include "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Invalid string: must match pattern ${_issue.pattern}`;
            return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Invalid number: must be a multiple of ${issue.divisor}`;
          case "unrecognized_keys":
            return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Invalid key in ${issue.origin}`;
          case "invalid_union":
            if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) {
              const opts = issue.options.map((o) => `'${o}'`).join(" | ");
              return `Invalid discriminator value. Expected ${opts}`;
            }
            return "Invalid input";
          case "invalid_element":
            return `Invalid value in ${issue.origin}`;
          default:
            return `Invalid input`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/eo.cjs
var require_eo = __commonJS({
  "node_modules/zod/v4/locales/eo.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "karaktrojn", verb: "havi" },
        file: { unit: "bajtojn", verb: "havi" },
        array: { unit: "elementojn", verb: "havi" },
        set: { unit: "elementojn", verb: "havi" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "enigo",
        email: "retadreso",
        url: "URL",
        emoji: "emo\u011Dio",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-datotempo",
        date: "ISO-dato",
        time: "ISO-tempo",
        duration: "ISO-da\u016Dro",
        ipv4: "IPv4-adreso",
        ipv6: "IPv6-adreso",
        cidrv4: "IPv4-rango",
        cidrv6: "IPv6-rango",
        base64: "64-ume kodita karaktraro",
        base64url: "URL-64-ume kodita karaktraro",
        json_string: "JSON-karaktraro",
        e164: "E.164-nombro",
        jwt: "JWT",
        template_literal: "enigo"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "nombro",
        array: "tabelo",
        null: "senvalora"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Nevalida enigo: atendi\u011Dis instanceof ${issue.expected}, ricevi\u011Dis ${received}`;
            }
            return `Nevalida enigo: atendi\u011Dis ${expected}, ricevi\u011Dis ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Nevalida enigo: atendi\u011Dis ${util.stringifyPrimitive(issue.values[0])}`;
            return `Nevalida opcio: atendi\u011Dis unu el ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Tro granda: atendi\u011Dis ke ${issue.origin ?? "valoro"} havu ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementojn"}`;
            return `Tro granda: atendi\u011Dis ke ${issue.origin ?? "valoro"} havu ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Tro malgranda: atendi\u011Dis ke ${issue.origin} havu ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Tro malgranda: atendi\u011Dis ke ${issue.origin} estu ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Nevalida karaktraro: devas komenci\u011Di per "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Nevalida karaktraro: devas fini\u011Di per "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Nevalida karaktraro: devas inkluzivi "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Nevalida karaktraro: devas kongrui kun la modelo ${_issue.pattern}`;
            return `Nevalida ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Nevalida nombro: devas esti oblo de ${issue.divisor}`;
          case "unrecognized_keys":
            return `Nekonata${issue.keys.length > 1 ? "j" : ""} \u015Dlosilo${issue.keys.length > 1 ? "j" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Nevalida \u015Dlosilo en ${issue.origin}`;
          case "invalid_union":
            return "Nevalida enigo";
          case "invalid_element":
            return `Nevalida valoro en ${issue.origin}`;
          default:
            return `Nevalida enigo`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/es.cjs
var require_es = __commonJS({
  "node_modules/zod/v4/locales/es.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "caracteres", verb: "tener" },
        file: { unit: "bytes", verb: "tener" },
        array: { unit: "elementos", verb: "tener" },
        set: { unit: "elementos", verb: "tener" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entrada",
        email: "direcci\xF3n de correo electr\xF3nico",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "fecha y hora ISO",
        date: "fecha ISO",
        time: "hora ISO",
        duration: "duraci\xF3n ISO",
        ipv4: "direcci\xF3n IPv4",
        ipv6: "direcci\xF3n IPv6",
        cidrv4: "rango IPv4",
        cidrv6: "rango IPv6",
        base64: "cadena codificada en base64",
        base64url: "URL codificada en base64",
        json_string: "cadena JSON",
        e164: "n\xFAmero E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "texto",
        number: "n\xFAmero",
        boolean: "booleano",
        array: "arreglo",
        object: "objeto",
        set: "conjunto",
        file: "archivo",
        date: "fecha",
        bigint: "n\xFAmero grande",
        symbol: "s\xEDmbolo",
        undefined: "indefinido",
        null: "nulo",
        function: "funci\xF3n",
        map: "mapa",
        record: "registro",
        tuple: "tupla",
        enum: "enumeraci\xF3n",
        union: "uni\xF3n",
        literal: "literal",
        promise: "promesa",
        void: "vac\xEDo",
        never: "nunca",
        unknown: "desconocido",
        any: "cualquiera"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Entrada inv\xE1lida: se esperaba instanceof ${issue.expected}, recibido ${received}`;
            }
            return `Entrada inv\xE1lida: se esperaba ${expected}, recibido ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Entrada inv\xE1lida: se esperaba ${util.stringifyPrimitive(issue.values[0])}`;
            return `Opci\xF3n inv\xE1lida: se esperaba una de ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            if (sizing)
              return `Demasiado grande: se esperaba que ${origin ?? "valor"} tuviera ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementos"}`;
            return `Demasiado grande: se esperaba que ${origin ?? "valor"} fuera ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            if (sizing) {
              return `Demasiado peque\xF1o: se esperaba que ${origin} tuviera ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Demasiado peque\xF1o: se esperaba que ${origin} fuera ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Cadena inv\xE1lida: debe comenzar con "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Cadena inv\xE1lida: debe terminar en "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Cadena inv\xE1lida: debe incluir "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Cadena inv\xE1lida: debe coincidir con el patr\xF3n ${_issue.pattern}`;
            return `Inv\xE1lido ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `N\xFAmero inv\xE1lido: debe ser m\xFAltiplo de ${issue.divisor}`;
          case "unrecognized_keys":
            return `Llave${issue.keys.length > 1 ? "s" : ""} desconocida${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Llave inv\xE1lida en ${TypeDictionary[issue.origin] ?? issue.origin}`;
          case "invalid_union":
            return "Entrada inv\xE1lida";
          case "invalid_element":
            return `Valor inv\xE1lido en ${TypeDictionary[issue.origin] ?? issue.origin}`;
          default:
            return `Entrada inv\xE1lida`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/fa.cjs
var require_fa = __commonJS({
  "node_modules/zod/v4/locales/fa.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
        file: { unit: "\u0628\u0627\u06CC\u062A", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
        array: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
        set: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0648\u0631\u0648\u062F\u06CC",
        email: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644",
        url: "URL",
        emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u062A\u0627\u0631\u06CC\u062E \u0648 \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
        date: "\u062A\u0627\u0631\u06CC\u062E \u0627\u06CC\u0632\u0648",
        time: "\u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
        duration: "\u0645\u062F\u062A \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
        ipv4: "IPv4 \u0622\u062F\u0631\u0633",
        ipv6: "IPv6 \u0622\u062F\u0631\u0633",
        cidrv4: "IPv4 \u062F\u0627\u0645\u0646\u0647",
        cidrv6: "IPv6 \u062F\u0627\u0645\u0646\u0647",
        base64: "base64-encoded \u0631\u0634\u062A\u0647",
        base64url: "base64url-encoded \u0631\u0634\u062A\u0647",
        json_string: "JSON \u0631\u0634\u062A\u0647",
        e164: "E.164 \u0639\u062F\u062F",
        jwt: "JWT",
        template_literal: "\u0648\u0631\u0648\u062F\u06CC"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0639\u062F\u062F",
        array: "\u0622\u0631\u0627\u06CC\u0647"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A instanceof ${issue.expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
            }
            return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
          }
          case "invalid_value":
            if (issue.values.length === 1) {
              return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${util.stringifyPrimitive(issue.values[0])} \u0645\u06CC\u200C\u0628\u0648\u062F`;
            }
            return `\u06AF\u0632\u06CC\u0646\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A \u06CC\u06A9\u06CC \u0627\u0632 ${util.joinValues(issue.values, "|")} \u0645\u06CC\u200C\u0628\u0648\u062F`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"} \u0628\u0627\u0634\u062F`;
            }
            return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue.maximum.toString()} \u0628\u0627\u0634\u062F`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue.origin} \u0628\u0627\u06CC\u062F ${adj}${issue.minimum.toString()} ${sizing.unit} \u0628\u0627\u0634\u062F`;
            }
            return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue.origin} \u0628\u0627\u06CC\u062F ${adj}${issue.minimum.toString()} \u0628\u0627\u0634\u062F`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.prefix}" \u0634\u0631\u0648\u0639 \u0634\u0648\u062F`;
            }
            if (_issue.format === "ends_with") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.suffix}" \u062A\u0645\u0627\u0645 \u0634\u0648\u062F`;
            }
            if (_issue.format === "includes") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0634\u0627\u0645\u0644 "${_issue.includes}" \u0628\u0627\u0634\u062F`;
            }
            if (_issue.format === "regex") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 \u0627\u0644\u06AF\u0648\u06CC ${_issue.pattern} \u0645\u0637\u0627\u0628\u0642\u062A \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F`;
            }
            return `${FormatDictionary[_issue.format] ?? issue.format} \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
          }
          case "not_multiple_of":
            return `\u0639\u062F\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0645\u0636\u0631\u0628 ${issue.divisor} \u0628\u0627\u0634\u062F`;
          case "unrecognized_keys":
            return `\u06A9\u0644\u06CC\u062F${issue.keys.length > 1 ? "\u0647\u0627\u06CC" : ""} \u0646\u0627\u0634\u0646\u0627\u0633: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u06A9\u0644\u06CC\u062F \u0646\u0627\u0634\u0646\u0627\u0633 \u062F\u0631 ${issue.origin}`;
          case "invalid_union":
            return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
          case "invalid_element":
            return `\u0645\u0642\u062F\u0627\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u062F\u0631 ${issue.origin}`;
          default:
            return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/fi.cjs
var require_fi = __commonJS({
  "node_modules/zod/v4/locales/fi.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "merkki\xE4", subject: "merkkijonon" },
        file: { unit: "tavua", subject: "tiedoston" },
        array: { unit: "alkiota", subject: "listan" },
        set: { unit: "alkiota", subject: "joukon" },
        number: { unit: "", subject: "luvun" },
        bigint: { unit: "", subject: "suuren kokonaisluvun" },
        int: { unit: "", subject: "kokonaisluvun" },
        date: { unit: "", subject: "p\xE4iv\xE4m\xE4\xE4r\xE4n" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "s\xE4\xE4nn\xF6llinen lauseke",
        email: "s\xE4hk\xF6postiosoite",
        url: "URL-osoite",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-aikaleima",
        date: "ISO-p\xE4iv\xE4m\xE4\xE4r\xE4",
        time: "ISO-aika",
        duration: "ISO-kesto",
        ipv4: "IPv4-osoite",
        ipv6: "IPv6-osoite",
        cidrv4: "IPv4-alue",
        cidrv6: "IPv6-alue",
        base64: "base64-koodattu merkkijono",
        base64url: "base64url-koodattu merkkijono",
        json_string: "JSON-merkkijono",
        e164: "E.164-luku",
        jwt: "JWT",
        template_literal: "templaattimerkkijono"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Virheellinen tyyppi: odotettiin instanceof ${issue.expected}, oli ${received}`;
            }
            return `Virheellinen tyyppi: odotettiin ${expected}, oli ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Virheellinen sy\xF6te: t\xE4ytyy olla ${util.stringifyPrimitive(issue.values[0])}`;
            return `Virheellinen valinta: t\xE4ytyy olla yksi seuraavista: ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Liian suuri: ${sizing.subject} t\xE4ytyy olla ${adj}${issue.maximum.toString()} ${sizing.unit}`.trim();
            }
            return `Liian suuri: arvon t\xE4ytyy olla ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Liian pieni: ${sizing.subject} t\xE4ytyy olla ${adj}${issue.minimum.toString()} ${sizing.unit}`.trim();
            }
            return `Liian pieni: arvon t\xE4ytyy olla ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Virheellinen sy\xF6te: t\xE4ytyy alkaa "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Virheellinen sy\xF6te: t\xE4ytyy loppua "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Virheellinen sy\xF6te: t\xE4ytyy sis\xE4lt\xE4\xE4 "${_issue.includes}"`;
            if (_issue.format === "regex") {
              return `Virheellinen sy\xF6te: t\xE4ytyy vastata s\xE4\xE4nn\xF6llist\xE4 lauseketta ${_issue.pattern}`;
            }
            return `Virheellinen ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Virheellinen luku: t\xE4ytyy olla luvun ${issue.divisor} monikerta`;
          case "unrecognized_keys":
            return `${issue.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return "Virheellinen avain tietueessa";
          case "invalid_union":
            return "Virheellinen unioni";
          case "invalid_element":
            return "Virheellinen arvo joukossa";
          default:
            return `Virheellinen sy\xF6te`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/fr.cjs
var require_fr = __commonJS({
  "node_modules/zod/v4/locales/fr.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "caract\xE8res", verb: "avoir" },
        file: { unit: "octets", verb: "avoir" },
        array: { unit: "\xE9l\xE9ments", verb: "avoir" },
        set: { unit: "\xE9l\xE9ments", verb: "avoir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entr\xE9e",
        email: "adresse e-mail",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "date et heure ISO",
        date: "date ISO",
        time: "heure ISO",
        duration: "dur\xE9e ISO",
        ipv4: "adresse IPv4",
        ipv6: "adresse IPv6",
        cidrv4: "plage IPv4",
        cidrv6: "plage IPv6",
        base64: "cha\xEEne encod\xE9e en base64",
        base64url: "cha\xEEne encod\xE9e en base64url",
        json_string: "cha\xEEne JSON",
        e164: "num\xE9ro E.164",
        jwt: "JWT",
        template_literal: "entr\xE9e"
      };
      const TypeDictionary = {
        string: "cha\xEEne",
        number: "nombre",
        int: "entier",
        boolean: "bool\xE9en",
        bigint: "grand entier",
        symbol: "symbole",
        undefined: "ind\xE9fini",
        null: "null",
        never: "jamais",
        void: "vide",
        date: "date",
        array: "tableau",
        object: "objet",
        tuple: "tuple",
        record: "enregistrement",
        map: "carte",
        set: "ensemble",
        file: "fichier",
        nonoptional: "non-optionnel",
        nan: "NaN",
        function: "fonction"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Entr\xE9e invalide : instanceof ${issue.expected} attendu, ${received} re\xE7u`;
            }
            return `Entr\xE9e invalide : ${expected} attendu, ${received} re\xE7u`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Entr\xE9e invalide : ${util.stringifyPrimitive(issue.values[0])} attendu`;
            return `Option invalide : une valeur parmi ${util.joinValues(issue.values, "|")} attendue`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Trop grand : ${TypeDictionary[issue.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\xE9l\xE9ment(s)"}`;
            return `Trop grand : ${TypeDictionary[issue.origin] ?? "valeur"} doit \xEAtre ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Trop petit : ${TypeDictionary[issue.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            return `Trop petit : ${TypeDictionary[issue.origin] ?? "valeur"} doit \xEAtre ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Cha\xEEne invalide : doit correspondre au mod\xE8le ${_issue.pattern}`;
            return `${FormatDictionary[_issue.format] ?? issue.format} invalide`;
          }
          case "not_multiple_of":
            return `Nombre invalide : doit \xEAtre un multiple de ${issue.divisor}`;
          case "unrecognized_keys":
            return `Cl\xE9${issue.keys.length > 1 ? "s" : ""} non reconnue${issue.keys.length > 1 ? "s" : ""} : ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Cl\xE9 invalide dans ${issue.origin}`;
          case "invalid_union":
            return "Entr\xE9e invalide";
          case "invalid_element":
            return `Valeur invalide dans ${issue.origin}`;
          default:
            return `Entr\xE9e invalide`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/fr-CA.cjs
var require_fr_CA = __commonJS({
  "node_modules/zod/v4/locales/fr-CA.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "caract\xE8res", verb: "avoir" },
        file: { unit: "octets", verb: "avoir" },
        array: { unit: "\xE9l\xE9ments", verb: "avoir" },
        set: { unit: "\xE9l\xE9ments", verb: "avoir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "entr\xE9e",
        email: "adresse courriel",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "date-heure ISO",
        date: "date ISO",
        time: "heure ISO",
        duration: "dur\xE9e ISO",
        ipv4: "adresse IPv4",
        ipv6: "adresse IPv6",
        cidrv4: "plage IPv4",
        cidrv6: "plage IPv6",
        base64: "cha\xEEne encod\xE9e en base64",
        base64url: "cha\xEEne encod\xE9e en base64url",
        json_string: "cha\xEEne JSON",
        e164: "num\xE9ro E.164",
        jwt: "JWT",
        template_literal: "entr\xE9e"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Entr\xE9e invalide : attendu instanceof ${issue.expected}, re\xE7u ${received}`;
            }
            return `Entr\xE9e invalide : attendu ${expected}, re\xE7u ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Entr\xE9e invalide : attendu ${util.stringifyPrimitive(issue.values[0])}`;
            return `Option invalide : attendu l'une des valeurs suivantes ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "\u2264" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Trop grand : attendu que ${issue.origin ?? "la valeur"} ait ${adj}${issue.maximum.toString()} ${sizing.unit}`;
            return `Trop grand : attendu que ${issue.origin ?? "la valeur"} soit ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? "\u2265" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Trop petit : attendu que ${issue.origin} ait ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Trop petit : attendu que ${issue.origin} soit ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Cha\xEEne invalide : doit correspondre au motif ${_issue.pattern}`;
            return `${FormatDictionary[_issue.format] ?? issue.format} invalide`;
          }
          case "not_multiple_of":
            return `Nombre invalide : doit \xEAtre un multiple de ${issue.divisor}`;
          case "unrecognized_keys":
            return `Cl\xE9${issue.keys.length > 1 ? "s" : ""} non reconnue${issue.keys.length > 1 ? "s" : ""} : ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Cl\xE9 invalide dans ${issue.origin}`;
          case "invalid_union":
            return "Entr\xE9e invalide";
          case "invalid_element":
            return `Valeur invalide dans ${issue.origin}`;
          default:
            return `Entr\xE9e invalide`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/he.cjs
var require_he = __commonJS({
  "node_modules/zod/v4/locales/he.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const TypeNames = {
        string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA", gender: "f" },
        number: { label: "\u05DE\u05E1\u05E4\u05E8", gender: "m" },
        boolean: { label: "\u05E2\u05E8\u05DA \u05D1\u05D5\u05DC\u05D9\u05D0\u05E0\u05D9", gender: "m" },
        bigint: { label: "BigInt", gender: "m" },
        date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA", gender: "m" },
        array: { label: "\u05DE\u05E2\u05E8\u05DA", gender: "m" },
        object: { label: "\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8", gender: "m" },
        null: { label: "\u05E2\u05E8\u05DA \u05E8\u05D9\u05E7 (null)", gender: "m" },
        undefined: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05DE\u05D5\u05D2\u05D3\u05E8 (undefined)", gender: "m" },
        symbol: { label: "\u05E1\u05D9\u05DE\u05D1\u05D5\u05DC (Symbol)", gender: "m" },
        function: { label: "\u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D4", gender: "f" },
        map: { label: "\u05DE\u05E4\u05D4 (Map)", gender: "f" },
        set: { label: "\u05E7\u05D1\u05D5\u05E6\u05D4 (Set)", gender: "f" },
        file: { label: "\u05E7\u05D5\u05D1\u05E5", gender: "m" },
        promise: { label: "Promise", gender: "m" },
        NaN: { label: "NaN", gender: "m" },
        unknown: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05D9\u05D3\u05D5\u05E2", gender: "m" },
        value: { label: "\u05E2\u05E8\u05DA", gender: "m" }
      };
      const Sizable = {
        string: { unit: "\u05EA\u05D5\u05D5\u05D9\u05DD", shortLabel: "\u05E7\u05E6\u05E8", longLabel: "\u05D0\u05E8\u05D5\u05DA" },
        file: { unit: "\u05D1\u05D9\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
        array: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
        set: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
        number: { unit: "", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" }
        // no unit
      };
      const typeEntry = (t) => t ? TypeNames[t] : void 0;
      const typeLabel = (t) => {
        const e = typeEntry(t);
        if (e)
          return e.label;
        return t ?? TypeNames.unknown.label;
      };
      const withDefinite = (t) => `\u05D4${typeLabel(t)}`;
      const verbFor = (t) => {
        const e = typeEntry(t);
        const gender = e?.gender ?? "m";
        return gender === "f" ? "\u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA" : "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA";
      };
      const getSizing = (origin) => {
        if (!origin)
          return null;
        return Sizable[origin] ?? null;
      };
      const FormatDictionary = {
        regex: { label: "\u05E7\u05DC\u05D8", gender: "m" },
        email: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC", gender: "f" },
        url: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05E8\u05E9\u05EA", gender: "f" },
        emoji: { label: "\u05D0\u05D9\u05DE\u05D5\u05D2'\u05D9", gender: "m" },
        uuid: { label: "UUID", gender: "m" },
        nanoid: { label: "nanoid", gender: "m" },
        guid: { label: "GUID", gender: "m" },
        cuid: { label: "cuid", gender: "m" },
        cuid2: { label: "cuid2", gender: "m" },
        ulid: { label: "ULID", gender: "m" },
        xid: { label: "XID", gender: "m" },
        ksuid: { label: "KSUID", gender: "m" },
        datetime: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA \u05D5\u05D6\u05DE\u05DF ISO", gender: "m" },
        date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA ISO", gender: "m" },
        time: { label: "\u05D6\u05DE\u05DF ISO", gender: "m" },
        duration: { label: "\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF ISO", gender: "m" },
        ipv4: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv4", gender: "f" },
        ipv6: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv6", gender: "f" },
        cidrv4: { label: "\u05D8\u05D5\u05D5\u05D7 IPv4", gender: "m" },
        cidrv6: { label: "\u05D8\u05D5\u05D5\u05D7 IPv6", gender: "m" },
        base64: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64", gender: "f" },
        base64url: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64 \u05DC\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA \u05E8\u05E9\u05EA", gender: "f" },
        json_string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA JSON", gender: "f" },
        e164: { label: "\u05DE\u05E1\u05E4\u05E8 E.164", gender: "m" },
        jwt: { label: "JWT", gender: "m" },
        ends_with: { label: "\u05E7\u05DC\u05D8", gender: "m" },
        includes: { label: "\u05E7\u05DC\u05D8", gender: "m" },
        lowercase: { label: "\u05E7\u05DC\u05D8", gender: "m" },
        starts_with: { label: "\u05E7\u05DC\u05D8", gender: "m" },
        uppercase: { label: "\u05E7\u05DC\u05D8", gender: "m" }
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expectedKey = issue.expected;
            const expected = TypeDictionary[expectedKey ?? ""] ?? typeLabel(expectedKey);
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? TypeNames[receivedType]?.label ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA instanceof ${issue.expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
            }
            return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
          }
          case "invalid_value": {
            if (issue.values.length === 1) {
              return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05E2\u05E8\u05DA \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA ${util.stringifyPrimitive(issue.values[0])}`;
            }
            const stringified = issue.values.map((v3) => util.stringifyPrimitive(v3));
            if (issue.values.length === 2) {
              return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${stringified[0]} \u05D0\u05D5 ${stringified[1]}`;
            }
            const lastValue = stringified[stringified.length - 1];
            const restValues = stringified.slice(0, -1).join(", ");
            return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${restValues} \u05D0\u05D5 ${lastValue}`;
          }
          case "too_big": {
            const sizing = getSizing(issue.origin);
            const subject = withDefinite(issue.origin ?? "value");
            if (issue.origin === "string") {
              return `${sizing?.longLabel ?? "\u05D0\u05E8\u05D5\u05DA"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue.maximum.toString()} ${sizing?.unit ?? ""} ${issue.inclusive ? "\u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA" : "\u05DC\u05DB\u05DC \u05D4\u05D9\u05D5\u05EA\u05E8"}`.trim();
            }
            if (issue.origin === "number") {
              const comparison = issue.inclusive ? `\u05E7\u05D8\u05DF \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue.maximum}` : `\u05E7\u05D8\u05DF \u05DE-${issue.maximum}`;
              return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
            }
            if (issue.origin === "array" || issue.origin === "set") {
              const verb = issue.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA";
              const comparison = issue.inclusive ? `${issue.maximum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA` : `\u05E4\u05D7\u05D5\u05EA \u05DE-${issue.maximum} ${sizing?.unit ?? ""}`;
              return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
            }
            const adj = issue.inclusive ? "<=" : "<";
            const be = verbFor(issue.origin ?? "value");
            if (sizing?.unit) {
              return `${sizing.longLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue.maximum.toString()} ${sizing.unit}`;
            }
            return `${sizing?.longLabel ?? "\u05D2\u05D3\u05D5\u05DC"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const sizing = getSizing(issue.origin);
            const subject = withDefinite(issue.origin ?? "value");
            if (issue.origin === "string") {
              return `${sizing?.shortLabel ?? "\u05E7\u05E6\u05E8"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue.minimum.toString()} ${sizing?.unit ?? ""} ${issue.inclusive ? "\u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8" : "\u05DC\u05E4\u05D7\u05D5\u05EA"}`.trim();
            }
            if (issue.origin === "number") {
              const comparison = issue.inclusive ? `\u05D2\u05D3\u05D5\u05DC \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue.minimum}` : `\u05D2\u05D3\u05D5\u05DC \u05DE-${issue.minimum}`;
              return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
            }
            if (issue.origin === "array" || issue.origin === "set") {
              const verb = issue.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA";
              if (issue.minimum === 1 && issue.inclusive) {
                const singularPhrase = issue.origin === "set" ? "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3" : "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3";
                return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${singularPhrase}`;
              }
              const comparison = issue.inclusive ? `${issue.minimum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8` : `\u05D9\u05D5\u05EA\u05E8 \u05DE-${issue.minimum} ${sizing?.unit ?? ""}`;
              return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
            }
            const adj = issue.inclusive ? ">=" : ">";
            const be = verbFor(issue.origin ?? "value");
            if (sizing?.unit) {
              return `${sizing.shortLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `${sizing?.shortLabel ?? "\u05E7\u05D8\u05DF"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05D1 "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05E1\u05EA\u05D9\u05D9\u05DD \u05D1 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D0\u05D9\u05DD \u05DC\u05EA\u05D1\u05E0\u05D9\u05EA ${_issue.pattern}`;
            const nounEntry = FormatDictionary[_issue.format];
            const noun = nounEntry?.label ?? _issue.format;
            const gender = nounEntry?.gender ?? "m";
            const adjective = gender === "f" ? "\u05EA\u05E7\u05D9\u05E0\u05D4" : "\u05EA\u05E7\u05D9\u05DF";
            return `${noun} \u05DC\u05D0 ${adjective}`;
          }
          case "not_multiple_of":
            return `\u05DE\u05E1\u05E4\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05DB\u05E4\u05DC\u05D4 \u05E9\u05DC ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u05DE\u05E4\u05EA\u05D7${issue.keys.length > 1 ? "\u05D5\u05EA" : ""} \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4${issue.keys.length > 1 ? "\u05D9\u05DD" : "\u05D4"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key": {
            return `\u05E9\u05D3\u05D4 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8`;
          }
          case "invalid_union":
            return "\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF";
          case "invalid_element": {
            const place = withDefinite(issue.origin ?? "array");
            return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1${place}`;
          }
          default:
            return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/hr.cjs
var require_hr = __commonJS({
  "node_modules/zod/v4/locales/hr.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "znakova", verb: "imati" },
        file: { unit: "bajtova", verb: "imati" },
        array: { unit: "stavki", verb: "imati" },
        set: { unit: "stavki", verb: "imati" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "unos",
        email: "email adresa",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum i vrijeme",
        date: "ISO datum",
        time: "ISO vrijeme",
        duration: "ISO trajanje",
        ipv4: "IPv4 adresa",
        ipv6: "IPv6 adresa",
        cidrv4: "IPv4 raspon",
        cidrv6: "IPv6 raspon",
        base64: "base64 kodirani tekst",
        base64url: "base64url kodirani tekst",
        json_string: "JSON tekst",
        e164: "E.164 broj",
        jwt: "JWT",
        template_literal: "unos"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "tekst",
        number: "broj",
        boolean: "boolean",
        array: "niz",
        object: "objekt",
        set: "skup",
        file: "datoteka",
        date: "datum",
        bigint: "bigint",
        symbol: "simbol",
        undefined: "undefined",
        null: "null",
        function: "funkcija",
        map: "mapa"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Neispravan unos: o\u010Dekuje se instanceof ${issue.expected}, a primljeno je ${received}`;
            }
            return `Neispravan unos: o\u010Dekuje se ${expected}, a primljeno je ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Neispravna vrijednost: o\u010Dekivano ${util.stringifyPrimitive(issue.values[0])}`;
            return `Neispravna opcija: o\u010Dekivano jedno od ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            if (sizing)
              return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} ima ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elemenata"}`;
            return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} bude ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            if (sizing) {
              return `Premalo: o\u010Dekivano da ${origin} ima ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Premalo: o\u010Dekivano da ${origin} bude ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Neispravan tekst: mora zapo\u010Dinjati s "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Neispravan tekst: mora zavr\u0161avati s "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Neispravan tekst: mora sadr\u017Eavati "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Neispravan tekst: mora odgovarati uzorku ${_issue.pattern}`;
            return `Neispravna ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Neispravan broj: mora biti vi\u0161ekratnik od ${issue.divisor}`;
          case "unrecognized_keys":
            return `Neprepoznat${issue.keys.length > 1 ? "i klju\u010Devi" : " klju\u010D"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Neispravan klju\u010D u ${TypeDictionary[issue.origin] ?? issue.origin}`;
          case "invalid_union":
            return "Neispravan unos";
          case "invalid_element":
            return `Neispravna vrijednost u ${TypeDictionary[issue.origin] ?? issue.origin}`;
          default:
            return `Neispravan unos`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/hu.cjs
var require_hu = __commonJS({
  "node_modules/zod/v4/locales/hu.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "legyen" },
        file: { unit: "byte", verb: "legyen" },
        array: { unit: "elem", verb: "legyen" },
        set: { unit: "elem", verb: "legyen" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "bemenet",
        email: "email c\xEDm",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO id\u0151b\xE9lyeg",
        date: "ISO d\xE1tum",
        time: "ISO id\u0151",
        duration: "ISO id\u0151intervallum",
        ipv4: "IPv4 c\xEDm",
        ipv6: "IPv6 c\xEDm",
        cidrv4: "IPv4 tartom\xE1ny",
        cidrv6: "IPv6 tartom\xE1ny",
        base64: "base64-k\xF3dolt string",
        base64url: "base64url-k\xF3dolt string",
        json_string: "JSON string",
        e164: "E.164 sz\xE1m",
        jwt: "JWT",
        template_literal: "bemenet"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "sz\xE1m",
        array: "t\xF6mb"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k instanceof ${issue.expected}, a kapott \xE9rt\xE9k ${received}`;
            }
            return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${expected}, a kapott \xE9rt\xE9k ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${util.stringifyPrimitive(issue.values[0])}`;
            return `\xC9rv\xE9nytelen opci\xF3: valamelyik \xE9rt\xE9k v\xE1rt ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `T\xFAl nagy: ${issue.origin ?? "\xE9rt\xE9k"} m\xE9rete t\xFAl nagy ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elem"}`;
            return `T\xFAl nagy: a bemeneti \xE9rt\xE9k ${issue.origin ?? "\xE9rt\xE9k"} t\xFAl nagy: ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue.origin} m\xE9rete t\xFAl kicsi ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue.origin} t\xFAl kicsi ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\xC9rv\xE9nytelen string: "${_issue.prefix}" \xE9rt\xE9kkel kell kezd\u0151dnie`;
            if (_issue.format === "ends_with")
              return `\xC9rv\xE9nytelen string: "${_issue.suffix}" \xE9rt\xE9kkel kell v\xE9gz\u0151dnie`;
            if (_issue.format === "includes")
              return `\xC9rv\xE9nytelen string: "${_issue.includes}" \xE9rt\xE9ket kell tartalmaznia`;
            if (_issue.format === "regex")
              return `\xC9rv\xE9nytelen string: ${_issue.pattern} mint\xE1nak kell megfelelnie`;
            return `\xC9rv\xE9nytelen ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\xC9rv\xE9nytelen sz\xE1m: ${issue.divisor} t\xF6bbsz\xF6r\xF6s\xE9nek kell lennie`;
          case "unrecognized_keys":
            return `Ismeretlen kulcs${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\xC9rv\xE9nytelen kulcs ${issue.origin}`;
          case "invalid_union":
            return "\xC9rv\xE9nytelen bemenet";
          case "invalid_element":
            return `\xC9rv\xE9nytelen \xE9rt\xE9k: ${issue.origin}`;
          default:
            return `\xC9rv\xE9nytelen bemenet`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/hy.cjs
var require_hy = __commonJS({
  "node_modules/zod/v4/locales/hy.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    function getArmenianPlural(count, one, many) {
      return Math.abs(count) === 1 ? one : many;
    }
    function withDefiniteArticle(word) {
      if (!word)
        return "";
      const vowels = ["\u0561", "\u0565", "\u0568", "\u056B", "\u0578", "\u0578\u0582", "\u0585"];
      const lastChar = word[word.length - 1];
      return word + (vowels.includes(lastChar) ? "\u0576" : "\u0568");
    }
    var error = () => {
      const Sizable = {
        string: {
          unit: {
            one: "\u0576\u0577\u0561\u0576",
            many: "\u0576\u0577\u0561\u0576\u0576\u0565\u0580"
          },
          verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
        },
        file: {
          unit: {
            one: "\u0562\u0561\u0575\u0569",
            many: "\u0562\u0561\u0575\u0569\u0565\u0580"
          },
          verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
        },
        array: {
          unit: {
            one: "\u057F\u0561\u0580\u0580",
            many: "\u057F\u0561\u0580\u0580\u0565\u0580"
          },
          verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
        },
        set: {
          unit: {
            one: "\u057F\u0561\u0580\u0580",
            many: "\u057F\u0561\u0580\u0580\u0565\u0580"
          },
          verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0574\u0578\u0582\u057F\u0584",
        email: "\u0567\u056C. \u0570\u0561\u057D\u0581\u0565",
        url: "URL",
        emoji: "\u0567\u0574\u0578\u057B\u056B",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E \u0587 \u056A\u0561\u0574",
        date: "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E",
        time: "ISO \u056A\u0561\u0574",
        duration: "ISO \u057F\u0587\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
        ipv4: "IPv4 \u0570\u0561\u057D\u0581\u0565",
        ipv6: "IPv6 \u0570\u0561\u057D\u0581\u0565",
        cidrv4: "IPv4 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
        cidrv6: "IPv6 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
        base64: "base64 \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
        base64url: "base64url \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
        json_string: "JSON \u057F\u0578\u0572",
        e164: "E.164 \u0570\u0561\u0574\u0561\u0580",
        jwt: "JWT",
        template_literal: "\u0574\u0578\u0582\u057F\u0584"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0569\u056B\u057E",
        array: "\u0566\u0561\u0576\u0563\u057E\u0561\u056E"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 instanceof ${issue.expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
            }
            return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${util.stringifyPrimitive(issue.values[1])}`;
            return `\u054D\u056D\u0561\u056C \u057F\u0561\u0580\u0562\u0565\u0580\u0561\u056F\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 \u0570\u0565\u057F\u0587\u0575\u0561\u056C\u0576\u0565\u0580\u056B\u0581 \u0574\u0565\u056F\u0568\u055D ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              const maxValue = Number(issue.maximum);
              const unit = getArmenianPlural(maxValue, sizing.unit.one, sizing.unit.many);
              return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue.maximum.toString()} ${unit}`;
            }
            return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056C\u056B\u0576\u056B ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              const minValue = Number(issue.minimum);
              const unit = getArmenianPlural(minValue, sizing.unit.one, sizing.unit.many);
              return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue.origin)} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue.minimum.toString()} ${unit}`;
            }
            return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue.origin)} \u056C\u056B\u0576\u056B ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057D\u056F\u057D\u057E\u056B "${_issue.prefix}"-\u0578\u057E`;
            if (_issue.format === "ends_with")
              return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0561\u057E\u0561\u0580\u057F\u057E\u056B "${_issue.suffix}"-\u0578\u057E`;
            if (_issue.format === "includes")
              return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057A\u0561\u0580\u0578\u0582\u0576\u0561\u056F\u056B "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0570\u0561\u0574\u0561\u057A\u0561\u057F\u0561\u057D\u056D\u0561\u0576\u056B ${_issue.pattern} \u0571\u0587\u0561\u0579\u0561\u0583\u056B\u0576`;
            return `\u054D\u056D\u0561\u056C ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u054D\u056D\u0561\u056C \u0569\u056B\u057E\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0562\u0561\u0566\u0574\u0561\u057A\u0561\u057F\u056B\u056F \u056C\u056B\u0576\u056B ${issue.divisor}-\u056B`;
          case "unrecognized_keys":
            return `\u0549\u0573\u0561\u0576\u0561\u0579\u057E\u0561\u056E \u0562\u0561\u0576\u0561\u056C\u056B${issue.keys.length > 1 ? "\u0576\u0565\u0580" : ""}. ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u054D\u056D\u0561\u056C \u0562\u0561\u0576\u0561\u056C\u056B ${withDefiniteArticle(issue.origin)}-\u0578\u0582\u0574`;
          case "invalid_union":
            return "\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574";
          case "invalid_element":
            return `\u054D\u056D\u0561\u056C \u0561\u0580\u056A\u0565\u0584 ${withDefiniteArticle(issue.origin)}-\u0578\u0582\u0574`;
          default:
            return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/id.cjs
var require_id = __commonJS({
  "node_modules/zod/v4/locales/id.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "memiliki" },
        file: { unit: "byte", verb: "memiliki" },
        array: { unit: "item", verb: "memiliki" },
        set: { unit: "item", verb: "memiliki" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "alamat email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "tanggal dan waktu format ISO",
        date: "tanggal format ISO",
        time: "jam format ISO",
        duration: "durasi format ISO",
        ipv4: "alamat IPv4",
        ipv6: "alamat IPv6",
        cidrv4: "rentang alamat IPv4",
        cidrv6: "rentang alamat IPv6",
        base64: "string dengan enkode base64",
        base64url: "string dengan enkode base64url",
        json_string: "string JSON",
        e164: "angka E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Input tidak valid: diharapkan instanceof ${issue.expected}, diterima ${received}`;
            }
            return `Input tidak valid: diharapkan ${expected}, diterima ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Input tidak valid: diharapkan ${util.stringifyPrimitive(issue.values[0])}`;
            return `Pilihan tidak valid: diharapkan salah satu dari ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Terlalu besar: diharapkan ${issue.origin ?? "value"} memiliki ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elemen"}`;
            return `Terlalu besar: diharapkan ${issue.origin ?? "value"} menjadi ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Terlalu kecil: diharapkan ${issue.origin} memiliki ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Terlalu kecil: diharapkan ${issue.origin} menjadi ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `String tidak valid: harus dimulai dengan "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `String tidak valid: harus berakhir dengan "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `String tidak valid: harus menyertakan "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `String tidak valid: harus sesuai pola ${_issue.pattern}`;
            return `${FormatDictionary[_issue.format] ?? issue.format} tidak valid`;
          }
          case "not_multiple_of":
            return `Angka tidak valid: harus kelipatan dari ${issue.divisor}`;
          case "unrecognized_keys":
            return `Kunci tidak dikenali ${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Kunci tidak valid di ${issue.origin}`;
          case "invalid_union":
            return "Input tidak valid";
          case "invalid_element":
            return `Nilai tidak valid di ${issue.origin}`;
          default:
            return `Input tidak valid`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/is.cjs
var require_is = __commonJS({
  "node_modules/zod/v4/locales/is.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "stafi", verb: "a\xF0 hafa" },
        file: { unit: "b\xE6ti", verb: "a\xF0 hafa" },
        array: { unit: "hluti", verb: "a\xF0 hafa" },
        set: { unit: "hluti", verb: "a\xF0 hafa" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "gildi",
        email: "netfang",
        url: "vefsl\xF3\xF0",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO dagsetning og t\xEDmi",
        date: "ISO dagsetning",
        time: "ISO t\xEDmi",
        duration: "ISO t\xEDmalengd",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded strengur",
        base64url: "base64url-encoded strengur",
        json_string: "JSON strengur",
        e164: "E.164 t\xF6lugildi",
        jwt: "JWT",
        template_literal: "gildi"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "n\xFAmer",
        array: "fylki"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera instanceof ${issue.expected}`;
            }
            return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera ${expected}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Rangt gildi: gert r\xE1\xF0 fyrir ${util.stringifyPrimitive(issue.values[0])}`;
            return `\xD3gilt val: m\xE1 vera eitt af eftirfarandi ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue.origin ?? "gildi"} hafi ${adj}${issue.maximum.toString()} ${sizing.unit ?? "hluti"}`;
            return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue.origin ?? "gildi"} s\xE9 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue.origin} hafi ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue.origin} s\xE9 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\xD3gildur strengur: ver\xF0ur a\xF0 byrja \xE1 "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\xD3gildur strengur: ver\xF0ur a\xF0 enda \xE1 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\xD3gildur strengur: ver\xF0ur a\xF0 innihalda "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\xD3gildur strengur: ver\xF0ur a\xF0 fylgja mynstri ${_issue.pattern}`;
            return `Rangt ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `R\xF6ng tala: ver\xF0ur a\xF0 vera margfeldi af ${issue.divisor}`;
          case "unrecognized_keys":
            return `\xD3\xFEekkt ${issue.keys.length > 1 ? "ir lyklar" : "ur lykill"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Rangur lykill \xED ${issue.origin}`;
          case "invalid_union":
            return "Rangt gildi";
          case "invalid_element":
            return `Rangt gildi \xED ${issue.origin}`;
          default:
            return `Rangt gildi`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/it.cjs
var require_it = __commonJS({
  "node_modules/zod/v4/locales/it.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "caratteri", verb: "avere" },
        file: { unit: "byte", verb: "avere" },
        array: { unit: "elementi", verb: "avere" },
        set: { unit: "elementi", verb: "avere" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "indirizzo email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data e ora ISO",
        date: "data ISO",
        time: "ora ISO",
        duration: "durata ISO",
        ipv4: "indirizzo IPv4",
        ipv6: "indirizzo IPv6",
        cidrv4: "intervallo IPv4",
        cidrv6: "intervallo IPv6",
        base64: "stringa codificata in base64",
        base64url: "URL codificata in base64",
        json_string: "stringa JSON",
        e164: "numero E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "numero",
        array: "vettore"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Input non valido: atteso instanceof ${issue.expected}, ricevuto ${received}`;
            }
            return `Input non valido: atteso ${expected}, ricevuto ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Input non valido: atteso ${util.stringifyPrimitive(issue.values[0])}`;
            return `Opzione non valida: atteso uno tra ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Troppo grande: ${issue.origin ?? "valore"} deve avere ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementi"}`;
            return `Troppo grande: ${issue.origin ?? "valore"} deve essere ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Troppo piccolo: ${issue.origin} deve avere ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Troppo piccolo: ${issue.origin} deve essere ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Stringa non valida: deve iniziare con "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Stringa non valida: deve terminare con "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Stringa non valida: deve includere "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Stringa non valida: deve corrispondere al pattern ${_issue.pattern}`;
            return `Input non valido: ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Numero non valido: deve essere un multiplo di ${issue.divisor}`;
          case "unrecognized_keys":
            return `Chiav${issue.keys.length > 1 ? "i" : "e"} non riconosciut${issue.keys.length > 1 ? "e" : "a"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Chiave non valida in ${issue.origin}`;
          case "invalid_union":
            return "Input non valido";
          case "invalid_element":
            return `Valore non valido in ${issue.origin}`;
          default:
            return `Input non valido`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ja.cjs
var require_ja = __commonJS({
  "node_modules/zod/v4/locales/ja.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u6587\u5B57", verb: "\u3067\u3042\u308B" },
        file: { unit: "\u30D0\u30A4\u30C8", verb: "\u3067\u3042\u308B" },
        array: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" },
        set: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u5165\u529B\u5024",
        email: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9",
        url: "URL",
        emoji: "\u7D75\u6587\u5B57",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO\u65E5\u6642",
        date: "ISO\u65E5\u4ED8",
        time: "ISO\u6642\u523B",
        duration: "ISO\u671F\u9593",
        ipv4: "IPv4\u30A2\u30C9\u30EC\u30B9",
        ipv6: "IPv6\u30A2\u30C9\u30EC\u30B9",
        cidrv4: "IPv4\u7BC4\u56F2",
        cidrv6: "IPv6\u7BC4\u56F2",
        base64: "base64\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
        base64url: "base64url\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
        json_string: "JSON\u6587\u5B57\u5217",
        e164: "E.164\u756A\u53F7",
        jwt: "JWT",
        template_literal: "\u5165\u529B\u5024"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u6570\u5024",
        array: "\u914D\u5217"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u7121\u52B9\u306A\u5165\u529B: instanceof ${issue.expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
            }
            return `\u7121\u52B9\u306A\u5165\u529B: ${expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u7121\u52B9\u306A\u5165\u529B: ${util.stringifyPrimitive(issue.values[0])}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F`;
            return `\u7121\u52B9\u306A\u9078\u629E: ${util.joinValues(issue.values, "\u3001")}\u306E\u3044\u305A\u308C\u304B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          case "too_big": {
            const adj = issue.inclusive ? "\u4EE5\u4E0B\u3067\u3042\u308B" : "\u3088\u308A\u5C0F\u3055\u3044";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue.origin ?? "\u5024"}\u306F${issue.maximum.toString()}${sizing.unit ?? "\u8981\u7D20"}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue.origin ?? "\u5024"}\u306F${issue.maximum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          }
          case "too_small": {
            const adj = issue.inclusive ? "\u4EE5\u4E0A\u3067\u3042\u308B" : "\u3088\u308A\u5927\u304D\u3044";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue.origin}\u306F${issue.minimum.toString()}${sizing.unit}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue.origin}\u306F${issue.minimum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.prefix}"\u3067\u59CB\u307E\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            if (_issue.format === "ends_with")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.suffix}"\u3067\u7D42\u308F\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            if (_issue.format === "includes")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.includes}"\u3092\u542B\u3080\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            if (_issue.format === "regex")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: \u30D1\u30BF\u30FC\u30F3${_issue.pattern}\u306B\u4E00\u81F4\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            return `\u7121\u52B9\u306A${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u7121\u52B9\u306A\u6570\u5024: ${issue.divisor}\u306E\u500D\u6570\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          case "unrecognized_keys":
            return `\u8A8D\u8B58\u3055\u308C\u3066\u3044\u306A\u3044\u30AD\u30FC${issue.keys.length > 1 ? "\u7FA4" : ""}: ${util.joinValues(issue.keys, "\u3001")}`;
          case "invalid_key":
            return `${issue.origin}\u5185\u306E\u7121\u52B9\u306A\u30AD\u30FC`;
          case "invalid_union":
            return "\u7121\u52B9\u306A\u5165\u529B";
          case "invalid_element":
            return `${issue.origin}\u5185\u306E\u7121\u52B9\u306A\u5024`;
          default:
            return `\u7121\u52B9\u306A\u5165\u529B`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ka.cjs
var require_ka = __commonJS({
  "node_modules/zod/v4/locales/ka.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u10E1\u10D8\u10DB\u10D1\u10DD\u10DA\u10DD", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
        file: { unit: "\u10D1\u10D0\u10D8\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
        array: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
        set: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0",
        email: "\u10D4\u10DA-\u10E4\u10DD\u10E1\u10E2\u10D8\u10E1 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
        url: "URL",
        emoji: "\u10D4\u10DB\u10DD\u10EF\u10D8",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8-\u10D3\u10E0\u10DD",
        date: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8",
        time: "\u10D3\u10E0\u10DD",
        duration: "\u10EE\u10D0\u10DC\u10D2\u10E0\u10EB\u10DA\u10D8\u10D5\u10DD\u10D1\u10D0",
        ipv4: "IPv4 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
        ipv6: "IPv6 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
        cidrv4: "IPv4 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
        cidrv6: "IPv6 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
        base64: "base64-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
        base64url: "base64url-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
        json_string: "JSON \u10D5\u10D4\u10DA\u10D8",
        e164: "E.164 \u10DC\u10DD\u10DB\u10D4\u10E0\u10D8",
        jwt: "JWT",
        template_literal: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u10E0\u10D8\u10EA\u10EE\u10D5\u10D8",
        string: "\u10D5\u10D4\u10DA\u10D8",
        boolean: "\u10D1\u10E3\u10DA\u10D4\u10D0\u10DC\u10D8",
        function: "\u10E4\u10E3\u10DC\u10E5\u10EA\u10D8\u10D0",
        array: "\u10DB\u10D0\u10E1\u10D8\u10D5\u10D8"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 instanceof ${issue.expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
            }
            return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D0\u10E0\u10D8\u10D0\u10DC\u10E2\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8\u10D0 \u10D4\u10E0\u10D7-\u10D4\u10E0\u10D7\u10D8 ${util.joinValues(issue.values, "|")}-\u10D3\u10D0\u10DC`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit}`;
            return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue.origin} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10EC\u10E7\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.prefix}"-\u10D8\u10D7`;
            }
            if (_issue.format === "ends_with")
              return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10DB\u10D7\u10D0\u10D5\u10E0\u10D3\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.suffix}"-\u10D8\u10D7`;
            if (_issue.format === "includes")
              return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1 "${_issue.includes}"-\u10E1`;
            if (_issue.format === "regex")
              return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D4\u10E1\u10D0\u10D1\u10D0\u10DB\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 \u10E8\u10D0\u10D1\u10DA\u10DD\u10DC\u10E1 ${_issue.pattern}`;
            return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E0\u10D8\u10EA\u10EE\u10D5\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10E7\u10DD\u10E1 ${issue.divisor}-\u10D8\u10E1 \u10EF\u10D4\u10E0\u10D0\u10D3\u10D8`;
          case "unrecognized_keys":
            return `\u10E3\u10EA\u10DC\u10DD\u10D1\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1${issue.keys.length > 1 ? "\u10D4\u10D1\u10D8" : "\u10D8"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1\u10D8 ${issue.origin}-\u10E8\u10D8`;
          case "invalid_union":
            return "\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0";
          case "invalid_element":
            return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0 ${issue.origin}-\u10E8\u10D8`;
          default:
            return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/km.cjs
var require_km = __commonJS({
  "node_modules/zod/v4/locales/km.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u178F\u17BD\u17A2\u1780\u17D2\u179F\u179A", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
        file: { unit: "\u1794\u17C3", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
        array: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
        set: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B",
        email: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793\u17A2\u17CA\u17B8\u1798\u17C2\u179B",
        url: "URL",
        emoji: "\u179F\u1789\u17D2\u1789\u17B6\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 \u1793\u17B7\u1784\u1798\u17C9\u17C4\u1784 ISO",
        date: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 ISO",
        time: "\u1798\u17C9\u17C4\u1784 ISO",
        duration: "\u179A\u1799\u17C8\u1796\u17C1\u179B ISO",
        ipv4: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
        ipv6: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
        cidrv4: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
        cidrv6: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
        base64: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64",
        base64url: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64url",
        json_string: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A JSON",
        e164: "\u179B\u17C1\u1781 E.164",
        jwt: "JWT",
        template_literal: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u179B\u17C1\u1781",
        array: "\u17A2\u17B6\u179A\u17C1 (Array)",
        null: "\u1782\u17D2\u1798\u17B6\u1793\u178F\u1798\u17D2\u179B\u17C3 (null)"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A instanceof ${issue.expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
            }
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u1787\u1798\u17D2\u179A\u17BE\u179F\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1787\u17B6\u1798\u17BD\u1799\u1780\u17D2\u1793\u17BB\u1784\u1785\u17C6\u178E\u17C4\u1798 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "\u1792\u17B6\u178F\u17BB"}`;
            return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue.origin} ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue.origin} ${adj} ${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1785\u17B6\u1794\u17CB\u1795\u17D2\u178F\u17BE\u1798\u178A\u17C4\u1799 "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1794\u1789\u17D2\u1785\u1794\u17CB\u178A\u17C4\u1799 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1798\u17B6\u1793 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1795\u17D2\u1782\u17BC\u1795\u17D2\u1782\u1784\u1793\u17B9\u1784\u1791\u1798\u17D2\u179A\u1784\u17CB\u178A\u17C2\u179B\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB ${_issue.pattern}`;
            return `\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u179B\u17C1\u1781\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1787\u17B6\u1796\u17A0\u17BB\u1782\u17BB\u178E\u1793\u17C3 ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u179A\u1780\u1783\u17BE\u1789\u179F\u17C4\u1798\u17B7\u1793\u179F\u17D2\u1782\u17B6\u179B\u17CB\u17D6 ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u179F\u17C4\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue.origin}`;
          case "invalid_union":
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
          case "invalid_element":
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue.origin}`;
          default:
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/kh.cjs
var require_kh = __commonJS({
  "node_modules/zod/v4/locales/kh.cjs"(exports2, module2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var km_js_1 = __importDefault(require_km());
    function default_1() {
      return (0, km_js_1.default)();
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ko.cjs
var require_ko = __commonJS({
  "node_modules/zod/v4/locales/ko.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\uBB38\uC790", verb: "to have" },
        file: { unit: "\uBC14\uC774\uD2B8", verb: "to have" },
        array: { unit: "\uAC1C", verb: "to have" },
        set: { unit: "\uAC1C", verb: "to have" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\uC785\uB825",
        email: "\uC774\uBA54\uC77C \uC8FC\uC18C",
        url: "URL",
        emoji: "\uC774\uBAA8\uC9C0",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \uB0A0\uC9DC\uC2DC\uAC04",
        date: "ISO \uB0A0\uC9DC",
        time: "ISO \uC2DC\uAC04",
        duration: "ISO \uAE30\uAC04",
        ipv4: "IPv4 \uC8FC\uC18C",
        ipv6: "IPv6 \uC8FC\uC18C",
        cidrv4: "IPv4 \uBC94\uC704",
        cidrv6: "IPv6 \uBC94\uC704",
        base64: "base64 \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
        base64url: "base64url \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
        json_string: "JSON \uBB38\uC790\uC5F4",
        e164: "E.164 \uBC88\uD638",
        jwt: "JWT",
        template_literal: "\uC785\uB825"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 instanceof ${issue.expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
            }
            return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 ${expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\uC798\uBABB\uB41C \uC785\uB825: \uAC12\uC740 ${util.stringifyPrimitive(issue.values[0])} \uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4`;
            return `\uC798\uBABB\uB41C \uC635\uC158: ${util.joinValues(issue.values, "\uB610\uB294 ")} \uC911 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
          case "too_big": {
            const adj = issue.inclusive ? "\uC774\uD558" : "\uBBF8\uB9CC";
            const suffix = adj === "\uBBF8\uB9CC" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
            const sizing = getSizing(issue.origin);
            const unit = sizing?.unit ?? "\uC694\uC18C";
            if (sizing)
              return `${issue.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue.maximum.toString()}${unit} ${adj}${suffix}`;
            return `${issue.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue.maximum.toString()} ${adj}${suffix}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? "\uC774\uC0C1" : "\uCD08\uACFC";
            const suffix = adj === "\uC774\uC0C1" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
            const sizing = getSizing(issue.origin);
            const unit = sizing?.unit ?? "\uC694\uC18C";
            if (sizing) {
              return `${issue.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue.minimum.toString()}${unit} ${adj}${suffix}`;
            }
            return `${issue.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue.minimum.toString()} ${adj}${suffix}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.prefix}"(\uC73C)\uB85C \uC2DC\uC791\uD574\uC57C \uD569\uB2C8\uB2E4`;
            }
            if (_issue.format === "ends_with")
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.suffix}"(\uC73C)\uB85C \uB05D\uB098\uC57C \uD569\uB2C8\uB2E4`;
            if (_issue.format === "includes")
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.includes}"\uC744(\uB97C) \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4`;
            if (_issue.format === "regex")
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: \uC815\uADDC\uC2DD ${_issue.pattern} \uD328\uD134\uACFC \uC77C\uCE58\uD574\uC57C \uD569\uB2C8\uB2E4`;
            return `\uC798\uBABB\uB41C ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\uC798\uBABB\uB41C \uC22B\uC790: ${issue.divisor}\uC758 \uBC30\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
          case "unrecognized_keys":
            return `\uC778\uC2DD\uD560 \uC218 \uC5C6\uB294 \uD0A4: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\uC798\uBABB\uB41C \uD0A4: ${issue.origin}`;
          case "invalid_union":
            return `\uC798\uBABB\uB41C \uC785\uB825`;
          case "invalid_element":
            return `\uC798\uBABB\uB41C \uAC12: ${issue.origin}`;
          default:
            return `\uC798\uBABB\uB41C \uC785\uB825`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/lt.cjs
var require_lt = __commonJS({
  "node_modules/zod/v4/locales/lt.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var capitalizeFirstCharacter = (text) => {
      return text.charAt(0).toUpperCase() + text.slice(1);
    };
    function getUnitTypeFromNumber(number) {
      const abs = Math.abs(number);
      const last = abs % 10;
      const last2 = abs % 100;
      if (last2 >= 11 && last2 <= 19 || last === 0)
        return "many";
      if (last === 1)
        return "one";
      return "few";
    }
    var error = () => {
      const Sizable = {
        string: {
          unit: {
            one: "simbolis",
            few: "simboliai",
            many: "simboli\u0173"
          },
          verb: {
            smaller: {
              inclusive: "turi b\u016Bti ne ilgesn\u0117 kaip",
              notInclusive: "turi b\u016Bti trumpesn\u0117 kaip"
            },
            bigger: {
              inclusive: "turi b\u016Bti ne trumpesn\u0117 kaip",
              notInclusive: "turi b\u016Bti ilgesn\u0117 kaip"
            }
          }
        },
        file: {
          unit: {
            one: "baitas",
            few: "baitai",
            many: "bait\u0173"
          },
          verb: {
            smaller: {
              inclusive: "turi b\u016Bti ne didesnis kaip",
              notInclusive: "turi b\u016Bti ma\u017Eesnis kaip"
            },
            bigger: {
              inclusive: "turi b\u016Bti ne ma\u017Eesnis kaip",
              notInclusive: "turi b\u016Bti didesnis kaip"
            }
          }
        },
        array: {
          unit: {
            one: "element\u0105",
            few: "elementus",
            many: "element\u0173"
          },
          verb: {
            smaller: {
              inclusive: "turi tur\u0117ti ne daugiau kaip",
              notInclusive: "turi tur\u0117ti ma\u017Eiau kaip"
            },
            bigger: {
              inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
              notInclusive: "turi tur\u0117ti daugiau kaip"
            }
          }
        },
        set: {
          unit: {
            one: "element\u0105",
            few: "elementus",
            many: "element\u0173"
          },
          verb: {
            smaller: {
              inclusive: "turi tur\u0117ti ne daugiau kaip",
              notInclusive: "turi tur\u0117ti ma\u017Eiau kaip"
            },
            bigger: {
              inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
              notInclusive: "turi tur\u0117ti daugiau kaip"
            }
          }
        }
      };
      function getSizing(origin, unitType, inclusive, targetShouldBe) {
        const result = Sizable[origin] ?? null;
        if (result === null)
          return result;
        return {
          unit: result.unit[unitType],
          verb: result.verb[targetShouldBe][inclusive ? "inclusive" : "notInclusive"]
        };
      }
      const FormatDictionary = {
        regex: "\u012Fvestis",
        email: "el. pa\u0161to adresas",
        url: "URL",
        emoji: "jaustukas",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO data ir laikas",
        date: "ISO data",
        time: "ISO laikas",
        duration: "ISO trukm\u0117",
        ipv4: "IPv4 adresas",
        ipv6: "IPv6 adresas",
        cidrv4: "IPv4 tinklo prefiksas (CIDR)",
        cidrv6: "IPv6 tinklo prefiksas (CIDR)",
        base64: "base64 u\u017Ekoduota eilut\u0117",
        base64url: "base64url u\u017Ekoduota eilut\u0117",
        json_string: "JSON eilut\u0117",
        e164: "E.164 numeris",
        jwt: "JWT",
        template_literal: "\u012Fvestis"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "skai\u010Dius",
        bigint: "sveikasis skai\u010Dius",
        string: "eilut\u0117",
        boolean: "login\u0117 reik\u0161m\u0117",
        undefined: "neapibr\u0117\u017Eta reik\u0161m\u0117",
        function: "funkcija",
        symbol: "simbolis",
        array: "masyvas",
        object: "objektas",
        null: "nulin\u0117 reik\u0161m\u0117"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Gautas tipas ${received}, o tik\u0117tasi - instanceof ${issue.expected}`;
            }
            return `Gautas tipas ${received}, o tik\u0117tasi - ${expected}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Privalo b\u016Bti ${util.stringifyPrimitive(issue.values[0])}`;
            return `Privalo b\u016Bti vienas i\u0161 ${util.joinValues(issue.values, "|")} pasirinkim\u0173`;
          case "too_big": {
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            const sizing = getSizing(issue.origin, getUnitTypeFromNumber(Number(issue.maximum)), issue.inclusive ?? false, "smaller");
            if (sizing?.verb)
              return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue.maximum.toString()} ${sizing.unit ?? "element\u0173"}`;
            const adj = issue.inclusive ? "ne didesnis kaip" : "ma\u017Eesnis kaip";
            return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue.maximum.toString()} ${sizing?.unit}`;
          }
          case "too_small": {
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            const sizing = getSizing(issue.origin, getUnitTypeFromNumber(Number(issue.minimum)), issue.inclusive ?? false, "bigger");
            if (sizing?.verb)
              return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue.minimum.toString()} ${sizing.unit ?? "element\u0173"}`;
            const adj = issue.inclusive ? "ne ma\u017Eesnis kaip" : "didesnis kaip";
            return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue.minimum.toString()} ${sizing?.unit}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `Eilut\u0117 privalo prasid\u0117ti "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Eilut\u0117 privalo pasibaigti "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Eilut\u0117 privalo \u012Ftraukti "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Eilut\u0117 privalo atitikti ${_issue.pattern}`;
            return `Neteisingas ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Skai\u010Dius privalo b\u016Bti ${issue.divisor} kartotinis.`;
          case "unrecognized_keys":
            return `Neatpa\u017Eint${issue.keys.length > 1 ? "i" : "as"} rakt${issue.keys.length > 1 ? "ai" : "as"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return "Rastas klaidingas raktas";
          case "invalid_union":
            return "Klaidinga \u012Fvestis";
          case "invalid_element": {
            const origin = TypeDictionary[issue.origin] ?? issue.origin;
            return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reik\u0161m\u0117")} turi klaiding\u0105 \u012Fvest\u012F`;
          }
          default:
            return "Klaidinga \u012Fvestis";
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/mk.cjs
var require_mk = __commonJS({
  "node_modules/zod/v4/locales/mk.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u0437\u043D\u0430\u0446\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
        file: { unit: "\u0431\u0430\u0458\u0442\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
        array: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
        set: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0432\u043D\u0435\u0441",
        email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u043D\u0430 \u0435-\u043F\u043E\u0448\u0442\u0430",
        url: "URL",
        emoji: "\u0435\u043C\u043E\u045F\u0438",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0434\u0430\u0442\u0443\u043C \u0438 \u0432\u0440\u0435\u043C\u0435",
        date: "ISO \u0434\u0430\u0442\u0443\u043C",
        time: "ISO \u0432\u0440\u0435\u043C\u0435",
        duration: "ISO \u0432\u0440\u0435\u043C\u0435\u0442\u0440\u0430\u0435\u045A\u0435",
        ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441\u0430",
        ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441\u0430",
        cidrv4: "IPv4 \u043E\u043F\u0441\u0435\u0433",
        cidrv6: "IPv6 \u043E\u043F\u0441\u0435\u0433",
        base64: "base64-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
        base64url: "base64url-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
        json_string: "JSON \u043D\u0438\u0437\u0430",
        e164: "E.164 \u0431\u0440\u043E\u0458",
        jwt: "JWT",
        template_literal: "\u0432\u043D\u0435\u0441"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0431\u0440\u043E\u0458",
        array: "\u043D\u0438\u0437\u0430"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 instanceof ${issue.expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
            }
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Invalid input: expected ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u0413\u0440\u0435\u0448\u0430\u043D\u0430 \u043E\u043F\u0446\u0438\u0458\u0430: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 \u0435\u0434\u043D\u0430 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0438"}`;
            return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue.origin} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue.origin} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u043D\u0443\u0432\u0430 \u0441\u043E "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u0432\u0440\u0448\u0443\u0432\u0430 \u0441\u043E "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0432\u043A\u043B\u0443\u0447\u0443\u0432\u0430 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u043E\u0434\u0433\u043E\u0430\u0440\u0430 \u043D\u0430 \u043F\u0430\u0442\u0435\u0440\u043D\u043E\u0442 ${_issue.pattern}`;
            return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u0431\u0440\u043E\u0458: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0431\u0438\u0434\u0435 \u0434\u0435\u043B\u0438\u0432 \u0441\u043E ${issue.divisor}`;
          case "unrecognized_keys":
            return `${issue.keys.length > 1 ? "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D\u0438 \u043A\u043B\u0443\u0447\u0435\u0432\u0438" : "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D \u043A\u043B\u0443\u0447"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u043A\u043B\u0443\u0447 \u0432\u043E ${issue.origin}`;
          case "invalid_union":
            return "\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441";
          case "invalid_element":
            return `\u0413\u0440\u0435\u0448\u043D\u0430 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442 \u0432\u043E ${issue.origin}`;
          default:
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ms.cjs
var require_ms = __commonJS({
  "node_modules/zod/v4/locales/ms.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "aksara", verb: "mempunyai" },
        file: { unit: "bait", verb: "mempunyai" },
        array: { unit: "elemen", verb: "mempunyai" },
        set: { unit: "elemen", verb: "mempunyai" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "alamat e-mel",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "tarikh masa ISO",
        date: "tarikh ISO",
        time: "masa ISO",
        duration: "tempoh ISO",
        ipv4: "alamat IPv4",
        ipv6: "alamat IPv6",
        cidrv4: "julat IPv4",
        cidrv6: "julat IPv6",
        base64: "string dikodkan base64",
        base64url: "string dikodkan base64url",
        json_string: "string JSON",
        e164: "nombor E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "nombor"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Input tidak sah: dijangka instanceof ${issue.expected}, diterima ${received}`;
            }
            return `Input tidak sah: dijangka ${expected}, diterima ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Input tidak sah: dijangka ${util.stringifyPrimitive(issue.values[0])}`;
            return `Pilihan tidak sah: dijangka salah satu daripada ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Terlalu besar: dijangka ${issue.origin ?? "nilai"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elemen"}`;
            return `Terlalu besar: dijangka ${issue.origin ?? "nilai"} adalah ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Terlalu kecil: dijangka ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Terlalu kecil: dijangka ${issue.origin} adalah ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `String tidak sah: mesti bermula dengan "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `String tidak sah: mesti berakhir dengan "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `String tidak sah: mesti mengandungi "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `String tidak sah: mesti sepadan dengan corak ${_issue.pattern}`;
            return `${FormatDictionary[_issue.format] ?? issue.format} tidak sah`;
          }
          case "not_multiple_of":
            return `Nombor tidak sah: perlu gandaan ${issue.divisor}`;
          case "unrecognized_keys":
            return `Kunci tidak dikenali: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Kunci tidak sah dalam ${issue.origin}`;
          case "invalid_union":
            return "Input tidak sah";
          case "invalid_element":
            return `Nilai tidak sah dalam ${issue.origin}`;
          default:
            return `Input tidak sah`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/nl.cjs
var require_nl = __commonJS({
  "node_modules/zod/v4/locales/nl.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "tekens", verb: "heeft" },
        file: { unit: "bytes", verb: "heeft" },
        array: { unit: "elementen", verb: "heeft" },
        set: { unit: "elementen", verb: "heeft" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "invoer",
        email: "emailadres",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum en tijd",
        date: "ISO datum",
        time: "ISO tijd",
        duration: "ISO duur",
        ipv4: "IPv4-adres",
        ipv6: "IPv6-adres",
        cidrv4: "IPv4-bereik",
        cidrv6: "IPv6-bereik",
        base64: "base64-gecodeerde tekst",
        base64url: "base64 URL-gecodeerde tekst",
        json_string: "JSON string",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "invoer"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "getal"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Ongeldige invoer: verwacht instanceof ${issue.expected}, ontving ${received}`;
            }
            return `Ongeldige invoer: verwacht ${expected}, ontving ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Ongeldige invoer: verwacht ${util.stringifyPrimitive(issue.values[0])}`;
            return `Ongeldige optie: verwacht \xE9\xE9n van ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            const longName = issue.origin === "date" ? "laat" : issue.origin === "string" ? "lang" : "groot";
            if (sizing)
              return `Te ${longName}: verwacht dat ${issue.origin ?? "waarde"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementen"} ${sizing.verb}`;
            return `Te ${longName}: verwacht dat ${issue.origin ?? "waarde"} ${adj}${issue.maximum.toString()} is`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            const shortName = issue.origin === "date" ? "vroeg" : issue.origin === "string" ? "kort" : "klein";
            if (sizing) {
              return `Te ${shortName}: verwacht dat ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
            }
            return `Te ${shortName}: verwacht dat ${issue.origin} ${adj}${issue.minimum.toString()} is`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `Ongeldige tekst: moet met "${_issue.prefix}" beginnen`;
            }
            if (_issue.format === "ends_with")
              return `Ongeldige tekst: moet op "${_issue.suffix}" eindigen`;
            if (_issue.format === "includes")
              return `Ongeldige tekst: moet "${_issue.includes}" bevatten`;
            if (_issue.format === "regex")
              return `Ongeldige tekst: moet overeenkomen met patroon ${_issue.pattern}`;
            return `Ongeldig: ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Ongeldig getal: moet een veelvoud van ${issue.divisor} zijn`;
          case "unrecognized_keys":
            return `Onbekende key${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Ongeldige key in ${issue.origin}`;
          case "invalid_union":
            return "Ongeldige invoer";
          case "invalid_element":
            return `Ongeldige waarde in ${issue.origin}`;
          default:
            return `Ongeldige invoer`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/no.cjs
var require_no = __commonJS({
  "node_modules/zod/v4/locales/no.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "tegn", verb: "\xE5 ha" },
        file: { unit: "bytes", verb: "\xE5 ha" },
        array: { unit: "elementer", verb: "\xE5 inneholde" },
        set: { unit: "elementer", verb: "\xE5 inneholde" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "input",
        email: "e-postadresse",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO dato- og klokkeslett",
        date: "ISO-dato",
        time: "ISO-klokkeslett",
        duration: "ISO-varighet",
        ipv4: "IPv4-omr\xE5de",
        ipv6: "IPv6-omr\xE5de",
        cidrv4: "IPv4-spekter",
        cidrv6: "IPv6-spekter",
        base64: "base64-enkodet streng",
        base64url: "base64url-enkodet streng",
        json_string: "JSON-streng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "tall",
        array: "liste"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Ugyldig input: forventet instanceof ${issue.expected}, fikk ${received}`;
            }
            return `Ugyldig input: forventet ${expected}, fikk ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Ugyldig verdi: forventet ${util.stringifyPrimitive(issue.values[0])}`;
            return `Ugyldig valg: forventet en av ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `For stor(t): forventet ${issue.origin ?? "value"} til \xE5 ha ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementer"}`;
            return `For stor(t): forventet ${issue.origin ?? "value"} til \xE5 ha ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `For lite(n): forventet ${issue.origin} til \xE5 ha ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `For lite(n): forventet ${issue.origin} til \xE5 ha ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Ugyldig streng: m\xE5 starte med "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Ugyldig streng: m\xE5 ende med "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Ugyldig streng: m\xE5 inneholde "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Ugyldig streng: m\xE5 matche m\xF8nsteret ${_issue.pattern}`;
            return `Ugyldig ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Ugyldig tall: m\xE5 v\xE6re et multiplum av ${issue.divisor}`;
          case "unrecognized_keys":
            return `${issue.keys.length > 1 ? "Ukjente n\xF8kler" : "Ukjent n\xF8kkel"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Ugyldig n\xF8kkel i ${issue.origin}`;
          case "invalid_union":
            return "Ugyldig input";
          case "invalid_element":
            return `Ugyldig verdi i ${issue.origin}`;
          default:
            return `Ugyldig input`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ota.cjs
var require_ota = __commonJS({
  "node_modules/zod/v4/locales/ota.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "harf", verb: "olmal\u0131d\u0131r" },
        file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
        array: { unit: "unsur", verb: "olmal\u0131d\u0131r" },
        set: { unit: "unsur", verb: "olmal\u0131d\u0131r" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "giren",
        email: "epostag\xE2h",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO heng\xE2m\u0131",
        date: "ISO tarihi",
        time: "ISO zaman\u0131",
        duration: "ISO m\xFCddeti",
        ipv4: "IPv4 ni\u015F\xE2n\u0131",
        ipv6: "IPv6 ni\u015F\xE2n\u0131",
        cidrv4: "IPv4 menzili",
        cidrv6: "IPv6 menzili",
        base64: "base64-\u015Fifreli metin",
        base64url: "base64url-\u015Fifreli metin",
        json_string: "JSON metin",
        e164: "E.164 say\u0131s\u0131",
        jwt: "JWT",
        template_literal: "giren"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "numara",
        array: "saf",
        null: "gayb"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `F\xE2sit giren: umulan instanceof ${issue.expected}, al\u0131nan ${received}`;
            }
            return `F\xE2sit giren: umulan ${expected}, al\u0131nan ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `F\xE2sit giren: umulan ${util.stringifyPrimitive(issue.values[0])}`;
            return `F\xE2sit tercih: m\xFBteberler ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Fazla b\xFCy\xFCk: ${issue.origin ?? "value"}, ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"} sahip olmal\u0131yd\u0131.`;
            return `Fazla b\xFCy\xFCk: ${issue.origin ?? "value"}, ${adj}${issue.maximum.toString()} olmal\u0131yd\u0131.`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Fazla k\xFC\xE7\xFCk: ${issue.origin}, ${adj}${issue.minimum.toString()} ${sizing.unit} sahip olmal\u0131yd\u0131.`;
            }
            return `Fazla k\xFC\xE7\xFCk: ${issue.origin}, ${adj}${issue.minimum.toString()} olmal\u0131yd\u0131.`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `F\xE2sit metin: "${_issue.prefix}" ile ba\u015Flamal\u0131.`;
            if (_issue.format === "ends_with")
              return `F\xE2sit metin: "${_issue.suffix}" ile bitmeli.`;
            if (_issue.format === "includes")
              return `F\xE2sit metin: "${_issue.includes}" ihtiv\xE2 etmeli.`;
            if (_issue.format === "regex")
              return `F\xE2sit metin: ${_issue.pattern} nak\u015F\u0131na uymal\u0131.`;
            return `F\xE2sit ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `F\xE2sit say\u0131: ${issue.divisor} kat\u0131 olmal\u0131yd\u0131.`;
          case "unrecognized_keys":
            return `Tan\u0131nmayan anahtar ${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `${issue.origin} i\xE7in tan\u0131nmayan anahtar var.`;
          case "invalid_union":
            return "Giren tan\u0131namad\u0131.";
          case "invalid_element":
            return `${issue.origin} i\xE7in tan\u0131nmayan k\u0131ymet var.`;
          default:
            return `K\u0131ymet tan\u0131namad\u0131.`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ps.cjs
var require_ps = __commonJS({
  "node_modules/zod/v4/locales/ps.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
        file: { unit: "\u0628\u0627\u06CC\u067C\u0633", verb: "\u0648\u0644\u0631\u064A" },
        array: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
        set: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0648\u0631\u0648\u062F\u064A",
        email: "\u0628\u0631\u06CC\u069A\u0646\u0627\u0644\u06CC\u06A9",
        url: "\u06CC\u0648 \u0622\u0631 \u0627\u0644",
        emoji: "\u0627\u06CC\u0645\u0648\u062C\u064A",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u0646\u06CC\u067C\u0647 \u0627\u0648 \u0648\u062E\u062A",
        date: "\u0646\u06D0\u067C\u0647",
        time: "\u0648\u062E\u062A",
        duration: "\u0645\u0648\u062F\u0647",
        ipv4: "\u062F IPv4 \u067E\u062A\u0647",
        ipv6: "\u062F IPv6 \u067E\u062A\u0647",
        cidrv4: "\u062F IPv4 \u0633\u0627\u062D\u0647",
        cidrv6: "\u062F IPv6 \u0633\u0627\u062D\u0647",
        base64: "base64-encoded \u0645\u062A\u0646",
        base64url: "base64url-encoded \u0645\u062A\u0646",
        json_string: "JSON \u0645\u062A\u0646",
        e164: "\u062F E.164 \u0634\u0645\u06D0\u0631\u0647",
        jwt: "JWT",
        template_literal: "\u0648\u0631\u0648\u062F\u064A"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0639\u062F\u062F",
        array: "\u0627\u0631\u06D0"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F instanceof ${issue.expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
            }
            return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
          }
          case "invalid_value":
            if (issue.values.length === 1) {
              return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${util.stringifyPrimitive(issue.values[0])} \u0648\u0627\u06CC`;
            }
            return `\u0646\u0627\u0633\u0645 \u0627\u0646\u062A\u062E\u0627\u0628: \u0628\u0627\u06CC\u062F \u06CC\u0648 \u0644\u0647 ${util.joinValues(issue.values, "|")} \u0685\u062E\u0647 \u0648\u0627\u06CC`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631\u0648\u0646\u0647"} \u0648\u0644\u0631\u064A`;
            }
            return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue.maximum.toString()} \u0648\u064A`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue.origin} \u0628\u0627\u06CC\u062F ${adj}${issue.minimum.toString()} ${sizing.unit} \u0648\u0644\u0631\u064A`;
            }
            return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue.origin} \u0628\u0627\u06CC\u062F ${adj}${issue.minimum.toString()} \u0648\u064A`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.prefix}" \u0633\u0631\u0647 \u067E\u06CC\u0644 \u0634\u064A`;
            }
            if (_issue.format === "ends_with") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.suffix}" \u0633\u0631\u0647 \u067E\u0627\u06CC \u062A\u0647 \u0648\u0631\u0633\u064A\u0696\u064A`;
            }
            if (_issue.format === "includes") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F "${_issue.includes}" \u0648\u0644\u0631\u064A`;
            }
            if (_issue.format === "regex") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F ${_issue.pattern} \u0633\u0631\u0647 \u0645\u0637\u0627\u0628\u0642\u062A \u0648\u0644\u0631\u064A`;
            }
            return `${FormatDictionary[_issue.format] ?? issue.format} \u0646\u0627\u0633\u0645 \u062F\u06CC`;
          }
          case "not_multiple_of":
            return `\u0646\u0627\u0633\u0645 \u0639\u062F\u062F: \u0628\u0627\u06CC\u062F \u062F ${issue.divisor} \u0645\u0636\u0631\u0628 \u0648\u064A`;
          case "unrecognized_keys":
            return `\u0646\u0627\u0633\u0645 ${issue.keys.length > 1 ? "\u06A9\u0644\u06CC\u0689\u0648\u0646\u0647" : "\u06A9\u0644\u06CC\u0689"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u0646\u0627\u0633\u0645 \u06A9\u0644\u06CC\u0689 \u067E\u0647 ${issue.origin} \u06A9\u06D0`;
          case "invalid_union":
            return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
          case "invalid_element":
            return `\u0646\u0627\u0633\u0645 \u0639\u0646\u0635\u0631 \u067E\u0647 ${issue.origin} \u06A9\u06D0`;
          default:
            return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/pl.cjs
var require_pl = __commonJS({
  "node_modules/zod/v4/locales/pl.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "znak\xF3w", verb: "mie\u0107" },
        file: { unit: "bajt\xF3w", verb: "mie\u0107" },
        array: { unit: "element\xF3w", verb: "mie\u0107" },
        set: { unit: "element\xF3w", verb: "mie\u0107" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "wyra\u017Cenie",
        email: "adres email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data i godzina w formacie ISO",
        date: "data w formacie ISO",
        time: "godzina w formacie ISO",
        duration: "czas trwania ISO",
        ipv4: "adres IPv4",
        ipv6: "adres IPv6",
        cidrv4: "zakres IPv4",
        cidrv6: "zakres IPv6",
        base64: "ci\u0105g znak\xF3w zakodowany w formacie base64",
        base64url: "ci\u0105g znak\xF3w zakodowany w formacie base64url",
        json_string: "ci\u0105g znak\xF3w w formacie JSON",
        e164: "liczba E.164",
        jwt: "JWT",
        template_literal: "wej\u015Bcie"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "liczba",
        array: "tablica"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano instanceof ${issue.expected}, otrzymano ${received}`;
            }
            return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${expected}, otrzymano ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${util.stringifyPrimitive(issue.values[0])}`;
            return `Nieprawid\u0142owa opcja: oczekiwano jednej z warto\u015Bci ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Za du\u017Ca warto\u015B\u0107: oczekiwano, \u017Ce ${issue.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue.maximum.toString()} ${sizing.unit ?? "element\xF3w"}`;
            }
            return `Zbyt du\u017C(y/a/e): oczekiwano, \u017Ce ${issue.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Za ma\u0142a warto\u015B\u0107: oczekiwano, \u017Ce ${issue.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue.minimum.toString()} ${sizing.unit ?? "element\xF3w"}`;
            }
            return `Zbyt ma\u0142(y/a/e): oczekiwano, \u017Ce ${issue.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zaczyna\u0107 si\u0119 od "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi ko\u0144czy\u0107 si\u0119 na "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zawiera\u0107 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi odpowiada\u0107 wzorcowi ${_issue.pattern}`;
            return `Nieprawid\u0142ow(y/a/e) ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Nieprawid\u0142owa liczba: musi by\u0107 wielokrotno\u015Bci\u0105 ${issue.divisor}`;
          case "unrecognized_keys":
            return `Nierozpoznane klucze${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Nieprawid\u0142owy klucz w ${issue.origin}`;
          case "invalid_union":
            return "Nieprawid\u0142owe dane wej\u015Bciowe";
          case "invalid_element":
            return `Nieprawid\u0142owa warto\u015B\u0107 w ${issue.origin}`;
          default:
            return `Nieprawid\u0142owe dane wej\u015Bciowe`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/pt.cjs
var require_pt = __commonJS({
  "node_modules/zod/v4/locales/pt.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "caracteres", verb: "ter" },
        file: { unit: "bytes", verb: "ter" },
        array: { unit: "itens", verb: "ter" },
        set: { unit: "itens", verb: "ter" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "padr\xE3o",
        email: "endere\xE7o de e-mail",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data e hora ISO",
        date: "data ISO",
        time: "hora ISO",
        duration: "dura\xE7\xE3o ISO",
        ipv4: "endere\xE7o IPv4",
        ipv6: "endere\xE7o IPv6",
        cidrv4: "faixa de IPv4",
        cidrv6: "faixa de IPv6",
        base64: "texto codificado em base64",
        base64url: "URL codificada em base64",
        json_string: "texto JSON",
        e164: "n\xFAmero E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "n\xFAmero",
        null: "nulo"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Tipo inv\xE1lido: esperado instanceof ${issue.expected}, recebido ${received}`;
            }
            return `Tipo inv\xE1lido: esperado ${expected}, recebido ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Entrada inv\xE1lida: esperado ${util.stringifyPrimitive(issue.values[0])}`;
            return `Op\xE7\xE3o inv\xE1lida: esperada uma das ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Muito grande: esperado que ${issue.origin ?? "valor"} tivesse ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementos"}`;
            return `Muito grande: esperado que ${issue.origin ?? "valor"} fosse ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Muito pequeno: esperado que ${issue.origin} tivesse ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Muito pequeno: esperado que ${issue.origin} fosse ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Texto inv\xE1lido: deve come\xE7ar com "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Texto inv\xE1lido: deve terminar com "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Texto inv\xE1lido: deve incluir "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Texto inv\xE1lido: deve corresponder ao padr\xE3o ${_issue.pattern}`;
            return `${FormatDictionary[_issue.format] ?? issue.format} inv\xE1lido`;
          }
          case "not_multiple_of":
            return `N\xFAmero inv\xE1lido: deve ser m\xFAltiplo de ${issue.divisor}`;
          case "unrecognized_keys":
            return `Chave${issue.keys.length > 1 ? "s" : ""} desconhecida${issue.keys.length > 1 ? "s" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Chave inv\xE1lida em ${issue.origin}`;
          case "invalid_union":
            return "Entrada inv\xE1lida";
          case "invalid_element":
            return `Valor inv\xE1lido em ${issue.origin}`;
          default:
            return `Campo inv\xE1lido`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ro.cjs
var require_ro = __commonJS({
  "node_modules/zod/v4/locales/ro.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "caractere", verb: "s\u0103 aib\u0103" },
        file: { unit: "octe\u021Bi", verb: "s\u0103 aib\u0103" },
        array: { unit: "elemente", verb: "s\u0103 aib\u0103" },
        set: { unit: "elemente", verb: "s\u0103 aib\u0103" },
        map: { unit: "intr\u0103ri", verb: "s\u0103 aib\u0103" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "intrare",
        email: "adres\u0103 de email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "dat\u0103 \u0219i or\u0103 ISO",
        date: "dat\u0103 ISO",
        time: "or\u0103 ISO",
        duration: "durat\u0103 ISO",
        ipv4: "adres\u0103 IPv4",
        ipv6: "adres\u0103 IPv6",
        mac: "adres\u0103 MAC",
        cidrv4: "interval IPv4",
        cidrv6: "interval IPv6",
        base64: "\u0219ir codat base64",
        base64url: "\u0219ir codat base64url",
        json_string: "\u0219ir JSON",
        e164: "num\u0103r E.164",
        jwt: "JWT",
        template_literal: "intrare"
      };
      const TypeDictionary = {
        nan: "NaN",
        string: "\u0219ir",
        number: "num\u0103r",
        boolean: "boolean",
        function: "func\u021Bie",
        array: "matrice",
        object: "obiect",
        undefined: "nedefinit",
        symbol: "simbol",
        bigint: "num\u0103r mare",
        void: "void",
        never: "never",
        map: "hart\u0103",
        set: "set"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            return `Intrare invalid\u0103: a\u0219teptat ${expected}, primit ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Intrare invalid\u0103: a\u0219teptat ${util.stringifyPrimitive(issue.values[0])}`;
            return `Op\u021Biune invalid\u0103: a\u0219teptat una dintre ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Prea mare: a\u0219teptat ca ${issue.origin ?? "valoarea"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elemente"}`;
            return `Prea mare: a\u0219teptat ca ${issue.origin ?? "valoarea"} s\u0103 fie ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Prea mic: a\u0219teptat ca ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Prea mic: a\u0219teptat ca ${issue.origin} s\u0103 fie ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u0218ir invalid: trebuie s\u0103 \xEEnceap\u0103 cu "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u0218ir invalid: trebuie s\u0103 se termine cu "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u0218ir invalid: trebuie s\u0103 includ\u0103 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u0218ir invalid: trebuie s\u0103 se potriveasc\u0103 cu modelul ${_issue.pattern}`;
            return `Format invalid: ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Num\u0103r invalid: trebuie s\u0103 fie multiplu de ${issue.divisor}`;
          case "unrecognized_keys":
            return `Chei nerecunoscute: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Cheie invalid\u0103 \xEEn ${issue.origin}`;
          case "invalid_union":
            return "Intrare invalid\u0103";
          case "invalid_element":
            return `Valoare invalid\u0103 \xEEn ${issue.origin}`;
          default:
            return `Intrare invalid\u0103`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ru.cjs
var require_ru = __commonJS({
  "node_modules/zod/v4/locales/ru.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    function getRussianPlural(count, one, few, many) {
      const absCount = Math.abs(count);
      const lastDigit = absCount % 10;
      const lastTwoDigits = absCount % 100;
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return many;
      }
      if (lastDigit === 1) {
        return one;
      }
      if (lastDigit >= 2 && lastDigit <= 4) {
        return few;
      }
      return many;
    }
    var error = () => {
      const Sizable = {
        string: {
          unit: {
            one: "\u0441\u0438\u043C\u0432\u043E\u043B",
            few: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430",
            many: "\u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        },
        file: {
          unit: {
            one: "\u0431\u0430\u0439\u0442",
            few: "\u0431\u0430\u0439\u0442\u0430",
            many: "\u0431\u0430\u0439\u0442"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        },
        array: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        },
        set: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0432\u0432\u043E\u0434",
        email: "email \u0430\u0434\u0440\u0435\u0441",
        url: "URL",
        emoji: "\u044D\u043C\u043E\u0434\u0437\u0438",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F",
        date: "ISO \u0434\u0430\u0442\u0430",
        time: "ISO \u0432\u0440\u0435\u043C\u044F",
        duration: "ISO \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
        ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
        ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
        cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
        cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
        base64: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64",
        base64url: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64url",
        json_string: "JSON \u0441\u0442\u0440\u043E\u043A\u0430",
        e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
        jwt: "JWT",
        template_literal: "\u0432\u0432\u043E\u0434"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0447\u0438\u0441\u043B\u043E",
        array: "\u043C\u0430\u0441\u0441\u0438\u0432"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C instanceof ${issue.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
            }
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0434\u043D\u043E \u0438\u0437 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              const maxValue = Number(issue.maximum);
              const unit = getRussianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue.maximum.toString()} ${unit}`;
            }
            return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              const minValue = Number(issue.minimum);
              const unit = getRussianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue.origin} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue.minimum.toString()} ${unit}`;
            }
            return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue.origin} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0442\u044C\u0441\u044F \u0441 "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E: \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u041D\u0435\u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D${issue.keys.length > 1 ? "\u044B\u0435" : "\u044B\u0439"} \u043A\u043B\u044E\u0447${issue.keys.length > 1 ? "\u0438" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u0432 ${issue.origin}`;
          case "invalid_union":
            return "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435";
          case "invalid_element":
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432 ${issue.origin}`;
          default:
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/sl.cjs
var require_sl = __commonJS({
  "node_modules/zod/v4/locales/sl.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "znakov", verb: "imeti" },
        file: { unit: "bajtov", verb: "imeti" },
        array: { unit: "elementov", verb: "imeti" },
        set: { unit: "elementov", verb: "imeti" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "vnos",
        email: "e-po\u0161tni naslov",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum in \u010Das",
        date: "ISO datum",
        time: "ISO \u010Das",
        duration: "ISO trajanje",
        ipv4: "IPv4 naslov",
        ipv6: "IPv6 naslov",
        cidrv4: "obseg IPv4",
        cidrv6: "obseg IPv6",
        base64: "base64 kodiran niz",
        base64url: "base64url kodiran niz",
        json_string: "JSON niz",
        e164: "E.164 \u0161tevilka",
        jwt: "JWT",
        template_literal: "vnos"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0161tevilo",
        array: "tabela"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Neveljaven vnos: pri\u010Dakovano instanceof ${issue.expected}, prejeto ${received}`;
            }
            return `Neveljaven vnos: pri\u010Dakovano ${expected}, prejeto ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Neveljaven vnos: pri\u010Dakovano ${util.stringifyPrimitive(issue.values[0])}`;
            return `Neveljavna mo\u017Enost: pri\u010Dakovano eno izmed ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Preveliko: pri\u010Dakovano, da bo ${issue.origin ?? "vrednost"} imelo ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementov"}`;
            return `Preveliko: pri\u010Dakovano, da bo ${issue.origin ?? "vrednost"} ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Premajhno: pri\u010Dakovano, da bo ${issue.origin} imelo ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Premajhno: pri\u010Dakovano, da bo ${issue.origin} ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `Neveljaven niz: mora se za\u010Deti z "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Neveljaven niz: mora se kon\u010Dati z "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Neveljaven niz: mora vsebovati "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Neveljaven niz: mora ustrezati vzorcu ${_issue.pattern}`;
            return `Neveljaven ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Neveljavno \u0161tevilo: mora biti ve\u010Dkratnik ${issue.divisor}`;
          case "unrecognized_keys":
            return `Neprepoznan${issue.keys.length > 1 ? "i klju\u010Di" : " klju\u010D"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Neveljaven klju\u010D v ${issue.origin}`;
          case "invalid_union":
            return "Neveljaven vnos";
          case "invalid_element":
            return `Neveljavna vrednost v ${issue.origin}`;
          default:
            return "Neveljaven vnos";
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/sv.cjs
var require_sv = __commonJS({
  "node_modules/zod/v4/locales/sv.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "tecken", verb: "att ha" },
        file: { unit: "bytes", verb: "att ha" },
        array: { unit: "objekt", verb: "att inneh\xE5lla" },
        set: { unit: "objekt", verb: "att inneh\xE5lla" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "regulj\xE4rt uttryck",
        email: "e-postadress",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-datum och tid",
        date: "ISO-datum",
        time: "ISO-tid",
        duration: "ISO-varaktighet",
        ipv4: "IPv4-intervall",
        ipv6: "IPv6-intervall",
        cidrv4: "IPv4-spektrum",
        cidrv6: "IPv6-spektrum",
        base64: "base64-kodad str\xE4ng",
        base64url: "base64url-kodad str\xE4ng",
        json_string: "JSON-str\xE4ng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "mall-literal"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "antal",
        array: "lista"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Ogiltig inmatning: f\xF6rv\xE4ntat instanceof ${issue.expected}, fick ${received}`;
            }
            return `Ogiltig inmatning: f\xF6rv\xE4ntat ${expected}, fick ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Ogiltig inmatning: f\xF6rv\xE4ntat ${util.stringifyPrimitive(issue.values[0])}`;
            return `Ogiltigt val: f\xF6rv\xE4ntade en av ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `F\xF6r stor(t): f\xF6rv\xE4ntade ${issue.origin ?? "v\xE4rdet"} att ha ${adj}${issue.maximum.toString()} ${sizing.unit ?? "element"}`;
            }
            return `F\xF6r stor(t): f\xF6rv\xE4ntat ${issue.origin ?? "v\xE4rdet"} att ha ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue.origin ?? "v\xE4rdet"} att ha ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue.origin ?? "v\xE4rdet"} att ha ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `Ogiltig str\xE4ng: m\xE5ste b\xF6rja med "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Ogiltig str\xE4ng: m\xE5ste sluta med "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Ogiltig str\xE4ng: m\xE5ste inneh\xE5lla "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Ogiltig str\xE4ng: m\xE5ste matcha m\xF6nstret "${_issue.pattern}"`;
            return `Ogiltig(t) ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Ogiltigt tal: m\xE5ste vara en multipel av ${issue.divisor}`;
          case "unrecognized_keys":
            return `${issue.keys.length > 1 ? "Ok\xE4nda nycklar" : "Ok\xE4nd nyckel"}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Ogiltig nyckel i ${issue.origin ?? "v\xE4rdet"}`;
          case "invalid_union":
            return "Ogiltig input";
          case "invalid_element":
            return `Ogiltigt v\xE4rde i ${issue.origin ?? "v\xE4rdet"}`;
          default:
            return `Ogiltig input`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ta.cjs
var require_ta = __commonJS({
  "node_modules/zod/v4/locales/ta.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u0B8E\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
        file: { unit: "\u0BAA\u0BC8\u0B9F\u0BCD\u0B9F\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
        array: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
        set: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1",
        email: "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0BA4\u0BC7\u0BA4\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
        date: "ISO \u0BA4\u0BC7\u0BA4\u0BBF",
        time: "ISO \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
        duration: "ISO \u0B95\u0BBE\u0BB2 \u0B85\u0BB3\u0BB5\u0BC1",
        ipv4: "IPv4 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
        ipv6: "IPv6 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
        cidrv4: "IPv4 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
        cidrv6: "IPv6 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
        base64: "base64-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
        base64url: "base64url-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
        json_string: "JSON \u0B9A\u0BB0\u0BAE\u0BCD",
        e164: "E.164 \u0B8E\u0BA3\u0BCD",
        jwt: "JWT",
        template_literal: "input"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0B8E\u0BA3\u0BCD",
        array: "\u0B85\u0BA3\u0BBF",
        null: "\u0BB5\u0BC6\u0BB1\u0BC1\u0BAE\u0BC8"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 instanceof ${issue.expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
            }
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${util.joinValues(issue.values, "|")} \u0B87\u0BB2\u0BCD \u0B92\u0BA9\u0BCD\u0BB1\u0BC1`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD"} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            }
            return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue.maximum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            }
            return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue.origin} ${adj}${issue.minimum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.prefix}" \u0B87\u0BB2\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            if (_issue.format === "ends_with")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.suffix}" \u0B87\u0BB2\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0B9F\u0BC8\u0BAF \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            if (_issue.format === "includes")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.includes}" \u0B90 \u0B89\u0BB3\u0BCD\u0BB3\u0B9F\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            if (_issue.format === "regex")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: ${_issue.pattern} \u0BAE\u0BC1\u0BB1\u0BC8\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0B9F\u0BA9\u0BCD \u0BAA\u0BCA\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B8E\u0BA3\u0BCD: ${issue.divisor} \u0B87\u0BA9\u0BCD \u0BAA\u0BB2\u0BAE\u0BBE\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
          case "unrecognized_keys":
            return `\u0B85\u0B9F\u0BC8\u0BAF\u0BBE\u0BB3\u0BAE\u0BCD \u0BA4\u0BC6\u0BB0\u0BBF\u0BAF\u0BBE\u0BA4 \u0BB5\u0BBF\u0B9A\u0BC8${issue.keys.length > 1 ? "\u0B95\u0BB3\u0BCD" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `${issue.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0B9A\u0BC8`;
          case "invalid_union":
            return "\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1";
          case "invalid_element":
            return `${issue.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1`;
          default:
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/th.cjs
var require_th = __commonJS({
  "node_modules/zod/v4/locales/th.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
        file: { unit: "\u0E44\u0E1A\u0E15\u0E4C", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
        array: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
        set: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19",
        email: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2D\u0E35\u0E40\u0E21\u0E25",
        url: "URL",
        emoji: "\u0E2D\u0E34\u0E42\u0E21\u0E08\u0E34",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
        date: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1A\u0E1A ISO",
        time: "\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
        duration: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
        ipv4: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv4",
        ipv6: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv6",
        cidrv4: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv4",
        cidrv6: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv6",
        base64: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64",
        base64url: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A URL",
        json_string: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A JSON",
        e164: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28 (E.164)",
        jwt: "\u0E42\u0E17\u0E40\u0E04\u0E19 JWT",
        template_literal: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02",
        array: "\u0E2D\u0E32\u0E23\u0E4C\u0E40\u0E23\u0E22\u0E4C (Array)",
        null: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 (null)"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 instanceof ${issue.expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
            }
            return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u0E04\u0E48\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E19 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19" : "\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue.maximum.toString()} ${sizing.unit ?? "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}`;
            return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? "\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22" : "\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E25\u0E07\u0E17\u0E49\u0E32\u0E22\u0E14\u0E49\u0E27\u0E22 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35 "${_issue.includes}" \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21`;
            if (_issue.format === "regex")
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14 ${_issue.pattern}`;
            return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22 ${issue.divisor} \u0E44\u0E14\u0E49\u0E25\u0E07\u0E15\u0E31\u0E27`;
          case "unrecognized_keys":
            return `\u0E1E\u0E1A\u0E04\u0E35\u0E22\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u0E04\u0E35\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue.origin}`;
          case "invalid_union":
            return "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E22\u0E39\u0E40\u0E19\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49";
          case "invalid_element":
            return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue.origin}`;
          default:
            return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/tr.cjs
var require_tr = __commonJS({
  "node_modules/zod/v4/locales/tr.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "olmal\u0131" },
        file: { unit: "bayt", verb: "olmal\u0131" },
        array: { unit: "\xF6\u011Fe", verb: "olmal\u0131" },
        set: { unit: "\xF6\u011Fe", verb: "olmal\u0131" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "girdi",
        email: "e-posta adresi",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO tarih ve saat",
        date: "ISO tarih",
        time: "ISO saat",
        duration: "ISO s\xFCre",
        ipv4: "IPv4 adresi",
        ipv6: "IPv6 adresi",
        cidrv4: "IPv4 aral\u0131\u011F\u0131",
        cidrv6: "IPv6 aral\u0131\u011F\u0131",
        base64: "base64 ile \u015Fifrelenmi\u015F metin",
        base64url: "base64url ile \u015Fifrelenmi\u015F metin",
        json_string: "JSON dizesi",
        e164: "E.164 say\u0131s\u0131",
        jwt: "JWT",
        template_literal: "\u015Eablon dizesi"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Ge\xE7ersiz de\u011Fer: beklenen instanceof ${issue.expected}, al\u0131nan ${received}`;
            }
            return `Ge\xE7ersiz de\u011Fer: beklenen ${expected}, al\u0131nan ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Ge\xE7ersiz de\u011Fer: beklenen ${util.stringifyPrimitive(issue.values[0])}`;
            return `Ge\xE7ersiz se\xE7enek: a\u015Fa\u011F\u0131dakilerden biri olmal\u0131: ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\xC7ok b\xFCy\xFCk: beklenen ${issue.origin ?? "de\u011Fer"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\xF6\u011Fe"}`;
            return `\xC7ok b\xFCy\xFCk: beklenen ${issue.origin ?? "de\u011Fer"} ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue.origin} ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Ge\xE7ersiz metin: "${_issue.prefix}" ile ba\u015Flamal\u0131`;
            if (_issue.format === "ends_with")
              return `Ge\xE7ersiz metin: "${_issue.suffix}" ile bitmeli`;
            if (_issue.format === "includes")
              return `Ge\xE7ersiz metin: "${_issue.includes}" i\xE7ermeli`;
            if (_issue.format === "regex")
              return `Ge\xE7ersiz metin: ${_issue.pattern} desenine uymal\u0131`;
            return `Ge\xE7ersiz ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Ge\xE7ersiz say\u0131: ${issue.divisor} ile tam b\xF6l\xFCnebilmeli`;
          case "unrecognized_keys":
            return `Tan\u0131nmayan anahtar${issue.keys.length > 1 ? "lar" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `${issue.origin} i\xE7inde ge\xE7ersiz anahtar`;
          case "invalid_union":
            return "Ge\xE7ersiz de\u011Fer";
          case "invalid_element":
            return `${issue.origin} i\xE7inde ge\xE7ersiz de\u011Fer`;
          default:
            return `Ge\xE7ersiz de\u011Fer`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/uk.cjs
var require_uk = __commonJS({
  "node_modules/zod/v4/locales/uk.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
        file: { unit: "\u0431\u0430\u0439\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
        array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
        set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456",
        email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u043F\u043E\u0448\u0442\u0438",
        url: "URL",
        emoji: "\u0435\u043C\u043E\u0434\u0437\u0456",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u0434\u0430\u0442\u0430 \u0442\u0430 \u0447\u0430\u0441 ISO",
        date: "\u0434\u0430\u0442\u0430 ISO",
        time: "\u0447\u0430\u0441 ISO",
        duration: "\u0442\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C ISO",
        ipv4: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv4",
        ipv6: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv6",
        cidrv4: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv4",
        cidrv6: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv6",
        base64: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64",
        base64url: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64url",
        json_string: "\u0440\u044F\u0434\u043E\u043A JSON",
        e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
        jwt: "JWT",
        template_literal: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0447\u0438\u0441\u043B\u043E",
        array: "\u043C\u0430\u0441\u0438\u0432"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F instanceof ${issue.expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
            }
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430 \u043E\u043F\u0446\u0456\u044F: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u043D\u0435 \u0437 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432"}`;
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} \u0431\u0443\u0434\u0435 ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue.origin} \u0431\u0443\u0434\u0435 ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043F\u043E\u0447\u0438\u043D\u0430\u0442\u0438\u0441\u044F \u0437 "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0437\u0430\u043A\u0456\u043D\u0447\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0447\u0438\u0441\u043B\u043E: \u043F\u043E\u0432\u0438\u043D\u043D\u043E \u0431\u0443\u0442\u0438 \u043A\u0440\u0430\u0442\u043D\u0438\u043C ${issue.divisor}`;
          case "unrecognized_keys":
            return `\u041D\u0435\u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u043D\u0438\u0439 \u043A\u043B\u044E\u0447${issue.keys.length > 1 ? "\u0456" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 \u0443 ${issue.origin}`;
          case "invalid_union":
            return "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456";
          case "invalid_element":
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0443 ${issue.origin}`;
          default:
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ua.cjs
var require_ua = __commonJS({
  "node_modules/zod/v4/locales/ua.cjs"(exports2, module2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var uk_js_1 = __importDefault(require_uk());
    function default_1() {
      return (0, uk_js_1.default)();
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/ur.cjs
var require_ur = __commonJS({
  "node_modules/zod/v4/locales/ur.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u062D\u0631\u0648\u0641", verb: "\u06C1\u0648\u0646\u0627" },
        file: { unit: "\u0628\u0627\u0626\u0679\u0633", verb: "\u06C1\u0648\u0646\u0627" },
        array: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" },
        set: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0627\u0646 \u067E\u0679",
        email: "\u0627\u06CC \u0645\u06CC\u0644 \u0627\u06CC\u0688\u0631\u06CC\u0633",
        url: "\u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644",
        emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
        uuid: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        uuidv4: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 4",
        uuidv6: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 6",
        nanoid: "\u0646\u06CC\u0646\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        guid: "\u062C\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        cuid: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        cuid2: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC 2",
        ulid: "\u06CC\u0648 \u0627\u06CC\u0644 \u0622\u0626\u06CC \u0688\u06CC",
        xid: "\u0627\u06CC\u06A9\u0633 \u0622\u0626\u06CC \u0688\u06CC",
        ksuid: "\u06A9\u06D2 \u0627\u06CC\u0633 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        datetime: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0688\u06CC\u0679 \u0679\u0627\u0626\u0645",
        date: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u062A\u0627\u0631\u06CC\u062E",
        time: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0648\u0642\u062A",
        duration: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0645\u062F\u062A",
        ipv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0627\u06CC\u0688\u0631\u06CC\u0633",
        ipv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0627\u06CC\u0688\u0631\u06CC\u0633",
        cidrv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0631\u06CC\u0646\u062C",
        cidrv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0631\u06CC\u0646\u062C",
        base64: "\u0628\u06CC\u0633 64 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
        base64url: "\u0628\u06CC\u0633 64 \u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
        json_string: "\u062C\u06D2 \u0627\u06CC\u0633 \u0627\u0648 \u0627\u06CC\u0646 \u0633\u0679\u0631\u0646\u06AF",
        e164: "\u0627\u06CC 164 \u0646\u0645\u0628\u0631",
        jwt: "\u062C\u06D2 \u0688\u0628\u0644\u06CC\u0648 \u0679\u06CC",
        template_literal: "\u0627\u0646 \u067E\u0679"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u0646\u0645\u0628\u0631",
        array: "\u0622\u0631\u06D2",
        null: "\u0646\u0644"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: instanceof ${issue.expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
            }
            return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${util.stringifyPrimitive(issue.values[0])} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
            return `\u063A\u0644\u0637 \u0622\u067E\u0634\u0646: ${util.joinValues(issue.values, "|")} \u0645\u06CC\u06BA \u0633\u06D2 \u0627\u06CC\u06A9 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u06D2 ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0627\u0635\u0631"} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
            return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u0627 ${adj}${issue.maximum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue.origin} \u06A9\u06D2 ${adj}${issue.minimum.toString()} ${sizing.unit} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
            }
            return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue.origin} \u06A9\u0627 ${adj}${issue.minimum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.prefix}" \u0633\u06D2 \u0634\u0631\u0648\u0639 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            }
            if (_issue.format === "ends_with")
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.suffix}" \u067E\u0631 \u062E\u062A\u0645 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            if (_issue.format === "includes")
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.includes}" \u0634\u0627\u0645\u0644 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            if (_issue.format === "regex")
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: \u067E\u06CC\u0679\u0631\u0646 ${_issue.pattern} \u0633\u06D2 \u0645\u06CC\u0686 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            return `\u063A\u0644\u0637 ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u063A\u0644\u0637 \u0646\u0645\u0628\u0631: ${issue.divisor} \u06A9\u0627 \u0645\u0636\u0627\u0639\u0641 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
          case "unrecognized_keys":
            return `\u063A\u06CC\u0631 \u062A\u0633\u0644\u06CC\u0645 \u0634\u062F\u06C1 \u06A9\u06CC${issue.keys.length > 1 ? "\u0632" : ""}: ${util.joinValues(issue.keys, "\u060C ")}`;
          case "invalid_key":
            return `${issue.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u06A9\u06CC`;
          case "invalid_union":
            return "\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679";
          case "invalid_element":
            return `${issue.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u0648\u06CC\u0644\u06CC\u0648`;
          default:
            return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/uz.cjs
var require_uz = __commonJS({
  "node_modules/zod/v4/locales/uz.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "belgi", verb: "bo\u2018lishi kerak" },
        file: { unit: "bayt", verb: "bo\u2018lishi kerak" },
        array: { unit: "element", verb: "bo\u2018lishi kerak" },
        set: { unit: "element", verb: "bo\u2018lishi kerak" },
        map: { unit: "yozuv", verb: "bo\u2018lishi kerak" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "kirish",
        email: "elektron pochta manzili",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO sana va vaqti",
        date: "ISO sana",
        time: "ISO vaqt",
        duration: "ISO davomiylik",
        ipv4: "IPv4 manzil",
        ipv6: "IPv6 manzil",
        mac: "MAC manzil",
        cidrv4: "IPv4 diapazon",
        cidrv6: "IPv6 diapazon",
        base64: "base64 kodlangan satr",
        base64url: "base64url kodlangan satr",
        json_string: "JSON satr",
        e164: "E.164 raqam",
        jwt: "JWT",
        template_literal: "kirish"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "raqam",
        array: "massiv"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `Noto\u2018g\u2018ri kirish: kutilgan instanceof ${issue.expected}, qabul qilingan ${received}`;
            }
            return `Noto\u2018g\u2018ri kirish: kutilgan ${expected}, qabul qilingan ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `Noto\u2018g\u2018ri kirish: kutilgan ${util.stringifyPrimitive(issue.values[0])}`;
            return `Noto\u2018g\u2018ri variant: quyidagilardan biri kutilgan ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Juda katta: kutilgan ${issue.origin ?? "qiymat"} ${adj}${issue.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
            return `Juda katta: kutilgan ${issue.origin ?? "qiymat"} ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Juda kichik: kutilgan ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
            }
            return `Juda kichik: kutilgan ${issue.origin} ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Noto\u2018g\u2018ri satr: "${_issue.prefix}" bilan boshlanishi kerak`;
            if (_issue.format === "ends_with")
              return `Noto\u2018g\u2018ri satr: "${_issue.suffix}" bilan tugashi kerak`;
            if (_issue.format === "includes")
              return `Noto\u2018g\u2018ri satr: "${_issue.includes}" ni o\u2018z ichiga olishi kerak`;
            if (_issue.format === "regex")
              return `Noto\u2018g\u2018ri satr: ${_issue.pattern} shabloniga mos kelishi kerak`;
            return `Noto\u2018g\u2018ri ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `Noto\u2018g\u2018ri raqam: ${issue.divisor} ning karralisi bo\u2018lishi kerak`;
          case "unrecognized_keys":
            return `Noma\u2019lum kalit${issue.keys.length > 1 ? "lar" : ""}: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `${issue.origin} dagi kalit noto\u2018g\u2018ri`;
          case "invalid_union":
            return "Noto\u2018g\u2018ri kirish";
          case "invalid_element":
            return `${issue.origin} da noto\u2018g\u2018ri qiymat`;
          default:
            return `Noto\u2018g\u2018ri kirish`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/vi.cjs
var require_vi = __commonJS({
  "node_modules/zod/v4/locales/vi.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "k\xFD t\u1EF1", verb: "c\xF3" },
        file: { unit: "byte", verb: "c\xF3" },
        array: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" },
        set: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u0111\u1EA7u v\xE0o",
        email: "\u0111\u1ECBa ch\u1EC9 email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ng\xE0y gi\u1EDD ISO",
        date: "ng\xE0y ISO",
        time: "gi\u1EDD ISO",
        duration: "kho\u1EA3ng th\u1EDDi gian ISO",
        ipv4: "\u0111\u1ECBa ch\u1EC9 IPv4",
        ipv6: "\u0111\u1ECBa ch\u1EC9 IPv6",
        cidrv4: "d\u1EA3i IPv4",
        cidrv6: "d\u1EA3i IPv6",
        base64: "chu\u1ED7i m\xE3 h\xF3a base64",
        base64url: "chu\u1ED7i m\xE3 h\xF3a base64url",
        json_string: "chu\u1ED7i JSON",
        e164: "s\u1ED1 E.164",
        jwt: "JWT",
        template_literal: "\u0111\u1EA7u v\xE0o"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "s\u1ED1",
        array: "m\u1EA3ng"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i instanceof ${issue.expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
            }
            return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${util.stringifyPrimitive(issue.values[0])}`;
            return `T\xF9y ch\u1ECDn kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i m\u1ED9t trong c\xE1c gi\xE1 tr\u1ECB ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue.origin ?? "gi\xE1 tr\u1ECB"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "ph\u1EA7n t\u1EED"}`;
            return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue.origin ?? "gi\xE1 tr\u1ECB"} ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue.origin} ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i k\u1EBFt th\xFAc b\u1EB1ng "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i bao g\u1ED3m "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i kh\u1EDBp v\u1EDBi m\u1EABu ${_issue.pattern}`;
            return `${FormatDictionary[_issue.format] ?? issue.format} kh\xF4ng h\u1EE3p l\u1EC7`;
          }
          case "not_multiple_of":
            return `S\u1ED1 kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i l\xE0 b\u1ED9i s\u1ED1 c\u1EE7a ${issue.divisor}`;
          case "unrecognized_keys":
            return `Kh\xF3a kh\xF4ng \u0111\u01B0\u1EE3c nh\u1EADn d\u1EA1ng: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `Kh\xF3a kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue.origin}`;
          case "invalid_union":
            return "\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7";
          case "invalid_element":
            return `Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue.origin}`;
          default:
            return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/zh-CN.cjs
var require_zh_CN = __commonJS({
  "node_modules/zod/v4/locales/zh-CN.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u5B57\u7B26", verb: "\u5305\u542B" },
        file: { unit: "\u5B57\u8282", verb: "\u5305\u542B" },
        array: { unit: "\u9879", verb: "\u5305\u542B" },
        set: { unit: "\u9879", verb: "\u5305\u542B" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u8F93\u5165",
        email: "\u7535\u5B50\u90AE\u4EF6",
        url: "URL",
        emoji: "\u8868\u60C5\u7B26\u53F7",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO\u65E5\u671F\u65F6\u95F4",
        date: "ISO\u65E5\u671F",
        time: "ISO\u65F6\u95F4",
        duration: "ISO\u65F6\u957F",
        ipv4: "IPv4\u5730\u5740",
        ipv6: "IPv6\u5730\u5740",
        cidrv4: "IPv4\u7F51\u6BB5",
        cidrv6: "IPv6\u7F51\u6BB5",
        base64: "base64\u7F16\u7801\u5B57\u7B26\u4E32",
        base64url: "base64url\u7F16\u7801\u5B57\u7B26\u4E32",
        json_string: "JSON\u5B57\u7B26\u4E32",
        e164: "E.164\u53F7\u7801",
        jwt: "JWT",
        template_literal: "\u8F93\u5165"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "\u6570\u5B57",
        array: "\u6570\u7EC4",
        null: "\u7A7A\u503C(null)"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B instanceof ${issue.expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
            }
            return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u65E0\u6548\u9009\u9879\uFF1A\u671F\u671B\u4EE5\u4E0B\u4E4B\u4E00 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue.origin ?? "\u503C"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u4E2A\u5143\u7D20"}`;
            return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue.origin ?? "\u503C"} ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue.origin} ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.prefix}" \u5F00\u5934`;
            if (_issue.format === "ends_with")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.suffix}" \u7ED3\u5C3E`;
            if (_issue.format === "includes")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u5305\u542B "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u6EE1\u8DB3\u6B63\u5219\u8868\u8FBE\u5F0F ${_issue.pattern}`;
            return `\u65E0\u6548${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u65E0\u6548\u6570\u5B57\uFF1A\u5FC5\u987B\u662F ${issue.divisor} \u7684\u500D\u6570`;
          case "unrecognized_keys":
            return `\u51FA\u73B0\u672A\u77E5\u7684\u952E(key): ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `${issue.origin} \u4E2D\u7684\u952E(key)\u65E0\u6548`;
          case "invalid_union":
            return "\u65E0\u6548\u8F93\u5165";
          case "invalid_element":
            return `${issue.origin} \u4E2D\u5305\u542B\u65E0\u6548\u503C(value)`;
          default:
            return `\u65E0\u6548\u8F93\u5165`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/zh-TW.cjs
var require_zh_TW = __commonJS({
  "node_modules/zod/v4/locales/zh-TW.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\u5B57\u5143", verb: "\u64C1\u6709" },
        file: { unit: "\u4F4D\u5143\u7D44", verb: "\u64C1\u6709" },
        array: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" },
        set: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u8F38\u5165",
        email: "\u90F5\u4EF6\u5730\u5740",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u65E5\u671F\u6642\u9593",
        date: "ISO \u65E5\u671F",
        time: "ISO \u6642\u9593",
        duration: "ISO \u671F\u9593",
        ipv4: "IPv4 \u4F4D\u5740",
        ipv6: "IPv6 \u4F4D\u5740",
        cidrv4: "IPv4 \u7BC4\u570D",
        cidrv6: "IPv6 \u7BC4\u570D",
        base64: "base64 \u7DE8\u78BC\u5B57\u4E32",
        base64url: "base64url \u7DE8\u78BC\u5B57\u4E32",
        json_string: "JSON \u5B57\u4E32",
        e164: "E.164 \u6578\u503C",
        jwt: "JWT",
        template_literal: "\u8F38\u5165"
      };
      const TypeDictionary = {
        nan: "NaN"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA instanceof ${issue.expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
            }
            return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${util.stringifyPrimitive(issue.values[0])}`;
            return `\u7121\u6548\u7684\u9078\u9805\uFF1A\u9810\u671F\u70BA\u4EE5\u4E0B\u5176\u4E2D\u4E4B\u4E00 ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue.maximum.toString()} ${sizing.unit ?? "\u500B\u5143\u7D20"}`;
            return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing) {
              return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue.origin} \u61C9\u70BA ${adj}${issue.minimum.toString()} ${sizing.unit}`;
            }
            return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue.origin} \u61C9\u70BA ${adj}${issue.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with") {
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.prefix}" \u958B\u982D`;
            }
            if (_issue.format === "ends_with")
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.suffix}" \u7D50\u5C3E`;
            if (_issue.format === "includes")
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u5305\u542B "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u7B26\u5408\u683C\u5F0F ${_issue.pattern}`;
            return `\u7121\u6548\u7684 ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `\u7121\u6548\u7684\u6578\u5B57\uFF1A\u5FC5\u9808\u70BA ${issue.divisor} \u7684\u500D\u6578`;
          case "unrecognized_keys":
            return `\u7121\u6CD5\u8B58\u5225\u7684\u9375\u503C${issue.keys.length > 1 ? "\u5011" : ""}\uFF1A${util.joinValues(issue.keys, "\u3001")}`;
          case "invalid_key":
            return `${issue.origin} \u4E2D\u6709\u7121\u6548\u7684\u9375\u503C`;
          case "invalid_union":
            return "\u7121\u6548\u7684\u8F38\u5165\u503C";
          case "invalid_element":
            return `${issue.origin} \u4E2D\u6709\u7121\u6548\u7684\u503C`;
          default:
            return `\u7121\u6548\u7684\u8F38\u5165\u503C`;
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/yo.cjs
var require_yo = __commonJS({
  "node_modules/zod/v4/locales/yo.cjs"(exports2, module2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = default_1;
    var util = __importStar(require_util());
    var error = () => {
      const Sizable = {
        string: { unit: "\xE0mi", verb: "n\xED" },
        file: { unit: "bytes", verb: "n\xED" },
        array: { unit: "nkan", verb: "n\xED" },
        set: { unit: "nkan", verb: "n\xED" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const FormatDictionary = {
        regex: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9",
        email: "\xE0d\xEDr\u1EB9\u0301s\xEC \xECm\u1EB9\u0301l\xEC",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\xE0k\xF3k\xF2 ISO",
        date: "\u1ECDj\u1ECD\u0301 ISO",
        time: "\xE0k\xF3k\xF2 ISO",
        duration: "\xE0k\xF3k\xF2 t\xF3 p\xE9 ISO",
        ipv4: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv4",
        ipv6: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv6",
        cidrv4: "\xE0gb\xE8gb\xE8 IPv4",
        cidrv6: "\xE0gb\xE8gb\xE8 IPv6",
        base64: "\u1ECD\u0300r\u1ECD\u0300 t\xED a k\u1ECD\u0301 n\xED base64",
        base64url: "\u1ECD\u0300r\u1ECD\u0300 base64url",
        json_string: "\u1ECD\u0300r\u1ECD\u0300 JSON",
        e164: "n\u1ECD\u0301mb\xE0 E.164",
        jwt: "JWT",
        template_literal: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9"
      };
      const TypeDictionary = {
        nan: "NaN",
        number: "n\u1ECD\u0301mb\xE0",
        array: "akop\u1ECD"
      };
      return (issue) => {
        switch (issue.code) {
          case "invalid_type": {
            const expected = TypeDictionary[issue.expected] ?? issue.expected;
            const receivedType = util.parsedType(issue.input);
            const received = TypeDictionary[receivedType] ?? receivedType;
            if (/^[A-Z]/.test(issue.expected)) {
              return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi instanceof ${issue.expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
            }
            return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
          }
          case "invalid_value":
            if (issue.values.length === 1)
              return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${util.stringifyPrimitive(issue.values[0])}`;
            return `\xC0\u1E63\xE0y\xE0n a\u1E63\xEC\u1E63e: yan \u1ECD\u0300kan l\xE1ra ${util.joinValues(issue.values, "|")}`;
          case "too_big": {
            const adj = issue.inclusive ? "<=" : "<";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue.origin ?? "iye"} ${sizing.verb} ${adj}${issue.maximum} ${sizing.unit}`;
            return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue.maximum}`;
          }
          case "too_small": {
            const adj = issue.inclusive ? ">=" : ">";
            const sizing = getSizing(issue.origin);
            if (sizing)
              return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue.origin} ${sizing.verb} ${adj}${issue.minimum} ${sizing.unit}`;
            return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue.minimum}`;
          }
          case "invalid_format": {
            const _issue = issue;
            if (_issue.format === "starts_with")
              return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\u1EB9\u0300r\u1EB9\u0300 p\u1EB9\u0300l\xFA "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 par\xED p\u1EB9\u0300l\xFA "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 n\xED "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\xE1 \xE0p\u1EB9\u1EB9r\u1EB9 mu ${_issue.pattern}`;
            return `A\u1E63\xEC\u1E63e: ${FormatDictionary[_issue.format] ?? issue.format}`;
          }
          case "not_multiple_of":
            return `N\u1ECD\u0301mb\xE0 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 j\u1EB9\u0301 \xE8y\xE0 p\xEDp\xEDn ti ${issue.divisor}`;
          case "unrecognized_keys":
            return `B\u1ECDt\xECn\xEC \xE0\xECm\u1ECD\u0300: ${util.joinValues(issue.keys, ", ")}`;
          case "invalid_key":
            return `B\u1ECDt\xECn\xEC a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue.origin}`;
          case "invalid_union":
            return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
          case "invalid_element":
            return `Iye a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue.origin}`;
          default:
            return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
        }
      };
    };
    function default_1() {
      return {
        localeError: error()
      };
    }
    module2.exports = exports2.default;
  }
});

// node_modules/zod/v4/locales/index.cjs
var require_locales = __commonJS({
  "node_modules/zod/v4/locales/index.cjs"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.zhCN = exports2.vi = exports2.uz = exports2.ur = exports2.uk = exports2.ua = exports2.tr = exports2.th = exports2.ta = exports2.sv = exports2.sl = exports2.ru = exports2.ro = exports2.pt = exports2.pl = exports2.ps = exports2.ota = exports2.no = exports2.nl = exports2.ms = exports2.mk = exports2.lt = exports2.ko = exports2.km = exports2.kh = exports2.ka = exports2.ja = exports2.it = exports2.is = exports2.id = exports2.hy = exports2.hu = exports2.hr = exports2.he = exports2.frCA = exports2.fr = exports2.fi = exports2.fa = exports2.es = exports2.eo = exports2.en = exports2.el = exports2.de = exports2.da = exports2.cs = exports2.ca = exports2.bg = exports2.be = exports2.az = exports2.ar = void 0;
    exports2.yo = exports2.zhTW = void 0;
    var ar_js_1 = require_ar();
    Object.defineProperty(exports2, "ar", { enumerable: true, get: function() {
      return __importDefault(ar_js_1).default;
    } });
    var az_js_1 = require_az();
    Object.defineProperty(exports2, "az", { enumerable: true, get: function() {
      return __importDefault(az_js_1).default;
    } });
    var be_js_1 = require_be();
    Object.defineProperty(exports2, "be", { enumerable: true, get: function() {
      return __importDefault(be_js_1).default;
    } });
    var bg_js_1 = require_bg();
    Object.defineProperty(exports2, "bg", { enumerable: true, get: function() {
      return __importDefault(bg_js_1).default;
    } });
    var ca_js_1 = require_ca();
    Object.defineProperty(exports2, "ca", { enumerable: true, get: function() {
      return __importDefault(ca_js_1).default;
    } });
    var cs_js_1 = require_cs();
    Object.defineProperty(exports2, "cs", { enumerable: true, get: function() {
      return __importDefault(cs_js_1).default;
    } });
    var da_js_1 = require_da();
    Object.defineProperty(exports2, "da", { enumerable: true, get: function() {
      return __importDefault(da_js_1).default;
    } });
    var de_js_1 = require_de();
    Object.defineProperty(exports2, "de", { enumerable: true, get: function() {
      return __importDefault(de_js_1).default;
    } });
    var el_js_1 = require_el();
    Object.defineProperty(exports2, "el", { enumerable: true, get: function() {
      return __importDefault(el_js_1).default;
    } });
    var en_js_1 = require_en();
    Object.defineProperty(exports2, "en", { enumerable: true, get: function() {
      return __importDefault(en_js_1).default;
    } });
    var eo_js_1 = require_eo();
    Object.defineProperty(exports2, "eo", { enumerable: true, get: function() {
      return __importDefault(eo_js_1).default;
    } });
    var es_js_1 = require_es();
    Object.defineProperty(exports2, "es", { enumerable: true, get: function() {
      return __importDefault(es_js_1).default;
    } });
    var fa_js_1 = require_fa();
    Object.defineProperty(exports2, "fa", { enumerable: true, get: function() {
      return __importDefault(fa_js_1).default;
    } });
    var fi_js_1 = require_fi();
    Object.defineProperty(exports2, "fi", { enumerable: true, get: function() {
      return __importDefault(fi_js_1).default;
    } });
    var fr_js_1 = require_fr();
    Object.defineProperty(exports2, "fr", { enumerable: true, get: function() {
      return __importDefault(fr_js_1).default;
    } });
    var fr_CA_js_1 = require_fr_CA();
    Object.defineProperty(exports2, "frCA", { enumerable: true, get: function() {
      return __importDefault(fr_CA_js_1).default;
    } });
    var he_js_1 = require_he();
    Object.defineProperty(exports2, "he", { enumerable: true, get: function() {
      return __importDefault(he_js_1).default;
    } });
    var hr_js_1 = require_hr();
    Object.defineProperty(exports2, "hr", { enumerable: true, get: function() {
      return __importDefault(hr_js_1).default;
    } });
    var hu_js_1 = require_hu();
    Object.defineProperty(exports2, "hu", { enumerable: true, get: function() {
      return __importDefault(hu_js_1).default;
    } });
    var hy_js_1 = require_hy();
    Object.defineProperty(exports2, "hy", { enumerable: true, get: function() {
      return __importDefault(hy_js_1).default;
    } });
    var id_js_1 = require_id();
    Object.defineProperty(exports2, "id", { enumerable: true, get: function() {
      return __importDefault(id_js_1).default;
    } });
    var is_js_1 = require_is();
    Object.defineProperty(exports2, "is", { enumerable: true, get: function() {
      return __importDefault(is_js_1).default;
    } });
    var it_js_1 = require_it();
    Object.defineProperty(exports2, "it", { enumerable: true, get: function() {
      return __importDefault(it_js_1).default;
    } });
    var ja_js_1 = require_ja();
    Object.defineProperty(exports2, "ja", { enumerable: true, get: function() {
      return __importDefault(ja_js_1).default;
    } });
    var ka_js_1 = require_ka();
    Object.defineProperty(exports2, "ka", { enumerable: true, get: function() {
      return __importDefault(ka_js_1).default;
    } });
    var kh_js_1 = require_kh();
    Object.defineProperty(exports2, "kh", { enumerable: true, get: function() {
      return __importDefault(kh_js_1).default;
    } });
    var km_js_1 = require_km();
    Object.defineProperty(exports2, "km", { enumerable: true, get: function() {
      return __importDefault(km_js_1).default;
    } });
    var ko_js_1 = require_ko();
    Object.defineProperty(exports2, "ko", { enumerable: true, get: function() {
      return __importDefault(ko_js_1).default;
    } });
    var lt_js_1 = require_lt();
    Object.defineProperty(exports2, "lt", { enumerable: true, get: function() {
      return __importDefault(lt_js_1).default;
    } });
    var mk_js_1 = require_mk();
    Object.defineProperty(exports2, "mk", { enumerable: true, get: function() {
      return __importDefault(mk_js_1).default;
    } });
    var ms_js_1 = require_ms();
    Object.defineProperty(exports2, "ms", { enumerable: true, get: function() {
      return __importDefault(ms_js_1).default;
    } });
    var nl_js_1 = require_nl();
    Object.defineProperty(exports2, "nl", { enumerable: true, get: function() {
      return __importDefault(nl_js_1).default;
    } });
    var no_js_1 = require_no();
    Object.defineProperty(exports2, "no", { enumerable: true, get: function() {
      return __importDefault(no_js_1).default;
    } });
    var ota_js_1 = require_ota();
    Object.defineProperty(exports2, "ota", { enumerable: true, get: function() {
      return __importDefault(ota_js_1).default;
    } });
    var ps_js_1 = require_ps();
    Object.defineProperty(exports2, "ps", { enumerable: true, get: function() {
      return __importDefault(ps_js_1).default;
    } });
    var pl_js_1 = require_pl();
    Object.defineProperty(exports2, "pl", { enumerable: true, get: function() {
      return __importDefault(pl_js_1).default;
    } });
    var pt_js_1 = require_pt();
    Object.defineProperty(exports2, "pt", { enumerable: true, get: function() {
      return __importDefault(pt_js_1).default;
    } });
    var ro_js_1 = require_ro();
    Object.defineProperty(exports2, "ro", { enumerable: true, get: function() {
      return __importDefault(ro_js_1).default;
    } });
    var ru_js_1 = require_ru();
    Object.defineProperty(exports2, "ru", { enumerable: true, get: function() {
      return __importDefault(ru_js_1).default;
    } });
    var sl_js_1 = require_sl();
    Object.defineProperty(exports2, "sl", { enumerable: true, get: function() {
      return __importDefault(sl_js_1).default;
    } });
    var sv_js_1 = require_sv();
    Object.defineProperty(exports2, "sv", { enumerable: true, get: function() {
      return __importDefault(sv_js_1).default;
    } });
    var ta_js_1 = require_ta();
    Object.defineProperty(exports2, "ta", { enumerable: true, get: function() {
      return __importDefault(ta_js_1).default;
    } });
    var th_js_1 = require_th();
    Object.defineProperty(exports2, "th", { enumerable: true, get: function() {
      return __importDefault(th_js_1).default;
    } });
    var tr_js_1 = require_tr();
    Object.defineProperty(exports2, "tr", { enumerable: true, get: function() {
      return __importDefault(tr_js_1).default;
    } });
    var ua_js_1 = require_ua();
    Object.defineProperty(exports2, "ua", { enumerable: true, get: function() {
      return __importDefault(ua_js_1).default;
    } });
    var uk_js_1 = require_uk();
    Object.defineProperty(exports2, "uk", { enumerable: true, get: function() {
      return __importDefault(uk_js_1).default;
    } });
    var ur_js_1 = require_ur();
    Object.defineProperty(exports2, "ur", { enumerable: true, get: function() {
      return __importDefault(ur_js_1).default;
    } });
    var uz_js_1 = require_uz();
    Object.defineProperty(exports2, "uz", { enumerable: true, get: function() {
      return __importDefault(uz_js_1).default;
    } });
    var vi_js_1 = require_vi();
    Object.defineProperty(exports2, "vi", { enumerable: true, get: function() {
      return __importDefault(vi_js_1).default;
    } });
    var zh_CN_js_1 = require_zh_CN();
    Object.defineProperty(exports2, "zhCN", { enumerable: true, get: function() {
      return __importDefault(zh_CN_js_1).default;
    } });
    var zh_TW_js_1 = require_zh_TW();
    Object.defineProperty(exports2, "zhTW", { enumerable: true, get: function() {
      return __importDefault(zh_TW_js_1).default;
    } });
    var yo_js_1 = require_yo();
    Object.defineProperty(exports2, "yo", { enumerable: true, get: function() {
      return __importDefault(yo_js_1).default;
    } });
  }
});

// node_modules/zod/v4/core/registries.cjs
var require_registries = __commonJS({
  "node_modules/zod/v4/core/registries.cjs"(exports2) {
    "use strict";
    var _a;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.globalRegistry = exports2.$ZodRegistry = exports2.$input = exports2.$output = void 0;
    exports2.registry = registry;
    exports2.$output = Symbol("ZodOutput");
    exports2.$input = Symbol("ZodInput");
    var $ZodRegistry = class {
      constructor() {
        this._map = /* @__PURE__ */ new WeakMap();
        this._idmap = /* @__PURE__ */ new Map();
      }
      add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && typeof meta === "object" && "id" in meta) {
          this._idmap.set(meta.id, schema);
        }
        return this;
      }
      clear() {
        this._map = /* @__PURE__ */ new WeakMap();
        this._idmap = /* @__PURE__ */ new Map();
        return this;
      }
      remove(schema) {
        const meta = this._map.get(schema);
        if (meta && typeof meta === "object" && "id" in meta) {
          this._idmap.delete(meta.id);
        }
        this._map.delete(schema);
        return this;
      }
      get(schema) {
        const p = schema._zod.parent;
        if (p) {
          const pm = { ...this.get(p) ?? {} };
          delete pm.id;
          const f = { ...pm, ...this._map.get(schema) };
          return Object.keys(f).length ? f : void 0;
        }
        return this._map.get(schema);
      }
      has(schema) {
        return this._map.has(schema);
      }
    };
    exports2.$ZodRegistry = $ZodRegistry;
    function registry() {
      return new $ZodRegistry();
    }
    (_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
    exports2.globalRegistry = globalThis.__zod_globalRegistry;
  }
});

// node_modules/zod/v4/core/api.cjs
var require_api2 = __commonJS({
  "node_modules/zod/v4/core/api.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TimePrecision = void 0;
    exports2._string = _string;
    exports2._coercedString = _coercedString;
    exports2._email = _email;
    exports2._guid = _guid;
    exports2._uuid = _uuid;
    exports2._uuidv4 = _uuidv4;
    exports2._uuidv6 = _uuidv6;
    exports2._uuidv7 = _uuidv7;
    exports2._url = _url;
    exports2._emoji = _emoji;
    exports2._nanoid = _nanoid;
    exports2._cuid = _cuid;
    exports2._cuid2 = _cuid2;
    exports2._ulid = _ulid;
    exports2._xid = _xid;
    exports2._ksuid = _ksuid;
    exports2._ipv4 = _ipv4;
    exports2._ipv6 = _ipv6;
    exports2._mac = _mac;
    exports2._cidrv4 = _cidrv4;
    exports2._cidrv6 = _cidrv6;
    exports2._base64 = _base64;
    exports2._base64url = _base64url;
    exports2._e164 = _e164;
    exports2._jwt = _jwt;
    exports2._isoDateTime = _isoDateTime;
    exports2._isoDate = _isoDate;
    exports2._isoTime = _isoTime;
    exports2._isoDuration = _isoDuration;
    exports2._number = _number;
    exports2._coercedNumber = _coercedNumber;
    exports2._int = _int;
    exports2._float32 = _float32;
    exports2._float64 = _float64;
    exports2._int32 = _int32;
    exports2._uint32 = _uint32;
    exports2._boolean = _boolean;
    exports2._coercedBoolean = _coercedBoolean;
    exports2._bigint = _bigint;
    exports2._coercedBigint = _coercedBigint;
    exports2._int64 = _int64;
    exports2._uint64 = _uint64;
    exports2._symbol = _symbol;
    exports2._undefined = _undefined;
    exports2._null = _null;
    exports2._any = _any;
    exports2._unknown = _unknown;
    exports2._never = _never;
    exports2._void = _void;
    exports2._date = _date;
    exports2._coercedDate = _coercedDate;
    exports2._nan = _nan;
    exports2._lt = _lt;
    exports2._lte = _lte;
    exports2._max = _lte;
    exports2._lte = _lte;
    exports2._max = _lte;
    exports2._gt = _gt;
    exports2._gte = _gte;
    exports2._min = _gte;
    exports2._gte = _gte;
    exports2._min = _gte;
    exports2._positive = _positive;
    exports2._negative = _negative;
    exports2._nonpositive = _nonpositive;
    exports2._nonnegative = _nonnegative;
    exports2._multipleOf = _multipleOf;
    exports2._maxSize = _maxSize;
    exports2._minSize = _minSize;
    exports2._size = _size;
    exports2._maxLength = _maxLength;
    exports2._minLength = _minLength;
    exports2._length = _length;
    exports2._regex = _regex;
    exports2._lowercase = _lowercase;
    exports2._uppercase = _uppercase;
    exports2._includes = _includes;
    exports2._startsWith = _startsWith;
    exports2._endsWith = _endsWith;
    exports2._property = _property;
    exports2._mime = _mime;
    exports2._overwrite = _overwrite;
    exports2._normalize = _normalize;
    exports2._trim = _trim;
    exports2._toLowerCase = _toLowerCase;
    exports2._toUpperCase = _toUpperCase;
    exports2._slugify = _slugify;
    exports2._array = _array;
    exports2._union = _union;
    exports2._xor = _xor;
    exports2._discriminatedUnion = _discriminatedUnion;
    exports2._intersection = _intersection;
    exports2._tuple = _tuple;
    exports2._record = _record;
    exports2._map = _map;
    exports2._set = _set;
    exports2._enum = _enum;
    exports2._nativeEnum = _nativeEnum;
    exports2._literal = _literal;
    exports2._file = _file;
    exports2._transform = _transform;
    exports2._optional = _optional;
    exports2._nullable = _nullable;
    exports2._default = _default;
    exports2._nonoptional = _nonoptional;
    exports2._success = _success;
    exports2._catch = _catch;
    exports2._pipe = _pipe;
    exports2._readonly = _readonly;
    exports2._templateLiteral = _templateLiteral;
    exports2._lazy = _lazy;
    exports2._promise = _promise;
    exports2._custom = _custom;
    exports2._refine = _refine;
    exports2._superRefine = _superRefine;
    exports2._check = _check;
    exports2.describe = describe;
    exports2.meta = meta;
    exports2._stringbool = _stringbool;
    exports2._stringFormat = _stringFormat;
    var checks = __importStar(require_checks());
    var registries = __importStar(require_registries());
    var schemas = __importStar(require_schemas());
    var util = __importStar(require_util());
    // @__NO_SIDE_EFFECTS__
    function _string(Class, params) {
      return new Class({
        type: "string",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _coercedString(Class, params) {
      return new Class({
        type: "string",
        coerce: true,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _email(Class, params) {
      return new Class({
        type: "string",
        format: "email",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _guid(Class, params) {
      return new Class({
        type: "string",
        format: "guid",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _uuid(Class, params) {
      return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _uuidv4(Class, params) {
      return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v4",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _uuidv6(Class, params) {
      return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v6",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _uuidv7(Class, params) {
      return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v7",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _url(Class, params) {
      return new Class({
        type: "string",
        format: "url",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _emoji(Class, params) {
      return new Class({
        type: "string",
        format: "emoji",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _nanoid(Class, params) {
      return new Class({
        type: "string",
        format: "nanoid",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _cuid(Class, params) {
      return new Class({
        type: "string",
        format: "cuid",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _cuid2(Class, params) {
      return new Class({
        type: "string",
        format: "cuid2",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _ulid(Class, params) {
      return new Class({
        type: "string",
        format: "ulid",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _xid(Class, params) {
      return new Class({
        type: "string",
        format: "xid",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _ksuid(Class, params) {
      return new Class({
        type: "string",
        format: "ksuid",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _ipv4(Class, params) {
      return new Class({
        type: "string",
        format: "ipv4",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _ipv6(Class, params) {
      return new Class({
        type: "string",
        format: "ipv6",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _mac(Class, params) {
      return new Class({
        type: "string",
        format: "mac",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _cidrv4(Class, params) {
      return new Class({
        type: "string",
        format: "cidrv4",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _cidrv6(Class, params) {
      return new Class({
        type: "string",
        format: "cidrv6",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _base64(Class, params) {
      return new Class({
        type: "string",
        format: "base64",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _base64url(Class, params) {
      return new Class({
        type: "string",
        format: "base64url",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _e164(Class, params) {
      return new Class({
        type: "string",
        format: "e164",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _jwt(Class, params) {
      return new Class({
        type: "string",
        format: "jwt",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params)
      });
    }
    exports2.TimePrecision = {
      Any: null,
      Minute: -1,
      Second: 0,
      Millisecond: 3,
      Microsecond: 6
    };
    // @__NO_SIDE_EFFECTS__
    function _isoDateTime(Class, params) {
      return new Class({
        type: "string",
        format: "datetime",
        check: "string_format",
        offset: false,
        local: false,
        precision: null,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _isoDate(Class, params) {
      return new Class({
        type: "string",
        format: "date",
        check: "string_format",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _isoTime(Class, params) {
      return new Class({
        type: "string",
        format: "time",
        check: "string_format",
        precision: null,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _isoDuration(Class, params) {
      return new Class({
        type: "string",
        format: "duration",
        check: "string_format",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _number(Class, params) {
      return new Class({
        type: "number",
        checks: [],
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _coercedNumber(Class, params) {
      return new Class({
        type: "number",
        coerce: true,
        checks: [],
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _int(Class, params) {
      return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "safeint",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _float32(Class, params) {
      return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "float32",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _float64(Class, params) {
      return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "float64",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _int32(Class, params) {
      return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "int32",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _uint32(Class, params) {
      return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "uint32",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _boolean(Class, params) {
      return new Class({
        type: "boolean",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _coercedBoolean(Class, params) {
      return new Class({
        type: "boolean",
        coerce: true,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _bigint(Class, params) {
      return new Class({
        type: "bigint",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _coercedBigint(Class, params) {
      return new Class({
        type: "bigint",
        coerce: true,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _int64(Class, params) {
      return new Class({
        type: "bigint",
        check: "bigint_format",
        abort: false,
        format: "int64",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _uint64(Class, params) {
      return new Class({
        type: "bigint",
        check: "bigint_format",
        abort: false,
        format: "uint64",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _symbol(Class, params) {
      return new Class({
        type: "symbol",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _undefined(Class, params) {
      return new Class({
        type: "undefined",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _null(Class, params) {
      return new Class({
        type: "null",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _any(Class) {
      return new Class({
        type: "any"
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _unknown(Class) {
      return new Class({
        type: "unknown"
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _never(Class, params) {
      return new Class({
        type: "never",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _void(Class, params) {
      return new Class({
        type: "void",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _date(Class, params) {
      return new Class({
        type: "date",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _coercedDate(Class, params) {
      return new Class({
        type: "date",
        coerce: true,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _nan(Class, params) {
      return new Class({
        type: "nan",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _lt(value, params) {
      return new checks.$ZodCheckLessThan({
        check: "less_than",
        ...util.normalizeParams(params),
        value,
        inclusive: false
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _lte(value, params) {
      return new checks.$ZodCheckLessThan({
        check: "less_than",
        ...util.normalizeParams(params),
        value,
        inclusive: true
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _gt(value, params) {
      return new checks.$ZodCheckGreaterThan({
        check: "greater_than",
        ...util.normalizeParams(params),
        value,
        inclusive: false
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _gte(value, params) {
      return new checks.$ZodCheckGreaterThan({
        check: "greater_than",
        ...util.normalizeParams(params),
        value,
        inclusive: true
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _positive(params) {
      return /* @__PURE__ */ _gt(0, params);
    }
    // @__NO_SIDE_EFFECTS__
    function _negative(params) {
      return /* @__PURE__ */ _lt(0, params);
    }
    // @__NO_SIDE_EFFECTS__
    function _nonpositive(params) {
      return /* @__PURE__ */ _lte(0, params);
    }
    // @__NO_SIDE_EFFECTS__
    function _nonnegative(params) {
      return /* @__PURE__ */ _gte(0, params);
    }
    // @__NO_SIDE_EFFECTS__
    function _multipleOf(value, params) {
      return new checks.$ZodCheckMultipleOf({
        check: "multiple_of",
        ...util.normalizeParams(params),
        value
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _maxSize(maximum, params) {
      return new checks.$ZodCheckMaxSize({
        check: "max_size",
        ...util.normalizeParams(params),
        maximum
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _minSize(minimum, params) {
      return new checks.$ZodCheckMinSize({
        check: "min_size",
        ...util.normalizeParams(params),
        minimum
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _size(size, params) {
      return new checks.$ZodCheckSizeEquals({
        check: "size_equals",
        ...util.normalizeParams(params),
        size
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _maxLength(maximum, params) {
      const ch = new checks.$ZodCheckMaxLength({
        check: "max_length",
        ...util.normalizeParams(params),
        maximum
      });
      return ch;
    }
    // @__NO_SIDE_EFFECTS__
    function _minLength(minimum, params) {
      return new checks.$ZodCheckMinLength({
        check: "min_length",
        ...util.normalizeParams(params),
        minimum
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _length(length, params) {
      return new checks.$ZodCheckLengthEquals({
        check: "length_equals",
        ...util.normalizeParams(params),
        length
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _regex(pattern, params) {
      return new checks.$ZodCheckRegex({
        check: "string_format",
        format: "regex",
        ...util.normalizeParams(params),
        pattern
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _lowercase(params) {
      return new checks.$ZodCheckLowerCase({
        check: "string_format",
        format: "lowercase",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _uppercase(params) {
      return new checks.$ZodCheckUpperCase({
        check: "string_format",
        format: "uppercase",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _includes(includes, params) {
      return new checks.$ZodCheckIncludes({
        check: "string_format",
        format: "includes",
        ...util.normalizeParams(params),
        includes
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _startsWith(prefix, params) {
      return new checks.$ZodCheckStartsWith({
        check: "string_format",
        format: "starts_with",
        ...util.normalizeParams(params),
        prefix
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _endsWith(suffix, params) {
      return new checks.$ZodCheckEndsWith({
        check: "string_format",
        format: "ends_with",
        ...util.normalizeParams(params),
        suffix
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _property(property, schema, params) {
      return new checks.$ZodCheckProperty({
        check: "property",
        property,
        schema,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _mime(types, params) {
      return new checks.$ZodCheckMimeType({
        check: "mime_type",
        mime: types,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _overwrite(tx) {
      return new checks.$ZodCheckOverwrite({
        check: "overwrite",
        tx
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _normalize(form) {
      return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
    }
    // @__NO_SIDE_EFFECTS__
    function _trim() {
      return /* @__PURE__ */ _overwrite((input) => input.trim());
    }
    // @__NO_SIDE_EFFECTS__
    function _toLowerCase() {
      return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
    }
    // @__NO_SIDE_EFFECTS__
    function _toUpperCase() {
      return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
    }
    // @__NO_SIDE_EFFECTS__
    function _slugify() {
      return /* @__PURE__ */ _overwrite((input) => util.slugify(input));
    }
    // @__NO_SIDE_EFFECTS__
    function _array(Class, element, params) {
      return new Class({
        type: "array",
        element,
        // get element() {
        //   return element;
        // },
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _union(Class, options, params) {
      return new Class({
        type: "union",
        options,
        ...util.normalizeParams(params)
      });
    }
    function _xor(Class, options, params) {
      return new Class({
        type: "union",
        options,
        inclusive: false,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _discriminatedUnion(Class, discriminator, options, params) {
      return new Class({
        type: "union",
        options,
        discriminator,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _intersection(Class, left, right) {
      return new Class({
        type: "intersection",
        left,
        right
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _tuple(Class, items, _paramsOrRest, _params) {
      const hasRest = _paramsOrRest instanceof schemas.$ZodType;
      const params = hasRest ? _params : _paramsOrRest;
      const rest = hasRest ? _paramsOrRest : null;
      return new Class({
        type: "tuple",
        items,
        rest,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _record(Class, keyType, valueType, params) {
      return new Class({
        type: "record",
        keyType,
        valueType,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _map(Class, keyType, valueType, params) {
      return new Class({
        type: "map",
        keyType,
        valueType,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _set(Class, valueType, params) {
      return new Class({
        type: "set",
        valueType,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _enum(Class, values, params) {
      const entries = Array.isArray(values) ? Object.fromEntries(values.map((v3) => [v3, v3])) : values;
      return new Class({
        type: "enum",
        entries,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _nativeEnum(Class, entries, params) {
      return new Class({
        type: "enum",
        entries,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _literal(Class, value, params) {
      return new Class({
        type: "literal",
        values: Array.isArray(value) ? value : [value],
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _file(Class, params) {
      return new Class({
        type: "file",
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _transform(Class, fn) {
      return new Class({
        type: "transform",
        transform: fn
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _optional(Class, innerType) {
      return new Class({
        type: "optional",
        innerType
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _nullable(Class, innerType) {
      return new Class({
        type: "nullable",
        innerType
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _default(Class, innerType, defaultValue) {
      return new Class({
        type: "default",
        innerType,
        get defaultValue() {
          return typeof defaultValue === "function" ? defaultValue() : util.shallowClone(defaultValue);
        }
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _nonoptional(Class, innerType, params) {
      return new Class({
        type: "nonoptional",
        innerType,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _success(Class, innerType) {
      return new Class({
        type: "success",
        innerType
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _catch(Class, innerType, catchValue) {
      return new Class({
        type: "catch",
        innerType,
        catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _pipe(Class, in_, out) {
      return new Class({
        type: "pipe",
        in: in_,
        out
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _readonly(Class, innerType) {
      return new Class({
        type: "readonly",
        innerType
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _templateLiteral(Class, parts, params) {
      return new Class({
        type: "template_literal",
        parts,
        ...util.normalizeParams(params)
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _lazy(Class, getter) {
      return new Class({
        type: "lazy",
        getter
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _promise(Class, innerType) {
      return new Class({
        type: "promise",
        innerType
      });
    }
    // @__NO_SIDE_EFFECTS__
    function _custom(Class, fn, _params) {
      const norm = util.normalizeParams(_params);
      norm.abort ?? (norm.abort = true);
      const schema = new Class({
        type: "custom",
        check: "custom",
        fn,
        ...norm
      });
      return schema;
    }
    // @__NO_SIDE_EFFECTS__
    function _refine(Class, fn, _params) {
      const schema = new Class({
        type: "custom",
        check: "custom",
        fn,
        ...util.normalizeParams(_params)
      });
      return schema;
    }
    // @__NO_SIDE_EFFECTS__
    function _superRefine(fn, params) {
      const ch = /* @__PURE__ */ _check((payload) => {
        payload.addIssue = (issue) => {
          if (typeof issue === "string") {
            payload.issues.push(util.issue(issue, payload.value, ch._zod.def));
          } else {
            const _issue = issue;
            if (_issue.fatal)
              _issue.continue = false;
            _issue.code ?? (_issue.code = "custom");
            _issue.input ?? (_issue.input = payload.value);
            _issue.inst ?? (_issue.inst = ch);
            _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
            payload.issues.push(util.issue(_issue));
          }
        };
        return fn(payload.value, payload);
      }, params);
      return ch;
    }
    // @__NO_SIDE_EFFECTS__
    function _check(fn, params) {
      const ch = new checks.$ZodCheck({
        check: "custom",
        ...util.normalizeParams(params)
      });
      ch._zod.check = fn;
      return ch;
    }
    // @__NO_SIDE_EFFECTS__
    function describe(description) {
      const ch = new checks.$ZodCheck({ check: "describe" });
      ch._zod.onattach = [
        (inst) => {
          const existing = registries.globalRegistry.get(inst) ?? {};
          registries.globalRegistry.add(inst, { ...existing, description });
        }
      ];
      ch._zod.check = () => {
      };
      return ch;
    }
    // @__NO_SIDE_EFFECTS__
    function meta(metadata) {
      const ch = new checks.$ZodCheck({ check: "meta" });
      ch._zod.onattach = [
        (inst) => {
          const existing = registries.globalRegistry.get(inst) ?? {};
          registries.globalRegistry.add(inst, { ...existing, ...metadata });
        }
      ];
      ch._zod.check = () => {
      };
      return ch;
    }
    // @__NO_SIDE_EFFECTS__
    function _stringbool(Classes, _params) {
      const params = util.normalizeParams(_params);
      let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
      let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
      if (params.case !== "sensitive") {
        truthyArray = truthyArray.map((v3) => typeof v3 === "string" ? v3.toLowerCase() : v3);
        falsyArray = falsyArray.map((v3) => typeof v3 === "string" ? v3.toLowerCase() : v3);
      }
      const truthySet = new Set(truthyArray);
      const falsySet = new Set(falsyArray);
      const _Codec = Classes.Codec ?? schemas.$ZodCodec;
      const _Boolean = Classes.Boolean ?? schemas.$ZodBoolean;
      const _String = Classes.String ?? schemas.$ZodString;
      const stringSchema = new _String({ type: "string", error: params.error });
      const booleanSchema = new _Boolean({ type: "boolean", error: params.error });
      const codec = new _Codec({
        type: "pipe",
        in: stringSchema,
        out: booleanSchema,
        transform: (input, payload) => {
          let data = input;
          if (params.case !== "sensitive")
            data = data.toLowerCase();
          if (truthySet.has(data)) {
            return true;
          } else if (falsySet.has(data)) {
            return false;
          } else {
            payload.issues.push({
              code: "invalid_value",
              expected: "stringbool",
              values: [...truthySet, ...falsySet],
              input: payload.value,
              inst: codec,
              continue: false
            });
            return {};
          }
        },
        reverseTransform: (input, _payload) => {
          if (input === true) {
            return truthyArray[0] || "true";
          } else {
            return falsyArray[0] || "false";
          }
        },
        error: params.error
      });
      return codec;
    }
    // @__NO_SIDE_EFFECTS__
    function _stringFormat(Class, format, fnOrRegex, _params = {}) {
      const params = util.normalizeParams(_params);
      const def = {
        ...util.normalizeParams(_params),
        check: "string_format",
        type: "string",
        format,
        fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
        ...params
      };
      if (fnOrRegex instanceof RegExp) {
        def.pattern = fnOrRegex;
      }
      const inst = new Class(def);
      return inst;
    }
  }
});

// node_modules/zod/v4/core/to-json-schema.cjs
var require_to_json_schema = __commonJS({
  "node_modules/zod/v4/core/to-json-schema.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createStandardJSONSchemaMethod = exports2.createToJSONSchemaMethod = void 0;
    exports2.initializeContext = initializeContext;
    exports2.process = process2;
    exports2.extractDefs = extractDefs;
    exports2.finalize = finalize;
    var registries_js_1 = require_registries();
    function initializeContext(params) {
      let target = params?.target ?? "draft-2020-12";
      if (target === "draft-4")
        target = "draft-04";
      if (target === "draft-7")
        target = "draft-07";
      return {
        processors: params.processors ?? {},
        metadataRegistry: params?.metadata ?? registries_js_1.globalRegistry,
        target,
        unrepresentable: params?.unrepresentable ?? "throw",
        override: params?.override ?? (() => {
        }),
        io: params?.io ?? "output",
        counter: 0,
        seen: /* @__PURE__ */ new Map(),
        cycles: params?.cycles ?? "ref",
        reused: params?.reused ?? "inline",
        external: params?.external ?? void 0
      };
    }
    function process2(schema, ctx, _params = { path: [], schemaPath: [] }) {
      var _a;
      const def = schema._zod.def;
      const seen = ctx.seen.get(schema);
      if (seen) {
        seen.count++;
        const isCycle = _params.schemaPath.includes(schema);
        if (isCycle) {
          seen.cycle = _params.path;
        }
        return seen.schema;
      }
      const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
      ctx.seen.set(schema, result);
      const overrideSchema = schema._zod.toJSONSchema?.();
      if (overrideSchema) {
        result.schema = overrideSchema;
      } else {
        const params = {
          ..._params,
          schemaPath: [..._params.schemaPath, schema],
          path: _params.path
        };
        if (schema._zod.processJSONSchema) {
          schema._zod.processJSONSchema(ctx, result.schema, params);
        } else {
          const _json = result.schema;
          const processor = ctx.processors[def.type];
          if (!processor) {
            throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
          }
          processor(schema, ctx, _json, params);
        }
        const parent = schema._zod.parent;
        if (parent) {
          if (!result.ref)
            result.ref = parent;
          process2(parent, ctx, params);
          ctx.seen.get(parent).isParent = true;
        }
      }
      const meta = ctx.metadataRegistry.get(schema);
      if (meta)
        Object.assign(result.schema, meta);
      if (ctx.io === "input" && isTransforming(schema)) {
        delete result.schema.examples;
        delete result.schema.default;
      }
      if (ctx.io === "input" && "_prefault" in result.schema)
        (_a = result.schema).default ?? (_a.default = result.schema._prefault);
      delete result.schema._prefault;
      const _result = ctx.seen.get(schema);
      return _result.schema;
    }
    function extractDefs(ctx, schema) {
      const root = ctx.seen.get(schema);
      if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
      const idToSchema = /* @__PURE__ */ new Map();
      for (const entry of ctx.seen.entries()) {
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
          const existing = idToSchema.get(id);
          if (existing && existing !== entry[0]) {
            throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
          }
          idToSchema.set(id, entry[0]);
        }
      }
      const makeURI = (entry) => {
        const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
        if (ctx.external) {
          const externalId = ctx.external.registry.get(entry[0])?.id;
          const uriGenerator = ctx.external.uri ?? ((id2) => id2);
          if (externalId) {
            return { ref: uriGenerator(externalId) };
          }
          const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
          entry[1].defId = id;
          return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
        }
        if (entry[1] === root) {
          return { ref: "#" };
        }
        const uriPrefix = `#`;
        const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return { defId, ref: defUriPrefix + defId };
      };
      const extractToDef = (entry) => {
        if (entry[1].schema.$ref) {
          return;
        }
        const seen = entry[1];
        const { ref, defId } = makeURI(entry);
        seen.def = { ...seen.schema };
        if (defId)
          seen.defId = defId;
        const schema2 = seen.schema;
        for (const key in schema2) {
          delete schema2[key];
        }
        schema2.$ref = ref;
      };
      if (ctx.cycles === "throw") {
        for (const entry of ctx.seen.entries()) {
          const seen = entry[1];
          if (seen.cycle) {
            throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
          }
        }
      }
      for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        if (schema === entry[0]) {
          extractToDef(entry);
          continue;
        }
        if (ctx.external) {
          const ext = ctx.external.registry.get(entry[0])?.id;
          if (schema !== entry[0] && ext) {
            extractToDef(entry);
            continue;
          }
        }
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
          extractToDef(entry);
          continue;
        }
        if (seen.cycle) {
          extractToDef(entry);
          continue;
        }
        if (seen.count > 1) {
          if (ctx.reused === "ref") {
            extractToDef(entry);
            continue;
          }
        }
      }
    }
    function finalize(ctx, schema) {
      const root = ctx.seen.get(schema);
      if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
      const flattenRef = (zodSchema) => {
        const seen = ctx.seen.get(zodSchema);
        if (seen.ref === null)
          return;
        const schema2 = seen.def ?? seen.schema;
        const _cached = { ...schema2 };
        const ref = seen.ref;
        seen.ref = null;
        if (ref) {
          flattenRef(ref);
          const refSeen = ctx.seen.get(ref);
          const refSchema = refSeen.schema;
          if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
            schema2.allOf = schema2.allOf ?? [];
            schema2.allOf.push(refSchema);
          } else {
            Object.assign(schema2, refSchema);
          }
          Object.assign(schema2, _cached);
          const isParentRef = zodSchema._zod.parent === ref;
          if (isParentRef) {
            for (const key in schema2) {
              if (key === "$ref" || key === "allOf")
                continue;
              if (!(key in _cached)) {
                delete schema2[key];
              }
            }
          }
          if (refSchema.$ref && refSeen.def) {
            for (const key in schema2) {
              if (key === "$ref" || key === "allOf")
                continue;
              if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
                delete schema2[key];
              }
            }
          }
        }
        const parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
          flattenRef(parent);
          const parentSeen = ctx.seen.get(parent);
          if (parentSeen?.schema.$ref) {
            schema2.$ref = parentSeen.schema.$ref;
            if (parentSeen.def) {
              for (const key in schema2) {
                if (key === "$ref" || key === "allOf")
                  continue;
                if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
                  delete schema2[key];
                }
              }
            }
          }
        }
        ctx.override({
          zodSchema,
          jsonSchema: schema2,
          path: seen.path ?? []
        });
      };
      for (const entry of [...ctx.seen.entries()].reverse()) {
        flattenRef(entry[0]);
      }
      const result = {};
      if (ctx.target === "draft-2020-12") {
        result.$schema = "https://json-schema.org/draft/2020-12/schema";
      } else if (ctx.target === "draft-07") {
        result.$schema = "http://json-schema.org/draft-07/schema#";
      } else if (ctx.target === "draft-04") {
        result.$schema = "http://json-schema.org/draft-04/schema#";
      } else if (ctx.target === "openapi-3.0") {
      } else {
      }
      if (ctx.external?.uri) {
        const id = ctx.external.registry.get(schema)?.id;
        if (!id)
          throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
      }
      Object.assign(result, root.def ?? root.schema);
      const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
      if (rootMetaId !== void 0 && result.id === rootMetaId)
        delete result.id;
      const defs = ctx.external?.defs ?? {};
      for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        if (seen.def && seen.defId) {
          if (seen.def.id === seen.defId)
            delete seen.def.id;
          defs[seen.defId] = seen.def;
        }
      }
      if (ctx.external) {
      } else {
        if (Object.keys(defs).length > 0) {
          if (ctx.target === "draft-2020-12") {
            result.$defs = defs;
          } else {
            result.definitions = defs;
          }
        }
      }
      try {
        const finalized = JSON.parse(JSON.stringify(result));
        Object.defineProperty(finalized, "~standard", {
          value: {
            ...schema["~standard"],
            jsonSchema: {
              input: (0, exports2.createStandardJSONSchemaMethod)(schema, "input", ctx.processors),
              output: (0, exports2.createStandardJSONSchemaMethod)(schema, "output", ctx.processors)
            }
          },
          enumerable: false,
          writable: false
        });
        return finalized;
      } catch (_err) {
        throw new Error("Error converting schema to JSON.");
      }
    }
    function isTransforming(_schema, _ctx) {
      const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
      if (ctx.seen.has(_schema))
        return false;
      ctx.seen.add(_schema);
      const def = _schema._zod.def;
      if (def.type === "transform")
        return true;
      if (def.type === "array")
        return isTransforming(def.element, ctx);
      if (def.type === "set")
        return isTransforming(def.valueType, ctx);
      if (def.type === "lazy")
        return isTransforming(def.getter(), ctx);
      if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
        return isTransforming(def.innerType, ctx);
      }
      if (def.type === "intersection") {
        return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
      }
      if (def.type === "record" || def.type === "map") {
        return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
      }
      if (def.type === "pipe") {
        if (_schema._zod.traits.has("$ZodCodec"))
          return true;
        return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
      }
      if (def.type === "object") {
        for (const key in def.shape) {
          if (isTransforming(def.shape[key], ctx))
            return true;
        }
        return false;
      }
      if (def.type === "union") {
        for (const option of def.options) {
          if (isTransforming(option, ctx))
            return true;
        }
        return false;
      }
      if (def.type === "tuple") {
        for (const item of def.items) {
          if (isTransforming(item, ctx))
            return true;
        }
        if (def.rest && isTransforming(def.rest, ctx))
          return true;
        return false;
      }
      return false;
    }
    var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
      const ctx = initializeContext({ ...params, processors });
      process2(schema, ctx);
      extractDefs(ctx, schema);
      return finalize(ctx, schema);
    };
    exports2.createToJSONSchemaMethod = createToJSONSchemaMethod;
    var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
      const { libraryOptions, target } = params ?? {};
      const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
      process2(schema, ctx);
      extractDefs(ctx, schema);
      return finalize(ctx, schema);
    };
    exports2.createStandardJSONSchemaMethod = createStandardJSONSchemaMethod;
  }
});

// node_modules/zod/v4/core/json-schema-processors.cjs
var require_json_schema_processors = __commonJS({
  "node_modules/zod/v4/core/json-schema-processors.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.allProcessors = exports2.lazyProcessor = exports2.optionalProcessor = exports2.promiseProcessor = exports2.readonlyProcessor = exports2.pipeProcessor = exports2.catchProcessor = exports2.prefaultProcessor = exports2.defaultProcessor = exports2.nonoptionalProcessor = exports2.nullableProcessor = exports2.recordProcessor = exports2.tupleProcessor = exports2.intersectionProcessor = exports2.unionProcessor = exports2.objectProcessor = exports2.arrayProcessor = exports2.setProcessor = exports2.mapProcessor = exports2.transformProcessor = exports2.functionProcessor = exports2.customProcessor = exports2.successProcessor = exports2.fileProcessor = exports2.templateLiteralProcessor = exports2.nanProcessor = exports2.literalProcessor = exports2.enumProcessor = exports2.dateProcessor = exports2.unknownProcessor = exports2.anyProcessor = exports2.neverProcessor = exports2.voidProcessor = exports2.undefinedProcessor = exports2.nullProcessor = exports2.symbolProcessor = exports2.bigintProcessor = exports2.booleanProcessor = exports2.numberProcessor = exports2.stringProcessor = void 0;
    exports2.toJSONSchema = toJSONSchema;
    var to_json_schema_js_1 = require_to_json_schema();
    var util_js_1 = require_util();
    var formatMap = {
      guid: "uuid",
      url: "uri",
      datetime: "date-time",
      json_string: "json-string",
      regex: ""
      // do not set
    };
    var stringProcessor = (schema, ctx, _json, _params) => {
      const json = _json;
      json.type = "string";
      const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
      if (typeof minimum === "number")
        json.minLength = minimum;
      if (typeof maximum === "number")
        json.maxLength = maximum;
      if (format) {
        json.format = formatMap[format] ?? format;
        if (json.format === "")
          delete json.format;
        if (format === "time") {
          delete json.format;
        }
      }
      if (contentEncoding)
        json.contentEncoding = contentEncoding;
      if (patterns && patterns.size > 0) {
        const regexes = [...patterns];
        if (regexes.length === 1)
          json.pattern = regexes[0].source;
        else if (regexes.length > 1) {
          json.allOf = [
            ...regexes.map((regex) => ({
              ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
              pattern: regex.source
            }))
          ];
        }
      }
    };
    exports2.stringProcessor = stringProcessor;
    var numberProcessor = (schema, ctx, _json, _params) => {
      const json = _json;
      const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
      if (typeof format === "string" && format.includes("int"))
        json.type = "integer";
      else
        json.type = "number";
      const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
      const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
      const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
      if (exMin) {
        if (legacy) {
          json.minimum = exclusiveMinimum;
          json.exclusiveMinimum = true;
        } else {
          json.exclusiveMinimum = exclusiveMinimum;
        }
      } else if (typeof minimum === "number") {
        json.minimum = minimum;
      }
      if (exMax) {
        if (legacy) {
          json.maximum = exclusiveMaximum;
          json.exclusiveMaximum = true;
        } else {
          json.exclusiveMaximum = exclusiveMaximum;
        }
      } else if (typeof maximum === "number") {
        json.maximum = maximum;
      }
      if (typeof multipleOf === "number")
        json.multipleOf = multipleOf;
    };
    exports2.numberProcessor = numberProcessor;
    var booleanProcessor = (_schema, _ctx, json, _params) => {
      json.type = "boolean";
    };
    exports2.booleanProcessor = booleanProcessor;
    var bigintProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt cannot be represented in JSON Schema");
      }
    };
    exports2.bigintProcessor = bigintProcessor;
    var symbolProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Symbols cannot be represented in JSON Schema");
      }
    };
    exports2.symbolProcessor = symbolProcessor;
    var nullProcessor = (_schema, ctx, json, _params) => {
      if (ctx.target === "openapi-3.0") {
        json.type = "string";
        json.nullable = true;
        json.enum = [null];
      } else {
        json.type = "null";
      }
    };
    exports2.nullProcessor = nullProcessor;
    var undefinedProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Undefined cannot be represented in JSON Schema");
      }
    };
    exports2.undefinedProcessor = undefinedProcessor;
    var voidProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Void cannot be represented in JSON Schema");
      }
    };
    exports2.voidProcessor = voidProcessor;
    var neverProcessor = (_schema, _ctx, json, _params) => {
      json.not = {};
    };
    exports2.neverProcessor = neverProcessor;
    var anyProcessor = (_schema, _ctx, _json, _params) => {
    };
    exports2.anyProcessor = anyProcessor;
    var unknownProcessor = (_schema, _ctx, _json, _params) => {
    };
    exports2.unknownProcessor = unknownProcessor;
    var dateProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Date cannot be represented in JSON Schema");
      }
    };
    exports2.dateProcessor = dateProcessor;
    var enumProcessor = (schema, _ctx, json, _params) => {
      const def = schema._zod.def;
      const values = (0, util_js_1.getEnumValues)(def.entries);
      if (values.every((v3) => typeof v3 === "number"))
        json.type = "number";
      if (values.every((v3) => typeof v3 === "string"))
        json.type = "string";
      json.enum = values;
    };
    exports2.enumProcessor = enumProcessor;
    var literalProcessor = (schema, ctx, json, _params) => {
      const def = schema._zod.def;
      const vals = [];
      for (const val of def.values) {
        if (val === void 0) {
          if (ctx.unrepresentable === "throw") {
            throw new Error("Literal `undefined` cannot be represented in JSON Schema");
          } else {
          }
        } else if (typeof val === "bigint") {
          if (ctx.unrepresentable === "throw") {
            throw new Error("BigInt literals cannot be represented in JSON Schema");
          } else {
            vals.push(Number(val));
          }
        } else {
          vals.push(val);
        }
      }
      if (vals.length === 0) {
      } else if (vals.length === 1) {
        const val = vals[0];
        json.type = val === null ? "null" : typeof val;
        if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
          json.enum = [val];
        } else {
          json.const = val;
        }
      } else {
        if (vals.every((v3) => typeof v3 === "number"))
          json.type = "number";
        if (vals.every((v3) => typeof v3 === "string"))
          json.type = "string";
        if (vals.every((v3) => typeof v3 === "boolean"))
          json.type = "boolean";
        if (vals.every((v3) => v3 === null))
          json.type = "null";
        json.enum = vals;
      }
    };
    exports2.literalProcessor = literalProcessor;
    var nanProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("NaN cannot be represented in JSON Schema");
      }
    };
    exports2.nanProcessor = nanProcessor;
    var templateLiteralProcessor = (schema, _ctx, json, _params) => {
      const _json = json;
      const pattern = schema._zod.pattern;
      if (!pattern)
        throw new Error("Pattern not found in template literal");
      _json.type = "string";
      _json.pattern = pattern.source;
    };
    exports2.templateLiteralProcessor = templateLiteralProcessor;
    var fileProcessor = (schema, _ctx, json, _params) => {
      const _json = json;
      const file = {
        type: "string",
        format: "binary",
        contentEncoding: "binary"
      };
      const { minimum, maximum, mime } = schema._zod.bag;
      if (minimum !== void 0)
        file.minLength = minimum;
      if (maximum !== void 0)
        file.maxLength = maximum;
      if (mime) {
        if (mime.length === 1) {
          file.contentMediaType = mime[0];
          Object.assign(_json, file);
        } else {
          Object.assign(_json, file);
          _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
        }
      } else {
        Object.assign(_json, file);
      }
    };
    exports2.fileProcessor = fileProcessor;
    var successProcessor = (_schema, _ctx, json, _params) => {
      json.type = "boolean";
    };
    exports2.successProcessor = successProcessor;
    var customProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Custom types cannot be represented in JSON Schema");
      }
    };
    exports2.customProcessor = customProcessor;
    var functionProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Function types cannot be represented in JSON Schema");
      }
    };
    exports2.functionProcessor = functionProcessor;
    var transformProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Transforms cannot be represented in JSON Schema");
      }
    };
    exports2.transformProcessor = transformProcessor;
    var mapProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Map cannot be represented in JSON Schema");
      }
    };
    exports2.mapProcessor = mapProcessor;
    var setProcessor = (_schema, ctx, _json, _params) => {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Set cannot be represented in JSON Schema");
      }
    };
    exports2.setProcessor = setProcessor;
    var arrayProcessor = (schema, ctx, _json, params) => {
      const json = _json;
      const def = schema._zod.def;
      const { minimum, maximum } = schema._zod.bag;
      if (typeof minimum === "number")
        json.minItems = minimum;
      if (typeof maximum === "number")
        json.maxItems = maximum;
      json.type = "array";
      json.items = (0, to_json_schema_js_1.process)(def.element, ctx, {
        ...params,
        path: [...params.path, "items"]
      });
    };
    exports2.arrayProcessor = arrayProcessor;
    var objectProcessor = (schema, ctx, _json, params) => {
      const json = _json;
      const def = schema._zod.def;
      json.type = "object";
      json.properties = {};
      const shape = def.shape;
      for (const key in shape) {
        json.properties[key] = (0, to_json_schema_js_1.process)(shape[key], ctx, {
          ...params,
          path: [...params.path, "properties", key]
        });
      }
      const allKeys = new Set(Object.keys(shape));
      const requiredKeys = new Set([...allKeys].filter((key) => {
        const v3 = def.shape[key]._zod;
        if (ctx.io === "input") {
          return v3.optin === void 0;
        } else {
          return v3.optout === void 0;
        }
      }));
      if (requiredKeys.size > 0) {
        json.required = Array.from(requiredKeys);
      }
      if (def.catchall?._zod.def.type === "never") {
        json.additionalProperties = false;
      } else if (!def.catchall) {
        if (ctx.io === "output")
          json.additionalProperties = false;
      } else if (def.catchall) {
        json.additionalProperties = (0, to_json_schema_js_1.process)(def.catchall, ctx, {
          ...params,
          path: [...params.path, "additionalProperties"]
        });
      }
    };
    exports2.objectProcessor = objectProcessor;
    var unionProcessor = (schema, ctx, json, params) => {
      const def = schema._zod.def;
      const isExclusive = def.inclusive === false;
      const options = def.options.map((x, i) => (0, to_json_schema_js_1.process)(x, ctx, {
        ...params,
        path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
      }));
      if (isExclusive) {
        json.oneOf = options;
      } else {
        json.anyOf = options;
      }
    };
    exports2.unionProcessor = unionProcessor;
    var intersectionProcessor = (schema, ctx, json, params) => {
      const def = schema._zod.def;
      const a = (0, to_json_schema_js_1.process)(def.left, ctx, {
        ...params,
        path: [...params.path, "allOf", 0]
      });
      const b = (0, to_json_schema_js_1.process)(def.right, ctx, {
        ...params,
        path: [...params.path, "allOf", 1]
      });
      const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
      const allOf = [
        ...isSimpleIntersection(a) ? a.allOf : [a],
        ...isSimpleIntersection(b) ? b.allOf : [b]
      ];
      json.allOf = allOf;
    };
    exports2.intersectionProcessor = intersectionProcessor;
    var tupleProcessor = (schema, ctx, _json, params) => {
      const json = _json;
      const def = schema._zod.def;
      json.type = "array";
      const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
      const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
      const prefixItems = def.items.map((x, i) => (0, to_json_schema_js_1.process)(x, ctx, {
        ...params,
        path: [...params.path, prefixPath, i]
      }));
      const rest = def.rest ? (0, to_json_schema_js_1.process)(def.rest, ctx, {
        ...params,
        path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
      }) : null;
      if (ctx.target === "draft-2020-12") {
        json.prefixItems = prefixItems;
        if (rest) {
          json.items = rest;
        }
      } else if (ctx.target === "openapi-3.0") {
        json.items = {
          anyOf: prefixItems
        };
        if (rest) {
          json.items.anyOf.push(rest);
        }
        json.minItems = prefixItems.length;
        if (!rest) {
          json.maxItems = prefixItems.length;
        }
      } else {
        json.items = prefixItems;
        if (rest) {
          json.additionalItems = rest;
        }
      }
      const { minimum, maximum } = schema._zod.bag;
      if (typeof minimum === "number")
        json.minItems = minimum;
      if (typeof maximum === "number")
        json.maxItems = maximum;
    };
    exports2.tupleProcessor = tupleProcessor;
    var recordProcessor = (schema, ctx, _json, params) => {
      const json = _json;
      const def = schema._zod.def;
      json.type = "object";
      const keyType = def.keyType;
      const keyBag = keyType._zod.bag;
      const patterns = keyBag?.patterns;
      if (def.mode === "loose" && patterns && patterns.size > 0) {
        const valueSchema = (0, to_json_schema_js_1.process)(def.valueType, ctx, {
          ...params,
          path: [...params.path, "patternProperties", "*"]
        });
        json.patternProperties = {};
        for (const pattern of patterns) {
          json.patternProperties[pattern.source] = valueSchema;
        }
      } else {
        if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
          json.propertyNames = (0, to_json_schema_js_1.process)(def.keyType, ctx, {
            ...params,
            path: [...params.path, "propertyNames"]
          });
        }
        json.additionalProperties = (0, to_json_schema_js_1.process)(def.valueType, ctx, {
          ...params,
          path: [...params.path, "additionalProperties"]
        });
      }
      const keyValues = keyType._zod.values;
      if (keyValues) {
        const validKeyValues = [...keyValues].filter((v3) => typeof v3 === "string" || typeof v3 === "number");
        if (validKeyValues.length > 0) {
          json.required = validKeyValues;
        }
      }
    };
    exports2.recordProcessor = recordProcessor;
    var nullableProcessor = (schema, ctx, json, params) => {
      const def = schema._zod.def;
      const inner = (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      if (ctx.target === "openapi-3.0") {
        seen.ref = def.innerType;
        json.nullable = true;
      } else {
        json.anyOf = [inner, { type: "null" }];
      }
    };
    exports2.nullableProcessor = nullableProcessor;
    var nonoptionalProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    exports2.nonoptionalProcessor = nonoptionalProcessor;
    var defaultProcessor = (schema, ctx, json, params) => {
      const def = schema._zod.def;
      (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      json.default = JSON.parse(JSON.stringify(def.defaultValue));
    };
    exports2.defaultProcessor = defaultProcessor;
    var prefaultProcessor = (schema, ctx, json, params) => {
      const def = schema._zod.def;
      (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      if (ctx.io === "input")
        json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
    };
    exports2.prefaultProcessor = prefaultProcessor;
    var catchProcessor = (schema, ctx, json, params) => {
      const def = schema._zod.def;
      (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      let catchValue;
      try {
        catchValue = def.catchValue(void 0);
      } catch {
        throw new Error("Dynamic catch values are not supported in JSON Schema");
      }
      json.default = catchValue;
    };
    exports2.catchProcessor = catchProcessor;
    var pipeProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      const inIsTransform = def.in._zod.traits.has("$ZodTransform");
      const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
      (0, to_json_schema_js_1.process)(innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = innerType;
    };
    exports2.pipeProcessor = pipeProcessor;
    var readonlyProcessor = (schema, ctx, json, params) => {
      const def = schema._zod.def;
      (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      json.readOnly = true;
    };
    exports2.readonlyProcessor = readonlyProcessor;
    var promiseProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    exports2.promiseProcessor = promiseProcessor;
    var optionalProcessor = (schema, ctx, _json, params) => {
      const def = schema._zod.def;
      (0, to_json_schema_js_1.process)(def.innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    exports2.optionalProcessor = optionalProcessor;
    var lazyProcessor = (schema, ctx, _json, params) => {
      const innerType = schema._zod.innerType;
      (0, to_json_schema_js_1.process)(innerType, ctx, params);
      const seen = ctx.seen.get(schema);
      seen.ref = innerType;
    };
    exports2.lazyProcessor = lazyProcessor;
    exports2.allProcessors = {
      string: exports2.stringProcessor,
      number: exports2.numberProcessor,
      boolean: exports2.booleanProcessor,
      bigint: exports2.bigintProcessor,
      symbol: exports2.symbolProcessor,
      null: exports2.nullProcessor,
      undefined: exports2.undefinedProcessor,
      void: exports2.voidProcessor,
      never: exports2.neverProcessor,
      any: exports2.anyProcessor,
      unknown: exports2.unknownProcessor,
      date: exports2.dateProcessor,
      enum: exports2.enumProcessor,
      literal: exports2.literalProcessor,
      nan: exports2.nanProcessor,
      template_literal: exports2.templateLiteralProcessor,
      file: exports2.fileProcessor,
      success: exports2.successProcessor,
      custom: exports2.customProcessor,
      function: exports2.functionProcessor,
      transform: exports2.transformProcessor,
      map: exports2.mapProcessor,
      set: exports2.setProcessor,
      array: exports2.arrayProcessor,
      object: exports2.objectProcessor,
      union: exports2.unionProcessor,
      intersection: exports2.intersectionProcessor,
      tuple: exports2.tupleProcessor,
      record: exports2.recordProcessor,
      nullable: exports2.nullableProcessor,
      nonoptional: exports2.nonoptionalProcessor,
      default: exports2.defaultProcessor,
      prefault: exports2.prefaultProcessor,
      catch: exports2.catchProcessor,
      pipe: exports2.pipeProcessor,
      readonly: exports2.readonlyProcessor,
      promise: exports2.promiseProcessor,
      optional: exports2.optionalProcessor,
      lazy: exports2.lazyProcessor
    };
    function toJSONSchema(input, params) {
      if ("_idmap" in input) {
        const registry = input;
        const ctx2 = (0, to_json_schema_js_1.initializeContext)({ ...params, processors: exports2.allProcessors });
        const defs = {};
        for (const entry of registry._idmap.entries()) {
          const [_, schema] = entry;
          (0, to_json_schema_js_1.process)(schema, ctx2);
        }
        const schemas = {};
        const external = {
          registry,
          uri: params?.uri,
          defs
        };
        ctx2.external = external;
        for (const entry of registry._idmap.entries()) {
          const [key, schema] = entry;
          (0, to_json_schema_js_1.extractDefs)(ctx2, schema);
          schemas[key] = (0, to_json_schema_js_1.finalize)(ctx2, schema);
        }
        if (Object.keys(defs).length > 0) {
          const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
          schemas.__shared = {
            [defsSegment]: defs
          };
        }
        return { schemas };
      }
      const ctx = (0, to_json_schema_js_1.initializeContext)({ ...params, processors: exports2.allProcessors });
      (0, to_json_schema_js_1.process)(input, ctx);
      (0, to_json_schema_js_1.extractDefs)(ctx, input);
      return (0, to_json_schema_js_1.finalize)(ctx, input);
    }
  }
});

// node_modules/zod/v4/core/json-schema-generator.cjs
var require_json_schema_generator = __commonJS({
  "node_modules/zod/v4/core/json-schema-generator.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.JSONSchemaGenerator = void 0;
    var json_schema_processors_js_1 = require_json_schema_processors();
    var to_json_schema_js_1 = require_to_json_schema();
    var JSONSchemaGenerator = class {
      /** @deprecated Access via ctx instead */
      get metadataRegistry() {
        return this.ctx.metadataRegistry;
      }
      /** @deprecated Access via ctx instead */
      get target() {
        return this.ctx.target;
      }
      /** @deprecated Access via ctx instead */
      get unrepresentable() {
        return this.ctx.unrepresentable;
      }
      /** @deprecated Access via ctx instead */
      get override() {
        return this.ctx.override;
      }
      /** @deprecated Access via ctx instead */
      get io() {
        return this.ctx.io;
      }
      /** @deprecated Access via ctx instead */
      get counter() {
        return this.ctx.counter;
      }
      set counter(value) {
        this.ctx.counter = value;
      }
      /** @deprecated Access via ctx instead */
      get seen() {
        return this.ctx.seen;
      }
      constructor(params) {
        let normalizedTarget = params?.target ?? "draft-2020-12";
        if (normalizedTarget === "draft-4")
          normalizedTarget = "draft-04";
        if (normalizedTarget === "draft-7")
          normalizedTarget = "draft-07";
        this.ctx = (0, to_json_schema_js_1.initializeContext)({
          processors: json_schema_processors_js_1.allProcessors,
          target: normalizedTarget,
          ...params?.metadata && { metadata: params.metadata },
          ...params?.unrepresentable && { unrepresentable: params.unrepresentable },
          ...params?.override && { override: params.override },
          ...params?.io && { io: params.io }
        });
      }
      /**
       * Process a schema to prepare it for JSON Schema generation.
       * This must be called before emit().
       */
      process(schema, _params = { path: [], schemaPath: [] }) {
        return (0, to_json_schema_js_1.process)(schema, this.ctx, _params);
      }
      /**
       * Emit the final JSON Schema after processing.
       * Must call process() first.
       */
      emit(schema, _params) {
        if (_params) {
          if (_params.cycles)
            this.ctx.cycles = _params.cycles;
          if (_params.reused)
            this.ctx.reused = _params.reused;
          if (_params.external)
            this.ctx.external = _params.external;
        }
        (0, to_json_schema_js_1.extractDefs)(this.ctx, schema);
        const result = (0, to_json_schema_js_1.finalize)(this.ctx, schema);
        const { "~standard": _, ...plainResult } = result;
        return plainResult;
      }
    };
    exports2.JSONSchemaGenerator = JSONSchemaGenerator;
  }
});

// node_modules/zod/v4/core/json-schema.cjs
var require_json_schema = __commonJS({
  "node_modules/zod/v4/core/json-schema.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/zod/v4/core/index.cjs
var require_core2 = __commonJS({
  "node_modules/zod/v4/core/index.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.JSONSchema = exports2.JSONSchemaGenerator = exports2.toJSONSchema = exports2.locales = exports2.regexes = exports2.util = void 0;
    __exportStar(require_core(), exports2);
    __exportStar(require_parse(), exports2);
    __exportStar(require_errors2(), exports2);
    __exportStar(require_schemas(), exports2);
    __exportStar(require_checks(), exports2);
    __exportStar(require_versions(), exports2);
    exports2.util = __importStar(require_util());
    exports2.regexes = __importStar(require_regexes());
    exports2.locales = __importStar(require_locales());
    __exportStar(require_registries(), exports2);
    __exportStar(require_doc(), exports2);
    __exportStar(require_api2(), exports2);
    __exportStar(require_to_json_schema(), exports2);
    var json_schema_processors_js_1 = require_json_schema_processors();
    Object.defineProperty(exports2, "toJSONSchema", { enumerable: true, get: function() {
      return json_schema_processors_js_1.toJSONSchema;
    } });
    var json_schema_generator_js_1 = require_json_schema_generator();
    Object.defineProperty(exports2, "JSONSchemaGenerator", { enumerable: true, get: function() {
      return json_schema_generator_js_1.JSONSchemaGenerator;
    } });
    exports2.JSONSchema = __importStar(require_json_schema());
  }
});

// node_modules/zod/v4/classic/checks.cjs
var require_checks2 = __commonJS({
  "node_modules/zod/v4/classic/checks.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.slugify = exports2.toUpperCase = exports2.toLowerCase = exports2.trim = exports2.normalize = exports2.overwrite = exports2.mime = exports2.property = exports2.endsWith = exports2.startsWith = exports2.includes = exports2.uppercase = exports2.lowercase = exports2.regex = exports2.length = exports2.minLength = exports2.maxLength = exports2.size = exports2.minSize = exports2.maxSize = exports2.multipleOf = exports2.nonnegative = exports2.nonpositive = exports2.negative = exports2.positive = exports2.gte = exports2.gt = exports2.lte = exports2.lt = void 0;
    var index_js_1 = require_core2();
    Object.defineProperty(exports2, "lt", { enumerable: true, get: function() {
      return index_js_1._lt;
    } });
    Object.defineProperty(exports2, "lte", { enumerable: true, get: function() {
      return index_js_1._lte;
    } });
    Object.defineProperty(exports2, "gt", { enumerable: true, get: function() {
      return index_js_1._gt;
    } });
    Object.defineProperty(exports2, "gte", { enumerable: true, get: function() {
      return index_js_1._gte;
    } });
    Object.defineProperty(exports2, "positive", { enumerable: true, get: function() {
      return index_js_1._positive;
    } });
    Object.defineProperty(exports2, "negative", { enumerable: true, get: function() {
      return index_js_1._negative;
    } });
    Object.defineProperty(exports2, "nonpositive", { enumerable: true, get: function() {
      return index_js_1._nonpositive;
    } });
    Object.defineProperty(exports2, "nonnegative", { enumerable: true, get: function() {
      return index_js_1._nonnegative;
    } });
    Object.defineProperty(exports2, "multipleOf", { enumerable: true, get: function() {
      return index_js_1._multipleOf;
    } });
    Object.defineProperty(exports2, "maxSize", { enumerable: true, get: function() {
      return index_js_1._maxSize;
    } });
    Object.defineProperty(exports2, "minSize", { enumerable: true, get: function() {
      return index_js_1._minSize;
    } });
    Object.defineProperty(exports2, "size", { enumerable: true, get: function() {
      return index_js_1._size;
    } });
    Object.defineProperty(exports2, "maxLength", { enumerable: true, get: function() {
      return index_js_1._maxLength;
    } });
    Object.defineProperty(exports2, "minLength", { enumerable: true, get: function() {
      return index_js_1._minLength;
    } });
    Object.defineProperty(exports2, "length", { enumerable: true, get: function() {
      return index_js_1._length;
    } });
    Object.defineProperty(exports2, "regex", { enumerable: true, get: function() {
      return index_js_1._regex;
    } });
    Object.defineProperty(exports2, "lowercase", { enumerable: true, get: function() {
      return index_js_1._lowercase;
    } });
    Object.defineProperty(exports2, "uppercase", { enumerable: true, get: function() {
      return index_js_1._uppercase;
    } });
    Object.defineProperty(exports2, "includes", { enumerable: true, get: function() {
      return index_js_1._includes;
    } });
    Object.defineProperty(exports2, "startsWith", { enumerable: true, get: function() {
      return index_js_1._startsWith;
    } });
    Object.defineProperty(exports2, "endsWith", { enumerable: true, get: function() {
      return index_js_1._endsWith;
    } });
    Object.defineProperty(exports2, "property", { enumerable: true, get: function() {
      return index_js_1._property;
    } });
    Object.defineProperty(exports2, "mime", { enumerable: true, get: function() {
      return index_js_1._mime;
    } });
    Object.defineProperty(exports2, "overwrite", { enumerable: true, get: function() {
      return index_js_1._overwrite;
    } });
    Object.defineProperty(exports2, "normalize", { enumerable: true, get: function() {
      return index_js_1._normalize;
    } });
    Object.defineProperty(exports2, "trim", { enumerable: true, get: function() {
      return index_js_1._trim;
    } });
    Object.defineProperty(exports2, "toLowerCase", { enumerable: true, get: function() {
      return index_js_1._toLowerCase;
    } });
    Object.defineProperty(exports2, "toUpperCase", { enumerable: true, get: function() {
      return index_js_1._toUpperCase;
    } });
    Object.defineProperty(exports2, "slugify", { enumerable: true, get: function() {
      return index_js_1._slugify;
    } });
  }
});

// node_modules/zod/v4/classic/iso.cjs
var require_iso = __commonJS({
  "node_modules/zod/v4/classic/iso.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ZodISODuration = exports2.ZodISOTime = exports2.ZodISODate = exports2.ZodISODateTime = void 0;
    exports2.datetime = datetime;
    exports2.date = date;
    exports2.time = time;
    exports2.duration = duration;
    var core = __importStar(require_core2());
    var schemas = __importStar(require_schemas2());
    exports2.ZodISODateTime = core.$constructor("ZodISODateTime", (inst, def) => {
      core.$ZodISODateTime.init(inst, def);
      schemas.ZodStringFormat.init(inst, def);
    });
    function datetime(params) {
      return core._isoDateTime(exports2.ZodISODateTime, params);
    }
    exports2.ZodISODate = core.$constructor("ZodISODate", (inst, def) => {
      core.$ZodISODate.init(inst, def);
      schemas.ZodStringFormat.init(inst, def);
    });
    function date(params) {
      return core._isoDate(exports2.ZodISODate, params);
    }
    exports2.ZodISOTime = core.$constructor("ZodISOTime", (inst, def) => {
      core.$ZodISOTime.init(inst, def);
      schemas.ZodStringFormat.init(inst, def);
    });
    function time(params) {
      return core._isoTime(exports2.ZodISOTime, params);
    }
    exports2.ZodISODuration = core.$constructor("ZodISODuration", (inst, def) => {
      core.$ZodISODuration.init(inst, def);
      schemas.ZodStringFormat.init(inst, def);
    });
    function duration(params) {
      return core._isoDuration(exports2.ZodISODuration, params);
    }
  }
});

// node_modules/zod/v4/classic/errors.cjs
var require_errors3 = __commonJS({
  "node_modules/zod/v4/classic/errors.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ZodRealError = exports2.ZodError = void 0;
    var core = __importStar(require_core2());
    var index_js_1 = require_core2();
    var util = __importStar(require_util());
    var initializer = (inst, issues) => {
      index_js_1.$ZodError.init(inst, issues);
      inst.name = "ZodError";
      Object.defineProperties(inst, {
        format: {
          value: (mapper) => core.formatError(inst, mapper)
          // enumerable: false,
        },
        flatten: {
          value: (mapper) => core.flattenError(inst, mapper)
          // enumerable: false,
        },
        addIssue: {
          value: (issue) => {
            inst.issues.push(issue);
            inst.message = JSON.stringify(inst.issues, util.jsonStringifyReplacer, 2);
          }
          // enumerable: false,
        },
        addIssues: {
          value: (issues2) => {
            inst.issues.push(...issues2);
            inst.message = JSON.stringify(inst.issues, util.jsonStringifyReplacer, 2);
          }
          // enumerable: false,
        },
        isEmpty: {
          get() {
            return inst.issues.length === 0;
          }
          // enumerable: false,
        }
      });
    };
    exports2.ZodError = core.$constructor("ZodError", initializer);
    exports2.ZodRealError = core.$constructor("ZodError", initializer, {
      Parent: Error
    });
  }
});

// node_modules/zod/v4/classic/parse.cjs
var require_parse2 = __commonJS({
  "node_modules/zod/v4/classic/parse.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.safeDecodeAsync = exports2.safeEncodeAsync = exports2.safeDecode = exports2.safeEncode = exports2.decodeAsync = exports2.encodeAsync = exports2.decode = exports2.encode = exports2.safeParseAsync = exports2.safeParse = exports2.parseAsync = exports2.parse = void 0;
    var core = __importStar(require_core2());
    var errors_js_1 = require_errors3();
    exports2.parse = core._parse(errors_js_1.ZodRealError);
    exports2.parseAsync = core._parseAsync(errors_js_1.ZodRealError);
    exports2.safeParse = core._safeParse(errors_js_1.ZodRealError);
    exports2.safeParseAsync = core._safeParseAsync(errors_js_1.ZodRealError);
    exports2.encode = core._encode(errors_js_1.ZodRealError);
    exports2.decode = core._decode(errors_js_1.ZodRealError);
    exports2.encodeAsync = core._encodeAsync(errors_js_1.ZodRealError);
    exports2.decodeAsync = core._decodeAsync(errors_js_1.ZodRealError);
    exports2.safeEncode = core._safeEncode(errors_js_1.ZodRealError);
    exports2.safeDecode = core._safeDecode(errors_js_1.ZodRealError);
    exports2.safeEncodeAsync = core._safeEncodeAsync(errors_js_1.ZodRealError);
    exports2.safeDecodeAsync = core._safeDecodeAsync(errors_js_1.ZodRealError);
  }
});

// node_modules/zod/v4/classic/schemas.cjs
var require_schemas2 = __commonJS({
  "node_modules/zod/v4/classic/schemas.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ZodLiteral = exports2.ZodEnum = exports2.ZodSet = exports2.ZodMap = exports2.ZodRecord = exports2.ZodTuple = exports2.ZodIntersection = exports2.ZodDiscriminatedUnion = exports2.ZodXor = exports2.ZodUnion = exports2.ZodObject = exports2.ZodArray = exports2.ZodDate = exports2.ZodVoid = exports2.ZodNever = exports2.ZodUnknown = exports2.ZodAny = exports2.ZodNull = exports2.ZodUndefined = exports2.ZodSymbol = exports2.ZodBigIntFormat = exports2.ZodBigInt = exports2.ZodBoolean = exports2.ZodNumberFormat = exports2.ZodNumber = exports2.ZodCustomStringFormat = exports2.ZodJWT = exports2.ZodE164 = exports2.ZodBase64URL = exports2.ZodBase64 = exports2.ZodCIDRv6 = exports2.ZodCIDRv4 = exports2.ZodIPv6 = exports2.ZodMAC = exports2.ZodIPv4 = exports2.ZodKSUID = exports2.ZodXID = exports2.ZodULID = exports2.ZodCUID2 = exports2.ZodCUID = exports2.ZodNanoID = exports2.ZodEmoji = exports2.ZodURL = exports2.ZodUUID = exports2.ZodGUID = exports2.ZodEmail = exports2.ZodStringFormat = exports2.ZodString = exports2._ZodString = exports2.ZodType = void 0;
    exports2.stringbool = exports2.meta = exports2.describe = exports2.ZodCustom = exports2.ZodFunction = exports2.ZodPromise = exports2.ZodLazy = exports2.ZodTemplateLiteral = exports2.ZodReadonly = exports2.ZodPreprocess = exports2.ZodCodec = exports2.ZodPipe = exports2.ZodNaN = exports2.ZodCatch = exports2.ZodSuccess = exports2.ZodNonOptional = exports2.ZodPrefault = exports2.ZodDefault = exports2.ZodNullable = exports2.ZodExactOptional = exports2.ZodOptional = exports2.ZodTransform = exports2.ZodFile = void 0;
    exports2.string = string;
    exports2.email = email;
    exports2.guid = guid;
    exports2.uuid = uuid;
    exports2.uuidv4 = uuidv4;
    exports2.uuidv6 = uuidv6;
    exports2.uuidv7 = uuidv7;
    exports2.url = url;
    exports2.httpUrl = httpUrl;
    exports2.emoji = emoji;
    exports2.nanoid = nanoid;
    exports2.cuid = cuid;
    exports2.cuid2 = cuid2;
    exports2.ulid = ulid;
    exports2.xid = xid;
    exports2.ksuid = ksuid;
    exports2.ipv4 = ipv4;
    exports2.mac = mac;
    exports2.ipv6 = ipv6;
    exports2.cidrv4 = cidrv4;
    exports2.cidrv6 = cidrv6;
    exports2.base64 = base64;
    exports2.base64url = base64url;
    exports2.e164 = e164;
    exports2.jwt = jwt;
    exports2.stringFormat = stringFormat;
    exports2.hostname = hostname;
    exports2.hex = hex;
    exports2.hash = hash;
    exports2.number = number;
    exports2.int = int;
    exports2.float32 = float32;
    exports2.float64 = float64;
    exports2.int32 = int32;
    exports2.uint32 = uint32;
    exports2.boolean = boolean;
    exports2.bigint = bigint;
    exports2.int64 = int64;
    exports2.uint64 = uint64;
    exports2.symbol = symbol;
    exports2.undefined = _undefined;
    exports2.null = _null;
    exports2.any = any;
    exports2.unknown = unknown;
    exports2.never = never;
    exports2.void = _void;
    exports2.date = date;
    exports2.array = array;
    exports2.keyof = keyof;
    exports2.object = object;
    exports2.strictObject = strictObject;
    exports2.looseObject = looseObject;
    exports2.union = union;
    exports2.xor = xor;
    exports2.discriminatedUnion = discriminatedUnion;
    exports2.intersection = intersection;
    exports2.tuple = tuple;
    exports2.record = record;
    exports2.partialRecord = partialRecord;
    exports2.looseRecord = looseRecord;
    exports2.map = map;
    exports2.set = set;
    exports2.enum = _enum;
    exports2.nativeEnum = nativeEnum;
    exports2.literal = literal;
    exports2.file = file;
    exports2.transform = transform;
    exports2.optional = optional;
    exports2.exactOptional = exactOptional;
    exports2.nullable = nullable;
    exports2.nullish = nullish;
    exports2._default = _default;
    exports2.prefault = prefault;
    exports2.nonoptional = nonoptional;
    exports2.success = success;
    exports2.catch = _catch;
    exports2.nan = nan;
    exports2.pipe = pipe;
    exports2.codec = codec;
    exports2.invertCodec = invertCodec;
    exports2.readonly = readonly;
    exports2.templateLiteral = templateLiteral;
    exports2.lazy = lazy;
    exports2.promise = promise;
    exports2._function = _function;
    exports2.function = _function;
    exports2._function = _function;
    exports2.function = _function;
    exports2.check = check;
    exports2.custom = custom;
    exports2.refine = refine;
    exports2.superRefine = superRefine;
    exports2.instanceof = _instanceof;
    exports2.json = json;
    exports2.preprocess = preprocess;
    var core = __importStar(require_core2());
    var index_js_1 = require_core2();
    var processors = __importStar(require_json_schema_processors());
    var to_json_schema_js_1 = require_to_json_schema();
    var checks = __importStar(require_checks2());
    var iso = __importStar(require_iso());
    var parse = __importStar(require_parse2());
    var _installedGroups = /* @__PURE__ */ new WeakMap();
    function _installLazyMethods(inst, group, methods) {
      const proto = Object.getPrototypeOf(inst);
      let installed = _installedGroups.get(proto);
      if (!installed) {
        installed = /* @__PURE__ */ new Set();
        _installedGroups.set(proto, installed);
      }
      if (installed.has(group))
        return;
      installed.add(group);
      for (const key in methods) {
        const fn = methods[key];
        Object.defineProperty(proto, key, {
          configurable: true,
          enumerable: false,
          get() {
            const bound = fn.bind(this);
            Object.defineProperty(this, key, {
              configurable: true,
              writable: true,
              enumerable: true,
              value: bound
            });
            return bound;
          },
          set(v3) {
            Object.defineProperty(this, key, {
              configurable: true,
              writable: true,
              enumerable: true,
              value: v3
            });
          }
        });
      }
    }
    exports2.ZodType = core.$constructor("ZodType", (inst, def) => {
      core.$ZodType.init(inst, def);
      Object.assign(inst["~standard"], {
        jsonSchema: {
          input: (0, to_json_schema_js_1.createStandardJSONSchemaMethod)(inst, "input"),
          output: (0, to_json_schema_js_1.createStandardJSONSchemaMethod)(inst, "output")
        }
      });
      inst.toJSONSchema = (0, to_json_schema_js_1.createToJSONSchemaMethod)(inst, {});
      inst.def = def;
      inst.type = def.type;
      Object.defineProperty(inst, "_def", { value: def });
      inst.parse = (data, params) => parse.parse(inst, data, params, { callee: inst.parse });
      inst.safeParse = (data, params) => parse.safeParse(inst, data, params);
      inst.parseAsync = async (data, params) => parse.parseAsync(inst, data, params, { callee: inst.parseAsync });
      inst.safeParseAsync = async (data, params) => parse.safeParseAsync(inst, data, params);
      inst.spa = inst.safeParseAsync;
      inst.encode = (data, params) => parse.encode(inst, data, params);
      inst.decode = (data, params) => parse.decode(inst, data, params);
      inst.encodeAsync = async (data, params) => parse.encodeAsync(inst, data, params);
      inst.decodeAsync = async (data, params) => parse.decodeAsync(inst, data, params);
      inst.safeEncode = (data, params) => parse.safeEncode(inst, data, params);
      inst.safeDecode = (data, params) => parse.safeDecode(inst, data, params);
      inst.safeEncodeAsync = async (data, params) => parse.safeEncodeAsync(inst, data, params);
      inst.safeDecodeAsync = async (data, params) => parse.safeDecodeAsync(inst, data, params);
      _installLazyMethods(inst, "ZodType", {
        check(...chks) {
          const def2 = this.def;
          return this.clone(index_js_1.util.mergeDefs(def2, {
            checks: [
              ...def2.checks ?? [],
              ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
            ]
          }), { parent: true });
        },
        with(...chks) {
          return this.check(...chks);
        },
        clone(def2, params) {
          return core.clone(this, def2, params);
        },
        brand() {
          return this;
        },
        register(reg, meta) {
          reg.add(this, meta);
          return this;
        },
        refine(check2, params) {
          return this.check(refine(check2, params));
        },
        superRefine(refinement, params) {
          return this.check(superRefine(refinement, params));
        },
        overwrite(fn) {
          return this.check(checks.overwrite(fn));
        },
        optional() {
          return optional(this);
        },
        exactOptional() {
          return exactOptional(this);
        },
        nullable() {
          return nullable(this);
        },
        nullish() {
          return optional(nullable(this));
        },
        nonoptional(params) {
          return nonoptional(this, params);
        },
        array() {
          return array(this);
        },
        or(arg) {
          return union([this, arg]);
        },
        and(arg) {
          return intersection(this, arg);
        },
        transform(tx) {
          return pipe(this, transform(tx));
        },
        default(d) {
          return _default(this, d);
        },
        prefault(d) {
          return prefault(this, d);
        },
        catch(params) {
          return _catch(this, params);
        },
        pipe(target) {
          return pipe(this, target);
        },
        readonly() {
          return readonly(this);
        },
        describe(description) {
          const cl = this.clone();
          core.globalRegistry.add(cl, { description });
          return cl;
        },
        meta(...args) {
          if (args.length === 0)
            return core.globalRegistry.get(this);
          const cl = this.clone();
          core.globalRegistry.add(cl, args[0]);
          return cl;
        },
        isOptional() {
          return this.safeParse(void 0).success;
        },
        isNullable() {
          return this.safeParse(null).success;
        },
        apply(fn) {
          return fn(this);
        }
      });
      Object.defineProperty(inst, "description", {
        get() {
          return core.globalRegistry.get(inst)?.description;
        },
        configurable: true
      });
      return inst;
    });
    exports2._ZodString = core.$constructor("_ZodString", (inst, def) => {
      core.$ZodString.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.stringProcessor(inst, ctx, json2, params);
      const bag = inst._zod.bag;
      inst.format = bag.format ?? null;
      inst.minLength = bag.minimum ?? null;
      inst.maxLength = bag.maximum ?? null;
      _installLazyMethods(inst, "_ZodString", {
        regex(...args) {
          return this.check(checks.regex(...args));
        },
        includes(...args) {
          return this.check(checks.includes(...args));
        },
        startsWith(...args) {
          return this.check(checks.startsWith(...args));
        },
        endsWith(...args) {
          return this.check(checks.endsWith(...args));
        },
        min(...args) {
          return this.check(checks.minLength(...args));
        },
        max(...args) {
          return this.check(checks.maxLength(...args));
        },
        length(...args) {
          return this.check(checks.length(...args));
        },
        nonempty(...args) {
          return this.check(checks.minLength(1, ...args));
        },
        lowercase(params) {
          return this.check(checks.lowercase(params));
        },
        uppercase(params) {
          return this.check(checks.uppercase(params));
        },
        trim() {
          return this.check(checks.trim());
        },
        normalize(...args) {
          return this.check(checks.normalize(...args));
        },
        toLowerCase() {
          return this.check(checks.toLowerCase());
        },
        toUpperCase() {
          return this.check(checks.toUpperCase());
        },
        slugify() {
          return this.check(checks.slugify());
        }
      });
    });
    exports2.ZodString = core.$constructor("ZodString", (inst, def) => {
      core.$ZodString.init(inst, def);
      exports2._ZodString.init(inst, def);
      inst.email = (params) => inst.check(core._email(exports2.ZodEmail, params));
      inst.url = (params) => inst.check(core._url(exports2.ZodURL, params));
      inst.jwt = (params) => inst.check(core._jwt(exports2.ZodJWT, params));
      inst.emoji = (params) => inst.check(core._emoji(exports2.ZodEmoji, params));
      inst.guid = (params) => inst.check(core._guid(exports2.ZodGUID, params));
      inst.uuid = (params) => inst.check(core._uuid(exports2.ZodUUID, params));
      inst.uuidv4 = (params) => inst.check(core._uuidv4(exports2.ZodUUID, params));
      inst.uuidv6 = (params) => inst.check(core._uuidv6(exports2.ZodUUID, params));
      inst.uuidv7 = (params) => inst.check(core._uuidv7(exports2.ZodUUID, params));
      inst.nanoid = (params) => inst.check(core._nanoid(exports2.ZodNanoID, params));
      inst.guid = (params) => inst.check(core._guid(exports2.ZodGUID, params));
      inst.cuid = (params) => inst.check(core._cuid(exports2.ZodCUID, params));
      inst.cuid2 = (params) => inst.check(core._cuid2(exports2.ZodCUID2, params));
      inst.ulid = (params) => inst.check(core._ulid(exports2.ZodULID, params));
      inst.base64 = (params) => inst.check(core._base64(exports2.ZodBase64, params));
      inst.base64url = (params) => inst.check(core._base64url(exports2.ZodBase64URL, params));
      inst.xid = (params) => inst.check(core._xid(exports2.ZodXID, params));
      inst.ksuid = (params) => inst.check(core._ksuid(exports2.ZodKSUID, params));
      inst.ipv4 = (params) => inst.check(core._ipv4(exports2.ZodIPv4, params));
      inst.ipv6 = (params) => inst.check(core._ipv6(exports2.ZodIPv6, params));
      inst.cidrv4 = (params) => inst.check(core._cidrv4(exports2.ZodCIDRv4, params));
      inst.cidrv6 = (params) => inst.check(core._cidrv6(exports2.ZodCIDRv6, params));
      inst.e164 = (params) => inst.check(core._e164(exports2.ZodE164, params));
      inst.datetime = (params) => inst.check(iso.datetime(params));
      inst.date = (params) => inst.check(iso.date(params));
      inst.time = (params) => inst.check(iso.time(params));
      inst.duration = (params) => inst.check(iso.duration(params));
    });
    function string(params) {
      return core._string(exports2.ZodString, params);
    }
    exports2.ZodStringFormat = core.$constructor("ZodStringFormat", (inst, def) => {
      core.$ZodStringFormat.init(inst, def);
      exports2._ZodString.init(inst, def);
    });
    exports2.ZodEmail = core.$constructor("ZodEmail", (inst, def) => {
      core.$ZodEmail.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function email(params) {
      return core._email(exports2.ZodEmail, params);
    }
    exports2.ZodGUID = core.$constructor("ZodGUID", (inst, def) => {
      core.$ZodGUID.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function guid(params) {
      return core._guid(exports2.ZodGUID, params);
    }
    exports2.ZodUUID = core.$constructor("ZodUUID", (inst, def) => {
      core.$ZodUUID.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function uuid(params) {
      return core._uuid(exports2.ZodUUID, params);
    }
    function uuidv4(params) {
      return core._uuidv4(exports2.ZodUUID, params);
    }
    function uuidv6(params) {
      return core._uuidv6(exports2.ZodUUID, params);
    }
    function uuidv7(params) {
      return core._uuidv7(exports2.ZodUUID, params);
    }
    exports2.ZodURL = core.$constructor("ZodURL", (inst, def) => {
      core.$ZodURL.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function url(params) {
      return core._url(exports2.ZodURL, params);
    }
    function httpUrl(params) {
      return core._url(exports2.ZodURL, {
        protocol: core.regexes.httpProtocol,
        hostname: core.regexes.domain,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodEmoji = core.$constructor("ZodEmoji", (inst, def) => {
      core.$ZodEmoji.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function emoji(params) {
      return core._emoji(exports2.ZodEmoji, params);
    }
    exports2.ZodNanoID = core.$constructor("ZodNanoID", (inst, def) => {
      core.$ZodNanoID.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function nanoid(params) {
      return core._nanoid(exports2.ZodNanoID, params);
    }
    exports2.ZodCUID = core.$constructor("ZodCUID", (inst, def) => {
      core.$ZodCUID.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function cuid(params) {
      return core._cuid(exports2.ZodCUID, params);
    }
    exports2.ZodCUID2 = core.$constructor("ZodCUID2", (inst, def) => {
      core.$ZodCUID2.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function cuid2(params) {
      return core._cuid2(exports2.ZodCUID2, params);
    }
    exports2.ZodULID = core.$constructor("ZodULID", (inst, def) => {
      core.$ZodULID.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function ulid(params) {
      return core._ulid(exports2.ZodULID, params);
    }
    exports2.ZodXID = core.$constructor("ZodXID", (inst, def) => {
      core.$ZodXID.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function xid(params) {
      return core._xid(exports2.ZodXID, params);
    }
    exports2.ZodKSUID = core.$constructor("ZodKSUID", (inst, def) => {
      core.$ZodKSUID.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function ksuid(params) {
      return core._ksuid(exports2.ZodKSUID, params);
    }
    exports2.ZodIPv4 = core.$constructor("ZodIPv4", (inst, def) => {
      core.$ZodIPv4.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function ipv4(params) {
      return core._ipv4(exports2.ZodIPv4, params);
    }
    exports2.ZodMAC = core.$constructor("ZodMAC", (inst, def) => {
      core.$ZodMAC.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function mac(params) {
      return core._mac(exports2.ZodMAC, params);
    }
    exports2.ZodIPv6 = core.$constructor("ZodIPv6", (inst, def) => {
      core.$ZodIPv6.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function ipv6(params) {
      return core._ipv6(exports2.ZodIPv6, params);
    }
    exports2.ZodCIDRv4 = core.$constructor("ZodCIDRv4", (inst, def) => {
      core.$ZodCIDRv4.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function cidrv4(params) {
      return core._cidrv4(exports2.ZodCIDRv4, params);
    }
    exports2.ZodCIDRv6 = core.$constructor("ZodCIDRv6", (inst, def) => {
      core.$ZodCIDRv6.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function cidrv6(params) {
      return core._cidrv6(exports2.ZodCIDRv6, params);
    }
    exports2.ZodBase64 = core.$constructor("ZodBase64", (inst, def) => {
      core.$ZodBase64.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function base64(params) {
      return core._base64(exports2.ZodBase64, params);
    }
    exports2.ZodBase64URL = core.$constructor("ZodBase64URL", (inst, def) => {
      core.$ZodBase64URL.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function base64url(params) {
      return core._base64url(exports2.ZodBase64URL, params);
    }
    exports2.ZodE164 = core.$constructor("ZodE164", (inst, def) => {
      core.$ZodE164.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function e164(params) {
      return core._e164(exports2.ZodE164, params);
    }
    exports2.ZodJWT = core.$constructor("ZodJWT", (inst, def) => {
      core.$ZodJWT.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function jwt(params) {
      return core._jwt(exports2.ZodJWT, params);
    }
    exports2.ZodCustomStringFormat = core.$constructor("ZodCustomStringFormat", (inst, def) => {
      core.$ZodCustomStringFormat.init(inst, def);
      exports2.ZodStringFormat.init(inst, def);
    });
    function stringFormat(format, fnOrRegex, _params = {}) {
      return core._stringFormat(exports2.ZodCustomStringFormat, format, fnOrRegex, _params);
    }
    function hostname(_params) {
      return core._stringFormat(exports2.ZodCustomStringFormat, "hostname", core.regexes.hostname, _params);
    }
    function hex(_params) {
      return core._stringFormat(exports2.ZodCustomStringFormat, "hex", core.regexes.hex, _params);
    }
    function hash(alg, params) {
      const enc = params?.enc ?? "hex";
      const format = `${alg}_${enc}`;
      const regex = core.regexes[format];
      if (!regex)
        throw new Error(`Unrecognized hash format: ${format}`);
      return core._stringFormat(exports2.ZodCustomStringFormat, format, regex, params);
    }
    exports2.ZodNumber = core.$constructor("ZodNumber", (inst, def) => {
      core.$ZodNumber.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.numberProcessor(inst, ctx, json2, params);
      _installLazyMethods(inst, "ZodNumber", {
        gt(value, params) {
          return this.check(checks.gt(value, params));
        },
        gte(value, params) {
          return this.check(checks.gte(value, params));
        },
        min(value, params) {
          return this.check(checks.gte(value, params));
        },
        lt(value, params) {
          return this.check(checks.lt(value, params));
        },
        lte(value, params) {
          return this.check(checks.lte(value, params));
        },
        max(value, params) {
          return this.check(checks.lte(value, params));
        },
        int(params) {
          return this.check(int(params));
        },
        safe(params) {
          return this.check(int(params));
        },
        positive(params) {
          return this.check(checks.gt(0, params));
        },
        nonnegative(params) {
          return this.check(checks.gte(0, params));
        },
        negative(params) {
          return this.check(checks.lt(0, params));
        },
        nonpositive(params) {
          return this.check(checks.lte(0, params));
        },
        multipleOf(value, params) {
          return this.check(checks.multipleOf(value, params));
        },
        step(value, params) {
          return this.check(checks.multipleOf(value, params));
        },
        finite() {
          return this;
        }
      });
      const bag = inst._zod.bag;
      inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
      inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
      inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
      inst.isFinite = true;
      inst.format = bag.format ?? null;
    });
    function number(params) {
      return core._number(exports2.ZodNumber, params);
    }
    exports2.ZodNumberFormat = core.$constructor("ZodNumberFormat", (inst, def) => {
      core.$ZodNumberFormat.init(inst, def);
      exports2.ZodNumber.init(inst, def);
    });
    function int(params) {
      return core._int(exports2.ZodNumberFormat, params);
    }
    function float32(params) {
      return core._float32(exports2.ZodNumberFormat, params);
    }
    function float64(params) {
      return core._float64(exports2.ZodNumberFormat, params);
    }
    function int32(params) {
      return core._int32(exports2.ZodNumberFormat, params);
    }
    function uint32(params) {
      return core._uint32(exports2.ZodNumberFormat, params);
    }
    exports2.ZodBoolean = core.$constructor("ZodBoolean", (inst, def) => {
      core.$ZodBoolean.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.booleanProcessor(inst, ctx, json2, params);
    });
    function boolean(params) {
      return core._boolean(exports2.ZodBoolean, params);
    }
    exports2.ZodBigInt = core.$constructor("ZodBigInt", (inst, def) => {
      core.$ZodBigInt.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.bigintProcessor(inst, ctx, json2, params);
      inst.gte = (value, params) => inst.check(checks.gte(value, params));
      inst.min = (value, params) => inst.check(checks.gte(value, params));
      inst.gt = (value, params) => inst.check(checks.gt(value, params));
      inst.gte = (value, params) => inst.check(checks.gte(value, params));
      inst.min = (value, params) => inst.check(checks.gte(value, params));
      inst.lt = (value, params) => inst.check(checks.lt(value, params));
      inst.lte = (value, params) => inst.check(checks.lte(value, params));
      inst.max = (value, params) => inst.check(checks.lte(value, params));
      inst.positive = (params) => inst.check(checks.gt(BigInt(0), params));
      inst.negative = (params) => inst.check(checks.lt(BigInt(0), params));
      inst.nonpositive = (params) => inst.check(checks.lte(BigInt(0), params));
      inst.nonnegative = (params) => inst.check(checks.gte(BigInt(0), params));
      inst.multipleOf = (value, params) => inst.check(checks.multipleOf(value, params));
      const bag = inst._zod.bag;
      inst.minValue = bag.minimum ?? null;
      inst.maxValue = bag.maximum ?? null;
      inst.format = bag.format ?? null;
    });
    function bigint(params) {
      return core._bigint(exports2.ZodBigInt, params);
    }
    exports2.ZodBigIntFormat = core.$constructor("ZodBigIntFormat", (inst, def) => {
      core.$ZodBigIntFormat.init(inst, def);
      exports2.ZodBigInt.init(inst, def);
    });
    function int64(params) {
      return core._int64(exports2.ZodBigIntFormat, params);
    }
    function uint64(params) {
      return core._uint64(exports2.ZodBigIntFormat, params);
    }
    exports2.ZodSymbol = core.$constructor("ZodSymbol", (inst, def) => {
      core.$ZodSymbol.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.symbolProcessor(inst, ctx, json2, params);
    });
    function symbol(params) {
      return core._symbol(exports2.ZodSymbol, params);
    }
    exports2.ZodUndefined = core.$constructor("ZodUndefined", (inst, def) => {
      core.$ZodUndefined.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.undefinedProcessor(inst, ctx, json2, params);
    });
    function _undefined(params) {
      return core._undefined(exports2.ZodUndefined, params);
    }
    exports2.ZodNull = core.$constructor("ZodNull", (inst, def) => {
      core.$ZodNull.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.nullProcessor(inst, ctx, json2, params);
    });
    function _null(params) {
      return core._null(exports2.ZodNull, params);
    }
    exports2.ZodAny = core.$constructor("ZodAny", (inst, def) => {
      core.$ZodAny.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.anyProcessor(inst, ctx, json2, params);
    });
    function any() {
      return core._any(exports2.ZodAny);
    }
    exports2.ZodUnknown = core.$constructor("ZodUnknown", (inst, def) => {
      core.$ZodUnknown.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.unknownProcessor(inst, ctx, json2, params);
    });
    function unknown() {
      return core._unknown(exports2.ZodUnknown);
    }
    exports2.ZodNever = core.$constructor("ZodNever", (inst, def) => {
      core.$ZodNever.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.neverProcessor(inst, ctx, json2, params);
    });
    function never(params) {
      return core._never(exports2.ZodNever, params);
    }
    exports2.ZodVoid = core.$constructor("ZodVoid", (inst, def) => {
      core.$ZodVoid.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.voidProcessor(inst, ctx, json2, params);
    });
    function _void(params) {
      return core._void(exports2.ZodVoid, params);
    }
    exports2.ZodDate = core.$constructor("ZodDate", (inst, def) => {
      core.$ZodDate.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.dateProcessor(inst, ctx, json2, params);
      inst.min = (value, params) => inst.check(checks.gte(value, params));
      inst.max = (value, params) => inst.check(checks.lte(value, params));
      const c = inst._zod.bag;
      inst.minDate = c.minimum ? new Date(c.minimum) : null;
      inst.maxDate = c.maximum ? new Date(c.maximum) : null;
    });
    function date(params) {
      return core._date(exports2.ZodDate, params);
    }
    exports2.ZodArray = core.$constructor("ZodArray", (inst, def) => {
      core.$ZodArray.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.arrayProcessor(inst, ctx, json2, params);
      inst.element = def.element;
      _installLazyMethods(inst, "ZodArray", {
        min(n, params) {
          return this.check(checks.minLength(n, params));
        },
        nonempty(params) {
          return this.check(checks.minLength(1, params));
        },
        max(n, params) {
          return this.check(checks.maxLength(n, params));
        },
        length(n, params) {
          return this.check(checks.length(n, params));
        },
        unwrap() {
          return this.element;
        }
      });
    });
    function array(element, params) {
      return core._array(exports2.ZodArray, element, params);
    }
    function keyof(schema) {
      const shape = schema._zod.def.shape;
      return _enum(Object.keys(shape));
    }
    exports2.ZodObject = core.$constructor("ZodObject", (inst, def) => {
      core.$ZodObjectJIT.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.objectProcessor(inst, ctx, json2, params);
      index_js_1.util.defineLazy(inst, "shape", () => {
        return def.shape;
      });
      _installLazyMethods(inst, "ZodObject", {
        keyof() {
          return _enum(Object.keys(this._zod.def.shape));
        },
        catchall(catchall) {
          return this.clone({ ...this._zod.def, catchall });
        },
        passthrough() {
          return this.clone({ ...this._zod.def, catchall: unknown() });
        },
        loose() {
          return this.clone({ ...this._zod.def, catchall: unknown() });
        },
        strict() {
          return this.clone({ ...this._zod.def, catchall: never() });
        },
        strip() {
          return this.clone({ ...this._zod.def, catchall: void 0 });
        },
        extend(incoming) {
          return index_js_1.util.extend(this, incoming);
        },
        safeExtend(incoming) {
          return index_js_1.util.safeExtend(this, incoming);
        },
        merge(other) {
          return index_js_1.util.merge(this, other);
        },
        pick(mask) {
          return index_js_1.util.pick(this, mask);
        },
        omit(mask) {
          return index_js_1.util.omit(this, mask);
        },
        partial(...args) {
          return index_js_1.util.partial(exports2.ZodOptional, this, args[0]);
        },
        required(...args) {
          return index_js_1.util.required(exports2.ZodNonOptional, this, args[0]);
        }
      });
    });
    function object(shape, params) {
      const def = {
        type: "object",
        shape: shape ?? {},
        ...index_js_1.util.normalizeParams(params)
      };
      return new exports2.ZodObject(def);
    }
    function strictObject(shape, params) {
      return new exports2.ZodObject({
        type: "object",
        shape,
        catchall: never(),
        ...index_js_1.util.normalizeParams(params)
      });
    }
    function looseObject(shape, params) {
      return new exports2.ZodObject({
        type: "object",
        shape,
        catchall: unknown(),
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodUnion = core.$constructor("ZodUnion", (inst, def) => {
      core.$ZodUnion.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.unionProcessor(inst, ctx, json2, params);
      inst.options = def.options;
    });
    function union(options, params) {
      return new exports2.ZodUnion({
        type: "union",
        options,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodXor = core.$constructor("ZodXor", (inst, def) => {
      exports2.ZodUnion.init(inst, def);
      core.$ZodXor.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.unionProcessor(inst, ctx, json2, params);
      inst.options = def.options;
    });
    function xor(options, params) {
      return new exports2.ZodXor({
        type: "union",
        options,
        inclusive: false,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodDiscriminatedUnion = core.$constructor("ZodDiscriminatedUnion", (inst, def) => {
      exports2.ZodUnion.init(inst, def);
      core.$ZodDiscriminatedUnion.init(inst, def);
    });
    function discriminatedUnion(discriminator, options, params) {
      return new exports2.ZodDiscriminatedUnion({
        type: "union",
        options,
        discriminator,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodIntersection = core.$constructor("ZodIntersection", (inst, def) => {
      core.$ZodIntersection.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.intersectionProcessor(inst, ctx, json2, params);
    });
    function intersection(left, right) {
      return new exports2.ZodIntersection({
        type: "intersection",
        left,
        right
      });
    }
    exports2.ZodTuple = core.$constructor("ZodTuple", (inst, def) => {
      core.$ZodTuple.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.tupleProcessor(inst, ctx, json2, params);
      inst.rest = (rest) => inst.clone({
        ...inst._zod.def,
        rest
      });
    });
    function tuple(items, _paramsOrRest, _params) {
      const hasRest = _paramsOrRest instanceof core.$ZodType;
      const params = hasRest ? _params : _paramsOrRest;
      const rest = hasRest ? _paramsOrRest : null;
      return new exports2.ZodTuple({
        type: "tuple",
        items,
        rest,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodRecord = core.$constructor("ZodRecord", (inst, def) => {
      core.$ZodRecord.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.recordProcessor(inst, ctx, json2, params);
      inst.keyType = def.keyType;
      inst.valueType = def.valueType;
    });
    function record(keyType, valueType, params) {
      if (!valueType || !valueType._zod) {
        return new exports2.ZodRecord({
          type: "record",
          keyType: string(),
          valueType: keyType,
          ...index_js_1.util.normalizeParams(valueType)
        });
      }
      return new exports2.ZodRecord({
        type: "record",
        keyType,
        valueType,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    function partialRecord(keyType, valueType, params) {
      const k = core.clone(keyType);
      k._zod.values = void 0;
      return new exports2.ZodRecord({
        type: "record",
        keyType: k,
        valueType,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    function looseRecord(keyType, valueType, params) {
      return new exports2.ZodRecord({
        type: "record",
        keyType,
        valueType,
        mode: "loose",
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodMap = core.$constructor("ZodMap", (inst, def) => {
      core.$ZodMap.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.mapProcessor(inst, ctx, json2, params);
      inst.keyType = def.keyType;
      inst.valueType = def.valueType;
      inst.min = (...args) => inst.check(core._minSize(...args));
      inst.nonempty = (params) => inst.check(core._minSize(1, params));
      inst.max = (...args) => inst.check(core._maxSize(...args));
      inst.size = (...args) => inst.check(core._size(...args));
    });
    function map(keyType, valueType, params) {
      return new exports2.ZodMap({
        type: "map",
        keyType,
        valueType,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodSet = core.$constructor("ZodSet", (inst, def) => {
      core.$ZodSet.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.setProcessor(inst, ctx, json2, params);
      inst.min = (...args) => inst.check(core._minSize(...args));
      inst.nonempty = (params) => inst.check(core._minSize(1, params));
      inst.max = (...args) => inst.check(core._maxSize(...args));
      inst.size = (...args) => inst.check(core._size(...args));
    });
    function set(valueType, params) {
      return new exports2.ZodSet({
        type: "set",
        valueType,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodEnum = core.$constructor("ZodEnum", (inst, def) => {
      core.$ZodEnum.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.enumProcessor(inst, ctx, json2, params);
      inst.enum = def.entries;
      inst.options = Object.values(def.entries);
      const keys = new Set(Object.keys(def.entries));
      inst.extract = (values, params) => {
        const newEntries = {};
        for (const value of values) {
          if (keys.has(value)) {
            newEntries[value] = def.entries[value];
          } else
            throw new Error(`Key ${value} not found in enum`);
        }
        return new exports2.ZodEnum({
          ...def,
          checks: [],
          ...index_js_1.util.normalizeParams(params),
          entries: newEntries
        });
      };
      inst.exclude = (values, params) => {
        const newEntries = { ...def.entries };
        for (const value of values) {
          if (keys.has(value)) {
            delete newEntries[value];
          } else
            throw new Error(`Key ${value} not found in enum`);
        }
        return new exports2.ZodEnum({
          ...def,
          checks: [],
          ...index_js_1.util.normalizeParams(params),
          entries: newEntries
        });
      };
    });
    function _enum(values, params) {
      const entries = Array.isArray(values) ? Object.fromEntries(values.map((v3) => [v3, v3])) : values;
      return new exports2.ZodEnum({
        type: "enum",
        entries,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    function nativeEnum(entries, params) {
      return new exports2.ZodEnum({
        type: "enum",
        entries,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodLiteral = core.$constructor("ZodLiteral", (inst, def) => {
      core.$ZodLiteral.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.literalProcessor(inst, ctx, json2, params);
      inst.values = new Set(def.values);
      Object.defineProperty(inst, "value", {
        get() {
          if (def.values.length > 1) {
            throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
          }
          return def.values[0];
        }
      });
    });
    function literal(value, params) {
      return new exports2.ZodLiteral({
        type: "literal",
        values: Array.isArray(value) ? value : [value],
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodFile = core.$constructor("ZodFile", (inst, def) => {
      core.$ZodFile.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.fileProcessor(inst, ctx, json2, params);
      inst.min = (size, params) => inst.check(core._minSize(size, params));
      inst.max = (size, params) => inst.check(core._maxSize(size, params));
      inst.mime = (types, params) => inst.check(core._mime(Array.isArray(types) ? types : [types], params));
    });
    function file(params) {
      return core._file(exports2.ZodFile, params);
    }
    exports2.ZodTransform = core.$constructor("ZodTransform", (inst, def) => {
      core.$ZodTransform.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.transformProcessor(inst, ctx, json2, params);
      inst._zod.parse = (payload, _ctx) => {
        if (_ctx.direction === "backward") {
          throw new core.$ZodEncodeError(inst.constructor.name);
        }
        payload.addIssue = (issue) => {
          if (typeof issue === "string") {
            payload.issues.push(index_js_1.util.issue(issue, payload.value, def));
          } else {
            const _issue = issue;
            if (_issue.fatal)
              _issue.continue = false;
            _issue.code ?? (_issue.code = "custom");
            _issue.input ?? (_issue.input = payload.value);
            _issue.inst ?? (_issue.inst = inst);
            payload.issues.push(index_js_1.util.issue(_issue));
          }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) {
          return output.then((output2) => {
            payload.value = output2;
            payload.fallback = true;
            return payload;
          });
        }
        payload.value = output;
        payload.fallback = true;
        return payload;
      };
    });
    function transform(fn) {
      return new exports2.ZodTransform({
        type: "transform",
        transform: fn
      });
    }
    exports2.ZodOptional = core.$constructor("ZodOptional", (inst, def) => {
      core.$ZodOptional.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.optionalProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function optional(innerType) {
      return new exports2.ZodOptional({
        type: "optional",
        innerType
      });
    }
    exports2.ZodExactOptional = core.$constructor("ZodExactOptional", (inst, def) => {
      core.$ZodExactOptional.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.optionalProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function exactOptional(innerType) {
      return new exports2.ZodExactOptional({
        type: "optional",
        innerType
      });
    }
    exports2.ZodNullable = core.$constructor("ZodNullable", (inst, def) => {
      core.$ZodNullable.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.nullableProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function nullable(innerType) {
      return new exports2.ZodNullable({
        type: "nullable",
        innerType
      });
    }
    function nullish(innerType) {
      return optional(nullable(innerType));
    }
    exports2.ZodDefault = core.$constructor("ZodDefault", (inst, def) => {
      core.$ZodDefault.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.defaultProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
      inst.removeDefault = inst.unwrap;
    });
    function _default(innerType, defaultValue) {
      return new exports2.ZodDefault({
        type: "default",
        innerType,
        get defaultValue() {
          return typeof defaultValue === "function" ? defaultValue() : index_js_1.util.shallowClone(defaultValue);
        }
      });
    }
    exports2.ZodPrefault = core.$constructor("ZodPrefault", (inst, def) => {
      core.$ZodPrefault.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.prefaultProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function prefault(innerType, defaultValue) {
      return new exports2.ZodPrefault({
        type: "prefault",
        innerType,
        get defaultValue() {
          return typeof defaultValue === "function" ? defaultValue() : index_js_1.util.shallowClone(defaultValue);
        }
      });
    }
    exports2.ZodNonOptional = core.$constructor("ZodNonOptional", (inst, def) => {
      core.$ZodNonOptional.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.nonoptionalProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function nonoptional(innerType, params) {
      return new exports2.ZodNonOptional({
        type: "nonoptional",
        innerType,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodSuccess = core.$constructor("ZodSuccess", (inst, def) => {
      core.$ZodSuccess.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.successProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function success(innerType) {
      return new exports2.ZodSuccess({
        type: "success",
        innerType
      });
    }
    exports2.ZodCatch = core.$constructor("ZodCatch", (inst, def) => {
      core.$ZodCatch.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.catchProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
      inst.removeCatch = inst.unwrap;
    });
    function _catch(innerType, catchValue) {
      return new exports2.ZodCatch({
        type: "catch",
        innerType,
        catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
      });
    }
    exports2.ZodNaN = core.$constructor("ZodNaN", (inst, def) => {
      core.$ZodNaN.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.nanProcessor(inst, ctx, json2, params);
    });
    function nan(params) {
      return core._nan(exports2.ZodNaN, params);
    }
    exports2.ZodPipe = core.$constructor("ZodPipe", (inst, def) => {
      core.$ZodPipe.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.pipeProcessor(inst, ctx, json2, params);
      inst.in = def.in;
      inst.out = def.out;
    });
    function pipe(in_, out) {
      return new exports2.ZodPipe({
        type: "pipe",
        in: in_,
        out
        // ...util.normalizeParams(params),
      });
    }
    exports2.ZodCodec = core.$constructor("ZodCodec", (inst, def) => {
      exports2.ZodPipe.init(inst, def);
      core.$ZodCodec.init(inst, def);
    });
    function codec(in_, out, params) {
      return new exports2.ZodCodec({
        type: "pipe",
        in: in_,
        out,
        transform: params.decode,
        reverseTransform: params.encode
      });
    }
    function invertCodec(codec2) {
      const def = codec2._zod.def;
      return new exports2.ZodCodec({
        type: "pipe",
        in: def.out,
        out: def.in,
        transform: def.reverseTransform,
        reverseTransform: def.transform
      });
    }
    exports2.ZodPreprocess = core.$constructor("ZodPreprocess", (inst, def) => {
      exports2.ZodPipe.init(inst, def);
      core.$ZodPreprocess.init(inst, def);
    });
    exports2.ZodReadonly = core.$constructor("ZodReadonly", (inst, def) => {
      core.$ZodReadonly.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.readonlyProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function readonly(innerType) {
      return new exports2.ZodReadonly({
        type: "readonly",
        innerType
      });
    }
    exports2.ZodTemplateLiteral = core.$constructor("ZodTemplateLiteral", (inst, def) => {
      core.$ZodTemplateLiteral.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.templateLiteralProcessor(inst, ctx, json2, params);
    });
    function templateLiteral(parts, params) {
      return new exports2.ZodTemplateLiteral({
        type: "template_literal",
        parts,
        ...index_js_1.util.normalizeParams(params)
      });
    }
    exports2.ZodLazy = core.$constructor("ZodLazy", (inst, def) => {
      core.$ZodLazy.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.lazyProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.getter();
    });
    function lazy(getter) {
      return new exports2.ZodLazy({
        type: "lazy",
        getter
      });
    }
    exports2.ZodPromise = core.$constructor("ZodPromise", (inst, def) => {
      core.$ZodPromise.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.promiseProcessor(inst, ctx, json2, params);
      inst.unwrap = () => inst._zod.def.innerType;
    });
    function promise(innerType) {
      return new exports2.ZodPromise({
        type: "promise",
        innerType
      });
    }
    exports2.ZodFunction = core.$constructor("ZodFunction", (inst, def) => {
      core.$ZodFunction.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.functionProcessor(inst, ctx, json2, params);
    });
    function _function(params) {
      return new exports2.ZodFunction({
        type: "function",
        input: Array.isArray(params?.input) ? tuple(params?.input) : params?.input ?? array(unknown()),
        output: params?.output ?? unknown()
      });
    }
    exports2.ZodCustom = core.$constructor("ZodCustom", (inst, def) => {
      core.$ZodCustom.init(inst, def);
      exports2.ZodType.init(inst, def);
      inst._zod.processJSONSchema = (ctx, json2, params) => processors.customProcessor(inst, ctx, json2, params);
    });
    function check(fn) {
      const ch = new core.$ZodCheck({
        check: "custom"
        // ...util.normalizeParams(params),
      });
      ch._zod.check = fn;
      return ch;
    }
    function custom(fn, _params) {
      return core._custom(exports2.ZodCustom, fn ?? (() => true), _params);
    }
    function refine(fn, _params = {}) {
      return core._refine(exports2.ZodCustom, fn, _params);
    }
    function superRefine(fn, params) {
      return core._superRefine(fn, params);
    }
    exports2.describe = core.describe;
    exports2.meta = core.meta;
    function _instanceof(cls, params = {}) {
      const inst = new exports2.ZodCustom({
        type: "custom",
        check: "custom",
        fn: (data) => data instanceof cls,
        abort: true,
        ...index_js_1.util.normalizeParams(params)
      });
      inst._zod.bag.Class = cls;
      inst._zod.check = (payload) => {
        if (!(payload.value instanceof cls)) {
          payload.issues.push({
            code: "invalid_type",
            expected: cls.name,
            input: payload.value,
            inst,
            path: [...inst._zod.def.path ?? []]
          });
        }
      };
      return inst;
    }
    var stringbool = (...args) => core._stringbool({
      Codec: exports2.ZodCodec,
      Boolean: exports2.ZodBoolean,
      String: exports2.ZodString
    }, ...args);
    exports2.stringbool = stringbool;
    function json(params) {
      const jsonSchema = lazy(() => {
        return union([string(params), number(), boolean(), _null(), array(jsonSchema), record(string(), jsonSchema)]);
      });
      return jsonSchema;
    }
    function preprocess(fn, schema) {
      return new exports2.ZodPreprocess({
        type: "pipe",
        in: transform(fn),
        out: schema
      });
    }
  }
});

// node_modules/zod/v4/classic/compat.cjs
var require_compat = __commonJS({
  "node_modules/zod/v4/classic/compat.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ZodFirstPartyTypeKind = exports2.config = exports2.$brand = exports2.ZodIssueCode = void 0;
    exports2.setErrorMap = setErrorMap;
    exports2.getErrorMap = getErrorMap;
    var core = __importStar(require_core2());
    exports2.ZodIssueCode = {
      invalid_type: "invalid_type",
      too_big: "too_big",
      too_small: "too_small",
      invalid_format: "invalid_format",
      not_multiple_of: "not_multiple_of",
      unrecognized_keys: "unrecognized_keys",
      invalid_union: "invalid_union",
      invalid_key: "invalid_key",
      invalid_element: "invalid_element",
      invalid_value: "invalid_value",
      custom: "custom"
    };
    var index_js_1 = require_core2();
    Object.defineProperty(exports2, "$brand", { enumerable: true, get: function() {
      return index_js_1.$brand;
    } });
    Object.defineProperty(exports2, "config", { enumerable: true, get: function() {
      return index_js_1.config;
    } });
    function setErrorMap(map) {
      core.config({
        customError: map
      });
    }
    function getErrorMap() {
      return core.config().customError;
    }
    var ZodFirstPartyTypeKind;
    /* @__PURE__ */ (function(ZodFirstPartyTypeKind2) {
    })(ZodFirstPartyTypeKind || (exports2.ZodFirstPartyTypeKind = ZodFirstPartyTypeKind = {}));
  }
});

// node_modules/zod/v4/classic/from-json-schema.cjs
var require_from_json_schema = __commonJS({
  "node_modules/zod/v4/classic/from-json-schema.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromJSONSchema = fromJSONSchema;
    var registries_js_1 = require_registries();
    var _checks = __importStar(require_checks2());
    var _iso = __importStar(require_iso());
    var _schemas = __importStar(require_schemas2());
    var z2 = {
      ..._schemas,
      ..._checks,
      iso: _iso
    };
    var RECOGNIZED_KEYS = /* @__PURE__ */ new Set([
      // Schema identification
      "$schema",
      "$ref",
      "$defs",
      "definitions",
      // Core schema keywords
      "$id",
      "id",
      "$comment",
      "$anchor",
      "$vocabulary",
      "$dynamicRef",
      "$dynamicAnchor",
      // Type
      "type",
      "enum",
      "const",
      // Composition
      "anyOf",
      "oneOf",
      "allOf",
      "not",
      // Object
      "properties",
      "required",
      "additionalProperties",
      "patternProperties",
      "propertyNames",
      "minProperties",
      "maxProperties",
      // Array
      "items",
      "prefixItems",
      "additionalItems",
      "minItems",
      "maxItems",
      "uniqueItems",
      "contains",
      "minContains",
      "maxContains",
      // String
      "minLength",
      "maxLength",
      "pattern",
      "format",
      // Number
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      // Already handled metadata
      "description",
      "default",
      // Content
      "contentEncoding",
      "contentMediaType",
      "contentSchema",
      // Unsupported (error-throwing)
      "unevaluatedItems",
      "unevaluatedProperties",
      "if",
      "then",
      "else",
      "dependentSchemas",
      "dependentRequired",
      // OpenAPI
      "nullable",
      "readOnly"
    ]);
    function detectVersion(schema, defaultTarget) {
      const $schema = schema.$schema;
      if ($schema === "https://json-schema.org/draft/2020-12/schema") {
        return "draft-2020-12";
      }
      if ($schema === "http://json-schema.org/draft-07/schema#") {
        return "draft-7";
      }
      if ($schema === "http://json-schema.org/draft-04/schema#") {
        return "draft-4";
      }
      return defaultTarget ?? "draft-2020-12";
    }
    function resolveRef(ref, ctx) {
      if (!ref.startsWith("#")) {
        throw new Error("External $ref is not supported, only local refs (#/...) are allowed");
      }
      const path = ref.slice(1).split("/").filter(Boolean);
      if (path.length === 0) {
        return ctx.rootSchema;
      }
      const defsKey = ctx.version === "draft-2020-12" ? "$defs" : "definitions";
      if (path[0] === defsKey) {
        const key = path[1];
        if (!key || !ctx.defs[key]) {
          throw new Error(`Reference not found: ${ref}`);
        }
        return ctx.defs[key];
      }
      throw new Error(`Reference not found: ${ref}`);
    }
    function convertBaseSchema(schema, ctx) {
      if (schema.not !== void 0) {
        if (typeof schema.not === "object" && Object.keys(schema.not).length === 0) {
          return z2.never();
        }
        throw new Error("not is not supported in Zod (except { not: {} } for never)");
      }
      if (schema.unevaluatedItems !== void 0) {
        throw new Error("unevaluatedItems is not supported");
      }
      if (schema.unevaluatedProperties !== void 0) {
        throw new Error("unevaluatedProperties is not supported");
      }
      if (schema.if !== void 0 || schema.then !== void 0 || schema.else !== void 0) {
        throw new Error("Conditional schemas (if/then/else) are not supported");
      }
      if (schema.dependentSchemas !== void 0 || schema.dependentRequired !== void 0) {
        throw new Error("dependentSchemas and dependentRequired are not supported");
      }
      if (schema.$ref) {
        const refPath = schema.$ref;
        if (ctx.refs.has(refPath)) {
          return ctx.refs.get(refPath);
        }
        if (ctx.processing.has(refPath)) {
          return z2.lazy(() => {
            if (!ctx.refs.has(refPath)) {
              throw new Error(`Circular reference not resolved: ${refPath}`);
            }
            return ctx.refs.get(refPath);
          });
        }
        ctx.processing.add(refPath);
        const resolved = resolveRef(refPath, ctx);
        const zodSchema2 = convertSchema(resolved, ctx);
        ctx.refs.set(refPath, zodSchema2);
        ctx.processing.delete(refPath);
        return zodSchema2;
      }
      if (schema.enum !== void 0) {
        const enumValues = schema.enum;
        if (ctx.version === "openapi-3.0" && schema.nullable === true && enumValues.length === 1 && enumValues[0] === null) {
          return z2.null();
        }
        if (enumValues.length === 0) {
          return z2.never();
        }
        if (enumValues.length === 1) {
          return z2.literal(enumValues[0]);
        }
        if (enumValues.every((v3) => typeof v3 === "string")) {
          return z2.enum(enumValues);
        }
        const literalSchemas = enumValues.map((v3) => z2.literal(v3));
        if (literalSchemas.length < 2) {
          return literalSchemas[0];
        }
        return z2.union([literalSchemas[0], literalSchemas[1], ...literalSchemas.slice(2)]);
      }
      if (schema.const !== void 0) {
        return z2.literal(schema.const);
      }
      const type = schema.type;
      if (Array.isArray(type)) {
        const typeSchemas = type.map((t) => {
          const typeSchema = { ...schema, type: t };
          return convertBaseSchema(typeSchema, ctx);
        });
        if (typeSchemas.length === 0) {
          return z2.never();
        }
        if (typeSchemas.length === 1) {
          return typeSchemas[0];
        }
        return z2.union(typeSchemas);
      }
      if (!type) {
        return z2.any();
      }
      let zodSchema;
      switch (type) {
        case "string": {
          let stringSchema = z2.string();
          if (schema.format) {
            const format = schema.format;
            if (format === "email") {
              stringSchema = stringSchema.check(z2.email());
            } else if (format === "uri" || format === "uri-reference") {
              stringSchema = stringSchema.check(z2.url());
            } else if (format === "uuid" || format === "guid") {
              stringSchema = stringSchema.check(z2.uuid());
            } else if (format === "date-time") {
              stringSchema = stringSchema.check(z2.iso.datetime());
            } else if (format === "date") {
              stringSchema = stringSchema.check(z2.iso.date());
            } else if (format === "time") {
              stringSchema = stringSchema.check(z2.iso.time());
            } else if (format === "duration") {
              stringSchema = stringSchema.check(z2.iso.duration());
            } else if (format === "ipv4") {
              stringSchema = stringSchema.check(z2.ipv4());
            } else if (format === "ipv6") {
              stringSchema = stringSchema.check(z2.ipv6());
            } else if (format === "mac") {
              stringSchema = stringSchema.check(z2.mac());
            } else if (format === "cidr") {
              stringSchema = stringSchema.check(z2.cidrv4());
            } else if (format === "cidr-v6") {
              stringSchema = stringSchema.check(z2.cidrv6());
            } else if (format === "base64") {
              stringSchema = stringSchema.check(z2.base64());
            } else if (format === "base64url") {
              stringSchema = stringSchema.check(z2.base64url());
            } else if (format === "e164") {
              stringSchema = stringSchema.check(z2.e164());
            } else if (format === "jwt") {
              stringSchema = stringSchema.check(z2.jwt());
            } else if (format === "emoji") {
              stringSchema = stringSchema.check(z2.emoji());
            } else if (format === "nanoid") {
              stringSchema = stringSchema.check(z2.nanoid());
            } else if (format === "cuid") {
              stringSchema = stringSchema.check(z2.cuid());
            } else if (format === "cuid2") {
              stringSchema = stringSchema.check(z2.cuid2());
            } else if (format === "ulid") {
              stringSchema = stringSchema.check(z2.ulid());
            } else if (format === "xid") {
              stringSchema = stringSchema.check(z2.xid());
            } else if (format === "ksuid") {
              stringSchema = stringSchema.check(z2.ksuid());
            }
          }
          if (typeof schema.minLength === "number") {
            stringSchema = stringSchema.min(schema.minLength);
          }
          if (typeof schema.maxLength === "number") {
            stringSchema = stringSchema.max(schema.maxLength);
          }
          if (schema.pattern) {
            stringSchema = stringSchema.regex(new RegExp(schema.pattern));
          }
          zodSchema = stringSchema;
          break;
        }
        case "number":
        case "integer": {
          let numberSchema = type === "integer" ? z2.number().int() : z2.number();
          if (typeof schema.minimum === "number") {
            numberSchema = numberSchema.min(schema.minimum);
          }
          if (typeof schema.maximum === "number") {
            numberSchema = numberSchema.max(schema.maximum);
          }
          if (typeof schema.exclusiveMinimum === "number") {
            numberSchema = numberSchema.gt(schema.exclusiveMinimum);
          } else if (schema.exclusiveMinimum === true && typeof schema.minimum === "number") {
            numberSchema = numberSchema.gt(schema.minimum);
          }
          if (typeof schema.exclusiveMaximum === "number") {
            numberSchema = numberSchema.lt(schema.exclusiveMaximum);
          } else if (schema.exclusiveMaximum === true && typeof schema.maximum === "number") {
            numberSchema = numberSchema.lt(schema.maximum);
          }
          if (typeof schema.multipleOf === "number") {
            numberSchema = numberSchema.multipleOf(schema.multipleOf);
          }
          zodSchema = numberSchema;
          break;
        }
        case "boolean": {
          zodSchema = z2.boolean();
          break;
        }
        case "null": {
          zodSchema = z2.null();
          break;
        }
        case "object": {
          const shape = {};
          const properties = schema.properties || {};
          const requiredSet = new Set(schema.required || []);
          for (const [key, propSchema] of Object.entries(properties)) {
            const propZodSchema = convertSchema(propSchema, ctx);
            shape[key] = requiredSet.has(key) ? propZodSchema : propZodSchema.optional();
          }
          if (schema.propertyNames) {
            const keySchema = convertSchema(schema.propertyNames, ctx);
            const valueSchema = schema.additionalProperties && typeof schema.additionalProperties === "object" ? convertSchema(schema.additionalProperties, ctx) : z2.any();
            if (Object.keys(shape).length === 0) {
              zodSchema = z2.record(keySchema, valueSchema);
              break;
            }
            const objectSchema2 = z2.object(shape).passthrough();
            const recordSchema = z2.looseRecord(keySchema, valueSchema);
            zodSchema = z2.intersection(objectSchema2, recordSchema);
            break;
          }
          if (schema.patternProperties) {
            const patternProps = schema.patternProperties;
            const patternKeys = Object.keys(patternProps);
            const looseRecords = [];
            for (const pattern of patternKeys) {
              const patternValue = convertSchema(patternProps[pattern], ctx);
              const keySchema = z2.string().regex(new RegExp(pattern));
              looseRecords.push(z2.looseRecord(keySchema, patternValue));
            }
            const schemasToIntersect = [];
            if (Object.keys(shape).length > 0) {
              schemasToIntersect.push(z2.object(shape).passthrough());
            }
            schemasToIntersect.push(...looseRecords);
            if (schemasToIntersect.length === 0) {
              zodSchema = z2.object({}).passthrough();
            } else if (schemasToIntersect.length === 1) {
              zodSchema = schemasToIntersect[0];
            } else {
              let result = z2.intersection(schemasToIntersect[0], schemasToIntersect[1]);
              for (let i = 2; i < schemasToIntersect.length; i++) {
                result = z2.intersection(result, schemasToIntersect[i]);
              }
              zodSchema = result;
            }
            break;
          }
          const objectSchema = z2.object(shape);
          if (schema.additionalProperties === false) {
            zodSchema = objectSchema.strict();
          } else if (typeof schema.additionalProperties === "object") {
            zodSchema = objectSchema.catchall(convertSchema(schema.additionalProperties, ctx));
          } else {
            zodSchema = objectSchema.passthrough();
          }
          break;
        }
        case "array": {
          const prefixItems = schema.prefixItems;
          const items = schema.items;
          if (prefixItems && Array.isArray(prefixItems)) {
            const tupleItems = prefixItems.map((item) => convertSchema(item, ctx));
            const rest = items && typeof items === "object" && !Array.isArray(items) ? convertSchema(items, ctx) : void 0;
            if (rest) {
              zodSchema = z2.tuple(tupleItems).rest(rest);
            } else {
              zodSchema = z2.tuple(tupleItems);
            }
            if (typeof schema.minItems === "number") {
              zodSchema = zodSchema.check(z2.minLength(schema.minItems));
            }
            if (typeof schema.maxItems === "number") {
              zodSchema = zodSchema.check(z2.maxLength(schema.maxItems));
            }
          } else if (Array.isArray(items)) {
            const tupleItems = items.map((item) => convertSchema(item, ctx));
            const rest = schema.additionalItems && typeof schema.additionalItems === "object" ? convertSchema(schema.additionalItems, ctx) : void 0;
            if (rest) {
              zodSchema = z2.tuple(tupleItems).rest(rest);
            } else {
              zodSchema = z2.tuple(tupleItems);
            }
            if (typeof schema.minItems === "number") {
              zodSchema = zodSchema.check(z2.minLength(schema.minItems));
            }
            if (typeof schema.maxItems === "number") {
              zodSchema = zodSchema.check(z2.maxLength(schema.maxItems));
            }
          } else if (items !== void 0) {
            const element = convertSchema(items, ctx);
            let arraySchema = z2.array(element);
            if (typeof schema.minItems === "number") {
              arraySchema = arraySchema.min(schema.minItems);
            }
            if (typeof schema.maxItems === "number") {
              arraySchema = arraySchema.max(schema.maxItems);
            }
            zodSchema = arraySchema;
          } else {
            zodSchema = z2.array(z2.any());
          }
          break;
        }
        default:
          throw new Error(`Unsupported type: ${type}`);
      }
      return zodSchema;
    }
    function convertSchema(schema, ctx) {
      if (typeof schema === "boolean") {
        return schema ? z2.any() : z2.never();
      }
      let baseSchema = convertBaseSchema(schema, ctx);
      const hasExplicitType = schema.type || schema.enum !== void 0 || schema.const !== void 0;
      if (schema.anyOf && Array.isArray(schema.anyOf)) {
        const options = schema.anyOf.map((s) => convertSchema(s, ctx));
        const anyOfUnion = z2.union(options);
        baseSchema = hasExplicitType ? z2.intersection(baseSchema, anyOfUnion) : anyOfUnion;
      }
      if (schema.oneOf && Array.isArray(schema.oneOf)) {
        const options = schema.oneOf.map((s) => convertSchema(s, ctx));
        const oneOfUnion = z2.xor(options);
        baseSchema = hasExplicitType ? z2.intersection(baseSchema, oneOfUnion) : oneOfUnion;
      }
      if (schema.allOf && Array.isArray(schema.allOf)) {
        if (schema.allOf.length === 0) {
          baseSchema = hasExplicitType ? baseSchema : z2.any();
        } else {
          let result = hasExplicitType ? baseSchema : convertSchema(schema.allOf[0], ctx);
          const startIdx = hasExplicitType ? 0 : 1;
          for (let i = startIdx; i < schema.allOf.length; i++) {
            result = z2.intersection(result, convertSchema(schema.allOf[i], ctx));
          }
          baseSchema = result;
        }
      }
      if (schema.nullable === true && ctx.version === "openapi-3.0") {
        baseSchema = z2.nullable(baseSchema);
      }
      if (schema.readOnly === true) {
        baseSchema = z2.readonly(baseSchema);
      }
      if (schema.default !== void 0) {
        baseSchema = baseSchema.default(schema.default);
      }
      const extraMeta = {};
      const coreMetadataKeys = ["$id", "id", "$comment", "$anchor", "$vocabulary", "$dynamicRef", "$dynamicAnchor"];
      for (const key of coreMetadataKeys) {
        if (key in schema) {
          extraMeta[key] = schema[key];
        }
      }
      const contentMetadataKeys = ["contentEncoding", "contentMediaType", "contentSchema"];
      for (const key of contentMetadataKeys) {
        if (key in schema) {
          extraMeta[key] = schema[key];
        }
      }
      for (const key of Object.keys(schema)) {
        if (!RECOGNIZED_KEYS.has(key)) {
          extraMeta[key] = schema[key];
        }
      }
      if (Object.keys(extraMeta).length > 0) {
        ctx.registry.add(baseSchema, extraMeta);
      }
      if (schema.description) {
        baseSchema = baseSchema.describe(schema.description);
      }
      return baseSchema;
    }
    function fromJSONSchema(schema, params) {
      if (typeof schema === "boolean") {
        return schema ? z2.any() : z2.never();
      }
      let normalized;
      try {
        normalized = JSON.parse(JSON.stringify(schema));
      } catch {
        throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas");
      }
      const version = detectVersion(normalized, params?.defaultTarget);
      const defs = normalized.$defs || normalized.definitions || {};
      const ctx = {
        version,
        defs,
        refs: /* @__PURE__ */ new Map(),
        processing: /* @__PURE__ */ new Set(),
        rootSchema: normalized,
        registry: params?.registry ?? registries_js_1.globalRegistry
      };
      return convertSchema(normalized, ctx);
    }
  }
});

// node_modules/zod/v4/classic/coerce.cjs
var require_coerce = __commonJS({
  "node_modules/zod/v4/classic/coerce.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.string = string;
    exports2.number = number;
    exports2.boolean = boolean;
    exports2.bigint = bigint;
    exports2.date = date;
    var core = __importStar(require_core2());
    var schemas = __importStar(require_schemas2());
    function string(params) {
      return core._coercedString(schemas.ZodString, params);
    }
    function number(params) {
      return core._coercedNumber(schemas.ZodNumber, params);
    }
    function boolean(params) {
      return core._coercedBoolean(schemas.ZodBoolean, params);
    }
    function bigint(params) {
      return core._coercedBigint(schemas.ZodBigInt, params);
    }
    function date(params) {
      return core._coercedDate(schemas.ZodDate, params);
    }
  }
});

// node_modules/zod/v4/classic/external.cjs
var require_external = __commonJS({
  "node_modules/zod/v4/classic/external.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.coerce = exports2.iso = exports2.ZodISODuration = exports2.ZodISOTime = exports2.ZodISODate = exports2.ZodISODateTime = exports2.locales = exports2.fromJSONSchema = exports2.toJSONSchema = exports2.NEVER = exports2.util = exports2.TimePrecision = exports2.flattenError = exports2.formatError = exports2.prettifyError = exports2.treeifyError = exports2.regexes = exports2.clone = exports2.$brand = exports2.$input = exports2.$output = exports2.config = exports2.registry = exports2.globalRegistry = exports2.core = void 0;
    exports2.core = __importStar(require_core2());
    __exportStar(require_schemas2(), exports2);
    __exportStar(require_checks2(), exports2);
    __exportStar(require_errors3(), exports2);
    __exportStar(require_parse2(), exports2);
    __exportStar(require_compat(), exports2);
    var index_js_1 = require_core2();
    var en_js_1 = __importDefault(require_en());
    (0, index_js_1.config)((0, en_js_1.default)());
    var index_js_2 = require_core2();
    Object.defineProperty(exports2, "globalRegistry", { enumerable: true, get: function() {
      return index_js_2.globalRegistry;
    } });
    Object.defineProperty(exports2, "registry", { enumerable: true, get: function() {
      return index_js_2.registry;
    } });
    Object.defineProperty(exports2, "config", { enumerable: true, get: function() {
      return index_js_2.config;
    } });
    Object.defineProperty(exports2, "$output", { enumerable: true, get: function() {
      return index_js_2.$output;
    } });
    Object.defineProperty(exports2, "$input", { enumerable: true, get: function() {
      return index_js_2.$input;
    } });
    Object.defineProperty(exports2, "$brand", { enumerable: true, get: function() {
      return index_js_2.$brand;
    } });
    Object.defineProperty(exports2, "clone", { enumerable: true, get: function() {
      return index_js_2.clone;
    } });
    Object.defineProperty(exports2, "regexes", { enumerable: true, get: function() {
      return index_js_2.regexes;
    } });
    Object.defineProperty(exports2, "treeifyError", { enumerable: true, get: function() {
      return index_js_2.treeifyError;
    } });
    Object.defineProperty(exports2, "prettifyError", { enumerable: true, get: function() {
      return index_js_2.prettifyError;
    } });
    Object.defineProperty(exports2, "formatError", { enumerable: true, get: function() {
      return index_js_2.formatError;
    } });
    Object.defineProperty(exports2, "flattenError", { enumerable: true, get: function() {
      return index_js_2.flattenError;
    } });
    Object.defineProperty(exports2, "TimePrecision", { enumerable: true, get: function() {
      return index_js_2.TimePrecision;
    } });
    Object.defineProperty(exports2, "util", { enumerable: true, get: function() {
      return index_js_2.util;
    } });
    Object.defineProperty(exports2, "NEVER", { enumerable: true, get: function() {
      return index_js_2.NEVER;
    } });
    var json_schema_processors_js_1 = require_json_schema_processors();
    Object.defineProperty(exports2, "toJSONSchema", { enumerable: true, get: function() {
      return json_schema_processors_js_1.toJSONSchema;
    } });
    var from_json_schema_js_1 = require_from_json_schema();
    Object.defineProperty(exports2, "fromJSONSchema", { enumerable: true, get: function() {
      return from_json_schema_js_1.fromJSONSchema;
    } });
    exports2.locales = __importStar(require_locales());
    var iso_js_1 = require_iso();
    Object.defineProperty(exports2, "ZodISODateTime", { enumerable: true, get: function() {
      return iso_js_1.ZodISODateTime;
    } });
    Object.defineProperty(exports2, "ZodISODate", { enumerable: true, get: function() {
      return iso_js_1.ZodISODate;
    } });
    Object.defineProperty(exports2, "ZodISOTime", { enumerable: true, get: function() {
      return iso_js_1.ZodISOTime;
    } });
    Object.defineProperty(exports2, "ZodISODuration", { enumerable: true, get: function() {
      return iso_js_1.ZodISODuration;
    } });
    exports2.iso = __importStar(require_iso());
    exports2.coerce = __importStar(require_coerce());
  }
});

// node_modules/zod/index.cjs
var require_zod = __commonJS({
  "node_modules/zod/index.cjs"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v3) {
      Object.defineProperty(o, "default", { enumerable: true, value: v3 });
    } : function(o, v3) {
      o["default"] = v3;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.z = void 0;
    var z2 = __importStar(require_external());
    exports2.z = z2;
    __exportStar(require_external(), exports2);
    exports2.default = z2;
  }
});

// scripts/.probe-pasar-entry.tsx
var probe_pasar_entry_exports = {};
__export(probe_pasar_entry_exports, {
  buildCleanItems: () => buildCleanItems,
  invokeCreateInvoice: () => invokeCreateInvoice,
  invokeEditInvoice: () => invokeEditInvoice,
  itemSubtotal: () => itemSubtotal,
  loadItemsForEdit: () => loadItemsForEdit,
  makeCtx: () => makeCtx,
  parseNumFn: () => parseNumFn,
  roundNumFn: () => roundNumFn,
  schemaInvoice: () => schemaInvoice,
  totalsInvoice: () => totalsInvoice
});
module.exports = __toCommonJS(probe_pasar_entry_exports);

// src/convex/business.ts
var import_values2 = __toESM(require_values());

// src/convex/_generated/server.js
var import_server = __toESM(require_server());
var mutation = import_server.mutationGeneric;
var env = process.env;

// src/convex/lib.ts
var import_values = __toESM(require_values());

// src/lib/format.ts
function roundNum(n, decimals = 6) {
  if (n === null || n === void 0 || !Number.isFinite(n))
    return 0;
  const p = 10 ** decimals;
  const r = Math.round((n + Number.EPSILON) * p) / p;
  return Object.is(r, -0) ? 0 : r;
}
function parseNum(v3) {
  if (typeof v3 === "number")
    return Number.isFinite(v3) ? v3 : 0;
  if (v3 === null || v3 === void 0)
    return 0;
  const cleaned = String(v3).trim().replace(/[^\d.,\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === ",")
    return 0;
  let normalized;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  } else if (hasDot) {
    const parts = cleaned.split(".");
    const last = parts[parts.length - 1];
    const isThousands = parts.length > 2 || parts.length === 2 && parts[0] !== "" && parts[0] !== "0" && parts[0] !== "-0" && last.length === 3;
    normalized = isThousands ? cleaned.replace(/\./g, "") : cleaned;
  } else {
    normalized = cleaned;
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

// src/lib/business.ts
var INVOICE_TIPES = ["Supplier", "Reseller", "DPL", "Pasar"];
var ABSENSI_STATUSES = ["Hadir", "Izin", "Sakit", "Alpa"];
var UTANG_STATUSES = ["Belum", "Lunas", "Parsial"];
var UTANG_JENISES = ["Utang", "Casbon"];
var PENGELUARAN_JENISES = [
  "Operasional",
  "Gaji",
  "Utang Karyawan",
  "Transportasi",
  "Listrik & Air",
  "Pembelian Perlengkapan",
  "Lainnya"
];
function computeInvoiceTotals(tipe, items) {
  let totalModal = 0;
  let totalPenjualan = 0;
  for (const it of items) {
    const terjual = roundNum(
      tipe === "Pasar" ? (it.stokAwal ?? 0) - (it.stokAkhir ?? 0) : Math.max(0, it.qty || 0)
    );
    totalModal += roundNum((it.hargaModal || 0) * terjual);
    totalPenjualan += roundNum((tipe === "Supplier" ? it.hargaModal || 0 : it.hargaJual || 0) * terjual);
  }
  totalModal = roundNum(totalModal);
  totalPenjualan = roundNum(totalPenjualan);
  const total = tipe === "Supplier" ? totalModal : totalPenjualan;
  return { total, totalModal, totalPenjualan, margin: roundNum(totalPenjualan - totalModal) };
}
function computeTetesanTotals(tipe, items) {
  const total = roundNum(items.reduce((s, it) => s + (it.harga || 0) * Math.max(0, it.qty || 0), 0));
  return { total };
}
function emptyAbsensiCounts() {
  return { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
}
function countAbsensi(records) {
  const c = emptyAbsensiCounts();
  for (const r of records) {
    if (r.status === "Hadir")
      c.hadir++;
    else if (r.status === "Izin")
      c.izin++;
    else if (r.status === "Sakit")
      c.sakit++;
    else if (r.status === "Alpa")
      c.alpa++;
  }
  return c;
}
function computeSlipGaji(inp) {
  const hariKerja = inp.hariKerja ?? 26;
  const potonganPerHari = roundNum(hariKerja > 0 ? inp.gajiPokok / hariKerja : 0);
  const potonganAbsensi = Math.round((inp.absensi.alpa + inp.absensi.izin) * potonganPerHari);
  const totalBonus = Math.max(0, inp.bonusKerajinan || 0) + Math.max(0, inp.bonusBulanan || 0);
  const denda = Math.max(0, inp.denda || 0);
  let available = Math.max(0, inp.gajiPokok + totalBonus - potonganAbsensi - denda);
  const targetUtang = inp.potonganUtangManual !== void 0 && inp.potonganUtangManual > 0 ? Math.max(0, inp.potonganUtangManual) : Math.max(0, inp.sisaUtang);
  const potonganUtang = Math.min(targetUtang, available);
  available = Math.max(0, available - potonganUtang);
  const targetCasbon = inp.potonganCasbonManual !== void 0 && inp.potonganCasbonManual > 0 ? Math.max(0, inp.potonganCasbonManual) : Math.max(0, inp.sisaCasbon);
  const potonganCasbon = Math.min(targetCasbon, available);
  const totalPotongan = potonganAbsensi + potonganUtang + potonganCasbon + denda;
  const gajiBersih = Math.max(0, inp.gajiPokok + totalBonus - totalPotongan);
  return {
    hariKerja,
    potonganPerHari,
    potonganAbsensi,
    potonganUtang,
    potonganCasbon,
    denda,
    totalBonus,
    totalPotongan,
    gajiBersih,
    sisaUtangAkhir: Math.max(0, inp.sisaUtang - potonganUtang),
    sisaCasbonAkhir: Math.max(0, inp.sisaCasbon - potonganCasbon)
  };
}
function computeKasBalances(entries) {
  const sorted = [...entries].sort((a, b) => {
    if (a.tanggal === b.tanggal)
      return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    return a.tanggal.localeCompare(b.tanggal);
  });
  let bal = 0;
  return sorted.map((e) => {
    const saldoAwal = roundNum(bal);
    bal = roundNum(saldoAwal + (e.kasMasuk || 0) - (e.kasKeluar || 0));
    return { ...e, saldoAwal, saldoAkhir: bal };
  });
}
function todayStr() {
  const d = /* @__PURE__ */ new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// src/convex/lib.ts
function logRequest(route, payload) {
  console.log(`[Dapur Laut] ${route} request:`, JSON.stringify(payload, null, 2));
}
function logResponse(route, payload) {
  console.log(`[Dapur Laut] ${route} response:`, JSON.stringify(payload, null, 2));
}
function badRequest(message, extra) {
  console.error(`[Dapur Laut] Invalid request:`, message, extra ?? "");
  throw new import_values.ConvexError({ error: message, message, detail: extra ?? null });
}
async function upsertByKey(ctx, table, keyField, keyValue, doc) {
  const existing = await ctx.db.query(table).filter((q) => q.eq(q.field(keyField), keyValue)).first();
  if (existing) {
    await ctx.db.patch(existing._id, doc);
    return { _id: existing._id, created: false };
  }
  const _id = await ctx.db.insert(table, { ...doc, [keyField]: keyValue });
  return { _id, created: true };
}
async function findOneByKey(ctx, table, keyField, keyValue) {
  return ctx.db.query(table).filter((q) => q.eq(q.field(keyField), keyValue)).first();
}
async function recomputeKas(ctx) {
  const entries = await ctx.db.query("kas").collect();
  const withBalances = computeKasBalances(
    entries.map((e) => ({
      id: e.id,
      tanggal: e.tanggal,
      kasMasuk: e.kasMasuk,
      kasKeluar: e.kasKeluar,
      saldoAwal: e.saldoAwal,
      saldoAkhir: e.saldoAkhir,
      createdAt: e._creationTime
    }))
  );
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const b = withBalances.find((x) => x.id === e.id);
    if (b && (b.saldoAwal !== e.saldoAwal || b.saldoAkhir !== e.saldoAkhir)) {
      await ctx.db.patch(e._id, { saldoAwal: b.saldoAwal, saldoAkhir: b.saldoAkhir });
    }
  }
}
async function recordKas(ctx, refKey, tanggal, kasMasuk, kasKeluar, keterangan, sumber) {
  const existing = await findOneByKey(ctx, "kas", "id", refKey);
  if (existing) {
    await ctx.db.patch(existing._id, { tanggal, kasMasuk, kasKeluar, keterangan, sumber });
  } else {
    await ctx.db.insert("kas", {
      id: refKey,
      tanggal,
      kasMasuk,
      kasKeluar,
      saldoAwal: 0,
      saldoAkhir: 0,
      keterangan,
      sumber
    });
  }
  await recomputeKas(ctx);
}
async function ensureGudangRow(ctx, namaBarang) {
  const existing = await findOneByKey(ctx, "gudang", "namaBarang", namaBarang);
  if (!existing) {
    await ctx.db.insert("gudang", {
      id: `GDG-${Date.now().toString(36).toUpperCase()}`,
      namaBarang,
      stokAwal: 0,
      keterangan: ""
    });
  }
}
async function addStokHistory(ctx, namaBarang, tanggal, perubahan, tipe, keterangan) {
  await ensureGudangRow(ctx, namaBarang);
  await ctx.db.insert("stokHistory", {
    id: `STK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    tanggal,
    namaBarang,
    perubahan,
    tipe,
    keterangan: keterangan ?? ""
  });
}
async function purgeStokFor(ctx, namaBarang) {
  const gudang = await findOneByKey(ctx, "gudang", "namaBarang", namaBarang);
  if (gudang)
    await ctx.db.delete(gudang._id);
  const hist = await ctx.db.query("stokHistory").filter((q) => q.eq(q.field("namaBarang"), namaBarang)).collect();
  for (const h of hist)
    await ctx.db.delete(h._id);
  const tStok = await findOneByKey(ctx, "tetesanStok", "namaBarang", namaBarang);
  if (tStok)
    await ctx.db.delete(tStok._id);
  const tHist = await ctx.db.query("tetesanStokHistory").filter((q) => q.eq(q.field("namaBarang"), namaBarang)).collect();
  for (const h of tHist)
    await ctx.db.delete(h._id);
}
function monthOf(tanggal) {
  return tanggal.slice(0, 7);
}

// src/lib/schemas.ts
var import_zod = __toESM(require_zod());
var idSchema = import_zod.z.string().min(1, "ID wajib diisi");
var tanggalSchema = import_zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD");
var barangSchema = import_zod.z.object({
  kode: idSchema,
  nama: import_zod.z.string().min(1, "Nama barang wajib diisi"),
  harga: import_zod.z.number().min(0, "Harga tidak boleh negatif"),
  kategori: import_zod.z.string().optional().default("")
});
var supplierSchema = import_zod.z.object({
  id: idSchema,
  nama: import_zod.z.string().min(1, "Nama supplier wajib diisi"),
  alamat: import_zod.z.string().optional().default(""),
  kontak: import_zod.z.string().optional().default("")
});
var resellerSchema = import_zod.z.object({
  id: idSchema,
  nama: import_zod.z.string().min(1, "Nama reseller wajib diisi"),
  alamat: import_zod.z.string().optional().default(""),
  kontak: import_zod.z.string().optional().default("")
});
var dplSchema = import_zod.z.object({
  id: idSchema,
  namaPasar: import_zod.z.string().min(1, "Nama pasar wajib diisi"),
  alamat: import_zod.z.string().optional().default(""),
  kontak: import_zod.z.string().optional().default("")
});
var pasarSchema = import_zod.z.object({
  id: idSchema,
  namaPasar: import_zod.z.string().min(1, "Nama pasar (Victoria/Tunas) wajib diisi"),
  alamat: import_zod.z.string().optional().default(""),
  kontak: import_zod.z.string().optional().default("")
});
var karyawanSchema = import_zod.z.object({
  id: idSchema,
  nama: import_zod.z.string().min(1, "Nama karyawan wajib diisi"),
  jabatan: import_zod.z.string().optional().default(""),
  gajiPokok: import_zod.z.number().min(0).default(0),
  utangTotal: import_zod.z.number().min(0).default(0)
});
var absensiSchema = import_zod.z.object({
  id: idSchema,
  idKaryawan: idSchema,
  tanggal: tanggalSchema,
  status: import_zod.z.enum(ABSENSI_STATUSES),
  jamMasuk: import_zod.z.string().optional().default(""),
  jamKeluar: import_zod.z.string().optional().default("")
});
var utangSchema = import_zod.z.object({
  id: idSchema,
  idKaryawan: idSchema,
  tanggal: tanggalSchema,
  nominal: import_zod.z.number().min(0),
  status: import_zod.z.enum(UTANG_STATUSES).default("Belum"),
  dibayar: import_zod.z.number().min(0).default(0),
  tglBayar: import_zod.z.string().optional().default(""),
  sisaUtang: import_zod.z.number().min(0).default(0),
  keterangan: import_zod.z.string().optional().default(""),
  jenis: import_zod.z.enum(UTANG_JENISES).default("Utang")
});
var invoiceItemSchema = import_zod.z.object({
  kodeBarang: import_zod.z.string().min(1, "Kode barang wajib diisi"),
  namaBarang: import_zod.z.string().min(1, "Nama barang wajib diisi"),
  hargaModal: import_zod.z.number().min(0),
  qty: import_zod.z.number().min(0),
  hargaJual: import_zod.z.number().min(0).optional(),
  stokAwal: import_zod.z.number().min(0).optional(),
  stokAkhir: import_zod.z.number().min(0).optional(),
  // Subtotal BOLEH negatif khusus Pasar: stok akhir > stok awal → terjual minus
  // (barang pulang lebih banyak dari yang dikirim) → subtotal ikut minus.
  subtotal: import_zod.z.number()
});
var invoiceSchema = import_zod.z.object({
  idInvoice: idSchema,
  tanggal: tanggalSchema,
  tipe: import_zod.z.enum(INVOICE_TIPES),
  namaPihak: import_zod.z.string().min(1, "Nama pihak wajib diisi"),
  // Tenggat bersifat OPSIONAL — string kosong (tidak diisi) HARUS diterima.
  // Jangan pakai tanggalSchema.optional() langsung karena regex-nya menolak
  // "" sehingga invoice tanpa tanggal jatuh tempo tidak bisa disimpan.
  tenggat: import_zod.z.string().refine((s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s), "Tenggat harus format YYYY-MM-DD").optional().default(""),
  // Mata uang: default Rupiah (Rp); khusus Supplier bisa pilih Dolar ($)
  mataUang: import_zod.z.enum(["Rp", "$"]).default("Rp"),
  // Status pembayaran: default Pending; bisa diubah jadi Lunas setelah invoice jadi
  statusPembayaran: import_zod.z.enum(["Lunas", "Pending"]).optional().default("Pending"),
  items: import_zod.z.array(invoiceItemSchema).min(1, "Invoice minimal berisi 1 barang")
}).superRefine((data, ctx) => {
  if (data.tipe === "Pasar") {
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      if ((it.stokAwal ?? 0) <= 0) {
        ctx.addIssue({
          code: import_zod.z.ZodIssueCode.custom,
          path: ["items", i, "stokAwal"],
          message: "Stok awal untuk pasar harus lebih dari 0"
        });
      }
    }
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      if (it.qty <= 0) {
        ctx.addIssue({
          code: import_zod.z.ZodIssueCode.custom,
          path: ["items", i, "qty"],
          message: "Qty harus lebih dari 0"
        });
      }
    }
  }
});
var returSchema = import_zod.z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  tipe: import_zod.z.enum(INVOICE_TIPES).refine((t) => t !== "Supplier", {
    message: "Tipe retur harus Reseller/DPL/Pasar"
  }),
  namaPihak: import_zod.z.string().min(1, "Nama pihak wajib diisi"),
  namaBarang: import_zod.z.string().min(1, "Nama barang wajib diisi"),
  // Qty boleh desimal (mis. 0,7 kg) — hanya harus lebih dari 0
  qty: import_zod.z.number().min(0.01, "Qty retur harus lebih dari 0"),
  keterangan: import_zod.z.string().optional().default("")
});
var kasSchema = import_zod.z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  kasMasuk: import_zod.z.number().min(0).default(0),
  kasKeluar: import_zod.z.number().min(0).default(0),
  keterangan: import_zod.z.string().optional().default("")
});
var pengeluaranSchema = import_zod.z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  jenis: import_zod.z.enum(PENGELUARAN_JENISES),
  nominal: import_zod.z.number().min(0, "Nominal tidak boleh negatif"),
  keterangan: import_zod.z.string().optional().default(""),
  idKaryawan: import_zod.z.string().optional().default("")
});
var gudangSchema = import_zod.z.object({
  id: idSchema,
  namaBarang: import_zod.z.string().min(1, "Nama barang wajib diisi"),
  stokAwal: import_zod.z.number().min(0).default(0),
  tanggalStokAwal: tanggalSchema.optional().default(""),
  keterangan: import_zod.z.string().optional().default("")
});
var stokHistorySchema = import_zod.z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  namaBarang: import_zod.z.string().min(1),
  perubahan: import_zod.z.number(),
  tipe: import_zod.z.string(),
  keterangan: import_zod.z.string().optional().default("")
});
var slipGajiSchema = import_zod.z.object({
  id: idSchema,
  idKaryawan: idSchema,
  periode: import_zod.z.string().regex(/^\d{4}-\d{2}$/, "Periode harus format YYYY-MM"),
  bonusKerajinan: import_zod.z.number().min(0).default(0),
  bonusBulanan: import_zod.z.number().min(0).default(0),
  denda: import_zod.z.number().min(0).default(0),
  keterangan: import_zod.z.string().optional().default("")
});
var bahanBakuSchema = import_zod.z.object({
  kode: idSchema,
  nama: import_zod.z.string().min(1, "Nama bahan baku wajib diisi"),
  hargaModal: import_zod.z.number().min(0, "Harga modal tidak boleh negatif"),
  stokAwal: import_zod.z.number().min(0).default(0),
  kategori: import_zod.z.string().optional().default("")
});
var barangJadiSchema = import_zod.z.object({
  kode: idSchema,
  nama: import_zod.z.string().min(1, "Nama barang jadi wajib diisi"),
  hargaJual: import_zod.z.number().min(0, "Harga jual tidak boleh negatif"),
  stokAwal: import_zod.z.number().min(0).default(0),
  kategori: import_zod.z.string().optional().default("")
});
var tetesanStokSchema = import_zod.z.object({
  id: idSchema,
  namaBarang: import_zod.z.string().min(1, "Nama barang wajib diisi"),
  tipe: import_zod.z.enum(["Baku", "Jadi"]),
  stokAwal: import_zod.z.number().min(0).default(0),
  tanggalStokAwal: tanggalSchema.optional().default(""),
  keterangan: import_zod.z.string().optional().default("")
});
var tetesanItemSchema = import_zod.z.object({
  kodeBarang: import_zod.z.string().min(1, "Kode barang wajib diisi"),
  namaBarang: import_zod.z.string().min(1, "Nama barang wajib diisi"),
  harga: import_zod.z.number().min(0, "Harga wajib diisi (0 atau lebih)"),
  // Qty boleh desimal (mis. 0,7) — hanya harus lebih dari 0
  qty: import_zod.z.number().min(0.01, "Qty wajib diisi lebih dari 0"),
  subtotal: import_zod.z.number().min(0)
});
var invoiceTetesanSchema = import_zod.z.object({
  idInvoice: idSchema,
  tanggal: tanggalSchema,
  tipe: import_zod.z.enum(["Modal", "Penjualan"]),
  namaPihak: import_zod.z.string().min(1, "Nama pihak wajib diisi"),
  mataUang: import_zod.z.enum(["Rp", "$"]).default("Rp"),
  items: import_zod.z.array(tetesanItemSchema).min(1, "Invoice minimal berisi 1 barang")
});
function zodErrorMessages(result) {
  return result.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: zodErrorMessages(result.error)
  };
}

// src/convex/business.ts
var upsertBarang = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertBarang", doc);
    const parsed = validate(barangSchema, doc);
    if (!parsed.success)
      return badRequest("Data barang tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "barang", "kode", d.kode, {
      nama: d.nama,
      harga: d.harga,
      kategori: d.kategori ?? ""
    });
    logResponse("upsertBarang", res);
    return res;
  }
});
var upsertSupplier = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertSupplier", doc);
    const parsed = validate(supplierSchema, doc);
    if (!parsed.success)
      return badRequest("Data supplier tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "supplier", "id", d.id, {
      nama: d.nama,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? ""
    });
    logResponse("upsertSupplier", res);
    return res;
  }
});
var upsertReseller = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertReseller", doc);
    const parsed = validate(resellerSchema, doc);
    if (!parsed.success)
      return badRequest("Data reseller tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "reseller", "id", d.id, {
      nama: d.nama,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? ""
    });
    logResponse("upsertReseller", res);
    return res;
  }
});
var upsertDpl = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertDpl", doc);
    const parsed = validate(dplSchema, doc);
    if (!parsed.success)
      return badRequest("Data DPL tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "dpl", "id", d.id, {
      namaPasar: d.namaPasar,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? ""
    });
    logResponse("upsertDpl", res);
    return res;
  }
});
var upsertPasar = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertPasar", doc);
    const parsed = validate(pasarSchema, doc);
    if (!parsed.success)
      return badRequest("Data pasar tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "pasar", "id", d.id, {
      namaPasar: d.namaPasar,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? ""
    });
    logResponse("upsertPasar", res);
    return res;
  }
});
var upsertKaryawan = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertKaryawan", doc);
    const parsed = validate(karyawanSchema, doc);
    if (!parsed.success)
      return badRequest("Data karyawan tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "karyawan", "id", d.id, {
      nama: d.nama,
      jabatan: d.jabatan ?? "",
      gajiPokok: d.gajiPokok
    });
    await syncKaryawanUtangTotal(ctx, d.id);
    logResponse("upsertKaryawan", res);
    return res;
  }
});
var deleteMaster = mutation({
  args: { table: import_values2.v.string(), id: import_values2.v.string() },
  handler: async (ctx, { table, id }) => {
    logRequest("deleteMaster", { table, id });
    const validTables = [
      "barang",
      "supplier",
      "reseller",
      "dpl",
      "pasar",
      "karyawan",
      "absensi",
      "utang",
      "retur",
      "pengeluaran",
      "gudang",
      "slipgaji",
      "bahanBaku",
      "barangJadi"
    ];
    if (!validTables.includes(table))
      return badRequest("Tabel tidak dikenal", { table });
    const keyField = table === "barang" || table === "bahanBaku" || table === "barangJadi" ? "kode" : table === "gudang" ? "namaBarang" : "id";
    const existing = await findOneByKey(ctx, table, keyField, id);
    if (!existing)
      return { deleted: false, id };
    if (table === "slipgaji") {
      const slip = existing;
      await ctx.db.delete(existing._id);
      if ((slip.potonganUtang || 0) > 0 || (slip.potonganCasbon || 0) > 0) {
        const allUtang = await ctx.db.query("utang").filter((q) => q.eq(q.field("idKaryawan"), slip.idKaryawan)).collect();
        let sisaPotonganUtang = slip.potonganUtang || 0;
        for (const u of allUtang.filter((x) => x.jenis === "Utang" && (x.sisaUtang || 0) > 0)) {
          if (sisaPotonganUtang <= 0)
            break;
          const restore = Math.min(sisaPotonganUtang, u.sisaUtang || 0);
          sisaPotonganUtang -= restore;
          const dibayar = Math.max(0, (u.dibayar || 0) - restore);
          const sisa = Math.min(u.nominal, (u.sisaUtang || 0) + restore);
          await ctx.db.patch(u._id, {
            dibayar,
            sisaUtang: sisa,
            status: sisa >= u.nominal ? "Belum" : dibayar > 0 ? "Parsial" : "Belum",
            tglBayar: dibayar > 0 ? u.tglBayar ?? "" : ""
          });
        }
        let sisaPotonganCasbon = slip.potonganCasbon || 0;
        for (const u of allUtang.filter((x) => x.jenis === "Casbon" && (x.sisaUtang || 0) > 0)) {
          if (sisaPotonganCasbon <= 0)
            break;
          const restore = Math.min(sisaPotonganCasbon, u.sisaUtang || 0);
          sisaPotonganCasbon -= restore;
          const dibayar = Math.max(0, (u.dibayar || 0) - restore);
          const sisa = Math.min(u.nominal, (u.sisaUtang || 0) + restore);
          await ctx.db.patch(u._id, {
            dibayar,
            sisaUtang: sisa,
            status: sisa >= u.nominal ? "Belum" : dibayar > 0 ? "Parsial" : "Belum",
            tglBayar: dibayar > 0 ? u.tglBayar ?? "" : ""
          });
        }
        await syncKaryawanUtangTotal(ctx, slip.idKaryawan);
      }
      const kasSlip = await findOneByKey(ctx, "kas", "id", `KAS-SLP-${id}`);
      if (kasSlip)
        await ctx.db.delete(kasSlip._id);
      const kasDenda = await findOneByKey(ctx, "kas", "id", `KAS-DND-${id}`);
      if (kasDenda)
        await ctx.db.delete(kasDenda._id);
      await recomputeKas(ctx);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }
    if (table === "utang") {
      const idKaryawan = existing.idKaryawan;
      await ctx.db.delete(existing._id);
      if (idKaryawan)
        await syncKaryawanUtangTotal(ctx, idKaryawan);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }
    if (table === "pengeluaran") {
      const idKaryawan = existing.idKaryawan;
      await ctx.db.delete(existing._id);
      const autoUtang = await findOneByKey(ctx, "utang", "id", `UTG-PEN-${id}`);
      if (autoUtang) {
        await ctx.db.delete(autoUtang._id);
        if (idKaryawan)
          await syncKaryawanUtangTotal(ctx, idKaryawan);
      }
      const kas = await findOneByKey(ctx, "kas", "id", `KAS-PEN-${id}`);
      if (kas)
        await ctx.db.delete(kas._id);
      await recomputeKas(ctx);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }
    if (table === "barang" || table === "bahanBaku" || table === "barangJadi") {
      const nama = existing.nama;
      await ctx.db.delete(existing._id);
      if (nama)
        await purgeStokFor(ctx, nama);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }
    await ctx.db.delete(existing._id);
    logResponse("deleteMaster", { deleted: true, id });
    return { deleted: true, id };
  }
});
var upsertAbsensi = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertAbsensi", doc);
    const parsed = validate(absensiSchema, doc);
    if (!parsed.success)
      return badRequest("Data absensi tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "absensi", "id", d.id, {
      idKaryawan: d.idKaryawan,
      tanggal: d.tanggal,
      status: d.status,
      jamMasuk: d.jamMasuk ?? "",
      jamKeluar: d.jamKeluar ?? ""
    });
    logResponse("upsertAbsensi", res);
    return res;
  }
});
async function syncKaryawanUtangTotal(ctx, idKaryawan) {
  const all = await ctx.db.query("utang").filter((q) => q.eq(q.field("idKaryawan"), idKaryawan)).collect();
  const total = all.reduce((s, u) => s + (u.sisaUtang || 0), 0);
  const karyawan = await ctx.db.query("karyawan").filter((q) => q.eq(q.field("id"), idKaryawan)).first();
  if (karyawan && karyawan.utangTotal !== total) {
    await ctx.db.patch(karyawan._id, { utangTotal: total });
  }
}
var upsertUtang = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertUtang", doc);
    const parsed = validate(utangSchema, doc);
    if (!parsed.success)
      return badRequest("Data utang tidak valid", parsed.errors);
    const d = parsed.data;
    const prev = await findOneByKey(ctx, "utang", "id", d.id);
    const prevKaryawan = prev ? prev.idKaryawan : void 0;
    const res = await upsertByKey(ctx, "utang", "id", d.id, {
      idKaryawan: d.idKaryawan,
      tanggal: d.tanggal,
      nominal: d.nominal,
      status: d.status,
      dibayar: d.dibayar,
      tglBayar: d.tglBayar ?? "",
      sisaUtang: d.sisaUtang,
      keterangan: d.keterangan ?? "",
      jenis: d.jenis ?? "Utang"
    });
    await syncKaryawanUtangTotal(ctx, d.idKaryawan);
    if (prevKaryawan && prevKaryawan !== d.idKaryawan)
      await syncKaryawanUtangTotal(ctx, prevKaryawan);
    logResponse("upsertUtang", res);
    return res;
  }
});
var bayarUtang = mutation({
  args: { id: import_values2.v.string(), jumlah: import_values2.v.number(), tglBayar: import_values2.v.optional(import_values2.v.string()) },
  handler: async (ctx, { id, jumlah, tglBayar }) => {
    logRequest("bayarUtang", { id, jumlah, tglBayar });
    if (jumlah <= 0)
      return badRequest("Jumlah pembayaran harus lebih dari 0");
    const utang = await findOneByKey(ctx, "utang", "id", id);
    if (!utang)
      return badRequest("Utang tidak ditemukan", { id });
    const dibayar = utang.dibayar + jumlah;
    const sisaUtang = Math.max(0, utang.nominal - dibayar);
    const status = sisaUtang <= 0 ? "Lunas" : dibayar > 0 ? "Parsial" : "Belum";
    const tgl = tglBayar || todayStr();
    await ctx.db.patch(utang._id, { dibayar, sisaUtang, status, tglBayar: tgl });
    await recordKas(ctx, `KAS-UTG-${id}-${Date.now().toString(36)}`, tgl, jumlah, 0, `Pembayaran utang ${utang.keterangan || utang.id}`, "Pembayaran Utang");
    await syncKaryawanUtangTotal(ctx, utang.idKaryawan);
    logResponse("bayarUtang", { id, dibayar, sisaUtang, status });
    return { id, dibayar, sisaUtang, status };
  }
});
var createInvoice = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("createInvoice", doc);
    const parsed = validate(invoiceSchema, doc);
    if (!parsed.success)
      return badRequest("Payload invoice tidak sesuai schema", parsed.errors);
    const d = parsed.data;
    const totals = computeInvoiceTotals(d.tipe, d.items);
    const mataUang = doc?.mataUang === "$" ? "$" : "Rp";
    const statusPembayaran = d.statusPembayaran === "Lunas" ? "Lunas" : "Pending";
    const totalTagihan = totals.totalPenjualan || totals.total || 0;
    const existing = await findOneByKey(ctx, "invoice", "idInvoice", d.idInvoice);
    const id = existing ? existing._id : void 0;
    if (id) {
      const prevDibayar = existing.dibayar ?? 0;
      await ctx.db.patch(id, {
        tanggal: d.tanggal,
        tipe: d.tipe,
        namaPihak: d.namaPihak,
        tenggat: d.tenggat ?? "",
        mataUang,
        items: d.items,
        total: totals.total,
        totalModal: totals.totalModal,
        totalPenjualan: totals.totalPenjualan,
        margin: totals.margin,
        sisa: Math.max(0, totalTagihan - prevDibayar)
      });
    } else {
      await ctx.db.insert("invoice", {
        idInvoice: d.idInvoice,
        tanggal: d.tanggal,
        tipe: d.tipe,
        namaPihak: d.namaPihak,
        tenggat: d.tenggat ?? "",
        mataUang,
        statusPembayaran,
        items: d.items,
        total: totals.total,
        totalModal: totals.totalModal,
        totalPenjualan: totals.totalPenjualan,
        margin: totals.margin,
        dibayar: 0,
        sisa: totalTagihan,
        riwayatBayar: []
      });
    }
    await applyInvoiceStokKas(ctx, d, totals);
    for (const it of d.items) {
      const b = await findOneByKey(ctx, "barang", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("barang", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          harga: it.hargaJual ?? it.hargaModal,
          kategori: ""
        });
      }
    }
    logResponse("createInvoice", { idInvoice: d.idInvoice, ...totals });
    return { idInvoice: d.idInvoice, ...totals };
  }
});
async function applyInvoiceStokKas(ctx, d, totals) {
  const tipe = d.tipe;
  const refKey = `INV-${d.idInvoice}`;
  if (tipe === "Supplier") {
    for (const it of d.items) {
      await addStokHistory(ctx, it.namaBarang, d.tanggal, it.qty, "Supplier", `Invoice ${d.idInvoice}`);
    }
    await recordKas(ctx, refKey, d.tanggal, 0, totals.total, `Pembelian dari ${d.namaPihak} (${d.idInvoice})`, "Invoice Supplier");
  } else if (tipe === "Reseller" || tipe === "DPL") {
    for (const it of d.items) {
      await addStokHistory(ctx, it.namaBarang, d.tanggal, -it.qty, tipe, `Invoice ${d.idInvoice}`);
    }
    await recordKas(ctx, refKey, d.tanggal, totals.totalPenjualan, 0, `Penjualan ke ${d.namaPihak} (${d.idInvoice})`, `Invoice ${tipe}`);
  } else {
    for (const it of d.items) {
      const stokAwal = it.stokAwal ?? 0;
      const stokAkhir = it.stokAkhir ?? 0;
      await addStokHistory(ctx, it.namaBarang, d.tanggal, -stokAwal, "Pasar", `Kirim stok awal ke ${d.namaPihak} (${d.idInvoice})`);
      if (stokAkhir > 0) {
        await addStokHistory(ctx, it.namaBarang, d.tanggal, stokAkhir, "Pasar", `Stok akhir kembali dari ${d.namaPihak} (${d.idInvoice})`);
      }
    }
    await recordKas(ctx, refKey, d.tanggal, totals.totalPenjualan, 0, `Penjualan di Pasar ${d.namaPihak} (${d.idInvoice})`, "Invoice Pasar");
  }
}
async function purgeInvoiceEffects(ctx, idInvoice) {
  const allHist = await ctx.db.query("stokHistory").collect();
  const hist = allHist.filter(
    (h) => h.keterangan === `Invoice ${idInvoice}` || (h.keterangan ?? "").includes(`(${idInvoice})`)
  );
  for (const h of hist)
    await ctx.db.delete(h._id);
  const kas = await findOneByKey(ctx, "kas", "id", `INV-${idInvoice}`);
  if (kas)
    await ctx.db.delete(kas._id);
  await recomputeKas(ctx);
}
var editInvoice = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("editInvoice", doc);
    const parsed = validate(invoiceSchema, doc);
    if (!parsed.success)
      return badRequest("Payload invoice tidak sesuai schema", parsed.errors);
    const d = parsed.data;
    const existing = await findOneByKey(ctx, "invoice", "idInvoice", d.idInvoice);
    if (!existing) {
      return badRequest("Invoice tidak ditemukan \u2014 gunakan 'Buat Invoice' untuk invoice baru", { idInvoice: d.idInvoice });
    }
    const totals = computeInvoiceTotals(d.tipe, d.items);
    const mataUang = doc?.mataUang === "$" ? "$" : "Rp";
    const totalTagihan = totals.totalPenjualan || totals.total || 0;
    const prevDibayar = existing.dibayar ?? 0;
    await purgeInvoiceEffects(ctx, d.idInvoice);
    await ctx.db.patch(existing._id, {
      tanggal: d.tanggal,
      tipe: d.tipe,
      namaPihak: d.namaPihak,
      tenggat: d.tenggat ?? "",
      mataUang,
      items: d.items,
      total: totals.total,
      totalModal: totals.totalModal,
      totalPenjualan: totals.totalPenjualan,
      margin: totals.margin,
      sisa: Math.max(0, totalTagihan - prevDibayar)
    });
    await applyInvoiceStokKas(ctx, d, totals);
    for (const it of d.items) {
      const b = await findOneByKey(ctx, "barang", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("barang", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          harga: it.hargaJual ?? it.hargaModal,
          kategori: ""
        });
      }
    }
    logResponse("editInvoice", { idInvoice: d.idInvoice, ...totals });
    return { idInvoice: d.idInvoice, ...totals, edited: true };
  }
});
var setStatusInvoice = mutation({
  args: { idInvoice: import_values2.v.string(), status: import_values2.v.string() },
  handler: async (ctx, { idInvoice, status }) => {
    logRequest("setStatusInvoice", { idInvoice, status });
    if (status !== "Lunas" && status !== "Pending") {
      return badRequest("Status pembayaran harus 'Lunas' atau 'Pending'", { status });
    }
    const inv = await findOneByKey(ctx, "invoice", "idInvoice", idInvoice);
    if (!inv)
      return badRequest("Invoice tidak ditemukan", { idInvoice });
    if (status === "Lunas") {
      const totalTagihan = inv.totalPenjualan || inv.total || 0;
      await ctx.db.patch(inv._id, { statusPembayaran: "Lunas", dibayar: totalTagihan, sisa: 0 });
    } else {
      await ctx.db.patch(inv._id, { statusPembayaran: "Pending" });
    }
    logResponse("setStatusInvoice", { idInvoice, status });
    return { idInvoice, status };
  }
});
var deleteInvoice = mutation({
  args: { idInvoice: import_values2.v.string() },
  handler: async (ctx, { idInvoice }) => {
    logRequest("deleteInvoice", { idInvoice });
    const inv = await findOneByKey(ctx, "invoice", "idInvoice", idInvoice);
    if (!inv)
      return { deleted: false };
    const allHist = await ctx.db.query("stokHistory").collect();
    const hist = allHist.filter(
      (h) => h.keterangan === `Invoice ${idInvoice}` || (h.keterangan ?? "").includes(`(${idInvoice})`)
    );
    for (const h of hist)
      await ctx.db.delete(h._id);
    const kas = await findOneByKey(ctx, "kas", "id", `INV-${idInvoice}`);
    if (kas)
      await ctx.db.delete(kas._id);
    await recomputeKas(ctx);
    await ctx.db.delete(inv._id);
    logResponse("deleteInvoice", { deleted: true });
    return { deleted: true };
  }
});
var upsertRetur = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertRetur", doc);
    const parsed = validate(returSchema, doc);
    if (!parsed.success)
      return badRequest("Data retur tidak valid", parsed.errors);
    const d = parsed.data;
    const qty = Math.round((Number(d.qty) || 0) * 100) / 100;
    const res = await upsertByKey(ctx, "retur", "id", d.id, {
      tanggal: d.tanggal,
      tipe: d.tipe,
      namaPihak: d.namaPihak,
      namaBarang: d.namaBarang,
      qty,
      keterangan: d.keterangan ?? ""
    });
    await addStokHistory(ctx, d.namaBarang, d.tanggal, qty, "Retur", `Retur dari ${d.tipe} ${d.namaPihak} (${d.id})`);
    logResponse("upsertRetur", res);
    return res;
  }
});
var upsertKasManual = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertKasManual", doc);
    const parsed = validate(kasSchema, doc);
    if (!parsed.success)
      return badRequest("Data kas tidak valid", parsed.errors);
    const d = parsed.data;
    if (d.kasMasuk > 0 && d.kasKeluar > 0)
      return badRequest("Pilih salah satu: kas masuk ATAU kas keluar");
    const refKey = d.id;
    const res = await upsertByKey(ctx, "kas", "id", refKey, {
      tanggal: d.tanggal,
      kasMasuk: d.kasMasuk,
      kasKeluar: d.kasKeluar,
      saldoAwal: 0,
      saldoAkhir: 0,
      keterangan: d.keterangan ?? "",
      sumber: "Manual"
    });
    await recomputeKas(ctx);
    logResponse("upsertKasManual", res);
    return res;
  }
});
var deleteKas = mutation({
  args: { id: import_values2.v.string() },
  handler: async (ctx, { id }) => {
    logRequest("deleteKas", { id });
    const row = await findOneByKey(ctx, "kas", "id", id);
    if (!row)
      return { deleted: false, id };
    const sumber = row.sumber;
    if (sumber !== "Manual" && sumber !== "Saldo Awal") {
      return badRequest(
        `Transaksi ${sumber} tidak bisa dihapus langsung \u2014 hapus dari sumbernya (invoice/pengeluaran/slip gaji)`,
        { id, sumber }
      );
    }
    await ctx.db.delete(row._id);
    await recomputeKas(ctx);
    logResponse("deleteKas", { deleted: true, id });
    return { deleted: true, id };
  }
});
var setSaldoAwalKas = mutation({
  args: { nominal: import_values2.v.number(), tanggal: import_values2.v.optional(import_values2.v.string()) },
  handler: async (ctx, { nominal, tanggal }) => {
    logRequest("setSaldoAwalKas", { nominal, tanggal });
    if (nominal < 0)
      return badRequest("Saldo awal tidak boleh negatif");
    const existing = await findOneByKey(ctx, "kas", "id", "KAS-AWAL");
    if (existing) {
      await ctx.db.patch(existing._id, { kasMasuk: nominal, kasKeluar: 0, tanggal: tanggal || todayStr(), keterangan: "Saldo awal kas" });
    } else {
      await ctx.db.insert("kas", {
        id: "KAS-AWAL",
        tanggal: tanggal || todayStr(),
        kasMasuk: nominal,
        kasKeluar: 0,
        saldoAwal: 0,
        saldoAkhir: 0,
        keterangan: "Saldo awal kas",
        sumber: "Saldo Awal"
      });
    }
    await recomputeKas(ctx);
    logResponse("setSaldoAwalKas", { ok: true });
    return { ok: true };
  }
});
var upsertPengeluaran = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertPengeluaran", doc);
    const parsed = validate(pengeluaranSchema, doc);
    if (!parsed.success)
      return badRequest("Data pengeluaran tidak valid", parsed.errors);
    const d = parsed.data;
    const existing = await findOneByKey(ctx, "pengeluaran", "id", d.id);
    if (existing) {
      await ctx.db.patch(existing._id, {
        tanggal: d.tanggal,
        jenis: d.jenis,
        nominal: d.nominal,
        keterangan: d.keterangan ?? "",
        idKaryawan: d.idKaryawan ?? ""
      });
    } else {
      await ctx.db.insert("pengeluaran", {
        id: d.id,
        tanggal: d.tanggal,
        jenis: d.jenis,
        nominal: d.nominal,
        keterangan: d.keterangan ?? "",
        idKaryawan: d.idKaryawan ?? ""
      });
    }
    await recordKas(ctx, `KAS-PEN-${d.id}`, d.tanggal, 0, d.nominal, `Pengeluaran ${d.jenis}${d.keterangan ? `: ${d.keterangan}` : ""} (${d.id})`, "Pengeluaran");
    if (d.jenis === "Utang Karyawan" && d.idKaryawan) {
      const utangId = `UTG-PEN-${d.id}`;
      await upsertByKey(ctx, "utang", "id", utangId, {
        idKaryawan: d.idKaryawan,
        tanggal: d.tanggal,
        nominal: d.nominal,
        status: "Belum",
        dibayar: 0,
        tglBayar: "",
        sisaUtang: d.nominal,
        keterangan: `Pengeluaran utang karyawan ${d.keterangan || ""}`.trim(),
        jenis: "Utang"
      });
      await syncKaryawanUtangTotal(ctx, d.idKaryawan);
    }
    logResponse("upsertPengeluaran", { id: d.id });
    return { id: d.id };
  }
});
var upsertGudang = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertGudang", doc);
    const parsed = validate(gudangSchema, doc);
    if (!parsed.success)
      return badRequest("Data gudang tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "gudang", "namaBarang", d.namaBarang, {
      id: d.id,
      stokAwal: d.stokAwal,
      tanggalStokAwal: d.tanggalStokAwal ?? "",
      keterangan: d.keterangan ?? ""
    });
    logResponse("upsertGudang", res);
    return res;
  }
});
var adjustStok = mutation({
  args: { namaBarang: import_values2.v.string(), stokBaru: import_values2.v.number(), keterangan: import_values2.v.optional(import_values2.v.string()) },
  handler: async (ctx, { namaBarang, stokBaru, keterangan }) => {
    logRequest("adjustStok", { namaBarang, stokBaru, keterangan });
    await ensureGudangRow(ctx, namaBarang);
    const history = await ctx.db.query("stokHistory").filter((q) => q.eq(q.field("namaBarang"), namaBarang)).collect();
    const gudang = await findOneByKey(ctx, "gudang", "namaBarang", namaBarang);
    const net = history.reduce((s, h) => s + h.perubahan, 0);
    const current = (gudang?.stokAwal ?? 0) + net;
    const delta = stokBaru - current;
    await ctx.db.insert("stokHistory", {
      id: `STK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      tanggal: todayStr(),
      namaBarang,
      perubahan: delta,
      tipe: "Manual",
      keterangan: keterangan ?? "Penyesuaian stok"
    });
    logResponse("adjustStok", { namaBarang, delta, stokBaru });
    return { namaBarang, delta, stokBaru };
  }
});
var createSlipGaji = mutation({
  args: {
    idKaryawan: import_values2.v.string(),
    periode: import_values2.v.string(),
    // YYYY-MM
    bonusKerajinan: import_values2.v.optional(import_values2.v.number()),
    bonusBulanan: import_values2.v.optional(import_values2.v.number()),
    denda: import_values2.v.optional(import_values2.v.number()),
    // Potongan utang/casbon manual (0/kosong = otomatis dari sisa)
    potonganUtangManual: import_values2.v.optional(import_values2.v.number()),
    potonganCasbonManual: import_values2.v.optional(import_values2.v.number())
  },
  handler: async (ctx, { idKaryawan, periode, bonusKerajinan, bonusBulanan, denda, potonganUtangManual, potonganCasbonManual }) => {
    logRequest("createSlipGaji", { idKaryawan, periode, bonusKerajinan, bonusBulanan, denda, potonganUtangManual, potonganCasbonManual });
    const karyawan = await ctx.db.query("karyawan").filter((q) => q.eq(q.field("id"), idKaryawan)).first();
    if (!karyawan)
      return badRequest("Karyawan tidak ditemukan", { idKaryawan });
    const absensi = await ctx.db.query("absensi").filter((q) => q.eq(q.field("idKaryawan"), idKaryawan)).collect();
    const absensiBulan = absensi.filter((a) => monthOf(a.tanggal) === periode);
    const counts = countAbsensi(absensiBulan);
    const utang = await ctx.db.query("utang").filter((q) => q.eq(q.field("idKaryawan"), idKaryawan)).collect();
    const sisaUtang = utang.filter((u) => u.jenis === "Utang").reduce((s, u) => s + u.sisaUtang, 0);
    const sisaCasbon = utang.filter((u) => u.jenis === "Casbon").reduce((s, u) => s + u.sisaUtang, 0);
    const gaji = computeSlipGaji({
      gajiPokok: karyawan.gajiPokok,
      bonusKerajinan: bonusKerajinan ?? 0,
      bonusBulanan: bonusBulanan ?? 0,
      denda: denda ?? 0,
      absensi: counts,
      sisaUtang,
      sisaCasbon,
      potonganUtangManual: potonganUtangManual ?? 0,
      potonganCasbonManual: potonganCasbonManual ?? 0
    });
    const slipId = `SLP-${periode}-${idKaryawan}`;
    const existing = await findOneByKey(ctx, "slipgaji", "id", slipId);
    const slipData = {
      idKaryawan,
      periode,
      tanggal: todayStr(),
      gajiPokok: karyawan.gajiPokok,
      bonusKerajinan: bonusKerajinan ?? 0,
      bonusBulanan: bonusBulanan ?? 0,
      denda: gaji.denda,
      hadir: counts.hadir,
      izin: counts.izin,
      sakit: counts.sakit,
      alpa: counts.alpa,
      potonganAbsensi: gaji.potonganAbsensi,
      potonganUtang: gaji.potonganUtang,
      potonganCasbon: gaji.potonganCasbon,
      gajiBersih: gaji.gajiBersih,
      sisaUtang: gaji.sisaUtangAkhir,
      sisaCasbon: gaji.sisaCasbonAkhir
    };
    if (existing) {
      await ctx.db.patch(existing._id, slipData);
    } else {
      await ctx.db.insert("slipgaji", { id: slipId, ...slipData });
    }
    await recordKas(ctx, `KAS-SLP-${slipId}`, todayStr(), 0, gaji.gajiBersih, `Slip gaji ${karyawan.nama} periode ${periode}`, "Slip Gaji");
    if (gaji.denda > 0) {
      await recordKas(ctx, `KAS-DND-${slipId}`, todayStr(), gaji.denda, 0, `Denda ${karyawan.nama} periode ${periode}`, "Denda");
    }
    let sisaPotonganUtang = gaji.potonganUtang;
    for (const u of utang.filter((x) => x.jenis === "Utang" && x.sisaUtang > 0)) {
      if (sisaPotonganUtang <= 0)
        break;
      const potong = Math.min(sisaPotonganUtang, u.sisaUtang);
      sisaPotonganUtang -= potong;
      const dibayar = u.dibayar + potong;
      const sisa = u.nominal - dibayar;
      await ctx.db.patch(u._id, {
        dibayar,
        sisaUtang: sisa,
        status: sisa <= 0 ? "Lunas" : "Parsial",
        tglBayar: todayStr()
      });
    }
    let sisaPotonganCasbon = gaji.potonganCasbon;
    for (const u of utang.filter((x) => x.jenis === "Casbon" && x.sisaUtang > 0)) {
      if (sisaPotonganCasbon <= 0)
        break;
      const potong = Math.min(sisaPotonganCasbon, u.sisaUtang);
      sisaPotonganCasbon -= potong;
      const dibayar = u.dibayar + potong;
      const sisa = u.nominal - dibayar;
      await ctx.db.patch(u._id, {
        dibayar,
        sisaUtang: sisa,
        status: sisa <= 0 ? "Lunas" : "Parsial",
        tglBayar: todayStr()
      });
    }
    await syncKaryawanUtangTotal(ctx, idKaryawan);
    logResponse("createSlipGaji", { slipId, ...gaji });
    return {
      id: slipId,
      ...gaji,
      nama: karyawan.nama,
      sisaUtangAkhir: gaji.sisaUtangAkhir,
      sisaCasbonAkhir: gaji.sisaCasbonAkhir
    };
  }
});
async function ensureTetesanStokRow(ctx, namaBarang, tipe, stokAwal = 0) {
  const existing = await findOneByKey(ctx, "tetesanStok", "namaBarang", namaBarang);
  if (!existing) {
    await ctx.db.insert("tetesanStok", {
      id: `TSTK-${Date.now().toString(36).toUpperCase()}`,
      namaBarang,
      tipe,
      stokAwal,
      keterangan: ""
    });
  }
}
async function addTetesanStokHistory(ctx, namaBarang, tipe, tanggal, perubahan, asal, keterangan) {
  await ensureTetesanStokRow(ctx, namaBarang, tipe);
  await ctx.db.insert("tetesanStokHistory", {
    id: `TSTK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    tanggal,
    namaBarang,
    perubahan,
    tipe: asal,
    keterangan: keterangan ?? ""
  });
}
function tetesanDoc(doc) {
  if (!doc || typeof doc !== "object")
    return badRequest("Payload tidak sesuai schema", { doc });
  return doc;
}
var upsertBahanBaku = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertBahanBaku", doc);
    const d = tetesanDoc(doc);
    if (!d.kode || !d.nama)
      return badRequest("Kode & nama bahan baku wajib diisi");
    if ((Number(d.hargaModal) || 0) < 0)
      return badRequest("Harga modal tidak boleh negatif");
    const res = await upsertByKey(ctx, "bahanBaku", "kode", d.kode, {
      nama: d.nama,
      hargaModal: Number(d.hargaModal) || 0,
      stokAwal: Number(d.stokAwal) || 0,
      kategori: d.kategori ?? ""
    });
    await ensureTetesanStokRow(ctx, d.nama, "Baku", Number(d.stokAwal) || 0);
    logResponse("upsertBahanBaku", res);
    return res;
  }
});
var upsertBarangJadi = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertBarangJadi", doc);
    const d = tetesanDoc(doc);
    if (!d.kode || !d.nama)
      return badRequest("Kode & nama barang jadi wajib diisi");
    if ((Number(d.hargaJual) || 0) < 0)
      return badRequest("Harga jual tidak boleh negatif");
    const res = await upsertByKey(ctx, "barangJadi", "kode", d.kode, {
      nama: d.nama,
      hargaJual: Number(d.hargaJual) || 0,
      stokAwal: Number(d.stokAwal) || 0,
      kategori: d.kategori ?? ""
    });
    await ensureTetesanStokRow(ctx, d.nama, "Jadi", Number(d.stokAwal) || 0);
    logResponse("upsertBarangJadi", res);
    return res;
  }
});
var upsertTetesanStok = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertTetesanStok", doc);
    const d = tetesanDoc(doc);
    if (!d.namaBarang)
      return badRequest("Nama barang wajib diisi");
    if ((Number(d.stokAwal) || 0) < 0)
      return badRequest("Stok awal tidak boleh negatif");
    const res = await upsertByKey(ctx, "tetesanStok", "namaBarang", d.namaBarang, {
      id: d.id ?? `TSTK-${Date.now().toString(36).toUpperCase()}`,
      tipe: d.tipe === "Jadi" ? "Jadi" : "Baku",
      stokAwal: Number(d.stokAwal) || 0,
      tanggalStokAwal: d.tanggalStokAwal ?? "",
      keterangan: d.keterangan ?? ""
    });
    logResponse("upsertTetesanStok", res);
    return res;
  }
});
var createInvoiceTetesan = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("createInvoiceTetesan", doc);
    const d = tetesanDoc(doc);
    const norm = normalizeTetesanInvoice(d);
    if (!norm.ok)
      return badRequest(norm.error);
    const { tipe, items, mataUang } = norm;
    const totals = computeTetesanTotals(tipe, items);
    const existing = await findOneByKey(ctx, "invoiceTetesan", "idInvoice", d.idInvoice);
    if (existing) {
      const prevDibayar = existing.dibayar ?? 0;
      await ctx.db.patch(existing._id, {
        tanggal: d.tanggal,
        tipe,
        namaPihak: d.namaPihak,
        mataUang,
        items,
        total: totals.total,
        sisa: Math.max(0, totals.total - prevDibayar)
      });
    } else {
      await ctx.db.insert("invoiceTetesan", {
        idInvoice: d.idInvoice,
        tanggal: d.tanggal,
        tipe,
        namaPihak: d.namaPihak,
        mataUang,
        items,
        total: totals.total,
        statusPembayaran: "Pending",
        dibayar: 0,
        sisa: totals.total,
        riwayatBayar: []
      });
    }
    await applyTetesanStokKas(ctx, d, tipe, items, totals);
    logResponse("createInvoiceTetesan", { idInvoice: d.idInvoice, total: totals.total });
    return { idInvoice: d.idInvoice, total: totals.total };
  }
});
function normalizeTetesanInvoice(d) {
  if (!d.idInvoice || !d.tanggal || !d.namaPihak) {
    return { ok: false, error: "Payload invoice tetesan tidak sesuai schema \u2014 butuh idInvoice, tanggal, namaPihak" };
  }
  const tipe = d.tipe === "Penjualan" ? "Penjualan" : "Modal";
  const items = Array.isArray(d.items) ? d.items.map((it) => ({
    kodeBarang: String(it.kodeBarang ?? ""),
    namaBarang: String(it.namaBarang ?? ""),
    harga: Number(it.harga) || 0,
    qty: Number(it.qty) || 0,
    subtotal: Number(it.subtotal) || 0
  })) : [];
  if (items.length === 0)
    return { ok: false, error: "Invoice minimal berisi 1 barang" };
  for (const it of items) {
    if (!it.kodeBarang || !it.namaBarang)
      return { ok: false, error: "Kode & nama barang wajib diisi" };
    if (it.qty <= 0)
      return { ok: false, error: "Qty harus lebih dari 0" };
  }
  return { ok: true, tipe, items, mataUang: d.mataUang === "$" ? "$" : "Rp" };
}
async function applyTetesanStokKas(ctx, d, tipe, items, totals) {
  if (tipe === "Modal") {
    for (const it of items) {
      await addTetesanStokHistory(ctx, it.namaBarang, "Baku", d.tanggal, it.qty, "Invoice Modal", `Invoice Modal ${d.idInvoice}`);
      await addStokHistory(ctx, it.namaBarang, d.tanggal, -it.qty, "Tetesan Modal", `Invoice Modal Tetesan ${d.idInvoice}`);
      const b = await findOneByKey(ctx, "bahanBaku", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("bahanBaku", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          hargaModal: it.harga,
          stokAwal: 0,
          kategori: ""
        });
      }
    }
    await recordKas(ctx, `KAS-TET-${d.idInvoice}`, d.tanggal, 0, totals.total, `Invoice Modal Tetesan ${d.namaPihak} (${d.idInvoice})`, "Invoice Modal Tetesan");
  } else {
    for (const it of items) {
      await addTetesanStokHistory(ctx, it.namaBarang, "Jadi", d.tanggal, -it.qty, "Invoice Penjualan", `Invoice Penjualan ${d.idInvoice}`);
      const b = await findOneByKey(ctx, "barangJadi", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("barangJadi", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          hargaJual: it.harga,
          stokAwal: 0,
          kategori: ""
        });
      }
    }
    await recordKas(ctx, `KAS-TET-${d.idInvoice}`, d.tanggal, totals.total, 0, `Invoice Penjualan Tetesan ${d.namaPihak} (${d.idInvoice})`, "Invoice Penjualan Tetesan");
  }
}
async function purgeTetesanEffects(ctx, idInvoice) {
  const allHist = await ctx.db.query("tetesanStokHistory").collect();
  const hist = allHist.filter((h) => (h.keterangan ?? "").includes(idInvoice));
  for (const h of hist)
    await ctx.db.delete(h._id);
  const allGudangHist = await ctx.db.query("stokHistory").collect();
  const gHist = allGudangHist.filter((h) => h.tipe === "Tetesan Modal" && (h.keterangan ?? "").includes(idInvoice));
  for (const h of gHist)
    await ctx.db.delete(h._id);
  const kas = await findOneByKey(ctx, "kas", "id", `KAS-TET-${idInvoice}`);
  if (kas)
    await ctx.db.delete(kas._id);
  await recomputeKas(ctx);
}
var editInvoiceTetesan = mutation({
  args: { doc: import_values2.v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("editInvoiceTetesan", doc);
    const d = tetesanDoc(doc);
    const norm = normalizeTetesanInvoice(d);
    if (!norm.ok)
      return badRequest(norm.error);
    const { tipe, items, mataUang } = norm;
    const existing = await findOneByKey(ctx, "invoiceTetesan", "idInvoice", d.idInvoice);
    if (!existing) {
      return badRequest("Invoice tidak ditemukan \u2014 buat invoice baru untuk transaksi baru", { idInvoice: d.idInvoice });
    }
    const totals = computeTetesanTotals(tipe, items);
    const prevDibayar = existing.dibayar ?? 0;
    await purgeTetesanEffects(ctx, d.idInvoice);
    await ctx.db.patch(existing._id, {
      tanggal: d.tanggal,
      tipe,
      namaPihak: d.namaPihak,
      mataUang,
      items,
      total: totals.total,
      sisa: Math.max(0, totals.total - prevDibayar)
    });
    await applyTetesanStokKas(ctx, d, tipe, items, totals);
    logResponse("editInvoiceTetesan", { idInvoice: d.idInvoice, total: totals.total });
    return { idInvoice: d.idInvoice, total: totals.total, edited: true };
  }
});
var deleteInvoiceTetesan = mutation({
  args: { idInvoice: import_values2.v.string() },
  handler: async (ctx, { idInvoice }) => {
    logRequest("deleteInvoiceTetesan", { idInvoice });
    const inv = await findOneByKey(ctx, "invoiceTetesan", "idInvoice", idInvoice);
    if (!inv)
      return { deleted: false };
    const allHist = await ctx.db.query("tetesanStokHistory").collect();
    const hist = allHist.filter((h) => (h.keterangan ?? "").includes(idInvoice));
    for (const h of hist)
      await ctx.db.delete(h._id);
    const allGudangHist = await ctx.db.query("stokHistory").collect();
    const gHist = allGudangHist.filter((h) => h.tipe === "Tetesan Modal" && (h.keterangan ?? "").includes(idInvoice));
    for (const h of gHist)
      await ctx.db.delete(h._id);
    const kas = await findOneByKey(ctx, "kas", "id", `KAS-TET-${idInvoice}`);
    if (kas)
      await ctx.db.delete(kas._id);
    await recomputeKas(ctx);
    await ctx.db.delete(inv._id);
    logResponse("deleteInvoiceTetesan", { deleted: true });
    return { deleted: true };
  }
});

// scripts/.probe-pasar-entry.tsx
function makeDb() {
  const tables = /* @__PURE__ */ new Map();
  let seq = 0;
  const ensure = (name) => {
    if (!tables.has(name))
      tables.set(name, /* @__PURE__ */ new Map());
    return tables.get(name);
  };
  const chain = (items) => {
    const qApi = { field: (f) => ({ __f: f }), eq: (a, b) => ({ __eq: [a, b] }), and: (a, b) => ({ __and: [a, b] }), or: (a, b) => ({ __or: [a, b] }), lt: (a, b) => ({ __lt: [a, b] }), gt: (a, b) => ({ __gt: [a, b] }) };
    const evalExpr = (e, doc) => {
      if (!e)
        return false;
      if (e.__f)
        return doc[e.__f];
      if (e.__eq)
        return evalExpr(e.__eq[0], doc) === e.__eq[1];
      if (e.__and)
        return evalExpr(e.__and[0], doc) && evalExpr(e.__and[1], doc);
      if (e.__or)
        return evalExpr(e.__or[0], doc) || evalExpr(e.__or[1], doc);
      if (e.__lt)
        return evalExpr(e.__lt[0], doc) < e.__lt[1];
      if (e.__gt)
        return evalExpr(e.__gt[0], doc) > e.__gt[1];
      return false;
    };
    return {
      filter(pred) {
        const expr = pred(qApi);
        return chain(items.filter((d) => evalExpr(expr, d)));
      },
      collect() {
        return items.map((d) => ({ ...d }));
      },
      first() {
        return items.length ? { ...items[0] } : null;
      }
    };
  };
  return {
    query(name) {
      return chain([...ensure(name).values()]);
    },
    insert(name, doc) {
      const t = ensure(name);
      const _id = "_" + name + "_" + ++seq;
      t.set(_id, { _id, _creationTime: Date.now() + seq, ...doc });
      return _id;
    },
    patch(id, patch) {
      for (const t of tables.values()) {
        const d = t.get(id);
        if (d) {
          Object.assign(d, patch);
          return;
        }
      }
    },
    delete(id) {
      for (const t of tables.values())
        t.delete(id);
    }
  };
}
function makeCtx() {
  return { db: makeDb() };
}
async function run(fn, ctx, args) {
  try {
    const handler = typeof fn === "function" ? fn._handler : fn.handler;
    const res = await handler(ctx, args);
    return { ok: true, res };
  } catch (e) {
    return { ok: false, data: e && e.data || {}, msg: String(e && e.message || e) };
  }
}
var invokeCreateInvoice = (ctx, doc) => run(createInvoice, ctx, { doc });
var invokeEditInvoice = (ctx, doc) => run(editInvoice, ctx, { doc });
var schemaInvoice = (doc) => validate(invoiceSchema, doc);
var totalsInvoice = (tipe, items) => computeInvoiceTotals(tipe, items);
var parseNumFn = parseNum;
var roundNumFn = roundNum;
function loadItemsForEdit(invItems) {
  return (invItems ?? []).map((it) => ({
    kodeBarang: it.kodeBarang ?? "",
    namaBarang: it.namaBarang ?? "",
    hargaModal: parseNum(it.hargaModal),
    qty: parseNum(it.qty) || 1,
    hargaJual: parseNum(it.hargaJual),
    stokAwal: it.stokAwal != null ? parseNum(it.stokAwal) : void 0,
    stokAkhir: it.stokAkhir != null ? parseNum(it.stokAkhir) : void 0,
    subtotal: parseNum(it.subtotal)
  }));
}
function itemSubtotal(tipe, it) {
  const qty = tipe === "Pasar" ? parseNum(it.stokAwal) - parseNum(it.stokAkhir) : parseNum(it.qty);
  const harga = tipe === "Supplier" ? parseNum(it.hargaModal) : parseNum(it.hargaJual);
  const st = roundNum(qty * harga);
  return tipe === "Pasar" ? st : Math.max(0, st);
}
function buildCleanItems(tipe, items) {
  return items.filter((it) => {
    const hasName = !!it.kodeBarang || !!it.namaBarang;
    const hasVal = parseNum(it.qty) > 0 || parseNum(it.hargaModal) > 0 || parseNum(it.hargaJual) > 0 || parseNum(it.stokAwal) > 0 || parseNum(it.stokAkhir) > 0;
    return hasName || hasVal;
  }).map((it) => {
    const stokAwal = tipe === "Pasar" ? parseNum(it.stokAwal) : 0;
    const stokAkhir = tipe === "Pasar" ? parseNum(it.stokAkhir) : 0;
    return {
      kodeBarang: it.kodeBarang,
      namaBarang: it.namaBarang,
      hargaModal: parseNum(it.hargaModal),
      hargaJual: parseNum(it.hargaJual),
      qty: stokAwal || parseNum(it.qty),
      subtotal: itemSubtotal(tipe, it),
      stokAwal: tipe === "Pasar" ? stokAwal : void 0,
      stokAkhir: tipe === "Pasar" ? stokAkhir : void 0
    };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildCleanItems,
  invokeCreateInvoice,
  invokeEditInvoice,
  itemSubtotal,
  loadItemsForEdit,
  makeCtx,
  parseNumFn,
  roundNumFn,
  schemaInvoice,
  totalsInvoice
});
