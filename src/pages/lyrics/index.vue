<template>
  <div class="page-lyrics">
    <!-- 搜索输入框 -->
    <div class="search-wrap">
      <div class="search-input-wrap">
        <input class="search-input" placeholder="搜索歌曲/歌手" placeholder-class="search-placeholder"/>
        <div class="search-icon-wrap">
          <img class="search-icon" src="../../assets/images/lyrics/search.png"/>
        </div>
      </div>
      <div class="search-cancel">取消</div>
    </div>

    <!-- 推荐歌手 -->
    <div class="recommend-wrap" v-if="!keywords">
      <div class="recommend-header">
        <div class="recommend-title">歌手</div>
        <div class="btn-change">
          <img class="icon-refresh" src="../../assets/images/record/refresh.png"/>
          <div>换一批</div>
        </div>
      </div>
      <div class="tag-wrap">
        <div class="tag" v-for="r in recommendSingers" :key="r.name">{{r.name}}</div>
      </div>
    </div>

    <!-- 推荐歌曲 -->
    <div class="recommend-wrap" v-if="!keywords">
      <div class="recommend-header">
        <div class="recommend-title">歌曲</div>
        <div class="btn-change">
          <img class="icon-refresh" src="../../assets/images/record/refresh.png"/>
          <div>换一批</div>
        </div>
      </div>
      <div class="tag-wrap">
        <div class="tag" v-for="r in recommendSongs" :key="r.name">{{r.name}}</div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <scroll-view v-if="keywords" class="results-wrap" scroll-y>
      <div class="result-item" v-for="r in searchResults">{{r.name}}</div>
    </scroll-view>
  </div>
</template>

<script>
export default {
  data() {
    return {
      recommendSingers: [
        { name: '周杰伦' },
        { name: '凤凰传奇' },
        { name: '凤凰传奇' },
        { name: '周杰伦' },
        { name: '凤凰传奇' },
        { name: '凤凰传奇' },
        { name: '周杰伦' },
        { name: '凤凰传奇' },
        { name: '凤凰传奇' },
      ],
      recommendSongs: [
        { name: '失眠飞行' },
        { name: '给我一首歌的时间' },
        { name: '我愿意' },
        { name: '孤单' },
        { name: '每一天' },
        { name: '你是我内心的一首歌' },
        { name: '爱的双重魔力' },
      ],
      searchResults: [
        { name: '失眠飞行' },
        { name: '给我一首歌的时间' },
        { name: '我愿意' },
        { name: '孤单' },
        { name: '每一天' },
        { name: '你是我内心的一首歌' },
        { name: '爱的双重魔力' },
        { name: '失眠飞行' },
        { name: '给我一首歌的时间' },
        { name: '我愿意' },
        { name: '孤单' },
        { name: '每一天' },
        { name: '你是我内心的一首歌' },
        { name: '爱的双重魔力' },
        { name: '失眠飞行' },
        { name: '给我一首歌的时间' },
        { name: '我愿意' },
        { name: '孤单' },
        { name: '每一天' },
        { name: '你是我内心的一首歌' },
        { name: '爱的双重魔力' },
        { name: '失眠飞行' },
        { name: '给我一首歌的时间' },
        { name: '我愿意' },
        { name: '孤单' },
        { name: '每一天' },
        { name: '你是我内心的一首歌' },
        { name: '爱的双重魔力' },
      ],
      keywords: 'w',
    }
  }
}
</script>

<style lang="less">
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
    }
  }
}
</style>