<template>
<div class="index-page">
    <img class="home-main-bg" src="../../assets/images/home-main-bg.png" alt="">
    <div class="operator-area">
        <div v-if="userInfoAuth" class=""></div>
        <div style="display: none;" @click="startPlay" v-if="userInfoAuth" class="btn-startuse">
            <span>开始使用</span>
        </div>
        <button class="btn-login"  open-type="getUserInfo" @getuserinfo="getUserInfo">
            登  录
        </button>
        <div  class="tip-text">为了完整的体验小程序，需要您进行微信授权</div>
    </div>
    <i-toast id="toast" />
    
</div>
</template>

<script>
import {mapMutations} from 'vuex';
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi()
const { $Toast } = require('../../../static/iview/base/index');
export default {
    data() {
        return {
            userInfoAuth: false,  
            clientHeight: '', 
        }
    },
    async onShow() {
        this.clientHeight = wx.getSystemInfoSync().windowHeight;
        let authSetting = await wxApi.getSetting();
        if(authSetting.authSetting['scope.userInfo']) {
            let token = wx.getStorageSync('token');
            if(token) {
                this.userInfoAuth = true;
                let userInfo = await this.ajaxGetUserInfo();
                this.setUserInfo(userInfo.user);
                wx.switchTab({url: '/pages/discover/main'});
            }
            else {
                await this.getUserInfo();
                
            }
        }
        else {
            this.userInfoAuth = false;
        }
    },
    methods: {
        ...mapMutations(['setUserInfoAuth', 'setUserInfo']),
        async getUserInfo(e) {
            console.log('getUserInfo', e);
            this.userInfoAuth = true;
            let codeInfo = await wxApi.login();
            let userInfo = await wxApi.getUserInfo();
            let loginConfig = (typeof e) == 'undefined' ? Object.assign(codeInfo, userInfo) : Object.assign(e.mp.detail, codeInfo);
            let loginRes = await this.doLogin(loginConfig)
            if(loginRes.errno == 0) {
                this.userInfoAuth = true;
                this.setUserInfo(loginRes.results.user);
                wx.setStorageSync('token', loginRes.results.token);
                wx.switchTab({url: '/pages/discover/main'});
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
                    content: '错误的提示',
                    type: 'error'
                })
                return;
            }
        },
        startPlay() {
            wx.switchTab({url: '/pages/discover/main'});
        }
    }
}
</script>

<style lang="less">
@import "../../assets/style/base.less"; 
.index-page {
    position: relative;
    height: 100vh;
    .home-main-bg {
        width: 100%;
        height: 100%;
    }
    .operator-area {
        position: absolute;
        bottom: 56px;
        // bottom: 100px;
        left: 50%;
        transform: translate(-50%, 0);
        width: 257px;
        height: 66px;
        display: flex;
        flex-direction: column;
        align-items: center;
        .btn-login {
            position: absolute;
            top: 0;
            width: 200px;
            height: 44px;
            font-size: 20px;
            font-family: "PingFangSC-Semibold", "Microsoft YaHei";
            color: #FB9F00;
            line-height: 44px;
            text-align: center;
            background-color: #fff;
            border: none;
        }
        .btn-startuse {
            position: absolute;
            top: 0;
            width: 200px;
            height: 44px;
            background-color: #fff;
            border-radius: 2px;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1;
            span {
                font-size: 18px;
                font-family: "PingFangSC-Semibold", "Microsoft YaHei";
                color: #FB9F00;
            }
        }
        .animation-bg {
            position: absolute;
            top: 0;
            width: 140px;
            height: 0;
            background-color: #00CEDA;
            border-radius: 2px;
            animation: loader 1s linear;
            animation-fill-mode:forwards;
        }
        .tip-text {
            position: absolute;
            bottom: 0;
            line-height: 14px;
            text-align: center;
            color: #967D54;
            font-size: 10px;
            font-family: "PingFangSC-Medium", "Microsoft YaHei";
        }
    }
    
}
@keyframes loader {
    0% {
        height: 0;
        top: 44px;
    }
    
    100% {
        height: 44px;
        top: 0;
    }
}

</style>
