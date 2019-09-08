<template>
  <div class="page-lyrics">
    <!-- 搜索输入框 -->
    <div class="search-wrap">
      <div class="search-input-wrap">
        <input
          class="search-input"
          :placeholder="isFocus ? '' : '搜索歌曲/歌手'"
          placeholder-class="search-placeholder"
          :value="keywords"
          confirm-type="search"
          @focus="onFocus"
          @blur="onBlur"
          @confirm="onSearch"
          @input="onInput"/>
        <form report-submit @submit="onSearchClick">
          <button form-type="submit">
            <div class="search-icon-wrap">
              <img class="search-icon" src="../../assets/images/lyrics/search.png"/>
            </div>
          </button>
        </form>
      </div>
      <form report-submit @submit="onCancel">
        <button form-type="submit">
          <div class="search-cancel">取消</div>
        </button>
      </form>
    </div>

    <!-- 推荐歌手 -->
    <div class="recommend-wrap" v-if="!searchResults.length">
      <div class="recommend-header">
        <div class="recommend-title">歌手</div>
        <form report-submit @submit="getRandomSingers">
          <button form-type="submit">
            <div class="btn-change">
              <img class="icon-refresh" src="../../assets/images/record/refresh.png"/>
              <div>换一批</div>
            </div>
          </button>
        </form>
      </div>
      <div class="tag-wrap">
        <form v-for="r in recommendSingers" :key="r.singer_id"  report-submit @submit="onSingerClick"  :data-item="r">
          <button class="tag" form-type="submit">{{r.singer_name}}</button>
        </form>
      </div>
    </div>

    <!-- 推荐歌曲 -->
    <div class="recommend-wrap" v-if="!searchResults.length">
      <div class="recommend-header">
        <div class="recommend-title">歌曲</div>
        <form report-submit @submit="getRandomLyrics">
          <button form-type="submit">
            <div class="btn-change">
              <img class="icon-refresh" src="../../assets/images/record/refresh.png"/>
              <div>换一批</div>
            </div>
          </button>
        </form>
      </div>
      <div class="tag-wrap">
        <form v-for="r in recommendSongs" :key="r.id"  report-submit @submit="onSongClick"  :data-item="r">
          <button class="tag" form-type="submit">{{r.song}}</button>
        </form>
      </div>
    </div>

    <!-- 搜索结果 -->
    <scroll-view v-if="searchResults.length" class="results-wrap" scroll-y>
      <form v-for="r in searchResults" :key="r.id"  report-submit @submit="onSongClick"  :data-item="r">
        <button class="result-item" form-type="submit">{{r.song}}</button>
      </form>
    </scroll-view>
    <i-toast id="toast" />
  </div>
</template>

<script>
import WxApi from '../../utils/WxApi'
const wxApi = new WxApi();
const { $Toast } = require('../../../static/iview/base/index');

