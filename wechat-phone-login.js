// 微信小程序获取手机号示例代码
Page({
  // 获取手机号
  getPhoneNumber(e) {
    console.log(e);
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 发送 encryptedData 和 iv 到后端解密
      wx.request({
        url: 'https://your-domain.com/api/auth/phone-login',
        method: 'POST',
        data: {
          code: this.data.loginCode, // wx.login 获取的 code
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        },
        success: (res) => {
          if (res.data.code === 200) {
            // 登录成功
            wx.setStorageSync('token', res.data.data.access_token);
            wx.navigateTo({
              url: '/pages/home/home'
            });
          } else {
            wx.showToast({
              title: res.data.message,
              icon: 'none'
            });
          }
        }
      });
    } else {
      wx.showToast({
        title: '获取手机号失败',
        icon: 'none'
      });
    }
  },

  // 微信登录获取 code
  wxLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          this.setData({
            loginCode: res.code
          });
        }
      }
    });
  }
});