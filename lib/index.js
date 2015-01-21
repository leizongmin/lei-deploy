/**
 * lei-deploy
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var child_process = require('child_process');
var async = require('async');
var pm2 = require('pm2');
var git = require('git');


/**
 * 部署代码
 *
 * @param {Object} options
 *   - {String} name 服务名称
 *   - {String} script 启动脚本
 *   - {String} repository Git项目所在目录
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
}

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

