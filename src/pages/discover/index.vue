<template>
<div class="discover-page">
  <div class="stack">
    <div class="stack-item" v-for="(item, index) in friends" :key="index"
         :style="index === current
         ? ('transform:translate3D(' + poswidth + 'px' + ',' + posheight + 'px' + ',0px);opacity:'+ opacity +';z-index:10;'+ (animation?'transitionTimingFunction:ease;transitionDuration:300ms;':''))
         : (index <= (current + visible - 1)
         ? 'opacity:1;transform:translate3D(0,0,' + (-1 * (index - current) * 60) + 'px' + ');z-index:'+(visible - index + current)+';transitionTimingFunction:ease;transitionDuration:300ms;'
         : 'z-index:-1;transform:translate3D(0,0,' + (-1 * visible * 60) + 'px' + ');')"
         @touchstart="touchStart"
         @touchmove="touchMove"
         @touchend="touchEnd">
      <div class="top-border"></div>
      <div class="card-content">
        <img :src="item.head_img" class="user-avatar" alt="">
        <div class="user-nickname">{{item.nickname}}</div>
        <div class="audio-operator">
          <img @click.stop="clickPlay" :src="'../../assets/images/' + (!item.playFlag ? 'icon-play.png': 'icon-pause.png') " alt="">
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import {mapMutations, mapGetters} from 'vuex';
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
export default {
    data() {
        return {
          start: {}, // 记录起始位置
          end: {}, // 记录终点位置
          current: 0, // 默认首图的序列
          opacity: 1, // 记录opacity
          zIndex: 10, // 记录zIndex
          visible: 3, // 记录默认显示堆叠数visible
          poswidth: '', // 记录位移
          posheight: '', // 记录位移
          lastPosWidth: '', // 记录上次最终位移
          lastPosHeight: '', // 记录上次最终位移
          tracking: false, // 是否在滑动，防止多次操作，影响体验
          animation: false, // 首图是否启用动画效果，默认为否
          opacity: 1, // 记录首图透明度
          swipe: false, // onTransition判定条件
          friends: [],
          innerAudioContext:null
        }
    },
    computed: {
        ...mapGetters(['userInfo', 'isFirst']),
    },
    async onShow() {
      this.friends = await this.getFriendInfo(5);
      this.playAudio(this.current);
      mpvue.setInnerAudioOption({
        obeyMuteSwitch: false
      });
    },
    onLoad() {

    },
    onHide() {

    },
    methods: {
      ...mapMutations(['setUserInfoAuth', 'setUserInfo', 'setInnerAudioContext', 'setIsFirst']),
      async getFriendInfo(num) {
        let config = {
          url: 'users/find_friend/?num=' + num,
          method: 'get'
        };
        let resInfo = await wxApi.request(config);
        resInfo.results.forEach(item => {
          item.playFlag = false;
        });
        return resInfo.results;
      },
      clickPlay(){
          if(this.friends[this.current].playFlag){
            this.innerAudioContext.pause();
          }else{
            this.innerAudioContext.play();
          }
      },
      playAudio(current){
        this.innerAudioContext = mpvue.createInnerAudioContext();
        this.innerAudioContext.autoplay = true;
        this.innerAudioContext.src = this.friends[current].file;
        this.innerAudioContext.onPlay(()=>{
          this.friends[current].playFlag = true;
        });
        this.innerAudioContext.onEnded(()=>{
          this.friends[current].playFlag = false;
        });
        this.innerAudioContext.onPause(()=>{
          this.friends[current].playFlag = false;
        });
      },
      touchStart (e) {
        if (this.tracking) {
          return
        }
        if (e.touches.length > 1) {
          this.tracking = false
          return
        } else {
          // 记录起始位置
          this.start.t = new Date().getTime()
          this.start.x = e.touches[0].clientX
          this.start.y = e.touches[0].clientY
          this.end.x = e.touches[0].clientX
          this.end.y = e.touches[0].clientY
        }
        this.tracking = true
        this.animation = false
      },
      touchMove (e) {
        // 记录滑动位置
        if (this.tracking && !this.animation) {
          this.end.x = e.touches[0].clientX
          this.end.y = e.touches[0].clientY
          // 计算滑动值
          this.poswidth = this.end.x - this.start.x
          this.posheight = this.end.y - this.start.y
        }
      },
      touchEnd (e) {
        this.tracking = false
        this.animation = true
        // 滑动结束，触发判断
        // 简单判断滑动宽度超出100像素时触发滑出
        if (Math.abs(this.poswidth) >= 100) {
          // 最终位移简单设定为x轴200像素的偏移
          let ratio = Math.abs(this.posheight / this.poswidth)
          this.poswidth = this.poswidth >= 0 ? this.poswidth + 200 : this.poswidth - 200
          this.posheight = this.posheight >= 0 ? Math.abs(this.poswidth * ratio) : -Math.abs(this.poswidth * ratio)
          this.opacity = 0
          this.swipe = true
          // 记录最终滑动距离
          this.lastPosWidth = this.poswidth
          this.lastPosHeight = this.posheight
          // currentPage+1 引发排序变化
          this.current += 1
          // currentPage切换，整体dom进行变化，把第一层滑动置零
          this.poswidth = 0
          this.posheight = 0
          this.opacity = 1
          // 不满足条件则滑入
        } else {
          this.poswidth = 0
          this.posheight = 0
          this.swipe = false
        }
        if (this.swipe) {
          this.animation = true
          this.lastPosWidth = 0
          this.lastPosHeight = 0
          this.swipe = false
          this.friends.splice(0,1)
        }
      },
    }
}
</script>

<style lang="less">
@import "../../assets/style/base.less";
.discover-page {
  position: relative;
  height: 100vh;
  box-sizing: border-box;
  font-family: "PingFangSC-Semibold";
  background: -webkit-linear-gradient(top,#fffef8, #fff9e0);
  .stack {
    top: 54px;
    width: 240px;
    height: 277px;
    position: relative;
    perspective: 1000px; //子元素视距
    perspective-origin: 50% 150%; //子元素透视位置
    -webkit-perspective: 1000px;
    -webkit-perspective-origin: 50% 150%;
    margin: 0 auto;
    padding: 0;
    .stack-item{
      height: 100%;
      width: 100%;
      top:0;
      opacity: 0;
      position: absolute;
      background-color: #fff;
      border: 1px solid #F4CF24;
      border-radius: 5px;
      box-shadow: 0 0 6px #EBE3D4;
      text-align: center;
      overflow: hidden;
      .top-border {
        height: 7px;
        background-color: #F4CF24;
      }
      .card-content {
        position: absolute;
        top: 39px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        .user-avatar {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          margin-bottom: 16px;
        }
        .user-nickname {
          font-size: 16px;
          color: #333;
          margin-bottom: 28px;
        }
        .audio-operator {
          padding: 0;
          margin: 0;
          display: flex;
          justify-content: center;
          height: 50px;
          // border-radius: 50%;
          background: none !important;
          img {
            width: 45px;
            height: 45px;
          }
        }
        .audio-operator::after {
          border: none;
        }
      }
    }
  }
}
</style>
