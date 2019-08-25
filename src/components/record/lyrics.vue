<template>
  <div class="record-lyrics-wrap">
    <!-- 歌词内容 -->
    <div class="title">《{{lyrics.song}}》</div>
    <scroll-view class="scroll-view" scroll-y :scroll-top="scrollTop">
      <div class="content" v-for="c in lyrics.climax" :key="c">{{c}}</div>
    </scroll-view>

    <div class="btn-wrap">
      <!-- 换一首 -->
      <form report-submit @submit="onChange">
        <button form-type="submit">
          <div class="btn-change">
            <img class="icon-refresh" src="../../assets/images/record/refresh.png"/>
            <div>换一首</div>
          </div>
        </button>
      </form>

      <!-- 更多 -->
      <form report-submit @submit="onMore">
        <button form-type="submit">
          <div class="btn-more">更多</div>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
const { $Toast } = require('../../../static/iview/base/index');

export default {
  name: 'v-lyrics',
  props: {
    lyricsRefresh: { type: Number, default: -1 },
  },
  watch: {
    lyricsRefresh() {
      this.getRandomLyrics();
    }
  },
  data() {
    return {
      lyrics: {},
      scrollTop: 0,
    }
  },
  created() {
    this.getRandomLyrics();
  },
  methods: {
    /*
     * 点击换一首
     */
    onChange(e) {
      let formId = e.mp.detail.formId;
      this.$emit('collectionFormId', formId);
      this.getRandomLyrics();
    },

    /*
     * 点击更多
     */
    onMore(e) {
      let formId = e.mp.detail.formId;
      this.$emit('collectionFormId', formId);
      wx.setStorageSync('inLyrics', true);
      wx.navigateTo({ url: '/pages/lyrics/main' });
    },

    /*
     * 随机加载歌词
     */
    async getRandomLyrics() {
      const song = wx.getStorageSync('song');
      if (song) {
        if (/^《/.test(song.climax[0])){
          song.climax.shift();
        }
        this.lyrics = song;
        wx.setStorageSync('song', '');
        return;
      }
      let config = {
        url: 'https://lrc.miaohudong.com/api/lrc/popular_lrc?num=1',
        method: 'get'
      }
      // await wxApi.showLoading({ title: '加载中', mask: true });
      let res = await wxApi.request(config);
      // await wxApi.hideLoading();
      if(res.errno == 0) {
        this.scrollTop = this.scrollTop === 0 ? -1 : 0;
        const lyrics = res.results && res.results[0] || []
        if (/^《/.test(lyrics.climax[0])){
          lyrics.climax.shift();
        }
        this.lyrics = lyrics
      }
      else {
        $Toast({
          content: `错误码:${res.errno}`,
          type: 'error'
        })
      }
    },
  }
}
</script>

<style lang="less">
button {
  background: none;
  padding: 0;
}
button:after {
  outline: none;
  border: none;
}
.record-lyrics-wrap {
  width: 294px;
  border-radius: 5px;
  border: 1px solid #F4CF24;
  box-sizing: border-box;
  box-shadow: 0px 0px 4px 0px rgba(204,118,26,1) inset;
  margin: 0 auto;
  background: rgba(238,139,33,0.03);
  padding: 28px 0px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  .title {
    text-align: center;
    font-size: 15px;
    color: #333333;
    line-height: 15px;
    margin-bottom: 12px;
  }
  .scroll-view {
    height: 150px;
    .content {
      font-size: 14px;
      text-align: center;
      color: #7F7F7F;
      line-height: 25px;
    }
  }
  .btn-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 22px;
  }
  .btn-change, .btn-more {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #EE8B21;
    width: 70px;
    height: 24px;
    border-radius: 12px;
    background:rgba(238,139,33,0.2);
    border:1px solid rgba(238,139,33,1);
    box-sizing: border-box;
    .icon-refresh {
      width: 10px;
      height: 10px;
      margin-right: 7px;
    }
  }
  .btn-more {
    background: none;
    width: 60px;
    text-align: center;
    line-height: 24px;
    margin-left: 21px;
  }
}
</style>