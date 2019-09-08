<template>
<div class="record-page" v-if="isPageLoaded">
  <v-lyrics @collectionFormId="collectionFormId" v-if="!hasFile" :lyricsRefresh="lyricsRefresh"></v-lyrics>
  <div v-if="hasFile" class="has-file-wrap">
    <div class="tip-text" style="margin-bottom: 55px;">当前声音</div>
    <div class="spinner-container">
      <div v-if="playRecord" class="spinner"></div>
      <form class="operator-container" report-submit @submit="playManger">
        <button :class="{'circle-btn': true, 'pause': playRecord}" form-type="submit">
          <div v-if="!playRecord" class="play"></div>
          <div v-else class="square"></div>
        </button>
      </form>
    </div>
    <div class="exchange-pic">
      <form report-submit @submit="reRecord">
        <button class="btn-exchange" form-type="submit">重新录制</button>
      </form>
    </div>
  </div>
  <div v-else>
    <div v-if="!stopRecord">
      <div style="margin-bottom: 21px;" v-if="!startRecord">
        <div class="tip-text">请录制一段声音</div>
        <div style="color: #999;font-size: 14px; text-align: center;line-height: 14px;">声音用于向对方发送申请，也会在首页展示</div>
      </div>
      <div v-else style="width: 100%;height: 29px;margin-top: 44px;margin-bottom: 21px;"></div>
      <div class="spinner-container">
        <div v-if="startRecord" class="spinner"></div>
        <form class="operator-container" report-submit @submit="recordManger">
          <button :class="{'circle-btn': true, 'pause': playRecord}" form-type="submit">
            <span v-if="!startRecord">开始录制</span>
            <div v-else class="square"></div>
          </button>
        </form>
      </div>
    </div>
    <div v-else>
      <div style="width: 100%;height: 29px;margin-top: 44px;margin-bottom: 21px;">
        <div class="tip-text">请点击保存</div>
      </div>
      <form class="operator-container1" report-submit @submit="playManger">
        <img @click="reRecord" class="operator-text1" src="../../assets/images/icon-rerecord.png" alt="">
        <div class="spinner-container">
          <div v-if="playRecord" class="spinner"></div>
          <button :class="{'circle-btn': true, 'pause': startRecord}" form-type="submit">
            <div v-if="!playRecord" class="play"></div>
            <div v-else class="square"></div>
          </button>
        </div>
        <img @click="saveAudio" class="operator-text2" src="../../assets/images/icon-save-preview.png" alt="">
      </form>

    </div>
  </div>
  <i-toast id="toast" />
</div>
</template>

<script>
import WxApi from '../../utils/WxApi'
import {mapMutations, mapGetters} from 'vuex';
import vLyrics from '../../components/record/lyrics';

