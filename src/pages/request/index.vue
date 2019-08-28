<template>
<div class="request-page" v-if="isShow">
    <div class="header" :style="'height:'+headerHeight+'px;'">
      <div @click.stop="home" class="icon-index"><img :src="'../../assets/images/left-index.png'" alt="" class="icon-image"></div>
      <div class="title">音吖</div>
    </div>
    <div class="photo-container" :style="'top:'+(headerHeight+54)+'px;'">
        <div class="photo-item photo-item1">
            <div class="top-border"></div>
            <div class="card-content">
                <img :src="requestInfo.applicant.head_img" class="user-avatar" alt="">
                <div class="user-nickname">{{requestInfo.applicant.nickname}}</div>
                <div class="audio-operator" @click="audioOperator">
                    <img :src="'../../assets/images/' + (!playFlag ? 'icon-play.png': 'icon-pause.png') " alt="">
                </div>
            </div>
        </div>
        <div class="exchange-pic">
            <div class="btn-exchange" @click="exchange">确认互加</div>
            <div class="tip-text">确认后将收到对方微信号，可互加好友</div>
        </div>
    </div>
    <van-dialog
        use-slot
        :show="isUploadFile"
        :showConfirmButton="false"
        :showCancelButton="false"
    >
        <div class="dialog-container">
            <div class="top-border"></div>
            <div class="dialog-content">
                <div class="dialog-text">你需要上传一段歌声和一张照片才能与对方交换</div>
                <div class="dialog-upload">
                    <div @click="toUpload" class="upload-btn">立即上传</div>
                </div>
                <img @click="closeDialog" src="../../assets/images/icon-close.png" alt="" class="close">
            </div>
        </div>
    </van-dialog>
    <i-toast id="toast" />
</div>
</template>

