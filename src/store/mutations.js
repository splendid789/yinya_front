
export default {
    setUserInfo(state, userInfo) {
        state.userInfo = userInfo;
    },
    setUserInfoAuth(state, authInfo) {
        state.userInfoAuth = authInfo;
    },
    setInnerAudioContext(state, context) {
        state.innerAudioContext = context;
    },
    setIsFirst(state, flag) {
        state.isFirst = flag;
    },
    setRecorderManager(state, context) {
        state.recorderManager = context;
    }
}   
