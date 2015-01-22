/**
 * lei-deploy eample
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var leiDeploy = require('./');

console.log(leiDeploy);
leiDeploy.deploy({
  name: 'SIDServer-dev',
  script: '',
  dir: '/Users/glen/work/superid/sidserver',
  branch: 'lei_dev',
  env: {
    NODE_ENV: 'development'
  }
}, console.log);
