<template>
  <div class="record-lyrics-wrap">
    <!-- 歌词内容 -->
    <div class="title">《{{lyrics.title}}》</div>
    <scroll-view class="scroll-view" scroll-y>
      <div class="content" v-for="c in lyrics.content">{{c}}</div>
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
export default {
  name: 'v-lyrics',
  data() {
    return {
      lyrics: {
        title: '七里香',
        content: [
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
          '窗外的麻雀在电线杆上多嘴',
        ]
      },
    }
  },
  methods: {
    onChange(e) {
      let formId = e.mp.detail.formId;
      this.$emit('collectionFormId', formId);
    },
    onMore(e) {
      let formId = e.mp.detail.formId;
      this.$emit('collectionFormId', formId);
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