<template>
<div class="mine-page">
    <!-- 未上传语音状态 -->
    <div class="upload-tip-wrap" v-if="!userInfo.file">
        <img :src="userInfo.head_img" alt="" class="avatar"/>
        <div class="user-name">{{userInfo.nickname}}</div>
        <div class="split"></div>
        <div class="tip-title">尚未完善个人信息</div>
        <div class="tip-desc">完善后即可与对方申请互加微信</div>
        <div class="upload-btn" @click="goRecord">立即完善</div>
    </div>

    <!-- 已上传语音状态 -->
    <div class="user-info" v-if="userInfo.file">
        <img :src="userInfo.head_img" alt="" class="avatar">
        <span class="user-name">{{userInfo.nickname}}</span>
    </div>
    <div class="item-container" v-if="userInfo.file">
        <div class="mine-account item" @click="openMyVoice">
            <div class="left">
                <img style="width: 22px; height: 28px; margin-right: 20px;" src="../../assets/images/icon-voice.png" alt="">
                <span class="text">我的声音</span>
            </div>
            <img style="width: 9px; height: 15px;" src="../../assets/images/icon-nextpage.png" alt="">
        </div>
        <div class="mine-voice item" @click="openWeChat">
            <div class="left">
                <img style="width: 28px; height: 28px; margin-right: 14px;" src="../../assets/images/icon-wechat.png" alt="">
                <span class="text">我的微信</span>
            </div>
            <img style="width: 9px; height: 15px;" src="../../assets/images/icon-nextpage.png" alt="">
        </div>
    </div>
    <i-toast id="toast" />
</div>
</template>

<script>
import {mapGetters, mapMutations} from 'vuex';
export default {
    data() {
        return {

        }
    },
    computed: {
        ...mapGetters(['userInfo', 'innerAudioContext']),
    },
    onShow() {
        if(this.innerAudioContext) {
            this.innerAudioContext.stop();
            this.innerAudioContext.destroy();
            this.setInnerAudioContext(null);
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
        ...mapMutations(['setInnerAudioContext']),
        goRecord() {
            wx.navigateTo({url: '/pages/record/main'})
        },
        openMyVoice() {
            wx.navigateTo({url: '/pages/record/main?root=mine'})
        },
        openWeChat() {
            wx.navigateTo({url: '/pages/uploadact/main?root=mine'})
        }
    },
    onTabItemTap() {
    },
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.mine-page {
    padding: 23px 12px;
    height: 100vh;
    box-sizing: border-box;
    font-family: "PingFangSC-Semibold";
    color: #999;
    font-size: 15px;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    /* 未上传提示 */
    .upload-tip-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 7px;
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
        .split {
            width: 343px;
            height: 1px;
            background: #ea6f39;
            margin-top: 22px;
        }
        .tip-title {
            font-size: 14px;
            font-weight: bold;
            color: #333333;
            margin-top: 22px;
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
            margin-top: 24px;
            background: linear-gradient(90deg,rgba(251,207,0,1),rgba(251,159,0,1));
            box-shadow: 0px 0px 3px 0px rgba(216,204,189,1);
            border-radius: 2px;
            color: #ffffff;
            font-size: 16px;
            line-height: 40px;
            width: 140px;
            text-align: center;
        }
    }
    .user-info {
        padding-left: 8px;
        width: 100%;
        height: 84px;
        display: flex;
        align-items: center;
        margin-bottom: 44px;
        .avatar {
            width: 82px;
            height: 82px;
            margin-right: 37px;
            border-radius: 50%;
        }
        .user-name {
            color: #333333;
            font-size: 18px;
        }
    }
    .item-container {
        // width: 100%;
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
</style>
