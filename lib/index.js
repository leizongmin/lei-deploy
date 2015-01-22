/**
 * lei-deploy
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var async = require('async');
var git = require('git');
var utils = require('lei-utils');
var debug = require('debug')('lei:deploy');


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
 *   - {Number} num 进程数量
 * @param {Function} callback
 */
exports.deploy = function (options, callback) {
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
  if (!(options.num > 0)) options.num = 1;
  options.env = options.env || {};
}

// 获取Git操作实例
Deploy.prototype._openRepo = function (callback) {
  var me = this;
  if (this._repo) return callback(null, this._repo);
  var repo = new git.Repo(this.options.dir, function (err) {
    if (err) return callback(err);
    me._repo = repo;
    callback(null, me._repo, me);
  });
};

// 获得最新版本号
Deploy.prototype._getCommits = function (callback) {
  debug('git get commits');
  this._openRepo(function (err, repo, me) {
    if (err) return callback(err);
    repo.commits(me.options.branch, function (err, list) {
      if (err) return callback(err);
      list = list.map(function (item) {
        return {id: item, message: item.message};
      });
      debug(' - commits [%s] last=%s', list.length, list[0] && list[0].id);
      callback(null, list);
    });
  });
};

// 执行命令
Deploy.prototype._exec = function (cmd, callback) {
  debug('exec: [%s] %s', this.options.dir, cmd);
  child_process.exec(cmd, {
    cwd: this.options.dir,
    env: utils.merge(process.env, this.options.env)
  }, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    debug(' - exec callback: err=%s', err);
    callback(err, stdout, stderr);
  });
};

// 拉取最新的代码
Deploy.prototype._pull = function (callback) {
  debug('git pull');
  var me = this;
  async.series([
    function (next) {
      me._exec('git reset --hard', next);
    },
    function (next) {
      me._exec('git pull', next);
    },
    function (next) {
      me._exec('git checkout ' + me.options.branch, next);
    }
  ], callback);
};

// checkout指定版本
Deploy.prototype._checkout = function (id, callback) {
  debug('git checkout %s', id);
  this._exec('git checkout ' + id + ' .', callback);
};

/**
 * 部署最新版本代码
 *
 * @param {Function} callback
 */
Deploy.prototype.deploy = function (callback) {
  var me = this;
  async.series([
    function (next) {
      me.checkoutLatest(next);
    },
    function (next) {
      me.installDependencies(next);
    },
    function (next) {
      me.stop(next);
    },
    function (next) {
      me.start(next);
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
  var me = this;
  async.series([
    function (next) {
      me.checkoutLast(next);
    },
    function (next) {
      me.installDependencies(next);
    },
    function (next) {
      me.stop(next);
    },
    function (next) {
      me.start(next);
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
  debug('checkout latest');
  var me = this;
  var lastItem;
  async.series([
    function (next) {
      me._pull(next);
    },
    function (next) {
      me._getCommits(function (err, list) {
        if (err) return callback(err);
        lastItem = list[0];
        next();
      });
    },
    function (next) {
      if (!lastItem) return next(new Error('lastest commit not found'));
      me._checkout(lastItem.id, next);
    }
  ], callback);
};

/**
 * 安装依赖模块
 *
 * @param {Function} callback
 */
Deploy.prototype.installDependencies = function (callback) {
  debug('install dependencies');
  this._exec('npm install', callback);
};

/**
 * 停止服务
 *
 * @param {Function} callback
 */
Deploy.prototype.stop = function (callback) {
  debug('stop %s', this.options.name);
  this._exec('pm2 stop ' + this.options.name + ' -f', function (err) {
    callback(null);
  });
};

/**
 * 启动服务
 *
 * @param {Function} callback
 */
Deploy.prototype.start = function (callback) {
  debug('start %s', this.options.name);
  this._exec('pm2 start ' + this.options.script + ' --name ' + this.options.name + ' -i ' + this.options.num + ' -x', callback);
};
