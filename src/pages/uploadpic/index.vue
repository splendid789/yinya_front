<template>
    <div class="uploadpic-page" :style="'padding-top: ' + (isChecked ? '32px' : '105px')">
        <div v-if="isChecked" style="width: 313px; height: 363px;" class="img-review">
            <img :src="tempFilePath" style="width: 100%; height: 100%;" mode="aspectFit" alt="">
        </div>
        <div v-if="!isChecked" class="tip-text">请上传一张你的真实生活照</div>
        <div v-if="!isChecked" style="color: #999;font-size: 12px; text-align: center; margin-bottom: 35px;">照片仅用于和对方交换，其他人不会看到</div>
        <div v-if="!isChecked" class="upload-container" style="over-flow: hidden;">
            <img v-if="!isChecked" @click="addPic" style="width: 60px; height: 60px;" src="../../assets/images/icon-add.png" alt="">
        </div>
        <div v-if="isChecked" @click="addPic" class="anew-upload">重新上传</div>
        <div @click="compleUpload" class="comple-btn">完成</div>
        
        <i-toast id="toast" />
    </div>
</template>
<script>
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
import {mapMutations} from 'vuex'
const { $Toast } = require('../../../static/iview/base/index');
export default {
    data() {
        return {
            isChecked: false,
            tempFilePath: '',
        }
    },
    onLoad() {

    },
    methods: {
        ...mapMutations(['setUserInfo']),
        async compleUpload() {
            let config = {
                url: 'users/upload_picture/',
                filePath: this.tempFilePath, 
                name: 'file',
            }
            let uploadInfo = await wxApi.uploadFile(config);
            if(JSON.parse(uploadInfo.data).errno == 0) {
                this.setUserInfo(JSON.parse(uploadInfo.data).results.user);
                wx.switchTab({url: '/pages/discover/main'});
            } 
            else {
                $Toast({
                    content: JSON.parse(uploadInfo.data).results,
                    type: 'error'
                })
            }
        },
        async addPic() {
            let imgInfo = await wxApi.chooseImage({count: 1});
            this.tempFilePath = imgInfo.tempFilePaths[0];
            this.isChecked ? '' : this.isChecked = true;
            
        },
    },
}
</script>

<style lang="less">
.uploadpic-page {
    font-family: "PingFangSC-Medium";
    color: #333;
    font-size: 16px;
    padding-bottom: 71px;
    height: 100vh;
    background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
    display: flex;
    flex-direction: column;
    align-items: center;
    .tip-text {
        font-size: 16px;
        margin-bottom: 17px;
        text-align: center;
    }
    .upload-container {
        width: 239px;
        height: 170px;
        background-color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 136px;
        border: 1px dashed #c7c7c7;
    }
    .comple-btn {
        width: 140px;
        height: 40px;
        background: -webkit-linear-gradient(left,#FBCF00, #FB9F00);
        font-size: 16px;
        color: #fff;
        text-align: center;
        line-height: 40px;
        border-radius: 2px;
    }
    .img-review {
        margin-bottom: 40px;
    }
    .anew-upload {
        width: 140px;
        height: 40px;
        background-color: #fff;
        color: #EE8B21;
        font-family: "PingFangSC-Semibold";
        font-size: 16px;
        line-height: 40px;
        text-align: center;
        margin-bottom: 18px;
        border-radius: 2px;
    }
    
}
</style>

