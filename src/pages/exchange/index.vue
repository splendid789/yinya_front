<template>
<div class="exchange-page">
    <div class="user-info">
        <div class="user-info-left">
            <img class="avatar" :src="exChangeConfig.respondent.head_img" alt="">
            <div class="base-info">
                <div class="user-nickname">{{exChangeConfig.respondent.nickname}}</div>
                <div @click="copyWechatNum(exChangeConfig.respondent.wechat_number)" class="user-wechat-account">微信号: {{exChangeConfig.respondent.wechat_number}}</div>
            </div>
            <div class="audio-container" >
                <div class="audio-widget" @click="audioOperator(1)">
                    <img :src="'../../assets/images/' + (playStatus2 == 0 ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                    <span >{{playStatus2 == 0 ? exChangeConfig.respondent.duration : currentTime2}}s</span>
                </div>
            </div>
        </div>
        <div class="user-info-right">
            <img class="avatar" :src="exChangeConfig.applicant.head_img" alt="">
            <div class="base-info">
                <div class="user-nickname">{{exChangeConfig.applicant.nickname}}</div>
                <div @click="copyWechatNum(exChangeConfig.applicant.wechat_number)" class="user-wechat-account">微信号: {{exChangeConfig.applicant.wechat_number}}</div>
            </div>
            <div class="audio-container" >
                <div class="audio-widget" @click="audioOperator(0)">
                    <img :src="'../../assets/images/' + (playStatus1 == 0 ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                    <span >{{playStatus1 == 0 ? exChangeConfig.applicant.duration : currentTime1}}s</span>
                </div>
            </div>
        </div>
    </div>
    <div class="center-line"></div>
    <div class="tip-text">互感兴趣可加好友（备注音吖）</div>
    <div v-if="rootPage != 'message'" class="exchange-ok" @click="exchangeOk">{{!goHome?'回到首页':'完成'}}</div>
    <i-toast id="toast" />
</div>
</template>

