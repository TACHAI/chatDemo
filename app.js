App({
  globalData: {
    host: 'https://can.xmduruo.com:4000',
    emojisEn: ['bugaoxing', 'guai', 'qinqin', 'lengmo', 'qie', 'mianqiang', 'chijing', 'tushe', 'hehe', 'hu', 'yi', 'haha', 'ku', 'pen', 'weiqu', 'kaixin', 'deyi', 'nu', 'exin', 'jingku', 'jingya', 'han', 'huaji', 'kuanghan', 'shengqi', 'yiwen', 'zhenbang', 'shuijue', 'xiaoyan', 'mengmengda', 'bishi', 'yinxian', 'heixian'],
    emojis: ['不高兴', '乖', '亲亲', '冷漠', '切~', '勉强', '吃惊', '吐舌', '呵呵', '呼~', '咦', '哈哈', '哭', '喷', '委屈', '开心', '得意', '怒', '恶心', '惊哭', '惊讶', '汗', '滑稽', '狂汗', '生气', '疑问', '真棒', '睡觉', '笑眼', '萌萌哒', '鄙视', '阴险', '黑线']
  },
  onLaunch: function () {
    var that = this;
    swan.getSetting({
      success(res) {
        if (!res['scope.record']) {
          swan.authorize({
            scope: 'scope.record'
          });
        }
        if (!res['scope.userInfo']) {
          swan.authorize({
            scope: 'scope.userInfo'
          });
        }
      }
    });
    swan.login({
      success: function (data) {
        swan.getUserInfo({
          success: function (res) {
            swan.setStorage({
              key: 'userInfo',
              data: res.userInfo
            });
          }
        });
        swan.request({
          method: 'GET',
          url: that.globalData.host + '/baidu/baiduLogin.do?code=' + data.code,
          success: function (res) {
            swan.setStorage({
              key: 'openid',
              data: res.data
            });
          }
        });
      }
    });
  }
});