const wxApi = new WxApi();
const { $Toast } = require('../../../static/iview/base/index');
export default {
    components: {
      vLyrics,
    },
    data() {
        return {
          isPageLoaded: false,
          rootPage:'mine',
          hasFile:false,
          recordAuth:false,
          startRecord:false,
          playRecord:false,
          duration:0,
          stopRecord:false,
          user:null,
          recorderManager: null, // 录音管理器实例
          innerAudioContext: null, // 播放音频实例
          tempFilePath: '',// 录音资源临时文件路径
          lyricsRefresh: 0,
        }
    },
    computed: {
        ...mapGetters(['userInfo']),
    },
    async onShow() {
        this.rootPage = this.$root.$mp.query.root;
        let authSetting = await wxApi.getSetting();
        if(authSetting.authSetting['scope.record']) {
            this.recordAuth = true;
        }
        else {
            this.recordAuth = false;
        }
        this.init();
    },
    onHide() {
      if(this.innerAudioContext) {
        this.innerAudioContext.destroy();
        this.innerAudioContext = null;
      }
      if(this.recorderManager) {
        this.recorderManager.stop();
        this.recorderManager = null;
      }
      this.init();
    },
    onUnload() {
      if(this.innerAudioContext) {
        this.innerAudioContext.destroy();
        this.innerAudioContext = null;
      }
      if(this.recorderManager) {
        this.recorderManager.stop();
        this.recorderManager = null;
      }
      this.init();
    },
    methods: {
      ...mapMutations(['setUserInfo', 'setInnerAudioContext', 'setRecorderManager']),
      async getUserInfo() {
        let config = {
          url: 'users/me/',
          method: 'get'
        }
        let res = await wxApi.request(config);
        if(res.errno == 0) {
          return res.results;
        }
        else {
          $Toast({
            content: '错误码:10001',
            type: 'error'
          })
          return null;
        }
      },
      collectionFormId(formid) {
        let config = {
          url: 'exchange/collect_formid/',
          method: 'post',
          data: {formid}
        };
        wxApi.request(config);
      },
      async init() {
        let userInfo = await this.getUserInfo();

        // 前往更多歌曲页选中特定歌曲后newSong会变更为true
        // 当newSong为true时，直接替换掉当前页面的歌曲
        const newSong = wx.getStorageSync('newSong');
        wx.setStorageSync('newSong', false);
        if (newSong) this.lyricsRefresh++;

        // 被逼无奈，在跳转更多歌曲页时inLyrics会设为true
        const inLyrics = wx.getStorageSync('inLyrics');
        if (inLyrics) {
          setTimeout(() => {
            wx.setStorageSync('inLyrics', false);
          }, 80);
        }

        this.user = userInfo.user;
        this.setUserInfo(userInfo.user);
        if(this.user && this.user.file){
          this.playRecord = false;
          this.initPlay(this.user.file);
          if (!inLyrics && !newSong) this.hasFile = true;
        } else{
          this.startRecord = false;
          this.stopRecord = false;
          if (!inLyrics && !newSong) this.hasFile = false;
        }
        this.isPageLoaded = true;
      },
      initPlay(src){
        if(!this.innerAudioContext){
          this.innerAudioContext = wx.createInnerAudioContext()
          this.innerAudioContext.src = src;
          this.listenAudioEvent();
          this.setInnerAudioContext(this.innerAudioContext);
        }else{
          this.innerAudioContext.src = src;
          this.listenAudioEvent();
          this.setInnerAudioContext(this.innerAudioContext);
        }
      },
      recordManger(e){
        let formId = e.mp.detail.formId;
        if(!this.startRecord){
          this.getRecordAuth();
        }else{
          this.recorderManager.stop();
        }
        this.collectionFormId(formId);
      },
      playManger(e){
        let formId = e.mp.detail.formId;
        if(!this.playRecord){
          this.innerAudioContext.play();
        }else{
          this.innerAudioContext.stop();
        }
        this.collectionFormId(formId);
      },
      async getRecordAuth() {
        const options = {
          format: 'mp3',
          sampleRate: 48000,
          encodeBitRate: 64000
        }
        if(!this.recordAuth) {
          let recordAuth = await wxApi.authorize('scope.record');
          this.recorderManager = wx.getRecorderManager()
          this.setRecorderManager(this.recorderManager)
          this.listenRecordEvent();
          this.recorderManager.start(options);
        }
        else {
          this.recorderManager = wx.getRecorderManager()
          this.setRecorderManager(this.recorderManager)
          this.listenRecordEvent();
          this.recorderManager.start(options);
        }

      },
      listenAudioEvent() {
        this.innerAudioContext.onPlay((res) => {
          this.playRecord = true;
        });
        this.innerAudioContext.onError((error) => {
          console.log('error=',error)
        });
        this.innerAudioContext.onEnded((res) => {
          this.playRecord = false;
        });
        this.innerAudioContext.onStop((res) => {
          this.playRecord = false;
        });
      },
      listenRecordEvent() {
        this.recorderManager.onStart(() => {
          this.startRecord = true;
        })
        this.recorderManager.onStop((res) => {
          const { tempFilePath, duration } = res;
          this.tempFilePath = tempFilePath;
          this.duration = Math.ceil(res.duration/1000);
          this.initPlay(this.tempFilePath);
          this.stopRecord = true;
          this.startRecord = false;
        })
      },
      reRecord(e){
        let formId = e.mp.detail.formId;
        this.collectionFormId(formId);
        this.innerAudioContext.stop();
        this.startRecord = false;
        this.stopRecord = false;
        this.hasFile = false;
      },
      async saveAudio(){
        let config = {
          url: 'users/upload_record/',
          filePath: this.tempFilePath,
          name: 'file',
          formData: {
            duration: this.duration
          }
        }
        let uploadInfo = await wxApi.uploadFile(config);
        if(JSON.parse(uploadInfo.data).errno == 0) {
          this.setUserInfo(JSON.parse(uploadInfo.data).results.user);
          if(this.rootPage === 'mine') {
            $Toast({
              content: '保存成功',
              type: 'success'
            })
            this.user = JSON.parse(uploadInfo.data).results.user;
            this.playRecord = false;
            this.initPlay(this.user.file);
            this.hasFile = true;
          }
          else {
            $Toast({
              content: '保存成功',
              type: 'success'
            })
            setTimeout(() => {
              wx.redirectTo({url: '/pages/uploadact/main?root=record'});
            }, 1000);

          }
        }
        else {
          $Toast({
            content: JSON.parse(uploadInfo.data).results,
            type: 'error'
          })
        }
      }
    }
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.record-page {
    padding-top: 38px;
    font-family: "PingFangSC-Medium";
    color: #333;
    font-size: 16px;
    height: 100vh;
    box-sizing: border-box;
    // background-color: #fff;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    .has-file-wrap {
      padding-top: 18px;
    }
    .textarea {
        box-sizing: border-box;
        width: 100%;
        padding: 12px 9px;
        height: 145px;
        margin-bottom: 66px;
        border: 1.5px solid #00ceda;
        border-radius: 4px;
        background-color: #FAFAFA;
    }
    .tip-text {
        margin-bottom: 13px;
        text-align: center;
        margin-top: 44px;
        line-height: 14px;
        font-size: 14px;
    }
    .time-text {
        height: 30px;
        line-height: 30px;
        text-align: center;
        font-size: 30px;
        color: #666;
        margin-bottom: 14px;
        margin-top: 67px;
        line-height: 30px;
    }
    .time-text-2 {
      margin-top: 9px;
      margin-top: -4px;
    }
    .spinner-container{
      width: 187px;
      height: 187px;
      margin: 0 auto;
      position: relative;
    }
    .spinner {
      width: 177px;
      height: 177px;
      border-radius: 100%;
      border:5px solid #FBCF00;
      -webkit-animation: scaleout 1.4s infinite ease-in-out;
    }

    @-webkit-keyframes scaleout {
      0% {
        -webkit-transform: scale(0.6);
      }
      100% {
        -webkit-transform: scale(1.0);
        opacity: 0.2;
      }
    }
    .operator-container {
        position: absolute;
        display: flex;
        height: 127px;
        justify-content: center;
        align-items: center;
        top:30px;
        left:30px;
        z-index: 10;
        .operator-text1 {
            position: absolute;
            left: 43px;
            top: 40px;
        }
        .circle-btn {
            flex: 1;
            width: 127px;
            height: 127px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: -webkit-linear-gradient(right top,#FBA500 , #FBCB00 );
            // background-color: #FBA500;
            border-radius: 50%;
            span {
                font-size: 20px;
                color: #fff;
                line-height: 24px;
            }
            .square {
                width: 40px;
                height: 40px;
                background-color: #fff;
                border-radius: 5px;
            }
            .play {
                position: relative;
                box-sizing: content-box;
                width: 0;
                height: 0;
                border:19px solid #000;
                transform: translate(32%, 0);
                border-width: 19px 31px 19px 31px;
                border-color: transparent transparent transparent #fff;
            }
        }
        .operator-text2 {
            position: absolute;
            right: 43px;
            top: 40px;
        }
        .operator-text1,
        .operator-text2 {
            width: 44px;
            height: 44px;
        }
        .pause {
            background: none;
            background-color: #EE8B21 !important;
        }
    }
    .operator-container1 {
      position: relative;
      display: flex;
      height: 187px;
      justify-content: center;
      align-items: center;
      .operator-text1 {
        position: absolute;
        left: 30px;
        top: 60px;
      }
      .circle-btn {
        flex: 1;
        width: 127px;
        height: 127px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: -webkit-linear-gradient(right top,#FBA500 , #FBCB00 );
        // background-color: #FBA500;
        border-radius: 50%;
        position: absolute;
        top:30px;
        left:30px;
        z-index: 10;
        span {
          font-size: 20px;
          color: #fff;
          line-height: 24px;
        }
        .square {
          width: 40px;
          height: 40px;
          background-color: #fff;
          border-radius: 5px;
        }
        .play {
          position: relative;
          box-sizing: content-box;
          width: 0;
          height: 0;
          border:19px solid #000;
          transform: translate(32%, 0);
          border-width: 19px 31px 19px 31px;
          border-color: transparent transparent transparent #fff;
        }
      }
      .operator-text2 {
        position: absolute;
        right: 30px;
        top: 60px;
      }
      .operator-text1,
      .operator-text2 {
        width: 44px;
        height: 44px;
      }
      .pause {
        background: none;
        background-color: #EE8B21 !important;
      }
    }
    .reward-container {
        .reward-title {
            color: #666666;
            height: 23px;
            line-height: 23px;
            text-align: center;
            margin-bottom: 14px;
        }
        .reward-labels {
            height: 36px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 41px;
            .label {
                position: relative;
                width: 60px;
                height: 32px;
                font-size: 18px;
                color: #666666;
                // text-align: center;
                border: 1px solid #56D4D4;
                border-radius: 4px;
                input {
                    width: 100%;
                    height: 100%;
                    padding-left: 6px;
                }
                span {
                    position: absolute;
                    right: 4px;
                    top: 48%;
                    transform: translate(0, -50%);
                }
            }
        }
    }
    .exchange-pic {
        position: absolute;
        bottom: 100rpx;
        height: 45px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        .btn-exchange {
            width: 140px;
            height: 40px;
            background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
            font-size: 16px;
            color: #fff;
            text-align: center;
            line-height: 40px;
            border-radius: 2px;
        }
    }
}

</style>