<script>
import {mapMutations} from 'vuex';
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
const { $Toast } = require('../../../static/iview/base/index');
export default {
    data() {
        return {
            goHome:false,
            messageArr: [],
            exChangeConfig: {},
            playStatus1: 0,  // 0/1 开始播放/录制结束,
            playStatus2: 0,  // 0/1 开始播放/录制结束,
            innerAudioContext: null, // 播放音频实例
            audioConfig: {}, // 录音配置
            currentTime1: 0, // 当前录音时间
            currentTime2: 0, // 当前录音时间
            palyRecordTimer: null, // 播放录音定时器,
            rootPage: '',
            audioCacheArr: [],
            audioArr: [],
            applyID: '',

        }
    },
    async onShow() {
        this.goHome = false;
        this.rootPage = this.$root.$mp.query.root;
        this.applyID = this.$root.$mp.query.applyID;
        if(this.rootPage === 'message'||this.rootPage === 'request') {
          this.goHome = false;
        }
        else {
          this.goHome = true;
        }
        if(this.applyID) {
          let config = {
            url: 'exchange',
            method: 'get',
            data: {
              status: 1,
              id: this.applyID
            }
          }
          let temp = await wxApi.request(config);
          this.exChangeConfig = temp.results.results[0];
        }
        else {
          this.exChangeConfig = JSON.parse(wx.getStorageSync('exChangeConfig'));
        }
        this.audioArr = [];
        this.audioCacheArr = [];
        this.audioArr.push(this.exChangeConfig.respondent)
        this.audioArr.push(this.exChangeConfig.applicant)
        this.innerAudioContext = null;
        this.currentTime1 = 0;
        this.currentTime2 = 0;
        this.playStatus1 = 0;
        this.playStatus2 = 0;
        for(let i = 0; i < 2; i++) {
            let url = this.audioArr[i].file;
            let info = await this.downloadAudio(url);
            this.audioCacheArr.push(info);
        }
    },
    methods: {
        ...mapMutations(['setUserInfoAuth', 'setUserInfo']),
        exchangeOk() {
            if(this.goHome){
              wx.switchTab({url: '/pages/discover/main'});
            }else{
              wx.switchTab({url: '/pages/message/main'});
            }
        },
        async downloadAudio(url) {
            let downloadInfo = await wxApi.downloadFile(url);
            if(downloadInfo.statusCode == 200) {
                return downloadInfo;
            }
            else {
            }
        },
        audioOperator(flag) {
            if(flag == 0) {
                this.audioConfig.path = this.audioCacheArr[1].tempFilePath;
                this.audioConfig.duration = this.audioArr[1].duration;
            }
            else {
                this.audioConfig.path = this.audioCacheArr[0].tempFilePath;
                this.audioConfig.duration = this.audioArr[0].duration;
            }
            if(flag == 0) {
                this.playStatus1 == 0 ? this.playAudio(0) : this.pauseAudio(0);
            }
            else {
                this.playStatus2 == 0 ? this.playAudio(1) : this.pauseAudio(1);
            }
        },
        async copyWechatNum(chatNum) {
            let info = await wxApi.setClipboardData(chatNum);
        },
        async playAudio(flag) {
            if(!this.innerAudioContext) {
                this.innerAudioContext = wx.createInnerAudioContext()
                this.innerAudioContext.src = this.audioConfig.path;
                this.listenAudioEvent();
            }
            else {
                this.innerAudioContext.stop();
                this.innerAudioContext.destroy();
                this.innerAudioContext = wx.createInnerAudioContext()
                this.innerAudioContext.src = this.audioConfig.path;
                this.listenAudioEvent();
            }
            if(flag == 0) {
                clearInterval(this.palyRecordTimer)
                this.playStatus2 = 0;
                this.currentTime2 = 0;
                this.playStatus1++;
            }
            else {
                clearInterval(this.palyRecordTimer)
                this.playStatus1 = 0;
                this.currentTime1 = 0;
                this.playStatus2++;
            }
            this.innerAudioContext.play();
            this.palyRecordTimer = setInterval(() => {
                if(flag == 0) {
                    this.currentTime1++;
                }
                else {
                    this.currentTime2++;
                }
            },1000);
        },
        pauseAudio(flag) {
            clearInterval(this.palyRecordTimer)

            if(flag == 0) {
                this.playStatus1 = 0;
            }
            else {
                this.playStatus2 = 0;
            }
            if(flag == 0) {
                this.currentTime1 = 0;
            }
            else {
                this.currentTime2 = 0;
            }
            this.innerAudioContext.destroy();
            this.innerAudioContext = null;
        },
        listenAudioEvent() {
            this.innerAudioContext.onPlay((res) => {
            })
            this.innerAudioContext.onError((res) => {
            })
            this.innerAudioContext.onStop((res) => {
            })
            this.innerAudioContext.onEnded((res) => {
                clearInterval(this.palyRecordTimer)
                this.playStatus1 = 0;
                this.playStatus2 = 0;
                this.currentTime1 = 0;
                this.currentTime2 = 0;
                this.innerAudioContext.stop();
            });
        },
    },
    onUnload () {
        this.innerAudioContext.stop();
        this.innerAudioContext.destroy();
        this.innerAudioContext = null;
        this.playStatus1 = 0;
        this.playStatus2 = 0;
        this.currentTime1 = 0;
        this.currentTime2 = 0;
    },
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.exchange-page {
    position: relative;
    padding-top: 86px;
    height: 100vh;
    box-sizing: border-box;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    .user-info {
        display: flex;
        justify-content: center;
        margin-bottom: 23px;
        .user-info-left {
            width: 135px;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 55px;
            .avatar {
                width: 90px;
                height: 90px;
                border-radius: 50%;
                margin-bottom: 15px;
            }
            .base-info {
                margin-bottom: 18px;
                .user-nickname {
                    text-align: center;
                    margin-bottom: 11px;
                    font-size: 14px;
                }
                .user-wechat-account {
                    color: #333333;
                    text-align: center;
                    font-size: 12px;
                    font-family: "PingFangSC-Regular";
                }
            }
        }
        .user-info-right {
            width: 135px;
            display: flex;
            flex-direction: column;
            align-items: center;
            .avatar {
                width: 90px;
                height: 90px;
                border-radius: 50%;
                margin-bottom: 15px;
            }
            .base-info {
                margin-bottom: 18px;
                .user-nickname {
                    text-align: center;
                    margin-bottom: 11px;
                    font-size: 14px;
                }
                .user-wechat-account {
                    text-align: center;
                    font-size: 12px;
                    font-family: "PingFangSC-Regular";
                }
            }
        }
    }
    .audio-container {
        width: 100px;
        height: 32px;
        .audio-widget {
            width: 87px;
            height: 32px;
            align-items: flex-start;
            border-radius: 15px;
            background-color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            .icon-audio {
                width: 30px;
                height: 30px;
                border-radius: 15px;
                // background-color: pink;
            }
            span {
                color: #333333;
                font-family: "PingFangSC-Regular";
                margin-right: 10px;
            }
        }
    }
    .center-line {
        height: 1px;
        background: -webkit-radial-gradient(#F4CF24 10%, #fff 90%);
        margin-bottom: 19px;
    }
    .tip-text {
        font-size: 14px;
        color: #666;
        font-family: "PingFangSC-Regular";
        text-align: center;
    }
    .exchange-ok {
        position: absolute;
        bottom: 70px;
        left: 50%;
        transform: translate(-50%, 0);
        width: 140px;
        line-height: 40px;
        text-align: center;
        font-size: 16px;
        font-family: "PingFangSC-Semibold";
        color: #fff;
        background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
        border-radius: 2px;
    }
}
</style>
