<template>
<div class="record-page">
    <!-- <textarea class="textarea" :disabled="isDisabled" @focus="bindTextAreaFocus" @blur="bindTextAreaBlur" :value="textAreaValue" /> -->
    <div v-if="userInfo.file && rootPage == 'mine' && isFirst" class="tip-text" style="margin-bottom: 65px;">当前声音</div>
    <block v-else>
        <div v-if="playStatus > 1" class="tip-text" style="margin-bottom: 65px;">请点击保存</div>
        <div v-else style="margin-bottom: 34px;">
            <div class="tip-text">请录制一段声音</div>
            <div style="color: #999;font-size: 14px; text-align: center;">声音用于向对方发送申请，也会在首页展示 </div>
        </div>
    </block>
    <div v-if="playStatus == 3" :style="'visibility:' + (playStatus > 0 ? ';' : 'hidden;') " class="time-text">{{currentTime}}s</div>
    <div v-else :style="'visibility:' + (playStatus > 0 ? ';' : 'hidden;') " class="time-text">{{recordTime}}s</div>
    <div  class="operator-container">
        <!-- <div @click="reRecord" v-if="playStatus > 1" class="operator-text1">重新录制</div> -->
        <img @click="reRecord" v-if="playStatus > 1" class="operator-text1" src="../../assets/images/icon-rerecord.png" alt="">
        <div @click="changePlayStatus" :class="{'circle-btn': true, 'pause': playStatus == 1 || playStatus == 3}">
            <span v-if="playStatus == 0">开始录制</span>
            <div v-else-if="playStatus ==1 || playStatus == 3" class="square"></div>
            <div v-else-if="playStatus == 2" class="play"></div>
        </div>
        <!-- <div @click="saveAudio" v-if="playStatus > 1" class="operator-text2">保存预览</div> -->
        <img @click="saveAudio" v-if="playStatus > 1" class="operator-text2" src="../../assets/images/icon-save-preview.png" alt="">
    </div>
    <!-- <div v-if="rootPage=='mine'" class="exchange-pic">
        <div class="btn-exchange" @click="reRecord">重新录制</div>
    </div> -->
    <i-toast id="toast" />
</div>
</template>

