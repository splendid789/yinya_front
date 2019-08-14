<template>
    <div class="uploadact-page">
        <div class="tip-text" style="color: #333; margin-bottom: 17px;">请上传微信号</div>
        <div class="tip-text" style="fong-size: 14px; margin-bottom: 30px;">互相喜欢对方声音 才可互看微信号</div>
        <div class="input-account">
            <input :value="account" @input="inputAccount" type="text" class="input-act" placeholder="输入微信号">
        </div>
        <div @click="compleUpload" class="comple-btn">完成</div>
        <i-toast id="toast" />
    </div>
</template>
<script>
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
import {mapMutations, mapGetters} from 'vuex'
const { $Toast } = require('../../../static/iview/base/index');
export default {
    data() {
        return {
            account: '',
            rootPage: '',
        }
    },
    computed: {
        ...mapGetters(['userInfo'])
    },
    onShow() {
        this.rootPage = this.$root.$mp.query.root;
        if(this.rootPage == 'mine') {
            this.account = this.userInfo.wechat_number;
        }
    },
    methods: {
        ...mapMutations(['setUserInfo']),
        inputAccount(e) {
            this.account = e.mp.detail.value;
        },
        async compleUpload() {
            if(this.account === '') {
                $Toast({
                    content: '微信号不能为空！',
                    type: 'warning'
                })
                return;
            }
            let config = {
                url: 'users/upload_wechat_number/',
                method: 'post',
                data: {
                    wechat_number: this.account
                }
            }
            let resInfo = await wxApi.request(config);
            if(resInfo.errno == 0) {
                this.setUserInfo(resInfo.results.user);
                if(this.rootPage === 'mine') {
                    $Toast({
                        content: '保存成功',
                        type: 'success'
                    })
                    setTimeout(() => {
                        wx.switchTab({url: '/pages/mine/main'});
                    }, 1000);
                }
                else if(this.rootPage === 'record'){
                    $Toast({
                        content: '保存成功',
                        type: 'success'
                    })
                    setTimeout(() => {
                        wx.switchTab({url: '/pages/discover/main'});
                    }, 1000);
                }
                else if(this.rootPage === 'discover') {
                    $Toast({
                        content: '保存成功',
                        type: 'success'
                    })
                    setTimeout(() => {
                        wx.switchTab({url: '/pages/discover/main'});
                    }, 1000);

                }

            }
            else {
                $Toast({
                    content: resInfo.results,
                    type: 'error'
                })
            }
        }
    }
}
</script>
<style lang="less">
.uploadact-page {
    box-sizing: border-box;
    position: relative;
    font-family: "PingFangSC-Medium";
    color: #999999;
    font-size: 16px;
    padding-bottom: 71px;
    height: 100vh;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    padding-top: 105px;
    .tip-text {
        text-align: center;
    }
    .input-account {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 34px;
        .input-act {
            text-align: center;
            width: 210px;
            border: none;
            border-bottom: 1px solid #F4CF24;
        }
    }
    .comple-btn {
        position: absolute;
        left: 50%;
        bottom: 70px;
        transform: translate(-50%, 0);
        width: 140px;
        height: 40px;
        background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
        font-size: 16px;
        color: #fff;
        text-align: center;
        line-height: 40px;
        border-radius: 2px;
    }
}
</style>


