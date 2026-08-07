"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const GitPath = {
  parse: path => {
    if (typeof path == 'object') return path;

    if (GitPath.isUrl(path)) {
      return GitPath._parseUrl(path);
    }

    return GitPath._parsePath(path);
  },
  _parsePath: path => {
    //@see: https://regex101.com/r/DwLNHW/11
    const regex = /^(?:(?:(?:(?:@)([\w]+)\/)?(?:([\w-]+)?\/)([\w-\.]+)(?:(?:#)([\w-]+))?)|(?:\.))\/?([\w-\/.]*(?:\.([\w]{2,4}))|[\w\/]*)?(?:\/)?([\w]+)?/mg;
    return GitPath._execRegex(regex, path);
  },
  _parseUrl: url => {
    //@see https://regex101.com/r/S9zzb9/5
    const regex = /https?:\/\/[\w\.]*(github|gitlab)[\w]*.com\/([\w-]+)\/([\w-\.]+)\/(?:(?:-\/)?(?:blob\/|raw\/)?([\w]+)\/)([\w\/\-\.]+\.([\w]+))/gm;
    return GitPath._execRegex(regex, url);
  },
  _execRegex: (regex, str) => {
    let m,
        groups = {},
        map = ['valid', 'ns', 'owner', 'repo', 'branch', 'path', 'type', 'resource'];

    while ((m = regex.exec(str)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      m.forEach((match, groupIndex) => {
        groups[map[groupIndex]] = match;
      });
    }

    groups.valid = GitPath.isValid(groups);
    return groups;
  },
  fromUrl: url => {
    let data = GitPath._parseUrl(url);

    if (!GitPath.isValid(data)) return null;
    data.branch = data.branch && data.branch != 'master' ? '#' + data.branch : '';
    return `@${data.ns}/${data.owner}/${data.repo}${data.branch}/${data.path}`;
  },
  toUrl: (path, raw = false) => {
    let data = typeof path == 'object' ? path : GitPath.parse(path);
    if (!GitPath.isValid(data)) return null;
    data.branch = data.branch || 'master';

    if (!data.ns || data.ns == 'github') {
      data.server = raw ? 'raw.githubusercontent.com' : 'github.com';
      data.format = raw ? '' : 'blob/';
      return `https://${data.server}/${data.owner}/${data.repo}/${data.format + data.branch}/${data.path}`;
    }

    data.server = data.server || 'gitlab.com';
    data.format = raw ? 'raw' : 'blob';
    return `https://${data.server}/${data.owner}/${data.repo}/-/${data.format}/${data.branch}/${data.path}`;
  },
  toApi: path => {
    let data = typeof path == 'object' ? path : GitPath.parse(path);
    if (!GitPath.isValid(data)) return null;

    if (!data.ns || data.ns == 'github') {
      data.server = 'api.github.com';
      return `https://${data.server}/repos/${data.owner}/${data.repo}/contents/${data.path}`;
    }

    data.server = data.server || 'gitlab.com';
    data.project = encodeURIComponent(data.owner + '/' + data.repo);
    data.path = encodeURIComponent(data.path);
    return `https://${data.server}/api/v4/projects/${data.project}/repository/files/${data.path}`;
  },
  isValid: obj => {
    if (typeof obj.type == 'undefined' || !['csv', 'json', 'yaml'].includes(obj.type.toLowerCase())) return false;
    let mandatory = ['ns', 'owner', 'repo', 'path'];
    return mandatory.every(x => x in obj && obj[x]);
  },
  isUrl: url => {
    /*
    *	@see https://gist.github.com/dperini/729294
    *	MIT © Diego Perini
    */
    const regex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url);
  }
};
var _default = GitPath;
exports.default = _default;
module.exports = exports.default;
