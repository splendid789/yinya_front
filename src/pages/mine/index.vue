<template>
<div class="mine-page">
    <div class="user-info">
        <img :src="userInfo.head_img" alt="" class="avatar">
        <span class="user-name">{{userInfo.nickname}}</span>
    </div>
    <div class="item-container">
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
    methods: {
        ...mapMutations(['setInnerAudioContext']),
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
