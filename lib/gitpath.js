"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var GitPath = {
  parse: function parse(path) {
    if (_typeof(path) == 'object') return path;

    if (GitPath.isUrl(path)) {
      return GitPath._parseUrl(path);
    }

    return GitPath._parsePath(path);
  },
  _parsePath: function _parsePath(path) {
    //@see: https://regex101.com/r/DwLNHW/5
    var regex = /(?:(?:(?:(?:@)([\w\.]+)\/)?(?:([\w-]+)?\/)([\w-\.]+)(?:(?::)([\w-]+))?)|(?:\.))\/([\w-\.\/]+\.(json|csv|yaml))(?:\/([\w]+))?/mg;
    return GitPath._execRegex(regex, path);
  },
  _parseUrl: function _parseUrl(url) {
    //@see https://regex101.com/r/S9zzb9/5
    var regex = /https?:\/\/[\w\.]*(github|gitlab)[\w]*.com\/([\w-]+)\/([\w-\.]+)\/(?:(?:-\/)?(?:blob\/|raw\/)?([\w]+)\/)([\w\/\-\.]+\.([\w]+))/gm;
    return GitPath._execRegex(regex, url);
  },
  _execRegex: function _execRegex(regex, str) {
    var m,
        groups = {},
        map = ['valid', 'ns', 'owner', 'repo', 'branch', 'path', 'type', 'resource'];

    while ((m = regex.exec(str)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      m.forEach(function (match, groupIndex) {
        groups[map[groupIndex]] = match;
      });
    }

    groups.valid = GitPath.isValid(groups);
    return groups;
  },
  fromUrl: function fromUrl(url) {
    var data = GitPath._parseUrl(url);

    if (!GitPath.isValid(data)) return null;
    data.branch = data.branch && data.branch != 'master' ? ':' + data.branch : '';
    return "@".concat(data.ns, "/").concat(data.owner, "/").concat(data.repo).concat(data.branch, "/").concat(data.path);
  },
  toUrl: function toUrl(path) {
    var raw = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var data = _typeof(path) == 'object' ? path : GitPath.parse(path);
    if (!GitPath.isValid(data)) return null;
    data.branch = data.branch || 'master';

    if (!data.ns || data.ns == 'github') {
      data.server = raw ? 'raw.githubusercontent.com' : 'github.com';
      data.format = raw ? '' : 'blob/';
      return "https://".concat(data.server, "/").concat(data.owner, "/").concat(data.repo, "/").concat(data.format + data.branch, "/").concat(data.path);
    }

    data.server = data.server || 'gitlab.com';
    data.format = raw ? 'raw' : 'blob';
    return "https://".concat(data.server, "/").concat(data.owner, "/").concat(data.repo, "/-/").concat(data.format, "/").concat(data.branch, "/").concat(data.path);
  },
  toApi: function toApi(path) {
    var data = _typeof(path) == 'object' ? path : GitPath.parse(path);
    if (!GitPath.isValid(data)) return null;

    if (!data.ns || data.ns == 'github') {
      data.server = 'api.github.com';
      return "https://".concat(data.server, "/repos/").concat(data.owner, "/").concat(data.repo, "/contents/").concat(data.path);
    }

    data.server = data.server || 'gitlab.com';
    data.project = encodeURIComponent(data.owner + '/' + data.repo);
    data.path = encodeURIComponent(data.path);
    return "https://".concat(data.server, "/api/v4/projects/").concat(data.project, "/repository/files/").concat(data.path);
  },
  isValid: function isValid(obj) {
    if (typeof obj.type == 'undefined' || !['csv', 'json', 'yaml'].includes(obj.type.toLowerCase())) return false;
    var mandatory = ['ns', 'owner', 'repo', 'path'];
    return mandatory.every(function (x) {
      return x in obj && obj[x];
    });
  },
  isUrl: function isUrl(url) {
    /*
    *	@see https://gist.github.com/dperini/729294
    *	MIT © Diego Perini
    */
    var regex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url);
  }
};
var _default = GitPath;
exports["default"] = _default;
module.exports = exports.default;