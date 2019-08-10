import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import mutations from './mutations'

Vue.use(Vuex);

const state = {
    userInfo: null,
    isFirst: false,
    userInfoAuth: null,
    innerAudioContext: null,
    recorderManager: null,
}

const store = new Vuex.Store({
    state,
    getters,
    mutations
});

export default store;