export default {
  data() {
    return {
      recommendSingers: [],
      recommendSongs: [],
      searchResults: [],
      keywords: '',
      isFocus: false,
    }
  },
  created() {
    setTimeout(() => {
      this.getFistRandomData();
    }, 800);
  },
  onLoad() {
    setTimeout(() => {
      wx.setStorageSync('inLyrics', true);
    }, 500);
  },
  onUnload() {
    this.onCancel();
  },
  methods: {
    onFocus() {
      this.isFocus = true;
    },
    onBlur() {
      this.isFocus = false;
    },

    /*
     * 搜索输入
     */
    onInput(e) {
      this.keywords = e.mp.detail.value || '';
    },

    /*
     * 点击歌手标签
     */
    onSingerClick(e) {
      const formId = e.mp.detail.formId;
      this.collectionFormId(formId);
      let singer = e.currentTarget.dataset.item;
      this.keywords = singer.singer_name;
      this.onSearch();
    },

    /*
     * 点击搜索按钮
     */
    onSearchClick(e) {
      const formId = e.mp.detail.formId;
      this.collectionFormId(formId);
      this.onSearch();
    },

    /*
     * 搜集formId
     */
    collectionFormId(formid) {
      let config = {
        url: 'exchange/collect_formid/',
        method: 'post',
        data: {formid}
      };
      wxApi.request(config);
    },

    /*
     * 点击歌曲标签
     */
    onSongClick(e) {
      const formId = e.mp.detail.formId;
      this.collectionFormId(formId);
      let song = e.currentTarget.dataset.item;
      wx.setStorageSync('song', song);
      wx.setStorageSync('newSong', true);
      wx.navigateBack();
    },

    /*
     * 清空搜索
     */
    onCancel(e) {
      if (e) {
        const formId = e.mp.detail.formId;
        this.collectionFormId(formId);
      }
      this.keywords = '';
      this.searchResults = [];
    },

    /*
     * 搜索
     */
    async onSearch() {
      if (!this.keywords) return this.onCancel()
      let config = {
        url: `https://lrc.miaohudong.com/api/lrc/search_song/?kw=${this.keywords}`,
        method: 'get'
      }
      await wxApi.showLoading({ title: '加载中', mask: true });
      let res = await wxApi.request(config);
      await wxApi.hideLoading();
      if(res.errno == 0) {
        this.searchResults = res.results || []
        if (!res.results.length) {
          $Toast({
            content: `暂未收录\n请等待更新`,
            type: 'error'
          })
        }
      }
      else {
        $Toast({
          content: `错误码:${res.errno}`,
          type: 'error'
        })
      }
    },

    async getFistRandomData() {
      let configSinger = {
        url: 'https://lrc.miaohudong.com/api/lrc/popular_singer?num=9',
        method: 'get'
      }
      let configLyrics = {
        url: 'https://lrc.miaohudong.com/api/lrc/popular_lrc?num=10',
        method: 'get'
      }
      // await wxApi.showLoading({ title: '加载中', mask: true });
      let resSinger = await wxApi.request(configSinger);
      let resLyrics = await wxApi.request(configLyrics);
      // await wxApi.hideLoading();
      if(resSinger.errno == 0 && resLyrics.errno === 0) {
        this.recommendSingers = resSinger.results || []
        this.recommendSongs = resLyrics.results || []
      }
      else {
        $Toast({
          content: `错误码:${resSinger.errno || resLyrics.errno}`,
          type: 'error'
        })
      }
    },

    /*
     * 随机加载歌手
     */
    async getRandomSingers(e) {
      if (e) {
        const formId = e.mp.detail.formId;
        this.collectionFormId(formId);
      }
      let config = {
        url: 'https://lrc.miaohudong.com/api/lrc/popular_singer?num=9',
        method: 'get'
      }
      // await wxApi.showLoading({ title: '加载中', mask: true });
      let res = await wxApi.request(config);
      // await wxApi.hideLoading();
      if(res.errno == 0) {
        this.recommendSingers = res.results || []
      }
      else {
        $Toast({
          content: `错误码:${res.errno}`,
          type: 'error'
        })
      }
    },

    /*
     * 随机加载歌曲
     */
    async getRandomLyrics(e) {
      if (e) {
        const formId = e.mp.detail.formId;
        this.collectionFormId(formId);
      }
      let config = {
        url: 'https://lrc.miaohudong.com/api/lrc/popular_lrc?num=10',
        method: 'get'
      }
      // await wxApi.showLoading({ title: '加载中', mask: true });
      let res = await wxApi.request(config);
      // await wxApi.hideLoading();
      if(res.errno == 0) {
        this.recommendSongs = res.results || []
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
  border-radius: 0;
}
button:after {
  outline: none;
  border: none;
}
.page-lyrics {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(29deg,rgba(255,230,117,0.16),rgba(255,251,232,0.16));
  /* 搜索输入框 */
  .search-wrap {
    padding: 13px 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .search-input {
      width: 258px;
      height: 32px;
      background: rgba(255,251,233,1);
      border: 1px solid rgba(238,139,33,1);
      border-radius: 2px 0 0 2px;
      box-sizing: border-box;
      padding: 0 9px;
      color: #EE8B21;
      font-size: 12px;
      &-wrap {
        display: flex;
        align-items: center;
      }
    }
    .search-placeholder {
      color: #EE8B21;
      font-size: 12px;
    }
    .search-icon {
      width: 21px;
      height: 21px;
      &-wrap {
        width: 32px;
        height: 32px;
        border-radius: 0 2px 2px 0;
        background: rgba(238,139,33,1);
        border: 1px solid rgba(238,139,33,1);
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
    .search-cancel {
      font-size: 14px;
      color: #EE8B21;
    }
  }

  /* 推荐 */
  .recommend-wrap {
    margin-top: 56px;
    .recommend-header {
      margin: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      color: #333333;
      line-height: 16px;
      font-weight: bold;
      padding-bottom: 4px;
      border-bottom: 1px solid #EE8B21;
      .btn-change {
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
    }
    .tag-wrap {
      padding-left: 20px;
      padding-top: 6px;
      display: flex;
      flex-wrap: wrap;
      .tag {
        margin-top: 10px;
        padding: 0 23px;
        height: 28px;
        border-radius: 14px;
        border: 1px solid #EE8B21;
        text-align: center;
        line-height: 28px;
        font-size: 14px;
        color: #333333;
        word-break: keep-all;
        margin-right: 19px;
      }
    }
  }

  /* 搜索结果 */
  .results-wrap {
    padding: 18px 0 0 20px;
    box-sizing: border-box;
    height: calc(100vh - 45px);
    .result-item {
      padding: 13px 0;
      border-bottom: 1px solid rgba(234, 111, 57, .2);
      font-size: 16px;
      color: #333333;
      font-weight: bold;
      text-align: left;
    }
  }
}
</style>
