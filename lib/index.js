/**
 * lei-deploy
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var async = require('async');
var pm2 = require('pm2');
var git = require('git');


function getStartScriptFromDir (dir) {
  var file = path.resolve(dir, 'package.json');
  try {
    var data = JSON.parse(fs.readFileSync(file).toString());
  } catch (err) {
    throw new Error('invalid file "package.json"');
  }
  if (!data.main) throw new Error('missing field "main" in file "package.json"');
  return data.main;
}

/**
 * 部署代码
 *
 * @param {Object} options
 *   - {String} name 服务名称
 *   - {String} script 启动脚本
 *   - {String} dir 项目根目录
 *   - {String} branch Git项目所在分支
 * @param {Function} callback
 */
exports.delopy = function (options, callback) {
  var deploy = new Deploy(options);

  deploy.deploy(function (err, info) {
    if (!err) return callback(null, info);

    deploy.rollback(callback);
  });
};


function Deploy (options) {
  this.options = options || {};
  if (!options.name) throw new TypeError('missing parameter "name"');
  if (!options.dir) throw new TypeError('missing parameter "dir"');
  if (!options.branch) options.branch = 'master';
  if (!options.script) options.script = getStartScriptFromDir(options.dir);
}

// 获取Git操作实例
Deploy.prototype._openRepo = function (callback) {
  var me = this;
  if (this._repo) return callback(null, this._repo);
  var repo = new git.Repo(this.options.dir, function (err) {
    if (err) return callback(err);
    me._repo = repo;
    callback(null, me._repo);
  });
};

/**
 * 部署最新版本代码
 *
 * @param {Function} callback
 */
Deploy.prototype.delpoy = function (callback) {
  async.series([
    function (next) {
      deploy.checkoutLatest(next);
    },
    function (next) {
      deploy.installDependencies(next);
    },
    function (next) {
      deploy.stop(next);
    },
    function (next) {
      deploy.start(next);
    }
  ], function (err) {
    if (err) return callback(err);

    // TODO: 成功返回Git版本、进程信息
    callback(null, {});
  });
};

/**
 * 回滚到最后一次正常版本代码
 *
 * @param {Function} callback
 */
Deploy.prototype.rollback = function (callback) {
  async.series([
    function (next) {
      deploy.checkoutLast(next);
    },
    function (next) {
      deploy.installDependencies(next);
    },
    function (next) {
      deploy.stop(next);
    },
    function (next) {
      deploy.start(next);
    }
  ], function (err) {
    if (err) return callback(err);

    // TODO: 成功返回Git版本、进程信息
    callback(null, {});
  });
};

/**
 * 检出最后一次正确的版本代码
 *
 * @param {Function} callback
 */
Deploy.prototype.checkoutLast = function (callback) {

};

/**
 * 检出最新版本代码
 *
 * @param {Function} callback
 */
Deploy.prototype.checkoutLatest = function (callback) {

};

/**
 * 安装依赖模块
 *
 * @param {Function} callback
 */
Deploy.prototype.installDependencies = function (callback) {

};

/**
 * 停止服务
 *
 * @param {Function} callback
 */
Deploy.prototype.stop = function (callback) {

};

/**
 * 启动服务
 *
 * @param {Function} callback
 */
Deploy.prototype.start = function (callback) {

};

