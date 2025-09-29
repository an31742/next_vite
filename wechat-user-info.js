// 微信小程序获取用户信息示例代码
Page({
  // 微信一键登录
  onWechatLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 直接获取用户信息并登录
          wx.getUserProfile({
            desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
            success: (profileRes) => {
              // 发送到后端
              wx.request({
                url: 'https://your-domain.com/api/auth/user-login',
                method: 'POST',
                data: {
                  code: res.code,
                  userInfo: profileRes.userInfo
                },
                success: (loginRes) => {
                  if (loginRes.data.code === 200) {
                    // 登录成功
                    wx.setStorageSync('token', loginRes.data.data.access_token);
                    wx.setStorageSync('userInfo', loginRes.data.data.user);

                    wx.showToast({
                      title: '登录成功',
                      icon: 'success'
                    });

                    // 跳转到首页
                    wx.switchTab({
                      url: '/pages/home/home'
                    });
                  } else {
                    wx.showToast({
                      title: loginRes.data.message,
                      icon: 'none'
                    });
                  }
                },
                fail: (err) => {
                  console.error('登录请求失败', err);
                  wx.showToast({
                    title: '登录请求失败',
                    icon: 'none'
                  });
                }
              });
            },
            fail: (err) => {
              console.error('获取用户信息失败', err);
              wx.showToast({
                title: '需要授权才能登录',
                icon: 'none'
              });
            }
          });
        } else {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      }
    });
  }
});