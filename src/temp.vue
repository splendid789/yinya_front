<template>
<div class="exchange-page">
    <div class="user-info">
        <div class="user-info-left">
            <img src="" alt="">
            <div class="base-info"></div>
            <div class="audio-container" >
                <div class="audio-widget" @click="audioOperator(1)">
                    <img :src="'../../assets/images/' + (playStatus2 == 0 ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                    <span >{{playStatus2 == 0 ? exChangeConfig.respondent.duration : currentTime2}}s</span>
                </div>
            </div>
        </div>
        <div class="user-info-right">
            <img src="" alt="">
            <div class="base-info"></div>
            <div class="audio-container" >
                <div class="audio-widget" @click="audioOperator(0)">
                    <img :src="'../../assets/images/' + (playStatus1 == 0 ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                    <span >{{playStatus1 == 0 ? exChangeConfig.applicant.duration : currentTime1}}s</span>
                </div>
            </div>
        </div>
    </div>
    <div v-if="this.rootPage !== 'message' " class="exchange-ok" @click="exchangeOk">完成</div>
    <!-- <div class="user-info-right">
        <div class="base-info">
            <div class="pic">
                <img :src="exChangeConfig.applicant.head_img" alt="" @click="previewPicture(0)">
            </div>
            <div class="audio-container" >
                <div class="audio-widget" @click="audioOperator(0)">
                    <img :src="'../../assets/images/' + (playStatus1 == 0 ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                    <span >{{playStatus1 == 0 ? exChangeConfig.applicant.duration : currentTime1}}s</span>
                </div>
            </div>
        </div>
    </div>
    <div class="user-info-left">
        <div class="base-info">
            <div class="pic">
                <img :src="exChangeConfig.respondent.head_img" alt="" @click="previewPicture(1)">
            </div>
            <div class="audio-container" >
                <div class="audio-widget" @click="audioOperator(1)">
                    <img :src="'../../assets/images/' + (playStatus2 == 0 ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                    <span >{{playStatus2 == 0 ? exChangeConfig.respondent.duration : currentTime2}}s</span>
                </div>
            </div>
        </div>
    </div> -->
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
            messageArr: [],
            exChangeConfig: {},
            playStatus1: 0,  // 0/1 开始播放/录制结束,
            playStatus2: 0,  // 0/1 开始播放/录制结束,
            innerAudioContext: null, // 播放音频实例
            audioConfig: {}, // 录音配置
            currentTime1: 0, // 当前录音时间
            currentTime2: 0, // 当前录音时间
            palyRecordTimer: null, // 播放录音定时器
        }
    },
    async onShow() {
        this.rootPage = this.$root.$mp.query.root;
        if(this.rootPage === 'message') {
            this.exChangeConfig = JSON.parse(wx.getStorageSync('exChangedConfig'));
        }
        else {
            this.exChangeConfig = JSON.parse(wx.getStorageSync('exChangeConfig'));
        }
        
        this.innerAudioContext = null;
        this.currentTime1 = 0;
        this.currentTime2 = 0;
        this.playStatus1 = 0;
        this.playStatus2 = 0;
    },
    methods: {
        ...mapMutations(['setUserInfoAuth', 'setUserInfo']),
        exchangeOk() {
            wx.navigateTo({url: '/pages/message/main'});
        },
        // 预览照片
        async previewPicture(flag) {
            // flag == 0 ? this.previewImage(this.exChangeConfig.applicant.picture) : this.previewImage
            if(flag == 0) {
                await wxApi.previewImage([this.exChangeConfig.applicant.picture]);
            }
            else {
                await wxApi.previewImage([this.exChangeConfig.respondent.picture]);
            }
        },
        // 播放/暂停录音
        audioOperator(flag) {
            if(flag == 0) {
                this.audioConfig.path = this.exChangeConfig.applicant.file;
                this.audioConfig.duration = this.exChangeConfig.applicant.duration;
            }
            else {
                this.audioConfig.path = this.exChangeConfig.respondent.file;
                this.audioConfig.duration = this.exChangeConfig.respondent.duration;
            }
            if(flag == 0) {
                this.playStatus1 == 0 ? this.playAudio(0) : this.pauseAudio(0);
            }
            else {
                this.playStatus2 == 0 ? this.playAudio(1) : this.pauseAudio(1);
            }
        },
        // 播放录音
        async playAudio(flag) {
            console.log('playAudio')
            if(!this.innerAudioContext) {
                this.innerAudioContext = wx.createInnerAudioContext()
                if(flag == 0) {
                    this.audioConfig.path = this.exChangeConfig.applicant.file;
                    this.audioConfig.duration = this.exChangeConfig.applicant.duration;
                    this.innerAudioContext.src = this.audioConfig.path;
                }
                else {
                    this.audioConfig.path = this.respondent.applicant.file;
                    this.audioConfig.duration = this.respondent.applicant.duration;
                    this.innerAudioContext.src = this.audioConfig.path;
                }
                this.listenAudioEvent();
            }
            else {
                this.innerAudioContext.destroy();
                let url; 
                url = flag ? this.exChangeConfig.respondent.file : this.exChangeConfig.applicant.file;
                let downloadInfo = await wxApi.downloadFile(url);
                console.log('downloadInfo: ', downloadInfo);
                if(downloadInfo.statusCode == 200) {
                    this.audioConfig.path = downloadInfo.tempFilePath;
                    this.audioConfig.duration = flag ? this.exChangeConfig.respondent.duration : this.exChangeConfig.applicant.duration;
                    this.innerAudioContext = wx.createInnerAudioContext();
                    this.innerAudioContext.src = this.audioConfig.path;
                    this.listenAudioEvent();
                }
                else {
                    console.log('downloadFile fail !');
                }
            }
            if(flag == 0) {
                this.playStatus1++;
            }
            else {
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
        // 暂停录音
        pauseAudio(flag) {
            console.log('stopPlayRecord')
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
        // 监听音频事件-回调处理函数
        listenAudioEvent() {
            this.innerAudioContext.onPlay((res) => {
                console.log('开始播放', res)
            })
            this.innerAudioContext.onError((res) => {
                console.log(res.errMsg)
                console.log(res.errCode)
            })
            this.innerAudioContext.onStop((res) => {
                console.log('停止播放', res);
            })
            this.innerAudioContext.onEnded((res) => {
                console.log('播放结束', res);
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
        console.log('exchange 页面卸载');
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
    padding-top: 86px;
    height: 100vh;
    box-sizing: border-box;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    .user-info {
        display: flex;
        justify-content: center;
        .user-info-left {

        }
        .user-info-right {

        }
    }
}
</style>
