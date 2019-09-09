<template>
<div class="request-page" v-if="isShow">
    <div class="photo-container">
        <div class="photo-item photo-item1">
            <div class="top-border"></div>
            <div class="card-content">
                <img :src="requestInfo.applicant.head_img" class="user-avatar" alt="">
                <div class="user-nickname">{{requestInfo.applicant.nickname}}</div>
                <form report-submit @submit="audioOperator">
                  <button form-type="submit" class="audio-operator">
                    <img :src="'../../assets/images/' + (!playFlag ? 'icon-play.png': 'icon-pause.png') " alt="">
                  </button>
                </form>
            </div>
        </div>
        <div class="exchange-pic">
            <form report-submit @submit="exchange">
              <button form-type="submit" class="btn-exchange">确认互加</button>
            </form>
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
    async onShow() {
      this.isShow = false;
      this.playFlag = false;
      this.requestInfo = JSON.parse(mpvue.getStorageSync('exChangeConfig'));
      this.isShow = true;
      console.log('storage->requestInfo: ', JSON.stringify(this.requestInfo));
      this.innerAudioContext = wx.createInnerAudioContext();
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
      async exchange(e) {
        let formId = e.mp.detail.formId;
        await this.collectionFormId(formId);
        console.log('exchange:',this.applyID);
        if(!this.userInfo.file || !this.userInfo.wechat_number) {
          this.isUploadFile = true;
          return;
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
          wx.redirectTo({url: '/pages/exchange/main?applyID=' + this.applyID+"&root=mrequest"});
        }
        else {
            console.log('同意交换失败！');
        }
      },
      // 播放/暂停录音
      async audioOperator(e) {
        let formId = e.mp.detail.formId;
        await this.collectionFormId(formId);
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
      async collectionFormId(formid) {
        let config = {
          url: 'exchange/collect_formid/',
          method: 'post',
          data: {formid}
        };
        let resInfo = await wxApi.request(config);
        if(resInfo.errno === 0) {
        }
        else {
        }
      },
    },
    onUnload () {
        console.log('request 页面卸载');
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
    .photo-container {
        position: absolute;
        left: 50%;
        top:54px;
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
