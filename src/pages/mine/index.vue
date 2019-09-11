<template>
<div>
    <div v-if="userInfo" class="mine-page">
      <img :src="userInfo.head_img" alt="" class="avatar">
      <span class="user-name">{{userInfo.nickname}}</span>

      <!-- 未上传语音状态 -->
      <div class="upload-tip-wrap" v-if="!userInfo.file">
        <div class="split"></div>
        <div class="tip-title">尚未完善个人信息</div>
        <div class="tip-desc">完善后即可与对方申请互加微信</div>
        <div class="upload-btn" @click="goRecord">立即完善</div>
      </div>

      <!-- 已上传语音状态 -->
      <div class="item-container" v-if="userInfo.file">
        <form report-submit @submit="openMyVoice">
          <button form-type="submit" class="mine-account item">
            <div class="left">
              <img style="width: 22px; height: 28px; margin-right: 20px;" src="../../assets/images/icon-voice.png" alt="">
              <span class="text">我的声音</span>
            </div>
            <img style="width: 9px; height: 15px;" src="../../assets/images/icon-nextpage.png" alt="">
          </button>
        </form>
        <form report-submit @submit="openWeChat">
          <button form-type="submit" class="mine-voice item">
            <div class="left">
              <img style="width: 28px; height: 28px; margin-right: 14px;" src="../../assets/images/icon-wechat.png" alt="">
              <span class="text">我的微信</span>
            </div>
            <img style="width: 9px; height: 15px;" src="../../assets/images/icon-nextpage.png" alt="">
          </button>
        </form>
      </div>
    </div>
    <div v-else class="nouser-container">
      <div class="line-1">尚未登录</div>
      <div class="line-2">登录后即可使用完整功能</div>
      <button class="login-btn"  open-type="getUserInfo" @getuserinfo="getUserInfo">立即登录</button>
    </div>
    <i-toast id="toast" />
</div>
</template>

<script>
import {mapGetters, mapMutations} from 'vuex';
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
const { $Toast } = require('../../../static/iview/base/index');
export default {
    data() {
        return {

        }
    },
    computed: {
        ...mapGetters(['userInfo', 'innerAudioContext']),
    },
    async onShow() {
      console.log('userInfo:',this.userInfo)
      if(this.userInfo){
        this.init()
      }else{
        let authSetting = await wxApi.getSetting();
        if(authSetting.authSetting['scope.userInfo']) {
          let config = {
            url: 'users/me/',
            method: 'get'
          }
          let userInfo = await this.ajaxGetUserInfo();
          this.setUserInfo(userInfo.user);
        }
      }
    },
    onShareAppMessage: function(res) {
      if(res.form === 'button') return {};
      return {
        title: '互相喜欢对方声音\r\n互加微信成为好友',
        path: '/pages/index/main',
        imageUrl: '/assets/images/share.jpg',
        success: function(res) {}
      }
    },
    methods: {
      ...mapMutations(['setUserInfo', 'setInnerAudioContext']),
      init(){
        if(this.innerAudioContext) {
          this.innerAudioContext.stop();
          this.innerAudioContext.destroy();
          this.setInnerAudioContext(null);
        }
      },
      async getUserInfo(e) {
        this.showLogin = false;
        console.log('getUserInfo', e);
        let codeInfo = await wxApi.login();
        let userInfo = await wxApi.getUserInfo();
        let loginConfig = (typeof e) == 'undefined' ? Object.assign(codeInfo, userInfo) : Object.assign(e.mp.detail, codeInfo);
        let loginRes = await this.doLogin(loginConfig)
        if(loginRes.errno == 0) {
          this.setUserInfo(loginRes.results.user);
          wx.setStorageSync('token', loginRes.results.token);
          this.init();
        }
        else {
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
          $Toast({
            content: '错误码:10001',
            type: 'error'
          })
          return;
        }
      },
      goRecord() {
          wx.navigateTo({url: '/pages/record/main'})
      },
      async openMyVoice(e) {
        let formId = e.mp.detail.formId;
        await this.collectionFormId(formId);
        wx.navigateTo({url: '/pages/record/main?root=mine'})
      },
      async openWeChat(e) {
        let formId = e.mp.detail.formId;
        await this.collectionFormId(formId);
        wx.navigateTo({url: '/pages/uploadact/main?root=mine'})
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
    onTabItemTap() {
    },
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.mine-page {
    width: 375px;
    padding: 30px 12px;
    height: 100vh;
    box-sizing: border-box;
    font-family: "PingFangSC-Semibold";
    color: #999;
    font-size: 15px;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    display: flex;
    flex-direction: column;
    align-items: center;
    .avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
    }
    .user-name {
        font-size: 18px;
        font-weight: bold;
        color: #333333;
        margin-top: 12px;
        line-height: 18px;
    }
    /* 未上传提示 */
    .upload-tip-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        .split {
            width: 343px;
            height: 1px;
            background: #ea6f39;
            margin-top: 22px;
            opacity: 0.3;
        }
        .tip-title {
            font-size: 14px;
            font-weight: bold;
            color: #333333;
            margin-top: 33px;
            line-height: 14px;
        }
        .tip-desc {
            font-size: 12px;
            font-weight: bold;
            color: #999999;
            margin-top: 14px;
            line-height: 12px;
        }
        .upload-btn {
            margin-top: 33px;
            background: linear-gradient(90deg,rgba(251,207,0,1),rgba(251,159,0,1));
            box-shadow: 0px 0px 3px 0px rgba(216,204,189,1);
            border-radius: 2px;
            color: #ffffff;
            font-size: 18px;
            line-height: 40px;
            width: 140px;
            text-align: center;
        }
    }
    /* 已上传展示内容 */
    .item-container {
        width: 100%;
        margin-top: 35px;
        // padding: 0 16px;
        .item {
            background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
            display: flex;
            padding: 0 24px;
            height: 44px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 2px;
            margin-bottom: 12px;
            .left {
                width: 100px;
                height: 44px;
                display: flex;
                align-items: center;
                .text {
                    color: #FFFFFF;
                    font-size: 12px;
                    font-size: "PingFangSC-Medium";
                }
            }
        }
    }

}
.nouser-container{
  width: 375px;
  height: 555px;
  box-sizing: border-box;
  background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
  .line-1{
    width: 375px;
    height:24px;
    font-size:15px;
    font-family:Source Han Sans CN;
    font-weight:400;
    color:#444444;
    line-height:24px;
    text-align: center;
    padding-top: 189px;
  }
  .line-2{
    width: 375px;
    height:24px;
    font-size:15px;
    font-family:Source Han Sans CN;
    font-weight:400;
    color:#444444;
    line-height:24px;
    text-align: center;
  }
  .login-btn{
    width:140px;
    height:40px;
    line-height: 40px;
    background:linear-gradient(90deg,#FBCF00,#FB9F00);
    box-shadow:0px 0px 3px 0px #D8CCBD;
    border-radius:2px;
    margin: 24px auto 0;
    font-size:16px;
    font-family:PingFang SC;
    font-weight:600;
    color:#FFFFFF;
    text-align: center;
  }
}
</style>
