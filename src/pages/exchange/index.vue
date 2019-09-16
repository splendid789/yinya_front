<template>
<div class="exchange-page">
    <div class="user-info" v-if="isShow">
        <div class="user-info-left">
            <img class="avatar" :src="respondent.head_img" alt="">
            <div class="base-info">
                <div class="user-nickname">{{respondent.nickname}}</div>
                <div @click="copyWechatNum(respondent.wechat_number)" class="user-wechat-account">微信号: {{respondent.wechat_number}}</div>
            </div>
            <div class="audio-container" >
              <form report-submit @submit="audioRespondent">
                <button form-type="submit" class="audio-widget">
                  <img :src="'../../assets/images/' + (!respondentFlag ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                  <span >{{respondent.duration}}s</span>
                </button>
              </form>
            </div>
        </div>
        <div class="user-info-right">
            <img class="avatar" :src="applicant.head_img" alt="">
            <div class="base-info">
                <div class="user-nickname">{{applicant.nickname}}</div>
                <div @click="copyWechatNum(applicant.wechat_number)" class="user-wechat-account">微信号: {{applicant.wechat_number}}</div>
            </div>
            <div class="audio-container" >
                <form report-submit @submit="audioApplicant">
                  <button form-type="submit" class="audio-widget">
                    <img :src="'../../assets/images/' + (!applicantFlag ? 'exchange-play.png': 'exchange-pause.png') " alt="" class="icon-audio">
                    <span >{{applicant.duration}}s</span>
                  </button>
                </form>
            </div>
        </div>
    </div>
    <div class="center-line"></div>
    <div class="tip-text" style="margin-bottom: 5px;">请复制对方微信号，到微信里添加对方好友</div>
    <div class="tip-text">（添加时备注音吖）</div>
    <div v-if="rootPage != 'message'" class="exchange-ok" @click="exchangeOk">{{btnText}}</div>
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
        isShow:false,
        goHome:false,
        btnText:'完成',
        messageArr: [],
        exChangeConfig: {},
        respondent:{},
        respondentFlag:false,
        applicant:{},
        applicantFlag:false,
        innerAudioContext: null, // 播放音频实例,
        rootPage: '',
        applyID: '',
      }
    },
    async onShow() {
      this.goHome = false;
      this.btnText = '完成';
      this.respondentFlag = false;
      this.applicantFlag = false;
      this.rootPage = this.$root.$mp.query.root;
      this.applyID = this.$root.$mp.query.applyID;
      console.log("from page:"+this.rootPage)
      console.log("from applyID:"+this.applyID)
      if(this.rootPage === 'message'|| this.rootPage === 'mrequest') {
        this.goHome = false;
      }
      else {
        this.goHome = true;
        if(this.rootPage === 'request'){
          this.btnText = '完成';
        }else{
          this.btnText = '回到首页';
        }
      }
      console.log('goHome:',this.goHome)
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
        this.respondent = this.exChangeConfig.respondent;
        this.applicant = this.exChangeConfig.applicant;
        console.log('from request:',JSON.stringify(this.exChangeConfig))
      }
      else {
        this.exChangeConfig = JSON.parse(mpvue.getStorageSync('exChangeConfig'));
        this.respondent = this.exChangeConfig.respondent;
        this.applicant = this.exChangeConfig.applicant;
        console.log('from storage:',JSON.stringify(this.exChangeConfig))
      }
      this.isShow = true;
      this.innerAudioContext = wx.createInnerAudioContext();
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
      async copyWechatNum(chatNum) {
          let info = await wxApi.setClipboardData(chatNum);
      },
      // 监听音频事件-回调处理函数
      listenAudioRespondentEvent() {
        this.innerAudioContext.onPlay((res) => {
          console.log('开始播放', res)
          this.respondentFlag = true;
          this.applicantFlag = false;
        })
        this.innerAudioContext.onError((res) => {
          console.log(res.errMsg)
          console.log(res.errCode)
        })
        this.innerAudioContext.onStop((res) => {
          console.log('停止播放', res);
          this.respondentFlag = false;
        })
        this.innerAudioContext.onEnded((res) => {
          console.log('播放结束', res);
          this.respondentFlag = false;
        });
      },
      listenAudioApplicantEvent() {
        this.innerAudioContext.onPlay((res) => {
          console.log('开始播放', res)
          this.applicantFlag = true;
          this.respondentFlag = false;
        })
        this.innerAudioContext.onError((res) => {
          console.log(res.errMsg)
          console.log(res.errCode)
        })
        this.innerAudioContext.onStop((res) => {
          console.log('停止播放', res);
          this.applicantFlag = false;
        })
        this.innerAudioContext.onEnded((res) => {
          console.log('播放结束', res);
          this.applicantFlag = false;
        });
      },
      async audioRespondent(e){
        let formId = e.mp.detail.formId;
        await this.collectionFormId(formId);
        this.innerAudioContext.stop();
        this.applicantFlag = false;
        this.innerAudioContext.src = this.respondent.file;
        !this.respondentFlag ? this.innerAudioContext.play() : this.innerAudioContext.stop();
        this.listenAudioRespondentEvent();
      },
      async audioApplicant(e){
        let formId = e.mp.detail.formId;
        await this.collectionFormId(formId);
        this.innerAudioContext.stop();
        this.respondentFlag = false;
        this.innerAudioContext.src = this.applicant.file;
        !this.applicantFlag ? this.innerAudioContext.play() : this.innerAudioContext.stop();
        this.listenAudioApplicantEvent();
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
    console.log('exchange 页面卸载');
    this.innerAudioContext.stop();
    this.innerAudioContext.destroy();
    this.innerAudioContext = null;
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
            width: 107px;
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
