<template>
<div class="discover-page">
  <div class="app-toast" v-if="showToast">
    <img src="../../assets/images/app-toast.png" class="back-img"/>
    <div class="toast-text">添加到我的小程序，更方便访问</div>
    <img src="../../assets/images/toast-logo.png" class="toast-logo"/>
    <img src="../../assets/images/toast-close.png" class="toast-close" @click="closeToast"/>
  </div>
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
      <button class="card-share" open-type="share" :id="item.id">
        <img src="../../assets/images/share.png">
      </button>
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
  <div v-if="userInfo">
    <div v-if="!isExchangePic">
      <form report-submit @submit="exchange" class="exchange-pic">
        <button class="btn-exchange" form-type="submit">加Ta微信</button>
      </form>
    </div>
    <div v-if="isExchangePic" :class="{'exchange-pic': true, 'showAnimation': isExchangePic}" style="color: #F4CF24; font-size: 16px;">已通知对方</div>
  </div>
  <div v-else>
    <div class="exchange-pic">
      <div class="btn-exchange" @click="login">加Ta微信</div>
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
        <div class="dialog-text">
          <div>完善声音和微信号后</div>
          <div>即可与对方申请互加微信</div>
        </div>
        <div class="dialog-upload">
          <form report-submit @submit="toUpload">
            <button class="upload-btn" form-type="submit">立即完善</button>
          </form>
        </div>
        <div class="close-btn">
          <img @click="closeDialog"  src="../../assets/images/icon-close.png" alt="" class="close">
        </div>
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
          <form report-submit @submit="closeExchangeOk">
            <button class="upload-btn" form-type="submit">不再提示</button>
          </form>
        </div>
        <!--<img style="display: none;" @click="closeDialog" src="../../assets/images/icon-close.png" alt="" class="close">-->
      </div>
    </div>
  </van-dialog>
  <van-dialog
    use-slot
    :show="showMsg"
    :showConfirmButton="false"
    :showCancelButton="false"
  >
  <div class="dialog-container">
    <div class="top-border"></div>
    <div class="dialog-content">
      <div class="dialog-text">
        <div>{{message1}}</div>
        <div>{{message2}}</div>
      </div>
      <div class="dialog-upload">
        <form report-submit @submit="closeMsg">
          <button class="upload-btn" form-type="submit">我知道了</button>
        </form>
      </div>
      <!--<img @click="closeMsg" src="../../assets/images/icon-close.png" alt="" class="close">-->
    </div>
  </div>
  </van-dialog>
  <van-dialog
    use-slot
    :show="showLogin"
    :showConfirmButton="false"
    :showCancelButton="false"
  >
    <div class="dialog-container">
      <div class="top-border"></div>
      <div class="dialog-content" style="padding-right: 0;padding-left: 0;">
        <div class="dialog-text">
          <div>登录后即可与对方申请互加微信</div>
        </div>
        <div class="dialog-login">
          <button class="unlogin-btn" @click="closeLogin">暂不登录</button>
          <button class="login-btn"  open-type="getUserInfo" @getuserinfo="getUserInfo">立即登录</button>
        </div>
        <!--<img @click="closeMsg" src="../../assets/images/icon-close.png" alt="" class="close">-->
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
          showMsg:false,
          message1:'',
          message2:'',
          showToast:false,
          appToastCount:0,
          showLogin:false,
          firstId:null
        }
    },
    computed: {
        ...mapGetters(['userInfo', 'isFirst']),
    },
    async onShow() {
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
      console.log('userInfo:',this.userInfo)
      if(this.userInfo){
        if(this.userInfo.file && this.userInfo.wechat_number) {
          this.isUploadFile = false;
        }
        if(!this.userInfo.file || !this.userInfo.wechat_number) {
          this.setIsFirst(true);
        }
      }else{
        let authSetting = await wxApi.getSetting();
        if(authSetting.authSetting['scope.userInfo']) {
          let config = {
            url: 'users/me/',
            method: 'get'
          }
          let userInfo = await this.ajaxGetUserInfo();
          if(userInfo){
            this.setUserInfo(userInfo.user);
          }
        }
      }
    },
    async onLoad(options) {
      this.firstId = this.$root.$mp.query.firstId;
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
      let count = wx.getStorageSync('appToastCount');
      this.appToastCount = parseInt(count?count:0);
      if(this.appToastCount < 2){
        setTimeout(()=>{
          this.showToast = true;
          setTimeout(()=>{
            this.showToast = false;
          },3000)
        },10000)
      }
      if(this.appToastCount < 2){
        wx.setStorageSync('appToastCount',this.appToastCount+1);
      }
    },
    onHide() {
      this.innerAudioContext.destroy()
    },
    onShareAppMessage: function(res) {
      if(res.from === 'button') {
        return {
          title: '发现一枚好听的声音 推荐你听听',
          path: '/pages/discover/main?firstId='+res.target.id,
          //imageUrl: '/assets/images/share.jpg',
          success: function(res) {}
        }
      }else{
        return {
          title: '互相喜欢 互加微信',
          path: '/pages/discover/main',
          imageUrl: '/assets/images/share.jpg',
          success: function(res) {}
        }
      }
    },
    methods: {
      ...mapMutations(['setUserInfoAuth', 'setUserInfo', 'setInnerAudioContext', 'setIsFirst']),
      login(){
        this.showLogin = true;
      },
      closeLogin(){
        this.showLogin = false;
      },
      async getUserInfo(e) {
        this.showLogin = false;
        console.log('getUserInfo', e);
        wx.showLoading({
          title: '正在登录',
          mask:true
        })
        let authSetting = await wxApi.getSetting();
        if(!authSetting.authSetting['scope.userInfo']) {
          wx.hideLoading()
          return;
        }
        let codeInfo = await wxApi.login();
        let userInfo = await wxApi.getUserInfo();
        let loginConfig = (typeof e) == 'undefined' ? Object.assign(codeInfo, userInfo) : Object.assign(e.mp.detail, codeInfo);
        let loginRes = await this.doLogin(loginConfig)
        if(loginRes.errno == 0) {
          this.setUserInfo(loginRes.results.user);
          wx.setStorageSync('token', loginRes.results.token);
          wx.hideLoading()
          this.onLoad();
        }
        else {
          wx.hideLoading()
          $Toast({
            content: loginRes.message,
            type: 'error'
          })
        }
      },
      async doLogin(params) {
        let config = {
          url: 'users/wapp_login/',
          method: 'post',
          data: {
            code: params.code,
            encrypted_data: params.encryptedData,
            iv: params.iv
          }
        }
        let res = await wxApi.request(config);
        return res;
      },
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
//          $Toast({
//            content: '错误码:10001',
//            type: 'error'
//          })
          return null;
        }
      },
      closeToast(){
        this.showToast  = false;
      },
      closeMsg(e){
        let formId = e.mp.detail.formId;
        this.collectionFormId(formId);
        this.showMsg = false;
      },
      closeDialog() {
        this.isUploadFile = false;
      },
      toUpload(e) {
        let formId = e.mp.detail.formId;
        this.collectionFormId(formId);
        console.log('file is ',!this.userInfo.file)
        console.log('wechat_number is ',!this.userInfo.wechat_number)
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
      closeExchangeOk(e) {
        let formId = e.mp.detail.formId;
        this.collectionFormId(formId);
        this.isExchangeOk = false;
        this.setIsFirst(false);
      },
      async getFriendInfo(num) {
        let list = [];
        if(this.firstId){
          let config = {
            url: 'users/find_friend/?first_id='+ this.firstId,
            method: 'get'
          };
          let resInfo = await wxApi.request(config);
          resInfo.results.forEach(item => {
            item.playFlag = false;
            list.push(item)
          });
          this.firstId = null;
        }
        let config = {
          url: 'users/find_friend/?num=' + num,
          method: 'get'
        };
        let resInfo = await wxApi.request(config);
        resInfo.results.forEach(item => {
          item.playFlag = false;
          list.push(item)
        });
        return list;
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
        if(!this.userInfo.file || !this.userInfo.wechat_number) {
          this.isUploadFile = true;
          return;
        }
        await this.collectionFormId(formId);
        let config = {
          url: 'exchange/',
          method: 'post',
          data: {
            user_id: this.friends[this.current].id
          }
        }
        let resInfo = await wxApi.request(config);
        if(resInfo.errno === 0){
          this.isExchangePic = true;
          setTimeout(() => {
            if(this.isFirst) {
              this.isExchangeOk = true;
            }
          }, 800);
        }
        if(resInfo.errno === 407){
          this.isExchangePic = true;
          setTimeout(() => {
            if(this.isFirst) {
              this.isExchangeOk = true;
            }
          }, 800);
          this.message1 = '一天只能与15人申请互加微信';
          this.message2 = '今日剩余5个申请机会';
          this.showMsg = true;
        }
        if(resInfo.errno === 408){
          this.message1 = '申请机会已用完';
          this.message2 = '明日0点更新';
          this.showMsg = true;
        }
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
  .app-toast{
    width: 255px;
    height: 36px;
    z-index: 10;
    position: fixed;
    top: 0;
    left: 60px;
    .back-img{
      width: 255px;
      height: 36px;
      z-index: 11;
    }
    .toast-text{
      width: 255px;
      height: 36px;
      line-height: 36px;
      text-align: center;
      font-size:12px;
      font-family:Source Han Sans CN;
      font-weight:400;
      color:#FFFFFF;
      z-index: 12;
      position: absolute;
      top: 0;
      left: 0;
    }
    .toast-logo{
      width: 20px;
      height: 20px;
      z-index: 13;
      position: absolute;
      top: 10px;
      left: 10px;
    }
    .toast-close{
      width: 12px;
      height: 12px;
      z-index: 13;
      position: absolute;
      top: 14px;
      right: 10px;
    }
  }
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
      .card-share{
        display: block;
        width: 30px;
        height: 30px;
        position: absolute;
        top: 6px;
        right: 2px;
        padding: 0;
        border-radius: 0;
        image{
          display: block;
          width: 20px;
          height: 20px;
          margin: 5px auto;
        }
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
        font-weight: 500;
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
        .upload-btn::after{
          border: none;
        }
      }
      .dialog-login{
        width: 100%;
        height: 40px;
        overflow: hidden;
        .unlogin-btn{
          width: 120px;
          height: 40px;
          font-size:16px;
          font-family:PingFang SC;
          font-weight:600;
          color:#AAAAAA;
          text-align: center;
          line-height: 40px;
          float: left;
          margin-left: 30px;
          background: #DADADA;
          box-shadow:0px 0px 3px 0px #DADADA;
          border-radius:2px;;
        }
        .unlogin-btn::after{
          border: none;
        }
        .login-btn {
          width: 120px;
          height: 40px;
          font-size:16px;
          font-family:PingFang SC;
          font-weight:600;
          color: #ffffff;
          text-align: center;
          line-height: 40px;
          float: right;
          margin-right: 30px;
          background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
          box-shadow:0px 0px 3px 0px #D8CCBD;
          border-radius:2px;
        }
        .login-btn::after{
          border: none;
        }
      }
      .close-btn{
        background: none;
        position: static;
        .close {
          position: absolute;
          width: 19px;
          height: 19px;
          top: 14px;
          right: 36rpx;
        }
      }
      .close-btn::after{
        border: none;
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
