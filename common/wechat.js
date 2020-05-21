var jweixin = require('jweixin-module');
export default {
    //判断是否在微信中  
    isWechat: function() {
        var ua = window.navigator.userAgent.toLowerCase();
        if (ua.match(/micromessenger/i) == 'micromessenger') {
            return true;
        } else {
            return false;
        }
    },
    //初始化sdk配置  
    initJssdk: function(callback, url) {
        //服务端进行签名 ，可使用uni.request替换。 签名算法请看文档 
        uni.request({
            url: '/rest/thirdpart/login/getSignature',
            data: param,
            dataType: 'json',
            header: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'GET',
            success(res) {
                if (res.data.code === 1) {
                    jweixin.config({
                        debug: false,
                        appId: res.appId,
                        timestamp: res.timestamp,
                        nonceStr: res.nonceStr,
                        signature: res.signature,
                        jsApiList: [
                            'checkJsApi',
                            'updateTimelineShareData',
                            'updateAppMessageShareData',
                            'getLocation', //获取位置 
                            'chooseWXPay', //微信支付 
                        ]
                    });
                    //配置完成后，再执行分享等功能  
                    if (callback) {
                        callback(res);
                    }
                } else {
                    uni.showToast({
                        title: res.data.message,
                        icon: 'none'
                    })
                }
            },
            fail(err) {
                reject(err)
            }
        });
    },
    //在需要自定义分享的页面中调用  
    share: function(data, url) {
        url = url ? url : window.location.href.split('#')[0];
        if (!this.isWechat()) {
            return;
        }
        //每次都需要重新初始化配置，才可以进行分享  
        this.initJssdk(function(signData) {
            jweixin.ready(function() {
                var shareData = {
                    title: data.title || 'xxx标题',
                    desc: data.desc || 'xxx描述',
                    link: url,
                    imgUrl: data.imgUrl || 'xxxx分享缩略图',
                    success: function(res) {
                        //用户点击分享后的回调，这里可以进行统计，例如分享送金币之类的  
                        // request.post('/api/member/share');  
                    },
                    cancel: function(res) {}
                };
                //分享给朋友接口  
                jweixin.updateAppMessageShareData(shareData);
                //分享到朋友圈接口  
                jweixin.updateTimelineShareData(shareData);
            });
        }, url);
    },
    //在需要定位页面调用  
    getlocation: function(callback, url) {
        if (!this.isWechat()) {
            //console.log('不是微信客户端')  
            return;
        }
        this.initJssdk(function(res) {
            jweixin.ready(function() {
                jweixin.getLocation({
                    type: 'gcj02', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'  
                    success: function(res) {
                        // console.log(res);  
                        callback(res)
                    },
                    fail: function(res) {
                        console.log(res)
                    }
                });
            });
        }, url);
    },
    // openlocation: function(data, callback) { //打开位置  
    //     if (!this.isWechat()) {
    //         //console.log('不是微信客户端')  
    //         return;
    //     }
    //     this.initJssdk(function(res) {
    //         jweixin.ready(function() {
    //             jweixin.openLocation({ //根据传入的坐标打开地图  
    //                 latitude: data.latitude,
    //                 longitude: data.longitude
    //             });
    //         });
    //     });
    // },
    //微信支付  
    wxpay: function(data, callback, url) {
        if (!this.isWechat()) {
            //console.log('不是微信客户端')  
            return;
        }
        this.initJssdk(function(res) {
            jweixin.ready(function() {
                jweixin.chooseWXPay({
                    appId: data.appId, //公众号名称，由商户传入 ok
                    timestamp: data.timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符  
                    nonceStr: data.nonceStr, // 支付签名随机串，不长于 32 位  
                    package: data.packageValue, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=\*\*\*）  
                    signType: data.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'  
                    paySign: data.paySign, // 支付签名  
                    success: function(res) {
                        // console.log(res);  
                        callback(res)
                    },
                    fail: function(res) {
                        callback(res)
                    }
                });
            });
        }, url);
    },
    // 根据传入的code, 获取openid
    getOpenId(code) {
        return new Promise((resolve, reject) => {
            uni.request({
                url: '/xxxxx/getOpenId',
                data: { code },
                method: 'GET',
                success(res) {
                    resolve(res.data);
                },
                fail(err) {
                    reject(err)
                }
            })
        })
    }
}