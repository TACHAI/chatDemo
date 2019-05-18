var util = require('../../utils/util');
const app = getApp();
const host = app.globalData.host;

var emojis = app.globalData.emojis;
Page({
  data: {
    messages: [
      {
        id: 1, contents: [{
          type: 'text',
          text: '欢迎来到聊天demo'
        }], me: false, avatar: '/images/robot.jpg', speech: false
      },
    ],
    isSpeech: false,
    scrollHeight: 0,
    toView: '',
    windowHeight: 0,
    windowWidth: 0,
    pxToRpx: 2,
    msg: '',
    emotionBox: false,
    emotions: [],
    speechText: '按住 说话',
    seconds: 0,
    interval: null,
    changeImageUrl: '/images/voice.png',
    speechIcon: '/images/speech0.png',
    defaultSpeechIcon: '/images/speech0.png',
    emotionIcon: '/images/emotion.png',
    playingSpeech: ''
  },
  chooseEmotion(e) {
    this.setData({
      msg: this.data.msg + '[' + e.target.dataset.name + ']'
    });
  },
  sendMessage(e) {
    this.setData({
      msg: e.detail.value
    });
  },
  onLoad() {
    var that = this;
    let emotions = [];
    for (let i = 0; i < emojis.length; i++) {
      emotions.push({
        src: '/emoji/' + util.getEmojiEn(emojis[i]) + '.png',
        id: i,
        name: emojis[i]
      });
    }
    this.setData({
      emotions: emotions
    });
    // 创建录音
    that.options = {
      duration: 60000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 96000,
      format: 'aac'
    };
    that.recorderManager = swan.getRecorderManager(); // 创建录音实例
    that.innerAudioContext = swan.createInnerAudioContext();//创建播放实例
    that.backgroundAudioManager = swan.getBackgroundAudioManager();//创建背景播放实例
    that.syncTimer;
    swan.getSystemInfo({
      success: res => {
        this.setData({
          windowHeight: res.windowHeight,
          pxToRpx: 750 / res.screenWidth,
          scrollHeight: (res.windowHeight - 50) * 750 / res.screenWidth
        });
      }
    });
  },
  onShareAppMessage: function () {
    return {
      title: '伙伴小Q',
      path: '/pages/index/index'
    };
  },
  emotionBtn() {
    if (this.data.emotionBox) {
      this.setData({
        emotionBox: false,
        scrollHeight: (this.data.windowHeight - 50) * this.data.pxToRpx
      });
    } else {
      this.setData({
        emotionBox: true,
        scrollHeight: (this.data.windowHeight - 285) * this.data.pxToRpx
      });
      if (this.data.isSpeech) {
        this.setData({
          isSpeech: false,
          changeImageUrl: '/images/voice.png'
        });
      }
    }
  }, changeType: function () {
    if (this.data.isSpeech) {
      this.setData({
        isSpeech: false,
        changeImageUrl: '/images/voice.png'
      });
    } else {
      this.setData({
        isSpeech: true,
        changeImageUrl: '/images/keyinput.png',
        emotionBox: false,
        scrollHeight: (this.data.windowHeight - 50) * this.data.pxToRpx
      });
    }
  },
  send: function () {
    var that = this;
    let msg = this.data.msg;
    let contents = util.getContents(msg);
    let id = 'id_' + Date.parse(new Date()) / 1000;
    let data = { id: id, contents: contents, me: true, avatar: swan.getStorageSync('userInfo').avatarUrl, speech: false };
    let messages = this.data.messages;
    messages.push(data);
    this.setData({
      messages: messages,
      msg: ''
    });
    this.setData({
      toView: id
    });
    swan.request({
      url: host + '/baidu/byWord.do',
      method: 'POST',
      // data: { 'word': msg, 'sessionId': swan.getStorageSync('openid'), 'username': swan.getStorageSync('userInfo').nickName },
      data: { 'word': msg, 'sessionId': swan.getStorageSync('openid') },
      header: {
        "content-type": "application/json"
      },
      success: function (res) {
        if (res.statusCode == 200) {
          let answer = res.data.data;
          let contents = util.getContents(answer, res.data.msg);
          let id = 'id_' + Date.parse(new Date()) / 1000;
          let data = { id: id, contents: contents, me: false, avatar: '/images/robot.jpg', speech: false };
          let messages = that.data.messages;
          messages.push(data);
          console.log(messages);
          that.setData({
            messages: messages
          });
          that.setData({
            toView: id
          });
        }
      },
      fail: function (res) {
        console.log(res);
      }
    });
  },
  startRecord: function () {
    var that = this;
    this.setData({
      speechText: '松开 发送'
    });
    // 定成全局變量
    // var seconds = 0;
    // 計時器開啟
    that.interval = setInterval(function () {
      that.seconds++;
    }, 1000);
    that.recorderManager.start(that.options);
    that.recorderManager.onStart(function () {
      console.log('recorder start')
    })
  },
  stopRecord: function () {
    var that = this;
    this.setData({
      speechText: '按住 说话'
    });
    // that.recorderManager.stop();
    that.recorderManager.onStop(
      function (res) {
        // 計時器結束
        clearInterval(this.interval);
        this.interval = null;
        // var tempFilePath = res.tempFilePath
        const { tempFilePath } = res;
        this.tempFilePath = tempFilePath;
        this.seconds = this.seconds == 0 ? 1 : this.seconds;
        let id = 'id_' + Date.parse(new Date()) / 1000;
        let data = { id: id, me: true, avatar: swan.getStorageSync('userInfo').avatarUrl, speech: true, seconds: seconds, filePath: tempFilePath }
        let messages = that.data.messages
        messages.push(data)
        that.setData({
          messages: messages
        });
        that.setData({
          toView: id
        })
        let nickName = swan.getStorageSync('userInfo').nickName;
        if (!nickName) nickName = 'null';
        // 上传语音给后台
        swan.uploadFile({
          url: host + '/baidu/byVice.do',
          filePath: tempFilePath,
          name: 'file',
          // 可以不传这些
          formData: {
            'sessionId': swan.getStorageSync('openid'),
            // 'username': swan.getStorageSync('userInfo').nickName
          },
          success: function (res) {
            if (res.statusCode == 200) {
              let answer = res.data.data;
              let contents = util.getContents(answer, res.data.msg);
              let id = 'id_' + Date.parse(new Date()) / 1000;
              let data = { id: id, contents: contents, me: false, avatar: '/images/robot.jpg', speech: false };
              let messages = that.data.messages;
              messages.push(data);
              console.log(messages);
              that.setData({
                messages: messages
              });
              that.setData({
                toView: id
              });
            }
            // let resData = JSON.parse(res.data);
            // if (resData.code == 102) {
            //   let answer = resData.text;
            //   let contents = util.getContents(answer)
            //   let id = 'id_' + Date.parse(new Date()) / 1000;
            //   let data = { id: id, contents: contents, me: false, avatar: '/images/robot.jpg', speech: false }
            //   let messages = that.data.messages
            //   messages.push(data)
            //   that.setData({
            //     messages: messages
            //   })
            //   that.setData({
            //     toView: id
            //   })
            // } else if (resData.code == 101) {
            //   // 这里干什么 还没搞懂
            //   var isFirst = true;
            //   wx.playBackgroundAudio({
            //     dataUrl: host + '/static/' + resData.text
            //   });
            //   wx.onBackgroundAudioPlay(function () {
            //     wx.getBackgroundAudioPlayerState({
            //       success: function (res) {
            //         if (!isFirst) {
            //           return;
            //         }
            //         isFirst = false;
            //         let duration = res.duration;
            //         wx.stopBackgroundAudio();
            //         let id = 'id_' + Date.parse(new Date()) / 1000;
            //         let data = { id: id, me: false, avatar: '/images/robot.jpg', speech: true, seconds: duration == 0 ? 1 : duration, filePath: host + '/static/' + resData.text }
            //         let messages = that.data.messages
            //         messages.push(data)
            //         that.setData({
            //           messages: messages
            //         });
            //         that.setData({
            //           toView: id
            //         })
            //       }
            //     })
            //   });
            // }
          },
          fail: function (err) {
            console.log(err)
          }
        })
      },
    )
  },
  playSpeech: function (event) {
    var that = this;
    var filePath = event.currentTarget.dataset.filepath;
    that.setData({
      playingSpeech: filePath
    });
    var num = 1;
    var interval = setInterval(function () {
      that.setData({
        speechIcon: '/images/speech' + num % 3 + '.png'
      });
      num++;
    }, 500);
    // 播放
    that.innerAudioContext.src = filePath;
    that.innerAudioContext.autoplay = false;

    that.innerAudioContext.onPlay(res => {
      swan.showToast({
        title: '',
        icon: '/images/speech0.png'
      });
      console.log('onPlay', res);
    });
    that.innerAudioContext.play();

    // that.innerAudioContext.playVoice({
    //   filePath: filePath,
    //   complete: function () {
    //     clearInterval(interval);
    //     that.setData({
    //       speechIcon: '/images/speech0.png',
    //       playingSpeech: ''
    //     });
    //   }
    // })
  },
  playRobotSpeech: function (event) {
    var that = this;
    var filePath = event.currentTarget.dataset.filepath;
    that.setData({
      playingSpeech: filePath
    });
    var num = 1;
    var interval = setInterval(function () {
      that.setData({
        speechIcon: '/images/speech' + num % 3 + '.png'
      });
      num++;
    }, 500);
    // 播放
    that.backgroundAudioManager.src = filePath;

    that.backgroundAudioManager.play();
    // wx.playBackgroundAudio({
    //   dataUrl: filePath
    // });
    that.backgroundAudioManager.onStop(res => {
      clearInterval(that.interval);
      swan.showToast({
        title: '',
        icon: '/images/speech0.png'
      });
    });
    // wx.onBackgroundAudioStop(function () {
    //   clearInterval(interval);
    //   that.setData({
    //     speechIcon: '/images/speech0.png',
    //     playingSpeech: ''
    //   });
    // })
  }
});