'use strict';

class BaseWxApi {
    baseUrl = 'https://yinya.miaohudong.com/api/';
    token = '';
    async request(params) {
        let res = await new Promise(async (resolve, reject) => {
            let token = wx.getStorageSync('token');
            let authorization = '';
            let url = params.url;
            if(token) {
              authorization += 'BEARER ' + token;
              console.log()
              if(params.url && params.url.indexOf('?') != -1){
                url += '&token='+token;
              }else{
                url += '?token='+token;
              }
            }
            let header = {
                'authorization': authorization
            }
            if(params.header) {
                header = {
                    ...params.header,
                    'authorization': authorization
                }
            }
            console.log('request url is:',url)
            wx.request({
                url: this.baseUrl + url,
                method: params.method,
                header: header,
                data: params.data,
                success: (res) => {
                    if(res && res.statusCode == 200) {
                        resolve(res.data);
                    }
                    else {
                        resolve(res);
                    }
                },
                fail: (err) => {
                    resolve(err);
                }
            })
        })
        // setTimeout(async () => {
        //     wx.hideLoading();
        // }, 500)
        return res;
    }
    // 获取用户当前的授权状态
    async getSetting() {
        let res = await new Promise((resolve, reject) => {
            wx.getSetting({
                success: function(res) {
                    resolve(res);
                }
            })
        })
        return res;
    }
    async setClipboardData(str) {
        let res = await new Promise((resolve, reject) => {
            wx.setClipboardData({
                data: str,
                success: function(res) {
                    resolve(res);
                },
                fail: function(err) {
                    resolve(err);
                },
                complete: function(res) {
                    resolve(res);
                }
            })
        })
        return res;
    }
    async previewImage(prevPicList) {
        let res = new Promise((resolve, reject) => {
            wx.previewImage({
                urls: prevPicList,
                current: prevPicList[0],
                success: function(res) {
                    resolve(res);
                },
                fail: function(err) {
                    reject(err);
                }
            })
        })
        return res;
    }
    async login() {
        let res = await new Promise((resolve, reject) => {
            wx.login({
                success: function(res) {
                    resolve(res);
                }
            })
        })
        return res;
    }
    async getSystemInfo() {
        let res = await new Promise((resolve, reject) => {
            wx.getSystemInfo({
                success: function(res) {
                    resolve(res);
                }
            })
        })
        return res;
    }
    async authorize(scope) {
        let res = await new Promise((resolve, reject) => {
            wx.authorize({
                scope: scope,
                success: function(res) {
                    resolve(res);
                },
                fail: function(err) {
                    resolve(err);
                }
            })
        })
        return res;
    }
    async getUserInfo() {
        let res = await new Promise((resolve, reject) => {
            wx.getUserInfo({
                success: function(res) {
                    resolve(res);
                }
            })
        })
        return res;
    }
    async openLocation(params) {
        let res = await new Promise((resolve, reject) => {
            wx.openLocation({
                latitude: params.latitude,
                longitude: params.longitude,
                scale: 18,
                name: params.name,
                success: function(res) {
                    resolve(res);
                }
            })
        })
        return res;
    }
    async chooseImage(params) {
        let res = await new Promise((resolve, reject) => {
            wx.chooseImage({
                count: params.count,
                sizeType: ['original', 'compressed'],
                sourceType: ['album', 'camera'],
                success: function(res) {
                    resolve(res);
                },
                fail: function(err) {
                    resolve(err);
                }
            })
        })
        return res;
    }
    async requestPayment(params) {
        let res = await new Promise((resolve, reject) => {
            wx.requestPayment({
                // 'appId': params.appId,
                'timeStamp': params.timeStamp,
                'nonceStr': params.nonceStr,
                'package': params.package,
                'signType': params.signType,
                'paySign': params.paySign,
                'success': function(res) {
                    resolve(res);
                },
                'fail': function(res) {
                    resolve(res);
                },
                'complete': function(res) {
                    resolve(res)
                }
            })
        })
        return res;
    }
    async showLoading(params) {
        let res = await new Promise((resolve, reject) => {
            wx.showLoading({
                ...params,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    resolve(err);
                }
            })
        })
        return res;
    }
    async hideLoading() {
        let res = await new Promise((resolve, reject) => {
            wx.hideLoading({
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    resolve(err);
                }
            })
        })
        return res;
    }
    async openLocation(params) {
        // wx.openLocation
        let res = await new Promise((resolve, reject) => {
            wx.openLocation({
                ...params,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    resolve(err);
                }
            })
        })
        return res;
    }
    async navigateTo(url) {
        let res = await new Promise((resolve, reject) => {
            wx.navigateTo({
                url: url,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    resolve(err);
                }
            })
        })
        return res;
    }
    async openCard(cardList) {
        let res = await new Promise((resolve,reject) => {
            wx.openCard({
                cardList: cardList,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    resolve(err);
                }
            })
        })
        return res;
    }
    async addCard(cardList) {
        let res = await new Promise((resolve, reject) => {
            wx.addCard({
                cardList: cardList,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    reject(err);
                }
            })
        })
        return res;
    }
    // 上传文件
    async uploadFile(params) {
        let res = await new Promise((resolve, reject) => {
            let token = wx.getStorageSync('token');
            let authorization = '';
            if(token) {
                authorization += 'BEARER ' + token;
            }
            wx.uploadFile({
                url: this.baseUrl + params.url,
                filePath: params.filePath,
                name: params.name,
                formData: params.formData,
                header: {
                    "Content-Type": "multipart/form-data",
                    'authorization': authorization
                },
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    reject(err);
                }
            })
        })
        return res;
    }
    // 下载文件
    async downloadFile(url) {
        let res = await new Promise((resolve, reject) => {
            wx.downloadFile({
                url: url,
                success: (res) => {
                    resolve(res);
                },
                fail: (err) => {
                    reject(err);
                }
            })
        })
        return res;
    }
}


export default BaseWxApi;
