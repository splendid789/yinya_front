<template>
<div class="discover-page">
    <div class="photo-container" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd">
        <div
            v-if="index > (photoArr.length - 4)"
            v-for="(item, index) in photoArr"
            :key="index"
            :class="{'photo-item': true, 'photo-item1': (index == photoArr.length - 1), 'photo-item2': (index == photoArr.length - 2), 'photo-item3': (index == photoArr.length - 3),}"
            :style="'transform: translate3d(' + item.left_val + 'px,'+item.top_val+ 'px,0px) ' + 'scale(' + (1 - (photoArr.length-(index+1)) * 0.1)+ ');' + 'transition-duration:' +duration+'s;'"
        >
            <div class="top-border"></div>
            <div class="card-content">
                <img :src="item.userInfo['head_img']" class="user-avatar" alt="">
                <div class="user-nickname">{{item.userInfo['nickname']}}</div>
                <form :data-id="item.userInfo.id" report-submit @submit="audioOperator">
                    <button class="audio-operator" form-type="submit">
                        <img :src="'../../assets/images/' + (item.playStatus == 0 ? 'icon-play.png': 'icon-pause.png') " alt="">
                    </button>
                </form>
            </div>
        </div>
        <div v-if="!isExchangePic" :class="{'exchange-pic': true}">
            <form report-submit @submit="exchange">
                <button class="btn-exchange" form-type="submit">加Ta微信
                </button>
            </form>
        </div>
        <div v-if="isExchangePic" :class="{'exchange-pic': true, 'showAnimation': isExchangePic}" style="color: #F4CF24; font-size: 16px;">已通知对方</div>
        <!-- <div v-if="isExchangePic" class="circle-0"></div>
        <div v-if="isExchangePic" class="circleProgress_wrapper">
            <img class="icon-send" v-if="!isSendComple" src="../../assets/images/icon-send-1.png" alt="">
            <img class="icon-send" v-else src="../../assets/images/icon-send-0.png" alt="">
            <div class="wrapper right">
                <div :class="{'circleProgress': true,'rightcircle': true, 'animation-right': isStartSend} "></div>
            </div>
            <div class="wrapper left">
                <div :class="{'circleProgress': true, 'leftcircle': true, 'animation-left': isStartSend} "></div>
            </div>
        </div> -->
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
                <div class="dialog-text">
                    <div>完善信息后即可加Ta微信</div>
                </div>
                <div class="dialog-upload">
                    <div @click="toUpload" class="upload-btn">立即完善</div>
                </div>
                <img @click="closeDialog" src="../../assets/images/icon-close.png" alt="" class="close">
            </div>
        </div>
    </van-dialog>
    <van-dialog
        use-slot
        :show="isExchangeOk"
        :showConfirmButton="false"
        :showCancelButton="false"
    >
         <div class="dialog-container">
            <div class="top-border"></div>
            <div class="dialog-content">
                <div class="dialog-text">
                    <div>Ta已收到你的请求</div>
                    <div>同意后即可互加微信</div>
                    </div>
                <div class="dialog-upload">
                    <div @click="closeExchangeOk" class="upload-btn">我知道了</div>
                </div>
                <img style="display: none;" @click="closeDialog" src="../../assets/images/icon-close.png" alt="" class="close">
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
            imgArr:[],
            clientWidth: wx.getSystemInfoSync().windowWidth,
            clientHeight: wx.getSystemInfoSync().windowHeight,
            duration: 0,
            run:true,
            load:false,
            reduceFlag: false,
            positionConfig: {
                _x_start:0,
                _y_start:0,
                _x_move:0,
                _y_move:0,
                _x_end:0,
                _y_end:0,
                top_val:0,
                left_val:0,
            },
            isCardMoveIng: false,
            photoArr: [
            ],
            playStatus: 0,
            innerAudioContext: null,
            audioConfig: {
                path: '',
                duration: ''
            },
            currentTime: 0,
            palyRecordTimer: null,
            isUploadFile: false,
            isExchangePic: false,
            isSendComple: false,
            isStartSend: false,
            isCanSlide: true,
            isExchangeOk: false,
            audioCacheArr: [],
            changeAudioTimer: null,
            isDownLoading: false,
        }
    },
    computed: {
        ...mapGetters(['userInfo', 'isFirst']),
    },
    onShow() {
        this.isCardMoveIng = false;
        this.isCanSlide = true;
        if(this.userInfo.file && this.userInfo.wechat_number) {
            this.isUploadFile = false;
        }
        if(!this.userInfo.file || !this.userInfo.wechat_number) {
            this.setIsFirst(true);
        }
        if(this.photoArr.length) {
            this.innerAudioContext = null;
            this.photoArr.forEach(item => {
                item.playStatus = 0;
            });
        }
        if(this.audioCacheArr.length > 0) {
            clearInterval(this.changeAudioTimer);
            this.changeAudioTimer = setInterval(async () => {
                if(this.audioCacheArr.length === 0) {
                    return '';
                }
                if(this.audioCacheArr.length === 1) {
                    if(!this.isDownLoading) {
                        this.isDownLoading = true;
                        let info = await this.downloadAudio(this.photoArr[this.photoArr.length - 3].userInfo.file)
                        this.audioCacheArr.push(info);
                        this.isDownLoading = false;
                        return '';
                    }
                }
            }, 20);
        }
        wx.setInnerAudioOption({
            obeyMuteSwitch: false
        })
    },
    async onLoad() {
        this.load = true;
        await this.getFriendInfo(10);
        this.audioCacheArr = [];
        for(let i = 1; i < 3; i++) {
            let url = this.photoArr[this.photoArr.length - i].userInfo.file;
            let info = await this.downloadAudio(url);
            this.audioCacheArr.push(info);
        }
        if(this.changeAudioTimer) {
            clearInterval(this.changeAudioTimer);
        }
        this.changeAudioTimer = setInterval(async () => {
            if(this.audioCacheArr.length === 0) {
                return '';
            }
            if(this.audioCacheArr.length === 1) {
                if(!this.isDownLoading) {
                    this.isDownLoading = true;
                    let info = await this.downloadAudio(this.photoArr[this.photoArr.length - 3].userInfo.file)
                    this.audioCacheArr.push(info);
                    this.isDownLoading = false;
                    return '';
                }
            }
        }, 20);
        this.changeCard();
    },
    onHide() {
        if(this.changeAudioTimer) {
            clearInterval(this.changeAudioTimer);
        }
    },
    methods: {
        ...mapMutations(['setUserInfoAuth', 'setUserInfo', 'setInnerAudioContext', 'setIsFirst']),
        closeDialog() {
            this.isUploadFile = false;
        },
        toUpload() {
            if(!this.userInfo.file) {
                if(this.innerAudioContext) {
                    this.innerAudioContext.destroy();
                }
                let url = '/pages/record/main?root=discover';
                this.isUploadFile = false;
                wx.navigateTo({url});
                return;
            }
            if(!this.userInfo.wechat_number) {
                if(this.innerAudioContext) {
                    this.innerAudioContext.destroy();
                }
                let url = '/pages/uploadact/main?root=discover';
                this.isUploadFile = false;
                wx.navigateTo({url});
            }
        },
        closeExchangeOk() {
            this.isExchangeOk = false;
            this.setIsFirst(false);
        },
        async exchange(e) {
            let formId = e.mp.detail.formId;
            if(!this.userInfo.file || !this.userInfo.wechat_number) {
                this.isUploadFile = true;
                return;
            }
            this.isExchangePic = true;
            this.isStartSend = true;
            let config = {
                url: 'exchange/',
                method: 'post',
                data: {
                    user_id: this.photoArr[this.photoArr.length - 1].userInfo.id
                }
            }
            let resInfo = await wxApi.request(config);
            setTimeout(() => {
                this.isSendComple = true;
                if(this.isFirst) {
                    this.isExchangeOk = true;
                }
            }, 800);
            await this.collectionFormId(formId);
        },
        changeCard() {
            this.audioConfig.path = this.audioCacheArr[0].tempFilePath;
        },
        async getFriendInfo(num, isNeedOne = false) {
            let config = {
                url: 'users/find_friend/?num=' + num,
                method: 'get'
            };
            let resInfo = await wxApi.request(config);
            for(let i = 0, len = resInfo.results.length; i < len; i++) {
                resInfo.results[i] = {userInfo: resInfo.results[i], ...this.positionConfig};
                resInfo.results[i].playStatus = 0;
            }
            if(!isNeedOne) {
                this.photoArr = resInfo.results.filter((item) => {
                    return item.userInfo.file && item.userInfo.wechat_number;
                })
            }
            else {
                this.photoArr.unshift(resInfo.results[0]);
            }
        },
        async audioOperator(e) {
            let cardId = e.mp.target.dataset.id;
            let formId = e.mp.detail.formId;
            let temp = this.photoArr.filter((temp) => {
                return temp.userInfo.id == cardId;
            })
            let item = temp[0];
            if(!this.reduceFlag && this.isCanSlide) {
                item.playStatus == 0 ? this.playAudio(item) : this.pauseAudio(item);
            }
            await this.collectionFormId(formId);
        },
        playAudio(item) {
            if(this.isCardMoveIng) {
                return;
            }
            if(!this.innerAudioContext) {
                this.innerAudioContext = wx.createInnerAudioContext()
                this.setInnerAudioContext(this.innerAudioContext);
                this.innerAudioContext.src = this.audioConfig.path;
                this.listenAudioEvent();
            }
            item.playStatus++;
            this.innerAudioContext.play();
            this.palyRecordTimer = setInterval(() => {
                this.currentTime++;
            },1000);
        },
        pauseAudio(item) {
            clearInterval(this.palyRecordTimer)
            item.playStatus = 0;
            this.currentTime = 0;
            this.innerAudioContext.destroy();
            this.innerAudioContext = null;
            this.setInnerAudioContext(null);
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
                this.photoArr[this.photoArr.length -1].playStatus = 0;
                this.currentTime = 0;
                this.innerAudioContext.stop();
            });
        },
        async animateMove(val) {
            if(!this.run){
                return;
            }
            this.run=false;
            this.photoArr[this.photoArr.length-1].left_val = this.clientWidth*val;
            this.photoArr[this.photoArr.length-1].top_val = this.photoArr[this.photoArr.length-1].top_val*2.2;
            this.duration = 0.3;
            if(this.innerAudioContext) {
                this.innerAudioContext.destroy();
            }
            this.audioCacheArr.shift();
            this.audioConfig.path = this.audioCacheArr[0].tempFilePath; //  downloadInfo.tempFilePath;
            this.innerAudioContext = wx.createInnerAudioContext();
            this.setInnerAudioContext(this.innerAudioContext);
            this.innerAudioContext.src = this.audioConfig.path;
            this.listenAudioEvent();
            var moveTime=setTimeout(async () => {
                let waitDownloadTimer = setInterval(async () => {
                    if(this.audioCacheArr.length == 2) {
                        clearInterval(waitDownloadTimer);
                        let temp = this.photoArr.pop();
                        this.clearLocation(temp);
                        setTimeout(async () => {
                            // this.photoArr.unshift(temp);
                            this.isExchangePic = false;
                            this.isUploadFile = false;
                            this.isSendComple = false;
                            this.isCardMoveIng = false;
                            this.isCanSlide = true;
                        }, 500);
                        this.run=true;
                        await this.getFriendInfo(1, true);
                    }
                }, 20);

            },200);
        },
        async downloadAudio(url) {
            let downloadInfo = await wxApi.downloadFile(url);
            if(downloadInfo.statusCode == 200) {
                return downloadInfo;
            }
            else {
            }
        },
        animateReset() {
            this.photoArr[this.photoArr.length-1].left_val = 0;
            this.photoArr[this.photoArr.length-1].top_val = 0;
            this.duration = 0.3;
            var resetTime=setTimeout(() => {
                this.duration = 0;
                this.isCardMoveIng = false;
                this.isCanSlide = true;
            },1000);
        },
        clearLocation(item) {
            item._x_start = 0;
            item._y_start = 0;
            item._x_move = 0;
            item._y_move = 0;
            item._y_end = 0;
            item.top_val = 0;
            item.left_val = 0;
        },
        touchStart(e) {
            if(!this.load || !this.run){
                return;
            }
            if(!this.isCardMoveIng) {
                this.isCardMoveIng = true;
                let pageX = e.mp.changedTouches[0].pageX;
                let pageY = e.mp.changedTouches[0].pageY;
                this.photoArr[this.photoArr.length-1]._x_start = pageX;
                this.photoArr[this.photoArr.length-1]._y_start = pageY;
            }
        },
        touchMove(e) {
            if(!this.load || !this.run){
                return;
            }
            if(this.isCardMoveIng && this.isCanSlide) {
                let pageX = e.mp.changedTouches[0].pageX;
                let pageY = e.mp.changedTouches[0].pageY;
                this.photoArr[this.photoArr.length-1]._x_move = pageX;
                this.photoArr[this.photoArr.length-1]._y_move = pageY;
                this.duration = 0;
                this.photoArr[this.photoArr.length-1].left_val = parseFloat(this.photoArr[this.photoArr.length-1]._x_move) - parseFloat(this.photoArr[this.photoArr.length-1]._x_start);
                this.photoArr[this.photoArr.length-1].top_val = parseFloat(this.photoArr[this.photoArr.length-1]._y_move) - parseFloat(this.photoArr[this.photoArr.length-1]._y_start);
            }
        },
        touchEnd(e) {
            if(!this.load || !this.run){
                return;
            }
            let pageX = e.mp.changedTouches[0].pageX;
            let pageY = e.mp.changedTouches[0].pageY;
            if(Math.abs(this.photoArr[this.photoArr.length-1].left_val) < 2 ) {
                this.isCardMoveIng = false;
                return;
            }
            if(this.isCardMoveIng) {
                this.isCanSlide = false;
                this.isCardMoveIng = false;
                this.photoArr[this.photoArr.length-1]._x_end = pageX;
                this.photoArr[this.photoArr.length-1]._y_end = pageY;
                if(this.photoArr[this.photoArr.length-1].left_val>0 && this.photoArr[this.photoArr.length-1].left_val>this.clientWidth/2-this.clientWidth/2.5){
                    this.photoArr[this.photoArr.length - 1].playStatus = 0;
                    this.animateMove(1);
                }else if(this.photoArr[this.photoArr.length-1].left_val<0 && this.photoArr[this.photoArr.length-1].left_val<-this.clientWidth/2+this.clientWidth/2.5){
                    this.photoArr[this.photoArr.length - 1].playStatus = 0;
                    this.animateMove(-1);
                }else {
                    this.animateReset();
                }
            }
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
        }
    },
    onTabItemTap() {
    },
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.discover-page {
    position: relative;
    height: 100vh;
    box-sizing: border-box;
    font-family: "PingFangSC-Semibold";
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    .photo-container {
        position: absolute;
        top: 54px;
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
                    padding: 0;
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    height: 50px;
                    // border-radius: 50%;
                    background: none !important;
                    img {
                        width: 45px;
                        height: 45px;
                    }
                }
                .audio-operator::after {
                    border: none;
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
        justify-content: center;
        align-items: center;
        width: 100%;
        .btn-exchange {
            display: block;
            padding: 0;
            margin: 0;
            width: 140px;
            height: 40px;
            background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
            font-size: 16px;
            color: #fff;
            text-align: center;
            line-height: 40px;
            border-radius: 2px;
        }
        .btn-exchange::after {
            border: none;
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
                font-size: 16px;
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
    .circle-0 {
        position: absolute;
        top: 750rpx;
        left: 50%;
        transform: translate(-50%, 0);
        width: 50px;
        height: 50px;
        z-index: 999;
        border-radius: 50%;
        box-sizing: border-box;
        border: 2.5px solid #F2EEDA;
    }
    .circleProgress_wrapper {
        position: absolute;
        top: 750rpx;
        left: 50%;
        transform: translate(-50%, 0);
        width: 50px;
        height: 50px;
        z-index: 9999;
        .icon-send {
            position: absolute;
            width: 24px;
            height: 24px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }
    .wrapper {
        width: 25px;
        height: 50px;
        position: absolute;
        top:0;
        overflow: hidden;
    }
    .right {
        width: 26;
        right:0;
    }
    .left {
        left:0;
    }
    .circleProgress {
        width: 44px;
        height: 44px;
        border:3px solid transparent;
        border-radius: 50%;
        position: absolute;
        top:0;
        transform: rotate(-135deg);
    }
    .rightcircle {
        border-top:3px solid #FBBD00;
        border-right:3px solid #FBBD00;
        right:0;
    }
    .animation-right {
        animation: circleProgressLoad_right 0.3s linear ;
        animation-fill-mode: forwards;
    }
    .leftcircle {
        border-bottom:3px solid #FBBD00;
        border-left:3px solid #FBBD00;
        left:0;
    }
    .animation-left {
        animation: circleProgressLoad_left 0.3s linear;
        animation-fill-mode: forwards;
    }
    .showAnimation {
        animation: showout 1s linear;
    }
    @keyframes showout {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    @keyframes circleProgressLoad_right{
        0%{
            transform: rotate(-135deg);
        }
        50%,100%{
            transform: rotate(45deg);
        }
    }
    @keyframes circleProgressLoad_left{
        0%,50%{
            transform: rotate(-135deg);
        }
        100%{
            transform: rotate(45deg);
        }
    }
}
</style>
