<template>
<div class="record-page" v-if="isPageLoaded">
  <v-lyrics @collectionFormId="collectionFormId" v-if="!hasFile" :lyricsRefresh="lyricsRefresh"></v-lyrics>
  <div v-if="hasFile" class="has-file-wrap">
    <div class="tip-text" style="margin-bottom: 55px;">当前声音</div>
    <div class="time-text">{{playTime}}s</div>
    <form class="operator-container" report-submit @submit="playManger">
      <button :class="{'circle-btn': true, 'pause': playRecord}" form-type="submit">
        <div v-if="!playRecord" class="play"></div>
        <div v-else class="square"></div>
      </button>
    </form>
    <div class="exchange-pic">
      <div class="btn-exchange" @click="reRecord">重新录制</div>
    </div>
  </div>
  <div v-else>
    <div v-if="!stopRecord">
      <div style="margin-bottom: 52rpx;" v-if="!recordTime">
        <div class="tip-text">请录制一段声音</div>
        <div style="color: #999;font-size: 14px; text-align: center;line-height: 14px;">声音用于向对方发送申请，也会在首页展示</div>
      </div>
      <div :style="'visibility:' + (startRecord ? ';' : 'hidden;') " class="time-text" v-if="recordTime">{{recordTime}}s</div>
      <form class="operator-container" report-submit @submit="recordManger">
        <button :class="{'circle-btn': true, 'pause': playRecord}" form-type="submit">
          <span v-if="!startRecord">开始录制</span>
          <div v-else class="square"></div>
        </button>
      </form>
    </div>
    <div v-else>
      <div class="tip-text">请点击保存</div>
      <div :style="'visibility:' + (true ? ';' : 'hidden;') " class="time-text time-text-2">{{playTime}}s</div>
      <form class="operator-container" report-submit @submit="playManger">
        <img @click="reRecord" class="operator-text1" src="../../assets/images/icon-rerecord.png" alt="">
        <button :class="{'circle-btn': true, 'pause': startRecord}" form-type="submit">
          <div v-if="!playRecord" class="play"></div>
          <div v-else class="square"></div>
        </button>
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
          recordTime:0,
          playTime:0,
          stopRecord:false,
          user:null,
          recorderManager: null, // 录音管理器实例
          innerAudioContext: null, // 播放音频实例
          tempFilePath: '',// 录音资源临时文件路径
          timer:null,
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
      clearInterval(this.timer);
      this.timer = null;
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
      clearInterval(this.timer);
      this.timer = null;
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
          }, 500);
        }

        this.user = userInfo.user;
        this.setUserInfo(userInfo.user);
        if(this.user && this.user.file){
          this.playRecord = false;
          this.playTime = this.user.duration;
          this.initPlay(this.user.file);
          if (!inLyrics && !newSong) this.hasFile = true;
        } else{
          this.startRecord = false;
          this.recordTime = 0;
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
          this.timer = setInterval(()=>{
            console.log('-----------')
            this.playTime += 1;
          },1000);
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
          this.playTime = 0;
        });
        this.innerAudioContext.onError((error) => {
          console.log('error=',error)
        });
        this.innerAudioContext.onEnded((res) => {
          let result = clearInterval(this.timer);
          this.timer = null;
          this.playRecord = false;
          if(this.hasFile){
            this.playTime = this.user.duration;
          }else{
            this.playTime = this.recordTime;
          }
        });
        this.innerAudioContext.onStop((res) => {
          clearInterval(this.timer);
          this.timer = null;
          this.playRecord = false;
          if(this.hasFile){
            this.playTime = this.user.duration;
          }else{
            this.playTime = this.recordTime;
          }
        });
      },
      listenRecordEvent() {
        this.recorderManager.onStart(() => {
          this.startRecord = true;
          this.timer = setInterval(()=>{
            this.recordTime += 1;
          },1000);
        })
        this.recorderManager.onStop((res) => {
          clearInterval(this.timer);
          this.timer = null;
          const { tempFilePath, duration } = res;
          this.tempFilePath = tempFilePath;
          this.playTime = Math.ceil(res.duration/1000);
          this.initPlay(this.tempFilePath);
          this.recordTime = this.playTime;
          this.stopRecord = true;
          this.startRecord = false;
        })
      },
      reRecord(){
        this.innerAudioContext.stop();
        this.startRecord = false;
        this.recordTime = 0;
        this.stopRecord = false;
        this.hasFile = false;
      },
      async saveAudio(){
        let config = {
          url: 'users/upload_record/',
          filePath: this.tempFilePath,
          name: 'file',
          formData: {
            duration: this.playTime
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
            this.playTime = this.user.duration;
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
    .operator-container {
        position: relative;
        display: flex;
        height: 127px;
        justify-content: center;
        align-items: center;
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