<script>
import {mapMutations, mapGetters} from 'vuex';
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
const { $Toast } = require('../../../static/iview/base/index');
export default {
    data() {
      return {
        headerHeight:0,
        isShow:false,
        requestInfo: {},
        applyID: '',
        innerAudioContext: null, // 播放音频实例
        playFlag: false,
        imgArr:[],
        clientWidth: wx.getSystemInfoSync().windowWidth,
        clientHeight: wx.getSystemInfoSync().windowHeight,
        duration: 0,
        photoArr: [

        ],
        audioConfig: {
            path: '',
            duration: ''
        }, // 录音配置
        currentTime: 0, // 当前录音时间
        palyRecordTimer: null, // 播放录音定时器
        isUploadFile: false,
        // isExchangePic: false,
        // isSendComple: false,
        // isStartSend: false,
      }
    },
    computed: {
        ...mapGetters(['userInfo']),
    },
    onLoad(){
      mpvue.getSystemInfo({
        success: res => {
          console.log(res)
          //导航高度
          this.headerHeight = res.statusBarHeight + 46;
        }, fail(err) {
          console.log(err);
        }
      })
    },
    async onShow() {
        this.isShow = false;
        this.playFlag = false;
        this.applyID = this.$root.$mp.query.applyID;
//        this.applyID = 2586;
        console.log('applyID:',this.applyID)
        if(this.applyID) {
          let config = {
              url: 'exchange?status=0&id='+this.applyID,
              method: 'get'
          }
          let temp = await wxApi.request(config);
          console.log('applyInfo: ', JSON.stringify(temp));
          if(temp.results.results && temp.results.results.length > 0){
            this.requestInfo = temp.results.results[0];
            this.isShow = true;
            console.log('http->requestInfo: ', JSON.stringify(this.requestInfo));
          }else{
            wx.switchTab({url: '/pages/message/main'});
          }
          this.findExchange(this.applyID);
        }
        else {
          this.requestInfo = JSON.parse(mpvue.getStorageSync('exChangeConfig'));
          this.isShow = true;
          console.log('storage->requestInfo: ', JSON.stringify(this.requestInfo));
        }
        this.innerAudioContext = wx.createInnerAudioContext();
        wx.setInnerAudioOption({
          obeyMuteSwitch: false
        });
        this.innerAudioContext.src = this.requestInfo.applicant.file;
        this.listenAudioEvent();
    },
    methods: {
        ...mapMutations(['setUserInfoAuth', 'setUserInfo']),
      home(){
        let url = '/pages/discover/main';
        wx.switchTab({url})
      },
      closeDialog() {
          this.isUploadFile = false;
      },
      toUpload() {
          let url = '/pages/record/main';
          wx.navigateTo({url});
      },
      async findExchange(exchangeId) {
        let config = {
          url: 'exchange/see_exchange/',
          method: 'get',
          data: {exchange_id: exchangeId}
        }
        await wxApi.request(config)
      },
      async exchange() {
          console.log('exchange:');
          if(!this.applyID) {
              if(!this.userInfo.file || !this.userInfo.wechat_number) {
                  this.isUploadFile = true;
                  return;
              }
          }
          let config = {
              url: 'exchange/agree_exchange/?exchange_id=' + this.requestInfo.id,
              method: 'post',
              data: {
                  exchange_id: this.requestInfo.id
              }
          }
          let resInfo = await wxApi.request(config);
          if(resInfo.errno == 0) {
              if(this.innerAudioContext) {
                  this.innerAudioContext.stop();
                  this.innerAudioContext.destroy();
                  this.innerAudioContext = null;
              }
              if(this.applyID) {
                  wx.redirectTo({url: '/pages/exchange/main?applyID=' + this.applyID+"&root=request"});
              }
          }
          else {
              console.log('同意交换失败！');
          }
      },
      // 播放/暂停录音
      audioOperator() {
        !this.playFlag ? this.playAudio() : this.pauseAudio();
      },
      // 播放录音
      playAudio() {
        console.log('playAudio')
        this.innerAudioContext.play();
      },
      // 暂停录音
      pauseAudio() {
        console.log('stopPlayRecord')
        this.innerAudioContext.stop();
      },
      // 监听音频事件-回调处理函数
      listenAudioEvent() {
          this.innerAudioContext.onPlay((res) => {
            console.log('开始播放', res)
            this.playFlag = true;
          })
          this.innerAudioContext.onError((res) => {
            console.log(res.errMsg)
            console.log(res.errCode)
          })
          this.innerAudioContext.onStop((res) => {
            console.log('停止播放', res);
            this.playFlag = false;
          })
          this.innerAudioContext.onEnded((res) => {
            console.log('播放结束', res);
            this.playFlag = false;
          });
      },
    },
    onUnload () {
        console.log('request 页面卸载');
        this.innerAudioContext.stop();
        this.innerAudioContext.destroy();
        this.innerAudioContext = null;
    },
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.request-page {
    position: relative;
    height: 100vh;
    box-sizing: border-box;
    font-family: "PingFangSC-Semibold";
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    // background-color: #FFFBE8;
    .header{
      position: relative;
      width: 100%;
      background-color: #ffffff;
      .title{
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 46px;
        line-height: 46px;
        font-family:PingFang-SC-Medium;
        font-size:18px;
        letter-spacing:2px;
        color:rgba(0,0,0,1);
        text-align: center;
      }
      .icon-index{
        width: 30px;
        height: 30px;
        position: absolute;
        left: 10px;
        bottom: 8px;
        z-index: 10;
        .icon-image{
          width: 20px;
          height: 20px;
          display: block;
          margin: 5px;
        }
      }
    }
    .photo-container {
        position: absolute;
        left: 50%;
        transform: translate(-50%, 0);
        width: 240px;
        height: 277px;
        .photo-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #fff;
            border: 1px solid #F4CF24;
            border-radius: 5px;
            box-shadow: 0 0 6px #EBE3D4;
            z-index: 1;
            .top-border {
                height: 7px;
                background-color: #F4CF24;
            }
            .card-content {
                position: absolute;
                width: 156px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                .user-avatar {
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    margin-bottom: 16px;
                }
                .user-nickname {
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 28px;
                }
                .audio-operator {
                    display: flex;
                    justify-content: center;
                    height: 50px;
                    img {
                        width: 45px;
                        height: 45px;
                    }
                }
            }
        }
        .photo-item1 {
            top: 0;
        }
        .photo-item2 {
            top: 42rpx;
        }
        .photo-item3 {
            top: 82rpx;
        }
    }
    .exchange-pic {
        position: absolute;
        top: 750rpx;
        height: 45px;
        display: flex;
        // justify-content: center;
        flex-direction: column;
        align-items: center;
        width: 100%;
        margin-bottom: 14px;
        .btn-exchange {
            width: 140px;
            height: 40px;
            background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
            font-size: 16px;
            color: #fff;
            text-align: center;
            line-height: 40px;
            border-radius: 2px;
            margin-bottom: 14px;
        }
        .tip-text {
            text-align: center;
            font-size: 14px;
            color: #999;
            font-family: "PingFangSC-Medium";
        }
    }

    .dialog-container {
        width: 326px;
        height: 254px;
        background-color: #fff;
        border-radius: 4px;
        .top-border {
            height: 7px;
            border-radius: 4px 4px 0 0;
            background-color: #F4CF24;
        }
        .dialog-content {
            height: 247px;
            padding: 70px 52px 0 52px;
            position: relative;
            .dialog-text {
                color: #333;
                font-size: 18px;
                font-family: "PingFangSC-Medium";
                line-height: 24px;
                text-align: center;
                margin-bottom: 56px;
            }
            .dialog-upload {
                display: flex;
                height: 45px;
                justify-content: center;
                .upload-btn {
                    width: 140px;
                    height: 40px;
                    color: #fff;
                    border-radius: 2px;
                    text-align: center;
                    line-height: 40px;
                    background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
                }
            }
            .close {
                position: absolute;
                width: 19px;
                height: 19px;
                top: 14px;
                right: 36rpx;
            }
        }
    }
}
</style>