<script>
import WxApi from '../../utils/WxApi'
import {mapMutations, mapGetters} from 'vuex';
const wxApi = new WxApi();
const { $Toast } = require('../../../static/iview/base/index');
export default {
    data() {
        return {
            recordAuth: false,  // 录音权限,
            textAreaValue: '请输入文本内容', // 文本域内容
            playStatus: 0,  // 0/1/2/3  录音授权/开始播放/录制结束/回放录音,
            rewardPriceArr: [0.5,2,5], // 打赏金额,
            recorderManager: null, // 录音管理器实例
            innerAudioContext: null, // 播放音频实例
            tempFilePath: '',  // 录音资源临时文件路径
            recordTime: 0, // 录音时长
            recordPlayTime: 0,  // 录音播放时长
            recordTimer: null, // 录音定时器
            palyRecordTimer: null, // 播放录音定时器
            currentTime: 0, // 当前录音时间
            isDisabled: false, // 是否禁用文本域
            rootPage: '',
            isFirst: true
        }
    },
    computed: {
        ...mapGetters(['userInfo']),
    },
    async onShow() {
        this.rootPage = this.$root.$mp.query.root;
        let authSetting = await wxApi.getSetting();
        if(authSetting.authSetting['scope.record']) {
            this.userInfoAuth = true;
        }
        else {
            this.userInfoAuth = false;
        }
        if(this.rootPage === 'mine') {
            if(this.userInfo.file) {
                this.init();
                this.playStatus = 2;
                this.recordTime = this.userInfo.duration;
                let audioInfo = await this.downloadAudio(this.userInfo.file);
                this.tempFilePath = audioInfo.tempFilePath
                this.innerAudioContext = wx.createInnerAudioContext()
                this.innerAudioContext.src = this.tempFilePath;
                this.listenAudioEvent();
            }
        }
        else if(this.rootPage === 'discover') {
           this.init();
        }
    },
    onHide() {
        if(this.innerAudioContext) {
            this.stopPlayRecord()
        }
        if(this.recorderManager) {
            this.stopRecord();
        }
        this.init();
    },
    methods: {
        ...mapMutations(['setUserInfo', 'setInnerAudioContext', 'setRecorderManager']),
        init() {
           if(this.palyRecordTimer) {
               clearInterval(this.palyRecordTimer);
           }
           this.palyRecordTimer = null;
           if(this.recordTimer) {
               clearInterval(this.recordTimer);
           }
           this.recordTimer = null;
           this.playStatus = 0;
           this.recorderManager = null;
           this.innerAudioContext = null;
           this.tempFilePath = '';
           this.recordTime = 0;
           this.recordPlayTime = 0;
           this.isFirst = true;
        },
        async downloadAudio(url) {
            let downloadInfo = await wxApi.downloadFile(url);
            if(downloadInfo.statusCode == 200) {
                return downloadInfo;
            }
            else {
            }
        },
        async changePlayStatus () {
            switch(this.playStatus) {
                case 0:
                    await this.getRecordAuth();  break;
                case 1:
                    this.stopRecord();  break;
                case 2:
                    this.playRecord();  break;
                case 3:
                    this.stopPlayRecord();  break;
            }
        },

        async getRecordAuth() {
            let authInfo = await wxApi.getSetting();
            let flag = authInfo.authSetting['scope.record'];
            if(!flag) {
                let recordAuth = await wxApi.authorize('scope.record');
                this.recorderManager = wx.getRecorderManager()
                this.setRecorderManager(this.recorderManager)
                this.listenRecordEvent();
                this.startRecrod();
            }
            else {
                this.recorderManager = wx.getRecorderManager()
                this.setRecorderManager(this.recorderManager)
                this.listenRecordEvent();
                this.startRecrod();
            }
        },
        startRecrod() {
            const options = {
              format: 'mp3',
              sampleRate: 48000,
              encodeBitRate: 64000
            }
            this.recorderManager.start(options);
        },
        stopRecord(isLeavePage = false) {
            clearInterval(this.recordTimer);
            this.playStatus++;
            this.isDisabled = false;
            this.recorderManager.stop();
            if(!isLeavePage) {
            }
        },
        playRecord() {
            if(!this.innerAudioContext) {
                this.innerAudioContext = wx.createInnerAudioContext()
                this.innerAudioContext.src = this.tempFilePath;
                this.listenAudioEvent();
                this.setInnerAudioContext(this.innerAudioContext);
            }
            else {
                this.innerAudioContext.destroy();
                this.innerAudioContext = wx.createInnerAudioContext()
                this.innerAudioContext.src = this.tempFilePath;
                this.listenAudioEvent();
                this.setInnerAudioContext(this.innerAudioContext);
            }
            this.playStatus++;
            this.innerAudioContext.play();
            this.palyRecordTimer = setInterval(() => {
                this.currentTime++;
            },1000);
        },
        stopPlayRecord() {
            clearInterval(this.palyRecordTimer)
            this.playStatus = 2;
            this.currentTime = 0;
            this.innerAudioContext.destroy();
            this.innerAudioContext = null;
            this.setInnerAudioContext(null);
        },
        listenRecordEvent() {
            this.recorderManager.onStart(() => {
                this.playStatus++;
                this.recordTime++;

                this.recordTimer = setInterval(() => {
                    if(this.recordTime >= 60) {
                        clearInterval(this.recordTimer);
                        this.stopRecord();
                        return;
                    }
                    this.recordTime++;
                }, 1000);
            })
            this.recorderManager.onPause(() => {
            })
            this.recorderManager.onStop((res) => {
                const { tempFilePath, duration } = res;
              this.tempFilePath = tempFilePath;
                if(this.recordTime > duration) {
                    this.recordPlayTime = Math.floor(duration);
                }
                else if(this.recordTime < duration) {
                    this.recordPlayTime++;
                }
                else if(this.recordTime == duration) {
                    this.recordPlayTime = duration;
                }
            })
            this.recorderManager.onFrameRecorded((res) => {
                const { frameBuffer } = res;
            })
        },
        listenAudioEvent() {
            this.innerAudioContext.onPlay((res) => {
            });
            this.innerAudioContext.onError((res) => {
            });
            this.innerAudioContext.onEnded((res) => {
                clearInterval(this.palyRecordTimer)
                this.playStatus = 2;
                this.currentTime = 0;
                this.innerAudioContext.stop();
            });
        },
        reRecord() {
            if(this.innerAudioContext) {
                this.stopPlayRecord();
            }
            this.isFirst = false;
            this.playStatus = 0;
            if(this.innerAudioContext) {
                this.innerAudioContext.destroy();
            }
            this.recorderManager = null;
            this.tempFilePath = '';
            this.recordTime = 0;
            this.recordPlayTime = 0;
            this.recordTimer = null;
            this.palyRecordTimer = null;
            this.currentTime = 0;
            this.textAreaValue = '请输入文本内容';
            this.rewardPriceArr = [0.5,2,5];
        },
        async saveAudio() {
            let config = {
                url: 'users/upload_record/',
                filePath: this.tempFilePath,
                name: 'file',
                formData: {
                    duration: this.recordTime
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
                    setTimeout(() => {
                        wx.switchTab({url: '/pages/mine/main'});
                    }, 1000);
                }
                else {
                    $Toast({
                        content: '保存成功',
                        type: 'success'
                    })
                    setTimeout(() => {
                        wx.navigateTo({url: '/pages/uploadact/main?root=record'});
                    }, 1000);

                }
            }
            else {
                $Toast({
                    content: JSON.parse(uploadInfo.data).results,
                    type: 'error'
                })
            }
        },
    },
    onUnload () {
        if(this.innerAudioContext) {
            this.stopPlayRecord();
        }
        if(this.recorderManager) {
            this.stopRecord(true);
        }
        this.init();
    }
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.record-page {
    padding-top: 100px;
    font-family: "PingFangSC-Medium";
    color: #333;
    font-size: 16px;
    height: 100vh;
    box-sizing: border-box;
    // background-color: #fff;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
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
        margin-bottom: 17px;
        text-align: center;
    }
    .time-text {
        height: 30px;
        line-height: 30px;
        text-align: center;
        font-size: 30px;
        color: #666;
        margin-bottom: 17px;
    }
    .operator-container {
        position: relative;
        display: flex;
        height: 127px;
        justify-content: center;
        margin-bottom: 40px;
        align-items: center;
        .operator-text1 {
            position: absolute;
            left: 18px;
        }
        .circle-btn {
            flex: 1;
            position: absolute;
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
            right: 18px;
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
