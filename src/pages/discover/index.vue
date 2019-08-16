<template>
<div class="discover-page">
  <div class="stack" v-if="friends.length > 0">
    <div class="stack-item hideSlow" v-for="(item, index) in friends" :key="index"
         :style="index === current
         ? ('transform:translate3D(' + poswidth + 'px' + ',' + posheight + 'px' + ',0px);opacity:'+ opacity +';z-index:10;'+ (animation?'transition-timing-function:linear;transition-duration:550ms;':''))
         : (index >= current && index <= (current + visible - 1)
         ? 'opacity:1;transform:translate3D(0,0,' + (-1 * (index - current) * 60) + 'px' + ');z-index:'+(visible - index + current)+';transition-timing-function:linear;transition-duration:550ms;'
         : 'z-index:-1;transform:translate3D(0,0,' + (-1 * visible * 60) + 'px' + ');')"
         @touchstart="touchStart"
         @touchmove="touchMove"
         @touchend="touchEnd">
      <div class="top-border"></div>
      <div class="card-content">
        <img :src="item.head_img" class="user-avatar" alt="">
        <div class="user-nickname">{{item.nickname}}</div>
        <form :data-id="item.id" report-submit @submit="clickPlay">
          <button class="audio-operator" form-type="submit">
            <img :src="'../../assets/images/' + (!item.playFlag ? 'icon-play.png': 'icon-pause.png') " alt="">
          </button>
        </form>
      </div>
    </div>
  </div>
  <div v-if="!isExchangePic" :class="{'exchange-pic': true}">
    <form report-submit @submit="exchange">
      <button class="btn-exchange" form-type="submit">加Ta微信
      </button>
    </form>
  </div>
  <div v-if="isExchangePic" :class="{'exchange-pic': true, 'showAnimation': isExchangePic}" style="color: #F4CF24; font-size: 16px;">已通知对方</div>
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
          <div>你的声音已发送对方</div>
          <div>对方同意后可互加微信</div>
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
          start: {}, // 记录起始位置
          end: {}, // 记录终点位置
          isOne:true,
          current: 0, // 默认首图的序列
          opacity: 1, // 记录opacity
          zIndex: 10, // 记录zIndex
          visible: 3, // 记录默认显示堆叠数visible
          poswidth: '0', // 记录位移
          posheight: '0', // 记录位移
          lastPosWidth: '', // 记录上次最终位移
          lastPosHeight: '', // 记录上次最终位移
          tracking: false, // 是否在滑动，防止多次操作，影响体验
          animation: false, // 首图是否启用动画效果，默认为否
          opacity: 1, // 记录首图透明度
          swipe: false, // onTransition判定条件
          friends: [],
          innerAudioContext:null,
          isUploadFile: false,
          isExchangePic: false,
          isExchangeOk: false,
        }
    },
    computed: {
        ...mapGetters(['userInfo', 'isFirst']),
    },
    async onShow() {
      console.log('userInfo:',this.userInfo)
      if(!this.userInfo){
        let token = mpvue.getStorageSync('token');
        console.log('token',token)
        if(!token){
          $Toast({
            content: '错误码:10000',
            type: 'error'
          });
        }
        let config = {
          url: 'users/me/',
          method: 'get'
        }
        let userInfo = await this.ajaxGetUserInfo();
        this.setUserInfo(userInfo.user);
      }
      if(this.userInfo.file && this.userInfo.wechat_number) {
        this.isUploadFile = false;
      }
      if(!this.userInfo.file || !this.userInfo.wechat_number) {
        this.setIsFirst(true);
      }
      this.innerAudioContext = mpvue.createInnerAudioContext();
      mpvue.setInnerAudioOption({
        obeyMuteSwitch: false
      });
      if(this.friends.length > 0){
        this.friends[this.current].playFlag = false;
        this.isOne = true;
//        this.playAudio(this.current);
//        setTimeout(()=>{
//          this.innerAudioContext.stop();
//        },100)
      }
    },
    async onLoad() {
      this.start = {};
      this.end = {};
      this.isOne = true;
      this.current = 0;
      this.opacity = 1;
      this.zIndex = 10;
      this.visible = 3;
      this.poswidth = '0';
      this.posheight = '0';
      this.lastPosWidth = '';
      this.lastPosHeight = '';
      this.tracking = false;
      this.animation = false;
      this.swipe = false;
      this.friends = [];

      this.friends = await this.getFriendInfo(10);
      //this.playAudio(this.current);
    },
    onHide() {
      this.innerAudioContext.destroy()
    },
    methods: {
      ...mapMutations(['setUserInfoAuth', 'setUserInfo', 'setInnerAudioContext', 'setIsFirst']),
      async ajaxGetUserInfo() {
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
          return;
        }
      },
      closeDialog() {
        this.isUploadFile = false;
      },
      toUpload() {
        if(!this.userInfo.file) {
          let url = '/pages/record/main?root=discover';
          this.isUploadFile = false;
          wx.navigateTo({url});
          return;
        }
        if(!this.userInfo.wechat_number) {
          let url = '/pages/uploadact/main?root=discover';
          this.isUploadFile = false;
          wx.navigateTo({url});
        }
      },
      closeExchangeOk() {
        this.isExchangeOk = false;
        this.setIsFirst(false);
      },
      async getFriendInfo(num) {
        let config = {
          url: 'users/find_friend/?num=' + num,
          method: 'get'
        };
        let resInfo = await wxApi.request(config);
        resInfo.results.forEach(item => {
          item.playFlag = false;
        });
        return resInfo.results;
      },
      async clickPlay(e){
        let formId = e.mp.detail.formId;
        if(this.isOne){
          this.playAudio(this.current);
          this.isOne = false;
        }else{
          if(this.friends[this.current].playFlag){
            this.innerAudioContext.stop();
          }else{
            this.innerAudioContext.play();
          }
        }
        await this.collectionFormId(formId);
      },
      playAudio(current){
        this.innerAudioContext.autoplay = true;
        this.innerAudioContext.src = this.friends[current].file;
        this.innerAudioContext.onPlay(()=>{
          this.friends[current].playFlag = true;
        });
        this.innerAudioContext.onEnded(()=>{
          this.friends[current].playFlag = false;
        });
        this.innerAudioContext.onStop(()=>{
          this.friends[current].playFlag = false;
        });
        this.innerAudioContext.onError((errCode)=>{
          console.log('error=',errCode)
        });
      },
      touchStart (e) {
        if (this.tracking) {
          return
        }
        if (e.touches.length > 1) {
          this.tracking = false
          return
        } else {
          // 记录起始位置
          this.start.t = new Date().getTime()
          this.start.x = e.touches[0].clientX
          this.start.y = e.touches[0].clientY
          this.end.x = e.touches[0].clientX
          this.end.y = e.touches[0].clientY
        }
        this.tracking = true
        this.animation = false
      },
      touchMove (e) {
        // 记录滑动位置
        if (this.tracking && !this.animation) {
          this.end.x = e.touches[0].clientX
          this.end.y = e.touches[0].clientY
          // 计算滑动值
          this.poswidth = this.end.x - this.start.x
          this.posheight = this.end.y - this.start.y
        }
      },
      async touchEnd (e) {
        this.tracking = false
        this.animation = true
        // 滑动结束，触发判断
        // 简单判断滑动宽度超出100像素时触发滑出
        if (Math.abs(this.poswidth) >= 60 || Math.abs(this.posheight) >= 60) {
          this.innerAudioContext.stop();
          this.isOne = false;
          // 最终位移简单设定为x轴200像素的偏移
          let ratio = Math.abs(this.posheight / this.poswidth)
          this.poswidth = this.poswidth >= 0 ? this.poswidth + 200 : this.poswidth - 200
          this.posheight = this.posheight >= 0 ? Math.abs(this.poswidth * ratio) : -Math.abs(this.poswidth * ratio)
          this.swipe = true
          // 记录最终滑动距离
          this.lastPosWidth = this.poswidth
          this.lastPosHeight = this.posheight
          // currentPage+1 引发排序变化
          this.current += 1
          // currentPage切换，整体dom进行变化，把第一层滑动置零
          this.poswidth = 0
          this.posheight = 0
          this.playAudio(this.current)
          if(this.friends.length - this.current < 6){
            let friends = await this.getFriendInfo(10);
            console.log(friends)
            for (let i = 0;i < friends.length;i++) {
                this.friends.push(friends[i]);
            }
          }
        }
        // 不满足条件则滑入
        else {
          this.poswidth = 0
          this.posheight = 0
          this.swipe = false
        }
        if (this.swipe) {
          this.animation = true
          this.lastPosWidth = 0
          this.lastPosHeight = 0
          this.opacity = 1
          this.swipe = false
          this.isUploadFile = false
          this.isExchangePic = false
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
      },
      async exchange(e) {
        let formId = e.mp.detail.formId;
        console.log(!this.userInfo.file)
        console.log(!this.userInfo.wechat_number)
        if(!this.userInfo.file || !this.userInfo.wechat_number) {
          this.isUploadFile = true;
          return;
        }
        this.isExchangePic = true;
        await this.collectionFormId(formId);
        let config = {
          url: 'exchange/',
          method: 'post',
          data: {
            user_id: this.friends[this.current].id
          }
        }
        let resInfo = await wxApi.request(config);
        setTimeout(() => {
          if(this.isFirst) {
            this.isExchangeOk = true;
          }
        }, 800);
      },
    }
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
  .stack {
    top: 54px;
    width: 240px;
    height: 277px;
    position: relative;
    perspective: 1000px; //子元素视距
    perspective-origin: 50% 150%; //子元素透视位置
    -webkit-perspective: 1000px;
    -webkit-perspective-origin: 50% 150%;
    margin: 0 auto;
    padding: 0;
    .stack-item{
      height: 100%;
      width: 100%;
      top:0;
      opacity: 0;
      position: absolute;
      background-color: #fff;
      border: 1px solid #F4CF24;
      border-radius: 5px;
      box-shadow: 0 0 6px #EBE3D4;
      text-align: center;
      overflow: hidden;
      .top-border {
        height: 7px;
        background-color: #F4CF24;
      }
      .card-content {
        position: absolute;
        top: 39px;
        width: 100%;
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
  }
  .exchange-pic {
    position: absolute;
    top: 421px;
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
