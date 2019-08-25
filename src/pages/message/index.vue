<template>
<div class="message-page" :style="'height: ' + clientHeight + 'px;'">
    <van-tabs type="card" @change="selectTab" nav-class="nav-class" tab-active-class="tabs-active"  tab-class="tabs-class">
        <van-tab class="top-tab" custom-class="tab-class" title="收到请求">
          <div v-if="messageArr1.length > 0">
            <div @click="findExchange(item)" v-for="(item, index) in messageArr1" :key="index" class="message-item">
                <div class="top-border"></div>
                <div class="item-content">
                  <div class="user-info">
                    <img class="avatar"  :src="item.applicant.head_img" alt="">
                    <span class="user-name">{{item.applicant.nickname}}</span>
                  </div>
                  <span v-if="!item.is_see" style="color: #EE8B21;" class="exchange-text">请求互加</span>
                  <span v-else  class="exchange-text">已读</span>
                </div>
            </div>
          </div>
          <div v-else>
            <div class="nomssage-text">申请加你微信的人会在这里出现</div>
            <img class="nomessage-img" src="../../assets/images/receive-no-msg.png" style="width: 208px;"/>
            <div class="nomessage-msg">暂无新消息</div>
          </div>
        </van-tab>
        <van-tab class="top-tab" custom-class="tab-class" title="互加成功">
          <div v-if="messageArr2.length > 0">
            <div @click="findExchange(item)" v-for="(item, index) in messageArr2" :key="index" class="message-item">
              <div class="top-border"></div>
              <div class="item-content">
                <div class="user-info">
                  <img class="avatar" :src="item.friend_info.head_img" alt="">
                  <span class="user-name">{{item.friend_info.nickname}}</span>
                </div>
                <span v-if="!item.is_see" style="color: #EE8B21;" class="exchange-text">未读</span>
                <span v-else  class="exchange-text">已读</span>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="nomssage-text">同意互加微信的人会在这里出现</div>
            <img class="nomessage-img" src="../../assets/images/success-no-msg.png"/>
            <div class="nomessage-msg">暂无新消息</div>
          </div>
        </van-tab>
    </van-tabs>

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
            messageArr1: [],
            messageArr2: [],
            clientHeight: '',
            flag: 0,
            timer: null
        }
    },
    computed: {
        ...mapGetters(['innerAudioContext'])
    },
    async onShow() {
        if(this.innerAudioContext) {
            this.innerAudioContext.stop();
            this.innerAudioContext.destroy();
            this.setInnerAudioContext(null);
        }
        this.clientHeight = wx.getSystemInfoSync().windowHeight;
        wx.createSelectorQuery().selectAll('.top-tab').boundingClientRect( (rect) => {
            if(this.flag) {
                if(this.clientHeight <= rect[1].height) {
                    this.clientHeight = Number(rect[1].height) + 50;
                }
            }
            else {
                if(this.clientHeight <= rect[0].height) {
                    this.clientHeight = Number(rect[0].height) + 50;
                }
            }
        }).exec();
        this.messageArr1 = [];
        this.messageArr2 = [];
        await this.getMessage(0);
        await this.getMessage(1);
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
        ...mapMutations(['setUserInfoAuth', 'setUserInfo', 'setInnerAudioContext']),
        async selectTab(e) {
            this.flag = e.mp.detail.index;
            setTimeout(() => {
                wx.createSelectorQuery().selectAll('.top-tab').boundingClientRect( (rect) => {
                    if(this.flag) {
                        if(this.clientHeight <= rect[1].height) {
                            this.clientHeight = Number(rect[1].height) + 50;
                        }
                    }
                    else {
                        if(this.clientHeight <= rect[0].height) {
                            this.clientHeight = Number(rect[0].height) + 50;
                        }
                    }
                }).exec();
            }, 1000);
            await this.getMessage(e.mp.detail.index);
        },
        async getMessage(value) {
            let systemInfo = await wxApi.getSystemInfo();
            let config;
            if((/ios/.test(systemInfo.platform))) {
                let token = wx.getStorageSync('token');
                let url;
                if(value) {
                    url = 'exchange?status=1&token=' + token
                }
                else {
                    url = 'exchange?status=0&token=' + token
                }
                config = {
                    url: url,
                    method: 'get'
                }
            }
            else {
                let url;
                if(value) {
                    url = 'exchange?status=1'
                }
                else {
                    url = 'exchange?status=0'
                }
                config = {
                    url: url,
                    method: 'get'
                }
            }
            let resInfo = await wxApi.request(config);
            if(value) {
                this.messageArr2 = resInfo.results.results;
            }
            else {
                this.messageArr1 = resInfo.results.results;
            }
        },
        async findExchange(item) {
            let config = {
                url: 'exchange/see_exchange/',
                method: 'get',
                data: {exchange_id: item.id}
            }
            await wxApi.request(config)
            if(item.status === 1) {
              mpvue.setStorageSync('exChangeConfig', JSON.stringify(item));
              wx.navigateTo({url: '/pages/exchange/main?root=message'});
            }
            else {
              mpvue.setStorageSync('exChangeConfig', JSON.stringify(item));
              wx.navigateTo({url: '/pages/mrequest/main'});
            }

        }
    },
    onTabItemTap() {
    },
    async onPullDownRefresh() {
        wx.showNavigationBarLoading();
        this.messageArr1 = [];
        this.messageArr2 = [];
        await this.getMessage(0);
        await this.getMessage(1);
        $Toast({
            content: '已刷新',
            type: 'success'
        })
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
    }
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.message-page {
    box-sizing: border-box;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    .nav-class {
        border-color: #EE8B21 !important;
    }
    .tabs-class {
        background-color: #fff !important;
        color: #999999 !important;
    }
    .tabs-active {
        background-color: #EE8B21 !important;
        color: #fff !important;
    }
    .tab-class {
        padding-top: 24px;
    }
    .nomssage-text{
      font-size:14px;
      font-family:PingFang SC;
      font-weight:500;
      color: #EE8B21;
      text-align: center;
      margin-top: 85px;
    }
    .nomessage-img{
      display: block;
      width: 176px;
      height: 83px;
      margin: 64px auto 0;
    }
    .nomessage-msg{
      font-size:12px;
      font-family:PingFang SC;
      font-weight:400;
      color: #666666;
      text-align: center;
      margin-top: 20px;
    }
    .message-item {
        border-radius: 5px;
        margin-bottom: 12px;
        .top-border {
            height: 4px;
            background-color: #F4CF24;
            border-radius: 5px 5px 0 0;
        }
        .item-content {
            padding: 0 24px 0 20px;
            height: 64px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #F4CF24;
            box-shadow: 0 0 6px #EBE3D4;
            .user-info {
                display: flex;
                // width: 110px;
                flex: 1;
                justify-content: flex-start;
                align-items: center;
                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    margin-right: 25px;
                }
                .user-name {
                    font-size: 14px;
                    font-family: "PingFangSC-Semibold";
                    color: #333;
                }
            }
            .exchange-text {
                color: #999;
                font-size: 12px;
                font-family: "PingFangSC-Regular";
            }
        }
    }
}
</style>
